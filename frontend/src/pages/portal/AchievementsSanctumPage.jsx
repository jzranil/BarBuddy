import { useMemo, useState } from 'react';
import PortalLayout from '../../layouts/PortalLayout';
import StatusTabs from '../../components/portal/achievements/StatusTabs';
import MilestoneCard from '../../components/portal/achievements/MilestoneCard';
import MilestoneDetailModal from '../../components/portal/achievements/MilestoneDetailModal';
import MilestoneEmptyState from '../../components/portal/achievements/MilestoneEmptyState';
import { ACHIEVEMENTS, getZeroedProgressMetrics, withStatus, requirementLabel } from '../../data/achievements';

// BACKEND TODO: swap for a real fetch once GET /api/reviewee/progress-metrics exists.
const metrics = getZeroedProgressMetrics();

export default function AchievementsSanctumPage() {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const achievements = useMemo(
    () => withStatus(ACHIEVEMENTS, metrics).map((a) => ({ ...a, requirementLabel: requirementLabel(a.requirement) })),
    []
  );

  const counts = useMemo(
    () => ({
      all: achievements.length,
      earned: achievements.filter((a) => a.earned).length,
      locked: achievements.filter((a) => !a.earned).length,
    }),
    [achievements]
  );

  const visible = achievements.filter((a) => {
    if (filter === 'earned') return a.earned;
    if (filter === 'locked') return !a.earned;
    return true;
  });

  return (
    <PortalLayout>


      <h1 style={{ fontSize: '28px', marginBottom: '6px' }}>Achievements Sanctum</h1>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', maxWidth: '560px' }}>
        Track your accomplishments and progress throughout your BarBuddy review journey.
      </p>

      <div style={{ marginBottom: '20px' }}>
        <StatusTabs value={filter} onChange={setFilter} counts={counts} />
      </div>

      {visible.length === 0 ? (
        <MilestoneEmptyState filter={filter} kindLabel="achievement" kindLabelPlural="Achievements" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {visible.map((a) => (
            <MilestoneCard
              key={a.id}
              icon={a.icon}
              name={a.name}
              description={a.description}
              requirementLabel={a.requirementLabel}
              current={a.current}
              target={a.target}
              earned={a.earned}
              rarity={a.rarity}
              variant="achievement"
              onClick={() => setSelected(a)}
            />
          ))}
        </div>
      )}

      <MilestoneDetailModal open={!!selected} onClose={() => setSelected(null)} entry={selected} variant="achievement" />
    </PortalLayout>
  );
}
