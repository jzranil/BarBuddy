// Shared section shell for the Settings page. Body uses the same white/
// border/radius card language as the rest of the portal; the header band
// uses the app's existing dark-navy-header convention (see the Subscription
// page's plan card) with light/cream text instead of a white header.
export default function SettingsSectionCard({ icon, title, description, id, children }) {
  return (
    <section
      id={id}
      style={{
        background: '#fff',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '20px',
        overflow: 'hidden',
        scrollMarginTop: '85px',
      }}
    >
      <div
        style={{
          padding: '20px 24px',
          background: 'var(--navy)',
          display: 'flex',
          gap: '14px',
          alignItems: 'flex-start',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            color: 'var(--gold)',
            fontSize: '20px',
            background: 'var(--navy-soft)',
            borderRadius: '8px',
            padding: '8px',
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: '17px', marginBottom: '4px', color: 'var(--bg)' }}>{title}</h2>
          <p style={{ fontSize: '13px', color: 'var(--gold-soft)', margin: 0 }}>{description}</p>
        </div>
      </div>

      {children && <div style={{ padding: '22px 24px' }}>{children}</div>}
    </section>
  );
}
