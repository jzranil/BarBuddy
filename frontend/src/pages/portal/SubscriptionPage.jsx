import { useNavigate } from 'react-router-dom';
import PortalLayout from '../../layouts/PortalLayout';
import PricingCard from '../../components/PricingCard';
import Button from '../../components/Button';
import { PRICING, FREE_TRIAL, getZeroedSubscriptionSummary } from '../../data/pricing';

// BACKEND TODO: swap for GET /api/billing/subscription once PayMongo + a
// billing table exist. See src/data/pricing.js for the exact shape expected.
const subscription = getZeroedSubscriptionSummary();

export default function SubscriptionPage() {
  const navigate = useNavigate();

  return (
    <PortalLayout>
      <h1 style={{ fontSize: '28px', marginBottom: '6px' }}>Subscription Status</h1>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
        Manage your access and active mastery plans.
      </p>

      {/* Current plan card */}
      <div style={{ border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '40px' }}>
        <div style={{ background: 'var(--navy)', padding: '14px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '18px' }}>
              {subscription.isPremium ? 'verified_user' : 'shield'}
            </span>
            {subscription.isPremium ? 'Active Subscription' : 'Free Trial Active'}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 700, border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: '999px', padding: '4px 12px' }}>
            {subscription.planTag}
          </span>
        </div>

        <div style={{ background: '#fff', padding: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '18px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '4px' }}>CURRENT PACKAGE</div>
            <h2 style={{ fontSize: '20px', marginBottom: '4px' }}>{subscription.packageName}</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>{subscription.packageDescription}</p>
          </div>

          {subscription.isPremium ? (
            <div style={{ minWidth: '180px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Days Remaining</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '18px', marginBottom: '6px' }}>
                {subscription.daysRemaining} / {subscription.daysTotal} Days
              </div>
              <div style={{ height: '5px', background: 'var(--card-border)', borderRadius: '999px', marginBottom: '6px' }}>
                <div style={{ width: `${(subscription.daysRemaining / subscription.daysTotal) * 100}%`, height: '100%', background: 'var(--gold)', borderRadius: '999px' }} />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>event</span>
                Next billing: {subscription.nextBillingLabel}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '260px' }}>
              You're on the free trial — upgrade any time to unlock full subject access below.
            </p>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              onClick={() => navigate('/coming-soon', { state: { title: 'Manage Plan', description: 'Plan management (cancel, change tier, payment method) connects here once billing exists.' } })}
            >
              Manage Plan
            </Button>
            <Button
              variant="navy"
              onClick={() =>
                subscription.isPremium
                  ? navigate('/coming-soon', { state: { title: 'Renew Now', description: 'Renewal checkout connects here once PayMongo billing is wired up.' } })
                  : document.getElementById('upgrade-packages')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              {subscription.isPremium ? 'Renew Now' : 'Upgrade Plan'}
            </Button>
          </div>
        </div>
      </div>

      {/* Upgrade packages */}
      <div id="upgrade-packages" style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>Would You Like to Upgrade Your Experience?</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Choose the plan that fits your study pace. All plans include access to our 2024
          jurisprudence database.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '20px' }}>
        {PRICING.map((pkg) => (
          <PricingCard key={pkg.id} {...pkg} showButton={false} />
        ))}
      </div>

      {/* Free trial summary */}
      <div
        style={{
          background: '#fff',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--radius-md)',
          padding: '22px 26px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '18px',
        }}
      >
        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.05em' }}>BASIC</span>
          <h3 style={{ fontSize: '20px', margin: '4px 0' }}>{FREE_TRIAL.name}</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>{FREE_TRIAL.tagline}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
          {FREE_TRIAL.features.map((f) => (
            <span key={f} style={{ fontSize: '13px', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--gold)' }}>check_circle</span>
              {f}
            </span>
          ))}
        </div>
      </div>
    </PortalLayout>
  );
}
