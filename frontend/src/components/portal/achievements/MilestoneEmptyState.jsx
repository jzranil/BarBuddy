// Only rendered when a specific filter (Earned or Locked) has zero results —
// per spec, "All" should never show an empty state as long as the catalog
// itself has entries.
export default function MilestoneEmptyState({ filter, kindLabel, kindLabelPlural }) {
  const copy = {
    earned: {
      icon: 'emoji_events',
      title: `No ${kindLabelPlural} Earned Yet`,
      body: `Keep reviewing and completing your BarBuddy activities to unlock your first ${kindLabel}.`,
    },
    locked: {
      icon: 'celebration',
      title: "You've Unlocked Everything!",
      body: `Great job! You have earned all available ${kindLabelPlural.toLowerCase()}.`,
    },
  }[filter];

  if (!copy) return null;

  return (
    <div style={{ textAlign: 'center', padding: '56px 22px', background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '34px', color: 'var(--text-muted)' }}>{copy.icon}</span>
      <h4 style={{ fontSize: '16px', margin: '12px 0 6px' }}>{copy.title}</h4>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 auto', maxWidth: '360px' }}>{copy.body}</p>
    </div>
  );
}
