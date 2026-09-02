// Segmented filter control — same visual language as the Font Size selector
// on the Settings page's Appearance section (pill track, navy active state).
// Used by both the Achievements Sanctum and Badges pages so filtering works
// identically in both places.
export default function StatusTabs({ value, onChange, counts }) {
  const tabs = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'earned', label: 'Earned', count: counts.earned },
    { key: 'locked', label: 'Locked', count: counts.locked },
  ];

  return (
    <div
      role="tablist"
      aria-label="Filter by status"
      style={{
        display: 'inline-flex',
        border: '1px solid var(--card-border)',
        borderRadius: '999px',
        padding: '3px',
        gap: '2px',
        background: '#fff',
      }}
    >
      {tabs.map((tab) => {
        const active = value === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            style={{
              border: 'none',
              borderRadius: '999px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: active ? 'var(--navy)' : 'transparent',
              color: active ? '#fff' : 'var(--navy)',
            }}
          >
            {tab.label} ({tab.count})
          </button>
        );
      })}
    </div>
  );
}
