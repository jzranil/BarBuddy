import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import Button from '../components/Button';
import { apiRequest } from '../lib/api';

// Opened from the cancellation email: /cancel-subscription?token=...
// The package is only cancelled when the reviewee presses Confirm here, so
// email link scanners opening the URL cannot cancel it.
export default function CancelSubscriptionPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    apiRequest('/reviewee/subscription/cancel/preview', { method: 'POST', body: { token }, auth: false })
      .then((r) => active && setPreview(r))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [token]);

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      const r = await apiRequest('/reviewee/subscription/cancel/confirm', { method: 'POST', body: { token }, auth: false });
      setDone(r.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const pkg = preview?.package;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px' }}>
      <Link to="/" style={{ marginBottom: '24px' }} aria-label="BarBuddy home">
        <BrandLogo height={36} />
      </Link>

      <main className="page-transition" style={{ width: '100%', maxWidth: '460px', background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '28px 24px', boxShadow: 'var(--shadow-card)' }}>
        {!preview && !error && <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Checking your link…</p>}

        {done ? (
          <Message icon="check_circle" color="#2e7d32" title="Subscription cancelled" text={done} />
        ) : !preview && error ? (
          <Message icon="link_off" color="#c0392b" title="We couldn't use this link" text={error} />
        ) : preview && !preview.active ? (
          <Message icon="info" color="var(--text-muted)" title="No active package" text="There is no active package on this account to cancel." />
        ) : preview ? (
          <>
            <h1 style={{ fontSize: '22px', marginBottom: '6px' }}>Cancel your subscription?</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Hi {preview.reviewee}, please confirm that you want to cancel this package.
            </p>

            <div style={{ border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>{pkg.name}: {pkg.tagline}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 8px' }}>{pkg.subjects}</div>
              <div style={{ fontSize: '13px' }}>
                <strong>{pkg.daysLeft}</strong> {pkg.daysLeft === 1 ? 'day' : 'days'} left · active until {pkg.expiresOn}
              </div>
            </div>

            <ul style={{ fontSize: '13px', lineHeight: 1.6, paddingLeft: '18px', margin: '0 0 20px' }}>
              <li>Your package ends right away and the remaining days are not kept.</li>
              <li>Daily questions stop. Your assessment history and achievements stay.</li>
              <li>You can choose a new package any time.</li>
            </ul>

            {error && <p role="alert" style={{ color: '#c0392b', fontSize: '13px' }}>{error}</p>}

            <div style={{ display: 'grid', gap: '10px' }}>
              <button
                type="button"
                onClick={confirm}
                disabled={busy}
                style={{ background: '#c0392b', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 22px', fontSize: '15px', fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1 }}
              >
                {busy ? 'Cancelling...' : 'Confirm cancellation'}
              </button>
              <Link to="/subscription" style={{ textAlign: 'center', fontSize: '13px', fontWeight: 700, color: 'var(--navy)', padding: '8px' }}>
                Keep my subscription
              </Link>
            </div>
          </>
        ) : null}

        {(done || (!preview && error) || (preview && !preview.active)) && (
          <div style={{ marginTop: '18px', textAlign: 'center' }}>
            <Link to="/subscription">
              <Button variant="navy">Go to Subscription</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

function Message({ icon, color, title, text }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '34px', color }}>{icon}</span>
      <h1 style={{ fontSize: '20px', margin: '8px 0 6px' }}>{title}</h1>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>{text}</p>
    </div>
  );
}
