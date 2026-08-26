// tiers: [{ days, price, note }]
// icon: optional Material Symbol name — renders a small circle above the
// name (used on SubscriptionPage; omitted on the public landing page).
// showButton: set to false to hide the "Subscribe to..." button entirely
// (defaults to true, so the landing page is unaffected).
export default function PricingCard({ name, icon, subtitle, questionsNote, tiers, featured, onSubscribe, showButton = true }) {
  return (
    <div
      style={{
        background: '#fff',
        border: featured ? '2px solid var(--gold)' : '1px solid var(--card-border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {featured && (
        <div
          style={{
            background: 'var(--gold)',
            color: 'var(--navy)',
            textAlign: 'center',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '8px',
          }}
        >
          Most Popular Choice
        </div>
      )}

      <div style={{ padding: '22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {icon && (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: featured ? 'var(--gold)' : 'var(--navy)' }}>
              {icon}
            </span>
          </div>
        )}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '17px', marginBottom: '4px' }}>{name}</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 14px' }}>{subtitle}</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
            {questionsNote}
          </p>
        </div>
        <div style={{ display: 'grid', gap: '10px', marginBottom: '18px' }}>
          {tiers.map((tier) => (
            <div
              key={tier.days}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid var(--card-border)',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
            >
              <span
                style={{
                  background: 'var(--gold)',
                  color: 'var(--navy)',
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '999px',
                  padding: '3px 10px',
                }}
              >
                {tier.days} Days
              </span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{tier.price}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tier.note}</div>
              </div>
            </div>
          ))}
        </div>

        {showButton && (
          <button
            onClick={onSubscribe}
            style={{
              marginTop: 'auto',
              background: featured ? 'var(--gold)' : 'var(--navy)',
              color: featured ? 'var(--navy)' : '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '11px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Subscribe to {name}
          </button>
        )}
      </div>
    </div>
  );
}
