import { randomBytes } from 'node:crypto';
import { supabaseAdmin } from './supabase';
import { appUrl } from './mailer';
import { logEvent } from './logs';
import { manilaDate } from './competency';
import { activatePlan, loadPlan, packageInfo } from './packages';
import { rolloutForUser } from './rollout';
import {
  createCheckoutSession,
  expireCheckoutSession,
  getCheckoutSession,
  methodLabel,
  type CheckoutSession,
  type PaymongoPayment,
} from './paymongo';

// A payment link is valid for 10 minutes. Anyone holding the link (the
// reviewee, or someone they share it with) can pay within that window.
export const LINK_MINUTES = Number(process.env.PAYMENT_LINK_MINUTES) || 10;

const COLUMNS =
  'payment_id, user_id, subscription_id, payment_token, payment_reference, payment_amount, payment_status, payment_method, payment_receipt, payment_expires_at, paid_at, payer_name, payer_email, paymongo_checkout_id, paymongo_checkout_url, created_at, ' +
  'bb_users_tbl ( user_fname, user_lname ), bb_subscriptions_tbl ( subscription_duration, subscription_package )';

export type PaymentRow = {
  payment_id: string;
  user_id: string;
  subscription_id: string;
  payment_token: string;
  payment_reference: string;
  payment_amount: number;
  payment_status: 'pending' | 'paid' | 'expired' | 'cancelled' | 'failed';
  payment_method: string | null;
  payment_receipt: string | null;
  payment_expires_at: string;
  paid_at: string | null;
  payer_name: string | null;
  payer_email: string | null;
  paymongo_checkout_id: string | null;
  paymongo_checkout_url: string | null;
  created_at: string;
  bb_users_tbl: { user_fname: string | null; user_lname: string | null } | null;
  bb_subscriptions_tbl: { subscription_duration: number; subscription_package: number } | null;
};

export class PaymentError extends Error {
  constructor(message: string, public status: 400 | 403 | 404 | 409 | 502 = 400) {
    super(message);
  }
}

// Shared links must open on other devices, so in local development point
// PUBLIC_APP_URL at a tunnel to the frontend (e.g. ngrok); otherwise APP_URL.
const publicAppUrl = () => (process.env.PUBLIC_APP_URL || '').replace(/\/+$/, '') || appUrl();

export const payUrl = (token: string) => `${publicAppUrl()}/pay/${token}`;

const isLive = (row: PaymentRow) => row.payment_status === 'pending' && Date.parse(row.payment_expires_at) > Date.now();

async function loadPayment(column: 'payment_token' | 'payment_id' | 'paymongo_checkout_id', value: string) {
  const { data } = await supabaseAdmin.from('bb_payments_tbl').select(COLUMNS).eq(column, value).maybeSingle();
  return (data as unknown as PaymentRow) ?? null;
}

export const loadPaymentByToken = (token: string) => loadPayment('payment_token', token);

// POST /payments/checkout — a new 10-minute link for one package plan. Any
// earlier pending link of the reviewee is cancelled so only one is payable.
export async function createPaymentLink(userId: string, subscriptionId: string) {
  const plan = await loadPlan(subscriptionId);
  if (!plan) throw new PaymentError('Choose one of the listed packages.');
  const info = packageInfo(plan.subscription_package)!;
  const amount = Number(plan.subscription_price);
  if (!(amount > 0)) throw new PaymentError('This package has no price set yet.');

  const { data: pending } = await supabaseAdmin
    .from('bb_payments_tbl')
    .select(COLUMNS)
    .eq('user_id', userId)
    .eq('payment_status', 'pending');
  for (const row of (pending as unknown as PaymentRow[]) || []) await closePayment(row, 'cancelled');

  const token = randomBytes(24).toString('base64url');
  const reference = `BB-${manilaDate().replace(/-/g, '')}-${randomBytes(3).toString('hex').toUpperCase()}`;
  const expiresAt = new Date(Date.now() + LINK_MINUTES * 60_000).toISOString();

  const { data: inserted, error } = await supabaseAdmin
    .from('bb_payments_tbl')
    .insert({
      user_id: userId,
      subscription_id: plan.subscription_id,
      payment_token: token,
      payment_reference: reference,
      payment_amount: amount,
      payment_status: 'pending',
      payment_expires_at: expiresAt,
      is_archived: false,
    })
    .select('payment_id')
    .single();
  if (error || !inserted) throw new PaymentError('Unable to start the payment.', 502);

  const description = `${info.name}: ${info.tagline} (${plan.subscription_duration} days)`;
  let session: CheckoutSession;
  try {
    session = await createCheckoutSession({
      amount,
      name: `BarBuddy ${info.name}`,
      description,
      reference,
      successUrl: `${payUrl(token)}?result=success`,
      cancelUrl: payUrl(token),
      metadata: { payment_id: inserted.payment_id, reference },
    });
  } catch (err: any) {
    await supabaseAdmin
      .from('bb_payments_tbl')
      .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
      .eq('payment_id', inserted.payment_id);
    await logEvent(userId, 'payment', `PayMongo checkout failed for ${reference}: ${err?.message || err}`, 'ERROR');
    throw new PaymentError('The payment provider is unavailable. Please try again.', 502);
  }

  await supabaseAdmin
    .from('bb_payments_tbl')
    .update({
      paymongo_checkout_id: session.id,
      paymongo_checkout_url: session.attributes.checkout_url,
      updated_at: new Date().toISOString(),
    })
    .eq('payment_id', inserted.payment_id);

  await logEvent(userId, 'payment', `Created payment link ${reference} for ${description}, ₱${amount}.`);
  return (await loadPayment('payment_id', inserted.payment_id))!;
}

// Brings a pending row up to date with PayMongo, then expires it if its
// 10 minutes are up. A payment that went through always wins over expiry.
export async function syncPayment(row: PaymentRow): Promise<PaymentRow> {
  if (row.payment_status !== 'pending') return row;
  if (row.paymongo_checkout_id) {
    try {
      const session = await getCheckoutSession(row.paymongo_checkout_id);
      if (await applySession(row, session)) return (await loadPayment('payment_id', row.payment_id))!;
    } catch (err: any) {
      console.error('PayMongo sync failed for', row.payment_reference, err?.message || err);
    }
  }
  if (!isLive(row)) {
    await closePayment(row, 'expired');
    return (await loadPayment('payment_id', row.payment_id))!;
  }
  return row;
}

// Records a paid session (true when the session is paid)
async function applySession(row: PaymentRow, session: CheckoutSession) {
  const paid = session.attributes.payments?.find((p) => p.attributes.status === 'paid');
  if (!paid) return false;
  await finalizePaid(row, session, paid);
  return true;
}

// Marks the row paid and activates the package — exactly once, even when the
// webhook and a status check arrive together.
async function finalizePaid(row: PaymentRow, session: CheckoutSession, payment: PaymongoPayment) {
  const now = new Date().toISOString();
  const { data: claimed } = await supabaseAdmin
    .from('bb_payments_tbl')
    .update({
      payment_status: 'paid',
      paid_at: payment.attributes.paid_at ? new Date(payment.attributes.paid_at * 1000).toISOString() : now,
      payment_method: methodLabel(payment, session.attributes.payment_method_used),
      payment_receipt: payment.id,
      paymongo_payment_id: payment.id,
      payer_name: payment.attributes.billing?.name || null,
      payer_email: payment.attributes.billing?.email || null,
      updated_at: now,
    })
    .eq('payment_id', row.payment_id)
    .neq('payment_status', 'paid')
    .select('payment_id');
  if (!claimed?.length) return; // already recorded

  const expected = Math.round(Number(row.payment_amount) * 100);
  if (payment.attributes.amount !== expected) {
    await logEvent(row.user_id, 'payment', `${row.payment_reference}: paid ${payment.attributes.amount / 100} but expected ${expected / 100}. Package not activated.`, 'ERROR');
    return;
  }

  if (row.payment_status !== 'pending') {
    await logEvent(row.user_id, 'payment', `${row.payment_reference} was paid after the link was ${row.payment_status}; activating anyway.`, 'WARNING');
  }

  // The plan is honoured even if it was archived after the link was made
  const { data: plan } = await supabaseAdmin
    .from('bb_subscriptions_tbl')
    .select('subscription_id, subscription_duration, subscription_package')
    .eq('subscription_id', row.subscription_id)
    .single();
  const info = packageInfo(plan?.subscription_package);
  if (!plan || !info) {
    await logEvent(row.user_id, 'payment', `${row.payment_reference} is paid but its package no longer exists.`, 'ERROR');
    return;
  }

  try {
    const lastDay = await activatePlan(row.user_id, plan);
    await logEvent(row.user_id, 'payment', `Paid ${row.payment_reference} (₱${row.payment_amount}, ${payment.id}). ${info.name} active until ${lastDay}.`);
    await logEvent(row.user_id, 'subscription', `Activated ${info.name} (${plan.subscription_duration} days) by payment ${row.payment_reference}.`);
  } catch (err: any) {
    await logEvent(row.user_id, 'payment', `${row.payment_reference} is paid but activation failed: ${err?.message || err}`, 'ERROR');
    return;
  }

  try {
    await rolloutForUser(row.user_id, { email: true });
  } catch (err: any) {
    console.error('Rollout after payment failed:', err?.message || err);
  }
}

// Expires or cancels a pending link, here and on PayMongo, unless it turns
// out to be paid already.
export async function closePayment(row: PaymentRow, status: 'expired' | 'cancelled') {
  if (row.paymongo_checkout_id) {
    try {
      const session = await getCheckoutSession(row.paymongo_checkout_id);
      if (await applySession(row, session)) return;
      if (session.attributes.status === 'active') await expireCheckoutSession(row.paymongo_checkout_id);
    } catch (err: any) {
      console.error('PayMongo expire failed for', row.payment_reference, err?.message || err);
    }
  }
  await supabaseAdmin
    .from('bb_payments_tbl')
    .update({ payment_status: status, updated_at: new Date().toISOString() })
    .eq('payment_id', row.payment_id)
    .eq('payment_status', 'pending');
}

// Every minute: close links whose 10 minutes are up, so their PayMongo
// checkout pages stop accepting payment too.
export async function expireStalePayments() {
  const { data } = await supabaseAdmin
    .from('bb_payments_tbl')
    .select(COLUMNS)
    .eq('payment_status', 'pending')
    .lt('payment_expires_at', new Date().toISOString())
    .limit(50);
  for (const row of (data as unknown as PaymentRow[]) || []) await closePayment(row, 'expired');
  return data?.length ?? 0;
}

// PayMongo webhook: checkout_session.payment.paid
export async function handlePaidSession(session: CheckoutSession) {
  const row =
    (await loadPayment('paymongo_checkout_id', session.id)) ??
    (session.attributes.metadata?.payment_id ? await loadPayment('payment_id', session.attributes.metadata.payment_id) : null);
  if (!row) return false;
  await applySession(row, session);
  return true;
}

const packageLabel = (row: PaymentRow) => {
  const info = packageInfo(row.bb_subscriptions_tbl?.subscription_package);
  return info ? { name: info.name, tagline: info.tagline, subjects: info.subjects, durationDays: row.bb_subscriptions_tbl!.subscription_duration } : null;
};

const secondsLeft = (row: PaymentRow) =>
  isLive(row) ? Math.max(0, Math.floor((Date.parse(row.payment_expires_at) - Date.now()) / 1000)) : 0;

// What anyone holding the link sees — no email or account details, and only
// the reviewee's first name and last initial.
export function publicPayment(row: PaymentRow) {
  const fname = row.bb_users_tbl?.user_fname?.trim() || 'BarBuddy';
  const lname = row.bb_users_tbl?.user_lname?.trim();
  return {
    reference: row.payment_reference,
    status: row.payment_status,
    reviewee: lname ? `${fname} ${lname[0]}.` : fname,
    package: packageLabel(row),
    amount: Number(row.payment_amount),
    currency: 'PHP',
    expiresAt: row.payment_expires_at,
    secondsLeft: secondsLeft(row),
    checkoutUrl: isLive(row) ? row.paymongo_checkout_url : null,
    paidAt: row.paid_at,
    method: row.payment_method,
  };
}

// What the reviewee sees in their payment history
export function ownerPayment(row: PaymentRow) {
  return {
    ...publicPayment(row),
    paymentId: row.payment_id,
    createdAt: row.created_at,
    payUrl: isLive(row) ? payUrl(row.payment_token) : null,
    token: isLive(row) ? row.payment_token : null,
    receipt: row.payment_receipt,
    payerName: row.payer_name,
    payerEmail: row.payer_email,
  };
}

export async function paymentHistory(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('bb_payments_tbl')
    .select(COLUMNS)
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  const rows = (data as unknown as PaymentRow[]) || [];
  return Promise.all(rows.map((row) => (row.payment_status === 'pending' ? syncPayment(row) : row)));
}
