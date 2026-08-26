export default function FeatureCard({ icon, title, description }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--radius-md)',
        padding: '26px',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '14px',
        }}
      >
        <span className="material-symbols-outlined" style={{ color: 'var(--gold)' }}>
          {icon}
        </span>
      </div>
      <h3 style={{ fontSize: '17px', marginBottom: '8px' }}>{title}</h3>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
        {description}
      </p>
    </div>
  );
}
