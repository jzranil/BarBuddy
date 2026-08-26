const STYLES = {
  Success: { bg: '#e8f5e9', color: '#2e7d32' },
  Active: { bg: '#e8f5e9', color: '#2e7d32' },
  Pending: { bg: '#fff3e0', color: '#b8860b' },
  Warning: { bg: '#fff3e0', color: '#b8860b' },
  Failed: { bg: '#fdecea', color: '#c0392b' },
  Suspended: { bg: '#fdecea', color: '#c0392b' },
  Info: { bg: '#eef0f4', color: 'var(--navy)' },
  Inactive: { bg: '#f5f3ee', color: 'var(--text-muted)' },
};

export default function StatusPill({ status }) {
  const style = STYLES[status] ?? STYLES.Inactive;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '11px',
        fontWeight: 700,
        borderRadius: '999px',
        padding: '4px 10px',
        background: style.bg,
        color: style.color,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: style.color, display: 'inline-block' }} />
      {status}
    </span>
  );
}
