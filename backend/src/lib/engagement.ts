
import { supabaseAdmin } from './supabase';
import { getAnalytics, loadRevieweeSummary, manilaDate, slugForSubject } from './competency';

// Engagement rules (capstone paper scope: XP, learning streaks, badges,
// milestones, achievements and challenges).
export const XP_RULES = {
  answerSubmitted: 20, // each non-blank essay answer
  assessmentCompleted: 50, // finishing any assessment
  dailyBonus: 30, // extra for completing the daily questions
  verifiedPerPoint: 10, // per point of the lawyer-verified five-point score
};

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
  if (analytics.lastActive !== today) {
    streak = analytics.lastActive === yesterday ? analytics.streak + 1 : 1;
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
      user_analytics_xp: analytics.xp + xp,
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
      .select('achievement_id, achievement_title, achievement_condition, achievement_threshold, achievement_xp_reward, bb_question_subjects_tbl ( question_subject_desc )')
      .eq('is_archived', false)
      .neq('achievement_condition', 'manual'),
    supabaseAdmin.from('bb_user_achievements_tbl').select('achievement_id').eq('user_id', userId),
  ]);

  const ownedIds = new Set((owned || []).map((o) => o.achievement_id));
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
  };

  const earned = (catalog || []).filter(
    (a: any) => !ownedIds.has(a.achievement_id) && (value[a.achievement_condition]?.(a) ?? 0) >= Number(a.achievement_threshold)
  );

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
