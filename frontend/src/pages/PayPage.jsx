import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import Button from '../components/Button';
import { apiRequest } from '../lib/api';
import { deadlineFrom, METHOD_LABELS, mmss, packageLabel, peso, useCountdown } from '../lib/payments';

const fetchLink = (token) => apiRequest(`/payments/link/${token}`, { auth: false });

// Public payment portal for a shared link: /pay/:token. Anyone with the link
// can pay for the reviewee's package within its 10 minutes. "Pay" opens the
// PayMongo checkout (GCash, Maya, card); PayMongo returns here afterwards
// with ?result=success while the payment is confirmed.
export default function PayPage() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const returned = searchParams.get('result') === 'success';

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [deadline, setDeadline] = useState(0);

  const apply = useCallback((r) => {
    setData(r);
    setError('');
    setDeadline(deadlineFrom(r.payment));
  }, []);

  useEffect(() => {
    let active = true;
    fetchLink(token)
      .then((r) => active && apply(r))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [token, apply]);

  const payment = data?.payment;
  const pending = payment?.status === 'pending';
  const secondsLeft = useCountdown(deadline);
  const timedOut = pending && deadline > 0 && secondsLeft === 0;

  // While pending, keep checking: quickly after returning from PayMongo or
  // once the time is up, slowly otherwise (it may be paid on another device).
  useEffect(() => {
    if (!pending) return undefined;
    const id = setInterval(() => {
      fetchLink(token).then(apply).catch(() => {});
    }, returned || timedOut ? 3000 : 10000);
    return () => clearInterval(id);
  }, [pending, returned, timedOut, token, apply]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px' }}>
      <Link to="/" style={{ marginBottom: '24px' }} aria-label="BarBuddy home">
        <BrandLogo height={36} />
      </Link>

      <main className="page-transition" style={{ width: '100%', maxWidth: '460px', background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        {!data && !error && <p style={{ padding: '40px 24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>Loading payment…</p>}
        {!data && error && <Notice icon="link_off" title="Payment link not found" text={error} />}
        {payment && (
          <>
            <div style={{ background: 'var(--navy-fill)', padding: '20px 24px', color: '#fff' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--gold)', marginBottom: '6px' }}>
                BARBUDDY REVIEW PACKAGE
              </div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '30px' }}>{peso(payment.amount)}</div>
              <div style={{ fontSize: '13px', color: '#cfd3dc' }}>for {payment.reviewee}</div>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <Row label="Package" value={packageLabel(payment.package)} />
              {payment.package?.subjects && <Row label="Subjects" value={payment.package.subjects} />}
              <Row label="Reference" value={payment.reference} mono />

              {pending && returned && <Notice icon="hourglass_top" title="Confirming your payment…" text="This usually takes a few seconds. Keep this page open." compact />}

              {pending && !returned && (
                <>
                  <div
                    role="timer"
                    aria-live="polite"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: secondsLeft <= 60 ? '#fdecea' : '#fdf7e9', border: `1px solid ${secondsLeft <= 60 ? '#f3c4bd' : 'var(--gold)'}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', margin: '16px 0' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: secondsLeft <= 60 ? '#c0392b' : 'var(--gold)' }}>timer</span>
                    This link expires in <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{mmss(secondsLeft)}</strong>
                  </div>

                  <Button variant="navy" fullWidth icon="lock" onClick={() => window.location.assign(payment.checkoutUrl)} disabled={!payment.checkoutUrl || secondsLeft === 0}>
                    Pay {peso(payment.amount)}
                  </Button>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '14px' }}>
                    {(data.methods || []).map((m) => (
                      <span key={m} style={{ fontSize: '11px', fontWeight: 700, border: '1px solid var(--card-border)', borderRadius: '999px', padding: '4px 10px', color: 'var(--text-muted)' }}>
                        {METHOD_LABELS[m] || m}
                      </span>
                    ))}
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', margin: '12px 0 0' }}>
                    Payments are processed securely by PayMongo. Anyone with this link can pay for {payment.reviewee}.
                  </p>
                </>
              )}

              {payment.status === 'paid' && (
                <Notice
                  icon="check_circle"
                  tone="success"
                  title="Payment received"
                  text={`Paid${payment.method ? ` via ${payment.method}` : ''}. ${payment.reviewee}'s package is now active.`}
                  compact
                />
              )}
              {(payment.status === 'expired' || payment.status === 'cancelled') && (
                <Notice
                  icon="timer_off"
                  tone="error"
                  title={payment.status === 'expired' ? 'This payment link has expired' : 'This payment link was cancelled'}
                  text={`Payment links last 10 minutes. Ask ${payment.reviewee} to create a new link from their Subscription page.`}
                  compact
                />
              )}
              {payment.status === 'failed' && (
                <Notice icon="error" tone="error" title="Payment could not be started" text="Please create a new payment link from the Subscription page." compact />
              )}

              {!pending && (
                <div style={{ marginTop: '16px' }}>
                  <Link to="/subscription" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>
                    Go to my BarBuddy packages →
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '8px 0', borderBottom: '1px solid var(--card-border)', fontSize: '13px' }}>
      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: 'right', fontFamily: mono ? 'ui-monospace, monospace' : undefined, overflowWrap: 'anywhere' }}>{value}</span>
    </div>
  );
}

function Notice({ icon, title, text, tone, compact }) {
  const colors = { success: '#2e7d32', error: '#c0392b' };
  return (
    <div style={{ textAlign: compact ? 'left' : 'center', padding: compact ? '14px 0 0' : '40px 24px', display: compact ? 'flex' : 'block', gap: '10px', alignItems: 'flex-start' }}>
      <span className="material-symbols-outlined" style={{ fontSize: compact ? '22px' : '32px', color: colors[tone] || 'var(--text-muted)' }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: '14px', margin: compact ? '0 0 2px' : '8px 0 4px' }}>{title}</div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{text}</div>
      </div>
    </div>
  );
}
