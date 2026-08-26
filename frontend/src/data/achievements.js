// ---------------------------------------------------------------------------
// Everything here defaults to a brand-new reviewee who hasn't done anything
// yet — 0 XP, 0-day streak, no badges unlocked, first progression step
// "in progress" and everything after it locked. Nothing is faked.
//
// BACKEND TODO: replace `getZeroedAchievementSummary()` with
// GET /api/reviewee/achievements-summary, and swap DAILY_CHALLENGES /
// PROGRESSION_ROAD / ACHIEVEMENT_BADGES / FINAL_FRONTIER for whatever those
// endpoints return. Field names below are the contract the components expect.
// ---------------------------------------------------------------------------

export function getZeroedAchievementSummary() {
  return {
    displayName: 'Reviewee', // BACKEND TODO: pull from Cognito profile
    levelTitle: 'New Candidate', // shown as the gold pill next to the page title
    trackTitle: 'Just getting started', // e.g. "Mastering Political Law" once they specialize
    level: 1,
    xpCurrent: 0,
    xpTarget: 3000, // XP needed to reach the next level
    streakDays: 0,
    expPoints: 0,
  };
}

// BACKEND TODO: replace with GET /api/reviewee/daily-challenges — these
// reset every day, so they should come from the server, not be hardcoded.
export const DAILY_CHALLENGES = [
  { icon: 'menu_book', title: 'Analyze a Case Digest', xpReward: 150, progressCurrent: 0, progressTotal: 5 },
  { icon: 'bolt', title: 'Speed MCQ Drill', xpReward: 100, progressCurrent: 0, progressTotal: 20 },
  { icon: 'edit_note', title: 'Essay Draft Practice', xpReward: 300, progressCurrent: 0, progressTotal: 1 },
];

// The vertical "Progression Road to Bar" — first step is always the current
// focus for a brand-new reviewee; everything after it is locked until a
// level requirement is met.
// BACKEND TODO: replace with GET /api/reviewee/progression-road
export const PROGRESSION_ROAD = [
  { title: 'Basic Legal Concepts Mastery', status: 'current', detail: 'In Progress: 0% Mastery' },
  { title: 'Political & Public Law Review', status: 'locked', detail: 'Requirement: Reach Level 5' },
  { title: 'Labor Law Proficiency Level', status: 'locked', detail: 'Requirement: Reach Level 8' },
  { title: 'Civil Law Advanced Scenarios', status: 'locked', detail: 'Requirement: Reach Level 10' },
  { title: 'Criminal Procedure Simulated Exam', status: 'locked', detail: 'Requirement: Reach Level 10' },
];

// BACKEND TODO: replace with GET /api/reviewee/achievements. `totalBadges`
// is the denominator shown in "0 / 48 Unlocked" — keep it in sync with
// however many badges actually exist in the catalog.
export const totalBadges = 48;

export const ACHIEVEMENT_BADGES = [
  {
    icon: 'shield',
    title: 'Political Law Prodigy',
    rarity: 'Rare',
    description: 'Score 95%+ in three consecutive Political Law mock exams.',
  },
  {
    icon: 'timer',
    title: 'Midnight Scholar',
    rarity: 'Common',
    description: 'Complete 5 full review sessions after midnight in one week.',
  },
  {
    icon: 'balance',
    title: 'Civil Law Sage',
    rarity: 'Legendary',
    description: 'Successfully cite over 100 correct Supreme Court precedents.',
  },
  {
    icon: 'gavel',
    title: 'Labor Force',
    rarity: 'Rare',
    description: 'Get a perfect score on the Collective Bargaining module assessment.',
  },
];

// BACKEND TODO: requirement `met` flags should be computed server-side from
// the reviewee's real level/mastery, e.g. GET /api/reviewee/final-frontier
export const FINAL_FRONTIER = {
  title: 'Grand Mock Bar Exam 2024',
  requirements: [
    { label: 'Reach Level 10', met: false },
    { label: 'Master Political Law', met: false },
    { label: 'Reach Level 15', met: false },
    { label: 'Master Remedial Law', met: false },
  ],
};
