import { useMemo, useState } from 'react';
import PortalLayout from '../../layouts/PortalLayout';
import StatusTabs from '../../components/portal/achievements/StatusTabs';
import MilestoneCard from '../../components/portal/achievements/MilestoneCard';
import MilestoneDetailModal from '../../components/portal/achievements/MilestoneDetailModal';
import MilestoneEmptyState from '../../components/portal/achievements/MilestoneEmptyState';
import { BADGES, getZeroedProgressMetrics, withStatus, requirementLabel } from '../../data/achievements';

// BACKEND TODO: swap for a real fetch once GET /api/reviewee/progress-metrics exists.
const metrics = getZeroedProgressMetrics();

export default function BadgesPage() {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const badges = useMemo(
    () => withStatus(BADGES, metrics).map((b) => ({ ...b, requirementLabel: requirementLabel(b.requirement) })),
    []
  );

  const counts = useMemo(
    () => ({
      all: badges.length,
      earned: badges.filter((b) => b.earned).length,
      locked: badges.filter((b) => !b.earned).length,
    }),
    [badges]
  );

  const visible = badges.filter((b) => {
    if (filter === 'earned') return b.earned;
    if (filter === 'locked') return !b.earned;
    return true;
  });

  return (
    <PortalLayout>


      <h1 style={{ fontSize: '28px', marginBottom: '6px' }}>Badges</h1>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', maxWidth: '560px' }}>
        Collect badges by reaching important milestones throughout your BarBuddy review journey.
      </p>

      <div style={{ marginBottom: '20px' }}>
        <StatusTabs value={filter} onChange={setFilter} counts={counts} />
      </div>

      {visible.length === 0 ? (
        <MilestoneEmptyState filter={filter} kindLabel="badge" kindLabelPlural="Badges" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {visible.map((b) => (
            <MilestoneCard
              key={b.id}
              icon={b.icon}
              name={b.name}
              description={b.description}
              requirementLabel={b.requirementLabel}
              current={b.current}
              target={b.target}
              earned={b.earned}
              variant="badge"
              onClick={() => setSelected(b)}
            />
          ))}
        </div>
      )}

      <MilestoneDetailModal open={!!selected} onClose={() => setSelected(null)} entry={selected} variant="badge" />
    </PortalLayout>
  );
}
