export default function TestimonialCard({ image, quote, name, role }) {
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
         <img
          src={image}
          alt={name}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            objectFit: 'cover',
            objectPosition: 'center',
            border: '2px solid var(--card-border)',
            flexShrink: 0,
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
