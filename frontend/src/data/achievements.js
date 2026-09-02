// ---------------------------------------------------------------------------
// Everything here defaults to a brand-new reviewee who hasn't done anything
// yet — 0 XP, 0-day streak, no badges unlocked, first progression step
// "in progress" and everything after it locked. Nothing is faked.
//
// BACKEND TODO: replace `getZeroedAchievementSummary()` with
// GET /api/reviewee/achievements-summary, and swap DAILY_CHALLENGES /
// PROGRESSION_ROAD / ACHIEVEMENTS / BADGES / FINAL_FRONTIER for whatever
// those endpoints return. Field names below are the contract the components
// expect.
// ---------------------------------------------------------------------------

import { getZeroedSubjectStats } from './subjects';

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

// ---------------------------------------------------------------------------
// PROGRESS METRICS — the single source of truth that both Achievements and
// Badges are evaluated against. Reuses tracked fields wherever the app
// already has them (streak, per-subject score/status from subjects.js) and
// adds a small number of new lifetime counters using the exact same
// "zeroed until the backend exists" convention as the rest of the app.
//
// BACKEND TODO: replace with GET /api/reviewee/progress-metrics. Once real
// activity data exists, every number below comes from the server instead —
// the requirement-evaluation logic never needs to change.
// ---------------------------------------------------------------------------
export function getZeroedProgressMetrics() {
  const subjectStats = getZeroedSubjectStats();
  const subjectsMastered = Object.values(subjectStats).filter((s) => s.status === 'Mastered').length;
  const subjectScores = Object.fromEntries(Object.entries(subjectStats).map(([slug, s]) => [slug, s.score]));

  return {
    questionsCompleted: 0, // lifetime total across daily challenges + exams
    studyStreakDays: 0, // BACKEND TODO: same underlying value as getZeroedAchievementSummary().streakDays once there's one source of truth
    examsCompleted: 0, // lifetime exams attempted across all subjects
    perfectScores: 0, // exams scored 100%
    studySessionsCompleted: 0, // lifetime full review sessions completed
    barReadinessScore: 0, // 0-100, mirrors getZeroedUserSummary().readinessScore in data/subjects.js
    subjectsMastered, // count of subjects currently at 'Mastered' status
    subjectScores, // { [subjectSlug]: 0-100 } — per-subject competency score
  };
}

// Requirement -> current progress, given a metrics object from
// getZeroedProgressMetrics(). Shared by both Achievements and Badges so
// there's exactly one place that knows how to read a requirement.
export function evaluateRequirement(requirement, metrics) {
  const { type, target, subject } = requirement;
  const readers = {
    questions_completed: () => metrics.questionsCompleted,
    study_streak: () => metrics.studyStreakDays,
    exams_completed: () => metrics.examsCompleted,
    perfect_scores: () => metrics.perfectScores,
    study_sessions: () => metrics.studySessionsCompleted,
    subjects_mastered: () => metrics.subjectsMastered,
    bar_readiness: () => metrics.barReadinessScore,
    subject_score: () => metrics.subjectScores[subject] ?? 0,
  };
  const current = (readers[type] ?? (() => 0))();
  return {
    earned: current >= target,
    current: Math.min(current, target),
    target,
  };
}

// Attaches computed { earned, current, target, requirementLabel } to every
// entry in a catalog (ACHIEVEMENTS or BADGES) without mutating the source
// arrays. `earned`/progress are always derived from `metrics` — nothing in
// the catalog itself is manually flagged as earned.
export function withStatus(catalog, metrics) {
  return catalog.map((entry) => {
    const { earned, current, target } = evaluateRequirement(entry.requirement, metrics);
    return { ...entry, earned, current, target };
  });
}

// Plain-language requirement text shown on locked cards, e.g. "Complete 100
// questions" or "Reach the required competency level in Political Law".
export function requirementLabel(requirement) {
  const { type, target, subject } = requirement;
  const subjectName = subject ? SUBJECT_NAMES[subject] ?? subject : '';
  const labels = {
    questions_completed: `Complete ${target} question${target === 1 ? '' : 's'}.`,
    study_streak: `Maintain a ${target}-day study streak.`,
    exams_completed: `Complete ${target} assessment${target === 1 ? '' : 's'}.`,
    perfect_scores: `Achieve a perfect score in ${target} qualifying assessment${target === 1 ? '' : 's'}.`,
    study_sessions: `Complete ${target} full review session${target === 1 ? '' : 's'}.`,
    subjects_mastered: `Reach Mastered status in ${target} Bar subject${target === 1 ? '' : 's'}.`,
    bar_readiness: `Reach a Bar Readiness Score of ${target}.`,
    subject_score: `Reach a ${target}% competency score in ${subjectName}.`,
  };
  return labels[type] ?? 'Requirement not yet defined.';
}

const SUBJECT_NAMES = {
  'political-law': 'Political Law',
  'labor-law': 'Labor Law',
  'civil-law': 'Civil Law',
  'criminal-law': 'Criminal Law',
  'commercial-law': 'Commercial Law',
  'tax-law': 'Tax Law',
  'remedial-law': 'Remedial Law',
  'legal-ethics': 'Legal Ethics',
};

// ---------------------------------------------------------------------------
// ACHIEVEMENTS — specific, flavorful accomplishments shown in the
// Achievements Sanctum. BACKEND TODO: replace with GET /api/reviewee/achievements.
// `earnedAt` stays null until the backend can actually timestamp an unlock —
// see withStatus() for how `earned`/progress get computed in the meantime.
// ---------------------------------------------------------------------------
export const ACHIEVEMENTS = [
  {
    id: 'achv-political-law-prodigy',
    icon: 'shield',
    name: 'Political Law Prodigy',
    category: 'Political Law',
    rarity: 'Rare',
    description: 'Reach a 95% competency score in Political Law.',
    requirement: { type: 'subject_score', subject: 'political-law', target: 95 },
    earnedAt: null,
  },
  {
    id: 'achv-midnight-scholar',
    icon: 'timer',
    name: 'Midnight Scholar',
    category: 'Consistency',
    rarity: 'Common',
    description: 'Complete 5 full review sessions in a single week.',
    requirement: { type: 'study_sessions', target: 5 },
    earnedAt: null,
  },
  {
    id: 'achv-civil-law-sage',
    icon: 'balance',
    name: 'Civil Law Sage',
    category: 'Civil Law',
    rarity: 'Legendary',
    description: 'Reach a 95% competency score in Civil Law.',
    requirement: { type: 'subject_score', subject: 'civil-law', target: 95 },
    earnedAt: null,
  },
  {
    id: 'achv-labor-force',
    icon: 'gavel',
    name: 'Labor Force',
    category: 'Labor Law',
    rarity: 'Rare',
    description: 'Score 100% on a Labor Law assessment.',
    requirement: { type: 'subject_score', subject: 'labor-law', target: 100 },
    earnedAt: null,
  },
  {
    id: 'achv-criminal-law-vanguard',
    icon: 'security',
    name: 'Criminal Law Vanguard',
    category: 'Criminal Law',
    rarity: 'Rare',
    description: 'Reach a 95% competency score in Criminal Law.',
    requirement: { type: 'subject_score', subject: 'criminal-law', target: 95 },
    earnedAt: null,
  },
  {
    id: 'achv-remedial-law-strategist',
    icon: 'fact_check',
    name: 'Remedial Law Strategist',
    category: 'Remedial Law',
    rarity: 'Rare',
    description: 'Reach a 95% competency score in Remedial Law.',
    requirement: { type: 'subject_score', subject: 'remedial-law', target: 95 },
    earnedAt: null,
  },
  {
    id: 'achv-perfect-scholar',
    icon: 'auto_awesome',
    name: 'Perfect Scholar',
    category: 'Performance',
    rarity: 'Legendary',
    description: 'Score a perfect 100% on three separate assessments.',
    requirement: { type: 'perfect_scores', target: 3 },
    earnedAt: null,
  },
  {
    id: 'achv-iron-streak',
    icon: 'local_fire_department',
    name: 'Iron Streak',
    category: 'Consistency',
    rarity: 'Common',
    description: 'Maintain a 14-day study streak without missing a day.',
    requirement: { type: 'study_streak', target: 14 },
    earnedAt: null,
  },
];

// ---------------------------------------------------------------------------
// BADGES — broader milestones across the whole review journey (as opposed
// to the subject-specific Achievements above). BACKEND TODO: replace with
// GET /api/reviewee/badges.
// ---------------------------------------------------------------------------
export const BADGES = [
  {
    id: 'badge-first-step',
    icon: 'flag',
    name: 'First Step',
    description: 'Complete your first daily question.',
    requirement: { type: 'questions_completed', target: 1 },
    earnedAt: null,
  },
  {
    id: 'badge-consistent-reviewer',
    icon: 'local_fire_department',
    name: 'Consistent Reviewer',
    description: 'Maintain a 7-day study streak.',
    requirement: { type: 'study_streak', target: 7 },
    earnedAt: null,
  },
  {
    id: 'badge-dedicated-reviewer',
    icon: 'whatshot',
    name: 'Dedicated Reviewer',
    description: 'Maintain a 30-day study streak.',
    requirement: { type: 'study_streak', target: 30 },
    earnedAt: null,
  },
  {
    id: 'badge-question-master',
    icon: 'quiz',
    name: 'Question Master',
    description: 'Complete 100 questions.',
    requirement: { type: 'questions_completed', target: 100 },
    earnedAt: null,
  },
  {
    id: 'badge-century-reviewer',
    icon: 'auto_stories',
    name: 'Century Reviewer',
    description: 'Complete 500 questions.',
    requirement: { type: 'questions_completed', target: 500 },
    earnedAt: null,
  },
  {
    id: 'badge-perfect-run',
    icon: 'military_tech',
    name: 'Perfect Run',
    description: 'Achieve a perfect score in a qualifying assessment.',
    requirement: { type: 'perfect_scores', target: 1 },
    earnedAt: null,
  },
  {
    id: 'badge-subject-specialist',
    icon: 'workspace_premium',
    name: 'Subject Specialist',
    description: 'Reach the required competency level in a Bar subject.',
    requirement: { type: 'subjects_mastered', target: 1 },
    earnedAt: null,
  },
  {
    id: 'badge-bar-ready',
    icon: 'verified',
    name: 'Bar Ready',
    description: 'Reach the required overall Bar readiness level.',
    requirement: { type: 'bar_readiness', target: 80 },
    earnedAt: null,
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
