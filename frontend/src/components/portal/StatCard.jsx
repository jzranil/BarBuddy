export default function StatCard({ icon, label, value, sublabel, tag }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--radius-md)',
        padding: '18px 20px',
        flex: 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '20px' }}>
          {icon}
        </span>
        {tag && (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              border: '1px solid var(--card-border)',
              borderRadius: '999px',
              padding: '3px 10px',
            }}
          >
            {tag}
          </span>
        )}
      </div>
      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', fontWeight: 700 }}>{value}</div>
      {sublabel && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{sublabel}</div>}
    </div>
  );
}
