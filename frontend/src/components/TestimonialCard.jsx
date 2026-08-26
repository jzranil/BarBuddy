export default function TestimonialCard({ quote, name, role }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--radius-md)',
        padding: '24px',
      }}
    >
      <div style={{ color: 'var(--gold)', marginBottom: '10px', fontSize: '14px' }}>
        {'★★★★★'}
      </div>
      <p style={{ fontSize: '14px', color: 'var(--navy)', lineHeight: 1.6, marginBottom: '18px' }}>
        “{quote}”
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'var(--bg)',
            border: '1px solid var(--card-border)',
          }}
        />
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{role}</div>
        </div>
      </div>
    </div>
  );
}
