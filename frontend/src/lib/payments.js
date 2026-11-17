import { useEffect, useState } from 'react';

// Shared helpers for PayMongo payment links (Subscription page, /pay/:token
// portal and Payment History).

export const peso = (n) => `₱${Number(n).toLocaleString('en-PH')}`;

export const METHOD_LABELS = {
  gcash: 'GCash',
  paymaya: 'Maya',
  card: 'Visa / Mastercard',
  dob: 'Online Banking',
  qrph: 'QR Ph',
  grab_pay: 'GrabPay',
  billease: 'BillEase',
};

export const STATUS_LABELS = {
  paid: 'Paid',
  pending: 'Pending',
  expired: 'Expired',
  cancelled: 'Cancelled',
  failed: 'Failed',
};

export const packageLabel = (pkg) => (pkg ? `${pkg.name}: ${pkg.tagline} (${pkg.durationDays} days)` : 'Review package');

export const formatDate = (iso) => (iso ? new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

export const mmss = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

// Local deadline (ms) from the server's secondsLeft, so the viewer's clock
// does not matter. Call it when a fresh payment is loaded.
export const deadlineFrom = (payment) => Date.now() + (payment?.secondsLeft || 0) * 1000;

// Seconds left until `deadline`, ticking every second
export function useCountdown(deadline) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : 0;
}
