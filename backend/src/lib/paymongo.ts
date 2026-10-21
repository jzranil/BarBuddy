import { createHmac, timingSafeEqual } from 'node:crypto';

// PayMongo Checkout Sessions (https://developers.paymongo.com/reference).
//   PAYMONGO_SECRET_KEY=sk_test_...        (Developers > API keys)
//   PAYMONGO_WEBHOOK_SECRET=whsk_...       (secret of the webhook you register
//                                           for checkout_session.payment.paid)
//   PAYMONGO_METHODS=gcash,paymaya,card    (optional; add dob, qrph, grab_pay
//                                           once they are enabled on the account)
const API = 'https://api.paymongo.com/v1';

export const paymongoConfigured = () => Boolean(process.env.PAYMONGO_SECRET_KEY);

export const paymentMethods = () =>
  (process.env.PAYMONGO_METHODS || 'gcash,paymaya,card')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);

export type CheckoutSession = {
  id: string;
  attributes: {
    checkout_url: string;
    status: 'active' | 'expired' | string;
    reference_number?: string;
    payment_method_used?: string | null;
    payments?: PaymongoPayment[];
    payment_intent?: { id: string; attributes?: { status?: string } } | null;
    metadata?: Record<string, string> | null;
  };
};

export type PaymongoPayment = {
  id: string;
  attributes: {
    amount: number;
    status: 'paid' | 'failed' | 'pending' | string;
    paid_at?: number | null;
    billing?: { name?: string | null; email?: string | null } | null;
    source?: { type?: string; brand?: string; last4?: string } | null;
  };
};

async function call<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key) throw new Error('PayMongo is not configured.');
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${key}:`).toString('base64')}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json: any = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = json?.errors?.map((e: any) => e.detail).filter(Boolean).join(' ') || response.statusText;
    throw new Error(`PayMongo ${response.status}: ${detail}`);
  }
  return json?.data as T;
}

export function createCheckoutSession(input: {
  amount: number; // pesos
  name: string;
  description: string;
  reference: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}) {
  return call<CheckoutSession>('POST', '/checkout_sessions', {
    data: {
      attributes: {
        line_items: [{ currency: 'PHP', amount: Math.round(input.amount * 100), name: input.name, description: input.description, quantity: 1 }],
        payment_method_types: paymentMethods(),
        description: input.description,
        reference_number: input.reference,
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        send_email_receipt: true,
        show_description: true,
        show_line_items: true,
        metadata: input.metadata,
      },
    },
  });
}

export const getCheckoutSession = (id: string) => call<CheckoutSession>('GET', `/checkout_sessions/${id}`);

export const expireCheckoutSession = (id: string) => call<CheckoutSession>('POST', `/checkout_sessions/${id}/expire`);

// Paymongo-Signature: t=<unix>,te=<test sig>,li=<live sig>
// signature = HMAC-SHA256(webhook secret, `${t}.${raw body}`)
export function verifyWebhookSignature(rawBody: string, header: string | undefined, livemode: boolean) {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=').map((s) => s.trim()) as [string, string]));
  const given = livemode ? parts.li : parts.te;
  if (!parts.t || !given) return false;
  // Reject replays older than 5 minutes
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return false;
  const expected = createHmac('sha256', secret).update(`${parts.t}.${rawBody}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

// "gcash" → "GCash", card → "Visa •••• 4242"
export function methodLabel(payment: PaymongoPayment | undefined, fallback?: string | null) {
  const source = payment?.attributes.source;
  const type = source?.type || fallback || '';
  if (type === 'card') {
    const brand = source?.brand ? source.brand[0].toUpperCase() + source.brand.slice(1) : 'Card';
    return source?.last4 ? `${brand} •••• ${source.last4}` : brand;
  }
  const labels: Record<string, string> = {
    gcash: 'GCash',
    paymaya: 'Maya',
    grab_pay: 'GrabPay',
    dob: 'Online Banking',
    dob_ubp: 'Online Banking (UnionBank)',
    brankas_bdo: 'BDO',
    brankas_landbank: 'Landbank',
    brankas_metrobank: 'Metrobank',
    qrph: 'QR Ph',
    billease: 'BillEase',
  };
  return labels[type] || type || null;
}
