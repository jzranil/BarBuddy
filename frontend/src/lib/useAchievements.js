import { useApi } from './useApi';
import { getZeroedAchievementSummary, requirementLabel, withStatus } from '../data/achievements';

const EMPTY = getZeroedAchievementSummary();

// Reviewee badges, achievements, challenges and progression from
// GET /api/reviewee/achievements. Anything already awarded (automatically or
// by a Review Administrator) stays earned even if a metric later drops.
export function useAchievements() {
  const { data, error } = useApi('/reviewee/achievements');

  const enrich = (list) =>
    data
      ? withStatus(list, data.metrics).map((entry) => ({
          ...entry,
          earned: entry.earned || entry.awarded,
          requirementLabel: requirementLabel(entry.requirement),
        }))
      : [];

  return {
    loaded: Boolean(data),
    error,
    summary: data ? { ...data.summary, trackTitle: `Level ${data.summary.level} • ${data.summary.longestStreak}-day best streak` } : EMPTY,
    metrics: data?.metrics,
    badges: enrich(data?.badges ?? []),
    achievements: enrich(data?.achievements ?? []),
    dailyChallenges: data?.dailyChallenges ?? [],
    progression: data?.progression ?? [],
    finalFrontier: data?.finalFrontier ?? { title: 'Grand Mock Bar Examination', requirements: [] },
  };
}
