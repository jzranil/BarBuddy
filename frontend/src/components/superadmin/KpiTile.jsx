// label/value/trendLabel matching the mockups' small stat cards.
// trendPositive: true = green up-arrow style, false = red, undefined = neutral grey.
export default function KpiTile({ icon, label, value, trendLabel, trendPositive }) {
  const trendColor = trendPositive === true ? '#2e7d32' : trendPositive === false ? '#c0392b' : 'var(--text-muted)';

  return (
    <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{label}</span>
        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--navy)' }}>{icon}</span>
        </div>
      </div>
      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '24px', marginBottom: '4px' }}>{value}</div>
      {trendLabel && (
        <div style={{ fontSize: '12px', color: trendColor }}>{trendLabel}</div>
      )}
    </div>
  );
}
