import { Hono } from 'hono';
import { requireUser } from '../lib/auth';
import { logEvent } from '../lib/logs';
import { paymentMethods, paymongoConfigured, verifyWebhookSignature } from '../lib/paymongo';
import {
  closePayment,
  createPaymentLink,
  handlePaidSession,
  LINK_MINUTES,
  loadPaymentByToken,
  ownerPayment,
  paymentHistory,
  PaymentError,
  publicPayment,
  syncPayment,
} from '../lib/payments';

// Package payment through PayMongo Checkout. A reviewee creates a payment
// link (/pay/<token> on the frontend) that is valid for 10 minutes; whoever
// opens it within that time can pay with GCash, Maya or a card. The package
// is activated by the PayMongo webhook, or by the next status check.
export const paymentRoutes = new Hono();

const TOKEN = /^[A-Za-z0-9_-]{32}$/;

// POST /api/payments/checkout — { subscriptionId } → a new payment link
paymentRoutes.post('/checkout', async (c) => {
  const auth = await requireUser(c, ['reviewee']);
  if (auth.response) return auth.response;
  if (!paymongoConfigured()) return c.json({ message: 'Online payment is not available yet.' }, 503);

  const body = await c.req.json().catch(() => null);
  try {
    const row = await createPaymentLink(auth.profile.user_id, String(body?.subscriptionId || ''));
    return c.json({
      message: `Payment link created. It is valid for ${LINK_MINUTES} minutes and can be shared with someone who will pay for you.`,
      payment: ownerPayment(row),
      methods: paymentMethods(),
    }, 201);
  } catch (err: any) {
    if (err instanceof PaymentError) return c.json({ message: err.message }, err.status);
    throw err;
  }
});

// GET /api/payments/history — the reviewee's own payments, newest first
paymentRoutes.get('/history', async (c) => {
  const auth = await requireUser(c, ['reviewee']);
  if (auth.response) return auth.response;
  const rows = await paymentHistory(auth.profile.user_id);
  return c.json({ payments: rows.map(ownerPayment) });
});

// GET /api/payments/link/:token — public: the payment portal for a shared link
paymentRoutes.get('/link/:token', async (c) => {
  const token = c.req.param('token');
  const row = TOKEN.test(token) ? await loadPaymentByToken(token) : null;
  if (!row) return c.json({ message: 'This payment link does not exist.' }, 404);
  const current = await syncPayment(row);
  return c.json({ payment: publicPayment(current), methods: paymentMethods() });
});

// POST /api/payments/link/:token/cancel — the reviewee withdraws their link
paymentRoutes.post('/link/:token/cancel', async (c) => {
  const auth = await requireUser(c, ['reviewee']);
  if (auth.response) return auth.response;
  const token = c.req.param('token');
  const row = TOKEN.test(token) ? await loadPaymentByToken(token) : null;
  if (!row || row.user_id !== auth.profile.user_id) return c.json({ message: 'This payment link does not exist.' }, 404);
  if (row.payment_status !== 'pending') return c.json({ message: `This payment is already ${row.payment_status}.` }, 409);

  await closePayment(row, 'cancelled');
  const current = (await loadPaymentByToken(token))!;
  await logEvent(row.user_id, 'payment', `Cancelled payment link ${row.payment_reference}.`);
  return c.json({
    message: current.payment_status === 'paid' ? 'This link was already paid.' : 'Payment link cancelled.',
    payment: ownerPayment(current),
  });
});

// POST /api/payments/webhook — PayMongo events (signature verified)
paymentRoutes.post('/webhook', async (c) => {
  const raw = await c.req.text();
  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return c.json({ message: 'Invalid payload.' }, 400);
  }
  const attributes = event?.data?.attributes;
  if (!verifyWebhookSignature(raw, c.req.header('Paymongo-Signature'), Boolean(attributes?.livemode))) {
    return c.json({ message: 'Invalid signature.' }, 401);
  }

  if (attributes?.type === 'checkout_session.payment.paid') {
    const found = await handlePaidSession(attributes.data);
    if (!found) await logEvent(null, 'payment', `Webhook for unknown checkout session ${attributes.data?.id}.`, 'WARNING');
  }
  // Always acknowledge so PayMongo does not retry events we do not use
  return c.json({ received: true });
});
