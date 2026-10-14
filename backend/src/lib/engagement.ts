
import { supabaseAdmin } from './supabase';
import { getAnalytics, loadRevieweeSummary, manilaDate, slugForSubject, type RevieweeSummary } from './competency';

// Engagement rules — "BarBuddy Achievements and Badges", Recommended XP System.
// XP = effort, Streak = consistency, Mastery = competency, Achievements = milestones.
// Competency milestones (+50) and subject mastery (+100) are paid through the
// XP reward of the matching badges.
export const XP_RULES = {
  dailyEssay: 20, // complete one daily essay
  dailyAllBonus: 25, // complete all daily questions
  feedbackReview: 5, // review generated feedback (once per assessment)
  adaptiveEssay: 15, // essay in an adaptive (subject practice) activity
  challenge: 30, // complete a challenge (subject practice set)
  mockEssay: 30, // complete a Mock Bar essay
  mockFull: 150, // complete an entire Mock Bar
  streakDay: 5, // maintain the daily streak (per day)
};

// XP earned by submitting an assessment.
//
// Pacing: the Mock Bar unlocks at a 30-day streak OR Level 4 (3,000 XP). A
// reviewee who answers all daily questions earns about 95 XP a day
// (3 x 20 + 25 bonus + 5 streak + 5 feedback review), so Level 4 takes about
// a month of daily work, the same as the streak path. Extra practice can
// speed it up, but only the first practice set each day earns XP, so the
// level cannot be reached by grinding practice sets in one sitting.
export function assessmentXp(type: string, answered: number, total: number, practiceXpUsedToday = false) {
  const complete = total > 0 && answered === total;
  if (type === 'daily') return answered * XP_RULES.dailyEssay + (complete ? XP_RULES.dailyAllBonus : 0);
  if (type === 'mock') return answered * XP_RULES.mockEssay + (complete ? XP_RULES.mockFull : 0);
  if (practiceXpUsedToday) return 0;
  return answered * XP_RULES.adaptiveEssay + (answered > 0 ? XP_RULES.challenge : 0);
}

// Creates the reviewee's bb_user_analytics_tbl row on first use
async function ensureAnalyticsId(userId: string) {
  const current = await getAnalytics(userId);
  if (current.analyticsId) return current;

  const { data: created, error } = await supabaseAdmin
    .from('bb_user_analytics_tbl')
    .insert({
      user_analytics_questions_answered: 0,
      user_analytics_days_streak: 0,
      user_analytics_xp: 0,
      is_archived: false,
    })
    .select('user_analytics_id')
    .single();

  if (error) throw error;

  await supabaseAdmin.from('bb_users_tbl').update({ user_analytics_id: created.user_analytics_id }).eq('user_id', userId);

  return { ...current, analyticsId: created.user_analytics_id as string };
}

export async function addXp(userId: string, amount: number) {
  if (amount <= 0) return;
  const analytics = await ensureAnalyticsId(userId);
  await supabaseAdmin
    .from('bb_user_analytics_tbl')
    .update({ user_analytics_xp: analytics.xp + amount, updated_at: new Date().toISOString() })
    .eq('user_analytics_id', analytics.analyticsId);
}

// Called when a reviewee submits an assessment: streak, answered count and XP
export async function recordStudyActivity(userId: string, answeredCount: number, xp: number) {
  const analytics = await ensureAnalyticsId(userId);
  const today = manilaDate();
  const yesterday = manilaDate(new Date(Date.now() - 86400000));

  let streak = analytics.streak;
  let streakXp = 0;
  if (analytics.lastActive !== today) {
    streak = analytics.lastActive === yesterday ? analytics.streak + 1 : 1;
    if (streak > 1) streakXp = XP_RULES.streakDay;
  }

  const { data: row } = await supabaseAdmin
    .from('bb_user_analytics_tbl')
    .select('user_analytics_questions_answered')
    .eq('user_analytics_id', analytics.analyticsId)
    .single();

  await supabaseAdmin
    .from('bb_user_analytics_tbl')
    .update({
      user_analytics_days_streak: streak,
      user_analytics_longest_streak: Math.max(analytics.longestStreak, streak),
      user_analytics_last_active: today,
      user_analytics_questions_answered: (row?.user_analytics_questions_answered ?? 0) + answeredCount,
      user_analytics_xp: analytics.xp + xp + streakXp,
      updated_at: new Date().toISOString(),
    })
    .eq('user_analytics_id', analytics.analyticsId);
}

// Keeps the stored average score in sync after a lawyer verification
export async function refreshAverageScore(userId: string) {
  const { summary } = await loadRevieweeSummary(userId);
  const analytics = await ensureAnalyticsId(userId);
  await supabaseAdmin
    .from('bb_user_analytics_tbl')
    .update({ user_analytics_avg_score: summary.overallCompetency, updated_at: new Date().toISOString() })
    .eq('user_analytics_id', analytics.analyticsId);
  await supabaseAdmin.from('bb_users_tbl').update({ user_progress: summary.readinessScore }).eq('user_id', userId);
}

// Awards every automatic badge/achievement whose condition the reviewee now
// meets. Returns the newly awarded titles.
export async function awardEarnedAchievements(userId: string) {
  const { summary } = await loadRevieweeSummary(userId);
  const m = summary.metrics;

  const [{ data: catalog }, { data: owned }] = await Promise.all([
    supabaseAdmin
      .from('bb_achievements_tbl')
      .select('achievement_id, achievement_title, achievement_condition, achievement_threshold, achievement_xp_reward, achievement_subject_group, bb_question_subjects_tbl ( question_subject_desc )')
      .eq('is_archived', false)
      .neq('achievement_condition', 'manual'),
    supabaseAdmin.from('bb_user_achievements_tbl').select('achievement_id').eq('user_id', userId),
  ]);

  const ownedIds = new Set((owned || []).map((o) => o.achievement_id));
  const value = conditionReaders(summary, ownedIds, catalog || []);

  // Meta badges depend on the others, so evaluate until nothing new is earned
  const earned: any[] = [];
  for (let pass = 0; pass < 3; pass++) {
    const batch = (catalog || []).filter(
      (a: any) => !ownedIds.has(a.achievement_id) && (value[a.achievement_condition]?.(a) ?? 0) >= Number(a.achievement_threshold)
    );
    if (batch.length === 0) break;
    for (const a of batch) {
      ownedIds.add(a.achievement_id);
      earned.push(a);
    }
  }

  if (earned.length === 0) return [];

  const { error } = await supabaseAdmin
    .from('bb_user_achievements_tbl')
    .upsert(
      earned.map((a: any) => ({ user_id: userId, achievement_id: a.achievement_id })),
      { onConflict: 'user_id,achievement_id', ignoreDuplicates: true }
    );
  if (error) throw error;

  await addXp(userId, earned.reduce((sum: number, a: any) => sum + (a.achievement_xp_reward || 0), 0));

  return earned.map((a: any) => a.achievement_title as string);
}

// Current value of every automatic condition for one reviewee. `catalog`
// rows need achievement_id, achievement_condition, achievement_subject_group
// and bb_question_subjects_tbl.question_subject_desc.
export function conditionReaders(summary: RevieweeSummary, ownedIds: Set<string>, catalog: any[]) {
  const m = summary.metrics;
  const standard = catalog.filter((a: any) => a.achievement_condition !== 'completionist' && a.achievement_condition !== 'manual');

  const value: Record<string, (a: any) => number> = {
    questions_completed: () => m.questionsCompleted,
    study_streak: () => Math.max(m.studyStreakDays, summary.longestStreak),
    exams_completed: () => m.examsCompleted,
    perfect_scores: () => m.perfectScores,
    study_sessions: () => m.studySessionsCompleted,
    subjects_mastered: () => m.subjectsMastered,
    bar_readiness: () => m.barReadinessScore,
    xp_earned: () => m.xpEarned,
    subject_score: (a) => {
      const name = a.bb_question_subjects_tbl?.question_subject_desc;
      return name ? m.subjectScores[slugForSubject(name)] ?? 0 : 0;
    },
    alac_complete: () => m.alacComplete,
    alac_master: () => m.alacMaster,
    score_improved: () => m.scoreImproved,
    competency_gain: () => m.competencyGain,
    mastery_points: () => m.masteryPoints,
    groups_competent: () => m.groupsCompetent,
    group_score: (a) => m.groupScores[a.achievement_subject_group] ?? 0,
    timed_completed: () => m.timedCompleted,
    mock_full: () => m.mockFull,
    daily_complete: () => m.dailyComplete,
    daily_full_streak: () => m.dailyFullStreak,
    challenges_completed: () => m.challengesCompleted,
    feedback_reviewed: () => m.feedbackReviewed,
    learn_improve: () => m.learnImprove,
    comeback: () => m.comebacks,
    achievements_unlocked: () => ownedIds.size,
    completionist: () => (standard.length > 0 && standard.every((a: any) => ownedIds.has(a.achievement_id)) ? 1 : 0),
  };
  return value;
}
