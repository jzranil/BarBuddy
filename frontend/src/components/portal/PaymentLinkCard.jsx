import { useEffect, useRef, useState } from 'react';
import Button from '../Button';
import { apiRequest } from '../../lib/api';
import { confirmAction, toastError, toastSuccess } from '../../lib/swal';
import { deadlineFrom, mmss, packageLabel, peso, useCountdown } from '../../lib/payments';

// The reviewee's open payment, shown as "Processing" while the PayMongo
// checkout is open in another tab (reopen it within the 10 minutes, or cancel). Checks the status every few seconds and calls
// onPaid once the package is paid (from any device). Render with
// key={payment.token} so a new link starts fresh.
export default function PaymentLinkCard({ payment, onPaid, onClosed }) {
  const [current, setCurrent] = useState(payment);
  const [deadline, setDeadline] = useState(() => deadlineFrom(payment));
  const [busy, setBusy] = useState(false);
  const notified = useRef(false);
  const token = payment.token;

  const pending = current.status === 'pending';
  const secondsLeft = useCountdown(deadline);

  useEffect(() => {
    if (!pending || !token) return undefined;
    const check = async () => {
      try {
        const r = await apiRequest(`/payments/link/${token}`, { auth: false });
        setCurrent((c) => ({ ...c, ...r.payment }));
        setDeadline(deadlineFrom(r.payment));
      } catch {
        // Keep the last known state; the next check retries
      }
    };
    const id = setInterval(check, secondsLeft === 0 ? 2000 : 5000);
    return () => clearInterval(id);
  }, [pending, token, secondsLeft === 0]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (notified.current) return;
    if (current.status === 'paid') {
      notified.current = true;
      toastSuccess('Payment received. Your package is active.');
      onPaid?.(current);
    } else if (current.status === 'expired' || current.status === 'failed') {
      notified.current = true;
      toastError(current.status === 'expired' ? 'The 10-minute payment window ended. Choose a package to try again.' : 'The payment could not be completed.');
      onClosed?.(current);
    }
  }, [current, onPaid, onClosed]);

  const cancel = async () => {
    if (!(await confirmAction({ title: 'Cancel this payment link?', text: 'The checkout page will stop accepting payment.', confirmText: 'Yes, cancel link', danger: true }))) return;
    setBusy(true);
    try {
      const r = await apiRequest(`/payments/link/${token}/cancel`, { method: 'POST' });
      setCurrent((c) => ({ ...c, ...r.payment }));
      if (r.payment.status !== 'paid') onClosed?.();
    } catch (err) {
      toastError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (current.status === 'paid') return null;

  const expired = !pending || secondsLeft === 0;

  return (
    <div style={{ border: `2px solid ${expired ? 'var(--card-border)' : 'var(--gold)'}`, borderRadius: 'var(--radius-lg)', background: '#fff', padding: '20px 22px', marginBottom: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '4px' }}>
            {expired ? 'PAYMENT LINK EXPIRED' : 'PROCESSING PAYMENT'}
          </div>
          <h2 style={{ fontSize: '19px', marginBottom: '2px' }}>{packageLabel(current.package)}</h2>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {peso(current.amount)} · Ref {current.reference}
          </div>
        </div>
        {!expired && (
          <div role="timer" aria-live="off" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: secondsLeft <= 60 ? '#c0392b' : 'var(--navy)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>timer</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{mmss(secondsLeft)}</span> left
          </div>
        )}
      </div>

      {expired ? (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
          This link is no longer payable. Choose a package below to create a new one.
        </p>
      ) : (
        <>
          <div role="status" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg)', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', marginBottom: '14px' }}>
            <span className="bb-spinner" aria-hidden="true" />
            <span>
              Complete your payment in the PayMongo tab. This page updates by itself as soon as the payment goes through.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Button variant="navy" icon="open_in_new" onClick={() => window.open(current.checkoutUrl, '_blank', 'noopener')} disabled={!current.checkoutUrl || busy}>
              Reopen payment page
            </Button>
            <Button variant="ghost" onClick={cancel} disabled={busy}>Cancel link</Button>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '12px 0 0' }}>
            GCash, Maya or Visa/Mastercard through PayMongo. Your package activates as soon as the payment goes through.
          </p>
        </>
      )}
    </div>
  );
}
