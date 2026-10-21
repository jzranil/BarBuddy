import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalLayout from '../../layouts/PortalLayout';
import Button from '../../components/Button';
import { useApi } from '../../lib/useApi';
import { apiRequest } from '../../lib/api';
import { alertMessage, confirmAction } from '../../lib/swal';
import { SkeletonCards } from '../../components/common/Skeleton';
import PaymentLinkCard from '../../components/portal/PaymentLinkCard';
import PaymentHistorySection from '../../components/portal/PaymentHistorySection';
import { peso } from '../../lib/payments';

const ICONS = { 1: 'menu_book', 2: 'balance', 3: 'gavel', 4: 'star' };

// Review packages. With PayMongo set up on the server (paymentEnabled),
// choosing a package opens the PayMongo checkout in a new tab (valid for 10
// minutes) while this page shows "Processing"; once paid, the package list is
// hidden and the active package is shown. Without it, reviewees
// choose a package directly. Activation starts the 7:00 AM daily questions
// rollout and releases (and emails) the first set right away.
export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { data, error, loading, reload } = useApi('/reviewee/packages');
  const [chosenPlan, setChosenPlan] = useState({});
  const [saving, setSaving] = useState(null);
  const [result, setResult] = useState(null);
  const [actionError, setActionError] = useState('');
  const [resending, setResending] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const current = data?.subscription;
  const paymentEnabled = Boolean(data?.paymentEnabled);
  const history = useApi(paymentEnabled ? '/payments/history' : null);
  const [link, setLink] = useState(null);
  const [changing, setChanging] = useState(false);
  const openLink = link ?? history.data?.payments?.find((p) => p.status === 'pending' && p.token) ?? null;
  const processing = openLink?.status === 'pending';
  // With online payment, an active package hides the package list until the
  // reviewee chooses to change it
  const showPackages = !(paymentEnabled && current?.active) || changing;

  const onPaid = useCallback(() => {
    setLink(null);
    setChanging(false);
    setResult({ message: 'Payment received. Your package is now active.' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    reload();
    history.reload();
  }, [reload, history.reload]); // eslint-disable-line react-hooks/exhaustive-deps

  const onLinkClosed = useCallback(() => {
    setLink(null);
    history.reload();
  }, [history.reload]); // eslint-disable-line react-hooks/exhaustive-deps

  const pay = async (pkg, plan) => {
    const ok = await confirmAction({
      title: `Pay for ${pkg.name}?`,
      html: `<strong>${pkg.name}: ${pkg.tagline}</strong> for <strong>${plan.durationDays} days</strong>, <strong>${peso(plan.price)}</strong>.<br>You'll be taken to PayMongo to pay with GCash, Maya or card. The payment page is valid for 10 minutes.${openLink ? '<br>Your current payment link will be cancelled.' : ''}`,
      confirmText: 'Continue to payment',
    });
    if (!ok) return;
    // Open the tab now, while the click still counts, so it is not blocked
    // as a popup; it is pointed at the PayMongo checkout once that exists.
    const tab = window.open('', '_blank');
    if (tab) {
      tab.document.title = 'Opening PayMongo…';
      tab.document.body.innerHTML = '<p style="font:15px system-ui,sans-serif;text-align:center;margin-top:80px;color:#0f1f3c">Opening secure PayMongo checkout…</p>';
    }
    setSaving(pkg.package);
    setActionError('');
    setResult(null);
    try {
      const r = await apiRequest('/payments/checkout', { method: 'POST', body: { subscriptionId: plan.subscriptionId } });
      setLink(r.payment);
      if (tab) {
        tab.opener = null;
        tab.location.href = r.payment.checkoutUrl;
      } else {
        window.location.assign(r.payment.checkoutUrl); // popups blocked
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      tab?.close();
      setActionError(err.message);
    } finally {
      setSaving(null);
    }
  };

  const choose = async (pkg) => {
    const subscriptionId = chosenPlan[pkg.package] || pkg.plans[0]?.subscriptionId;
    if (!subscriptionId) return;
    const plan = pkg.plans.find((p) => p.subscriptionId === subscriptionId);
    if (paymentEnabled) return pay(pkg, plan);
    const ok = await confirmAction({
      title: `Choose ${pkg.name}?`,
      html: `<strong>${pkg.name}: ${pkg.tagline}</strong> for <strong>${plan?.durationDays} days</strong>.<br>${current?.active ? 'This replaces your current package. ' : ''}Today's questions are released right away and emailed to you.`,
      confirmText: 'Yes, choose package',
    });
    if (!ok) return;
    setSaving(pkg.package);
    setActionError('');
    setResult(null);
    try {
      const r = await apiRequest('/reviewee/subscription', { method: 'POST', body: { subscriptionId } });
      setResult(r);
      reload();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSaving(null);
    }
  };

  // Cancelling is confirmed from a link we email to the reviewee
  const requestCancel = async () => {
    const ok = await confirmAction({
      title: 'Cancel your subscription?',
      html: `Your <strong>${current.name}</strong> package (${current.daysLeft} days left) ends once you confirm.<br>We'll email you a confirmation link that is valid for 30 minutes.`,
      confirmText: 'Cancel subscription',
      cancelText: 'Keep subscription',
      danger: true,
    });
    if (!ok) return;
    setCancelling(true);
    setActionError('');
    try {
      const r = await apiRequest('/reviewee/subscription/cancel', { method: 'POST' });
      const email = String(r.email || 'your email').replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
      await alertMessage({
        icon: 'success',
        title: 'Check your email',
        html: `We sent a confirmation link to <strong>${email}</strong>.<br>Open it within <strong>30 minutes</strong> to cancel your <strong>${current.name}</strong> package. Your package stays active until you confirm.<br><span style="font-size:12px;opacity:.75">Can't find it? Check your Spam or Promotions folder.</span>`,
        confirmText: 'Got it',
      });
    } catch (err) {
      setActionError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const resend = async () => {
    if (!(await confirmAction({ title: "Email today's questions?", text: "We'll send today's daily questions to your email address.", confirmText: 'Yes, send' }))) return;
    setResending(true);
    setActionError('');
    try {
      const r = await apiRequest('/reviewee/daily/email', { method: 'POST' });
      setResult({ message: r.message, rollout: r });
    } catch (err) {
      setActionError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <PortalLayout>
      <h1 style={{ fontSize: '28px', marginBottom: '6px' }}>Review Packages</h1>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
        Choose the Bar subjects you want to review. Your daily questions are released every day at 7:00 AM (Philippine time) and sent to your email.
      </p>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: '#fdf7e9', border: '1px solid var(--gold)', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', marginBottom: '22px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--gold)' }}>info</span>
        <span>
          {paymentEnabled
            ? 'Pay with GCash, Maya or Visa/Mastercard through PayMongo. Each payment page is valid for 10 minutes.'
            : 'Online payment is not available yet, so you can choose any package for free while BarBuddy is being tested. Prices are shown for reference.'}
        </span>
      </div>

      {error && <p role="alert" style={{ color: '#c0392b', fontSize: '13px' }}>{error}</p>}
      {actionError && <p role="alert" style={{ color: '#c0392b', fontSize: '13px' }}>{actionError}</p>}

      {openLink && <PaymentLinkCard key={openLink.token} payment={openLink} onPaid={onPaid} onClosed={onLinkClosed} />}

      {result && <RolloutResult result={result} onStart={() => navigate('/assessments/start/daily')} />}

      {current && (
        <div style={{ border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '32px' }}>
          <div style={{ background: 'var(--navy)', padding: '14px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '18px' }}>{current.active ? 'verified_user' : 'shield'}</span>
              {current.active ? 'Active Package' : 'Package Ended'}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: '999px', padding: '4px 12px' }}>
              {current.durationDays} DAYS
            </span>
          </div>
          <div style={{ background: '#fff', padding: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '18px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '4px' }}>CURRENT PACKAGE</div>
              <h2 style={{ fontSize: '20px', marginBottom: '4px' }}>{current.name} — {current.tagline}</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>{current.subjects}</p>
            </div>
            <div style={{ minWidth: '180px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Days Remaining</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '18px', marginBottom: '6px' }}>
                {current.daysLeft} / {current.durationDays} Days
              </div>
              <div style={{ height: '5px', background: 'var(--card-border)', borderRadius: '999px', marginBottom: '6px' }}>
                <div style={{ width: `${Math.min(100, (current.daysLeft / current.durationDays) * 100)}%`, height: '100%', background: 'var(--gold)', borderRadius: '999px' }} />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ends {current.expiresOn}</div>
            </div>
            {current.active && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {paymentEnabled && !changing && (
                  <Button variant="ghost" onClick={() => setChanging(true)} disabled={processing}>Change Package</Button>
                )}
                <Button variant="outline" onClick={resend} disabled={resending}>
                  {resending ? 'Sending...' : "Email Today's Questions"}
                </Button>
                <Button variant="navy" onClick={() => navigate('/assessments/start/daily')}>Answer Today's Questions</Button>
              </div>
            )}
          </div>
          {current.active && (
            <div style={{ background: '#fff', borderTop: '1px solid var(--card-border)', padding: '12px 22px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={requestCancel}
                disabled={cancelling || processing}
                style={{ background: 'none', border: 'none', padding: 0, color: '#c0392b', fontSize: '13px', fontWeight: 600, cursor: cancelling || processing ? 'not-allowed' : 'pointer', opacity: cancelling || processing ? 0.6 : 1 }}
              >
                {cancelling ? 'Sending confirmation email...' : 'Cancel Subscription'}
              </button>
            </div>
          )}
        </div>
      )}

      {data && !data.emailConfigured && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px' }}>
          Daily emails are not set up on the server yet. Your questions are still released here every day at 7:00 AM.
        </p>
      )}

      {showPackages && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '22px', margin: 0 }}>{current ? 'Change Package' : 'Choose Your Package'}</h2>
            {changing && <Button variant="ghost" onClick={() => setChanging(false)} disabled={processing}>Hide packages</Button>}
          </div>
          {loading && !data && <SkeletonCards count={4} height={320} min={240} />}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '20px' }}>
            {(data?.packages || []).map((pkg) => {
              const selected = chosenPlan[pkg.package] || pkg.plans[0]?.subscriptionId;
              const isCurrent = current?.active && current.package === pkg.package;
              const isProcessing = processing && openLink.package?.name === pkg.name;
              return (
                <div
                  key={pkg.package}
                  style={{
                    background: '#fff',
                    border: pkg.package === 4 ? '2px solid var(--gold)' : '1px solid var(--card-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '19px', color: 'var(--navy)' }}>{ICONS[pkg.package]}</span>
                  </div>
                  <h3 style={{ fontSize: '18px', marginBottom: '2px' }}>{pkg.name}: {pkg.tagline}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>{pkg.subjects}</p>

                  <ul style={{ margin: '0 0 14px', paddingLeft: '18px', display: 'grid', gap: '4px' }}>
                    {pkg.examDays.map((d) => (
                      <li key={d.day} style={{ fontSize: '12px', lineHeight: 1.45 }}>
                        <strong>{d.label}:</strong> {d.subjects}
                      </li>
                    ))}
                  </ul>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    {pkg.package === 4
                      ? '3 daily essays: one each from Day 1, Day 2 and Day 3 subjects.'
                      : '3 daily essays rotating across these subjects.'}
                  </p>

                  <fieldset style={{ border: 'none', padding: 0, margin: '0 0 16px', display: 'grid', gap: '6px' }}>
                    <legend style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '6px' }}>DURATION</legend>
                    {pkg.plans.map((plan) => (
                      <label
                        key={plan.subscriptionId}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '8px',
                          border: `1px solid ${selected === plan.subscriptionId ? 'var(--navy)' : 'var(--card-border)'}`,
                          borderRadius: '8px',
                          padding: '8px 10px',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="radio"
                            name={`plan-${pkg.package}`}
                            checked={selected === plan.subscriptionId}
                            onChange={() => setChosenPlan((c) => ({ ...c, [pkg.package]: plan.subscriptionId }))}
                          />
                          {plan.durationDays} days
                        </span>
                        <strong>{peso(plan.price)}</strong>
                      </label>
                    ))}
                    {pkg.plans.length === 0 && <span style={{ fontSize: '12px', color: '#c0392b' }}>Not available yet.</span>}
                  </fieldset>

                  <div style={{ marginTop: 'auto' }}>
                    <Button variant={pkg.package === 4 ? 'navy' : 'outline'} fullWidth onClick={() => choose(pkg)} disabled={saving !== null || processing || pkg.plans.length === 0}>
                      {saving === pkg.package || isProcessing
                        ? paymentEnabled ? 'Processing...' : 'Activating...'
                        : `${paymentEnabled ? 'Pay for' : isCurrent ? 'Renew' : 'Choose'} ${pkg.name}`}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {paymentEnabled && <PaymentHistorySection payments={history.data?.payments} loading={history.loading && !history.data} error={history.error} />}
    </PortalLayout>
  );
}

function RolloutResult({ result, onStart }) {
  const rollout = result.rollout || {};
  const email = rollout.email || {};
  const ready = rollout.status === 'released' || rollout.status === 'existing';
  return (
    <div role="status" style={{ background: '#e8f5e9', border: '1px solid #b9dcc2', borderRadius: '10px', padding: '14px 16px', marginBottom: '22px', fontSize: '13px' }}>
      <strong style={{ display: 'block', marginBottom: '4px' }}>{result.message}</strong>
      {ready && <div>Your daily questions for today are ready.</div>}
      {rollout.status === 'exhausted' && <div>Every question in this package has already been given to you. New questions appear once the Review Administrators upload more.</div>}
      {email.sent && <div>We emailed them to <strong>{email.to}</strong>.</div>}
      {!email.sent && email.reason && email.reason !== 'skipped' && <div style={{ color: '#8a6514' }}>Email: {email.reason}</div>}
      {ready && (
        <button onClick={onStart} style={{ marginTop: '8px', background: 'none', border: 'none', padding: 0, color: 'var(--navy)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
          Start Answering →
        </button>
      )}
    </div>
  );
}
