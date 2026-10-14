// Seeds the badge and achievement catalog from "BarBuddy Achievements and
// Badges". Safe to re-run: entries are matched by title and updated in place.
// Starter entries that are not in the document are archived (not deleted), so
// Review Administrators can restore them from Badges & Achievements.
// Requires supabase/migrations/20261016_packages_rollout_badges.sql.
//
//   npx tsx --env-file=.env scripts/seed-achievements.ts

import { supabaseAdmin } from '../src/lib/supabase';

type Seed = {
  type: 'Badge' | 'Achievement';
  icon: string;
  title: string;
  desc: string;
  category: string;
  condition: string;
  threshold: number;
  group?: string; // WEIGHT_GROUPS key for group_score
  rarity?: 'Common' | 'Rare' | 'Legendary';
  xp?: number;
};

// Subject mastery pays +100 XP and competency milestones +50 XP (Recommended XP System)
const CATALOG: Seed[] = [
  // Streak
  { type: 'Badge', icon: 'local_fire_department', title: 'Getting Started', desc: 'Reach a 3-day streak. Awarded for beginning a consistent Bar review routine.', category: 'Streak', condition: 'study_streak', threshold: 3 },
  { type: 'Badge', icon: 'local_fire_department', title: 'One Week Strong', desc: 'Reach a 7-day streak. You maintained a full week of consistent study.', category: 'Streak', condition: 'study_streak', threshold: 7 },
  { type: 'Badge', icon: 'local_fire_department', title: 'Legal Routine', desc: 'Reach a 14-day streak. Two weeks of continuous review activity.', category: 'Streak', condition: 'study_streak', threshold: 14 },
  { type: 'Badge', icon: 'local_fire_department', title: 'Monthly Discipline', desc: 'Reach a 30-day streak. A month-long study habit.', category: 'Streak', condition: 'study_streak', threshold: 30, rarity: 'Rare' },
  { type: 'Badge', icon: 'local_fire_department', title: 'Unbroken Counsel', desc: 'Reach a 60-day streak. Long-term consistency.', category: 'Streak', condition: 'study_streak', threshold: 60, rarity: 'Rare' },
  { type: 'Badge', icon: 'local_fire_department', title: 'Bar Review Veteran', desc: 'Reach a 100-day streak. Reserved for highly consistent reviewees.', category: 'Streak', condition: 'study_streak', threshold: 100, rarity: 'Legendary' },

  // Experience points
  { type: 'Badge', icon: 'star', title: 'XP Starter', desc: "Earn 500 XP. Your first step in BarBuddy's progression system.", category: 'Experience Points', condition: 'xp_earned', threshold: 500 },
  { type: 'Badge', icon: 'star', title: 'XP Advocate', desc: 'Earn 1,000 total XP from review activities.', category: 'Experience Points', condition: 'xp_earned', threshold: 1000 },
  { type: 'Badge', icon: 'star', title: 'XP Achiever', desc: 'Earn 5,000 XP through sustained assessments and learning activities.', category: 'Experience Points', condition: 'xp_earned', threshold: 5000, rarity: 'Rare' },
  { type: 'Badge', icon: 'star', title: 'XP Scholar', desc: 'Earn 10,000 XP. An advanced milestone for active reviewees.', category: 'Experience Points', condition: 'xp_earned', threshold: 10000, rarity: 'Rare' },
  { type: 'Badge', icon: 'star', title: 'XP Legend', desc: 'Earn 25,000 lifetime XP.', category: 'Experience Points', condition: 'xp_earned', threshold: 25000, rarity: 'Legendary' },

  // Assessment
  { type: 'Badge', icon: 'edit_note', title: 'First Step to the Bar', desc: 'Submit your first BarBuddy essay.', category: 'Assessment', condition: 'questions_completed', threshold: 1 },
  { type: 'Badge', icon: 'edit_note', title: 'Practice Makes Counsel', desc: 'Complete 10 essay assessments.', category: 'Assessment', condition: 'questions_completed', threshold: 10 },
  { type: 'Badge', icon: 'edit_note', title: 'Essay Regular', desc: 'Complete 25 essay assessments.', category: 'Assessment', condition: 'questions_completed', threshold: 25 },
  { type: 'Badge', icon: 'edit_note', title: 'Century of Arguments', desc: 'Complete 100 essay assessments.', category: 'Assessment', condition: 'questions_completed', threshold: 100, rarity: 'Rare' },

  // ALAC performance
  { type: 'Achievement', icon: 'balance', title: 'ALAC Beginner', desc: 'Write an answer containing all 4 ALAC components: Answer, Legal Basis, Application and Conclusion.', category: 'ALAC Performance', condition: 'alac_complete', threshold: 1 },
  { type: 'Achievement', icon: 'balance', title: 'ALAC Practitioner', desc: 'Receive complete ALAC results in 10 essays.', category: 'ALAC Performance', condition: 'alac_complete', threshold: 10 },
  { type: 'Achievement', icon: 'balance', title: 'ALAC Master', desc: 'Earn strong lawyer ratings in all four ALAC components on 10 essays (threshold set by the Review Administrator).', category: 'ALAC Performance', condition: 'alac_master', threshold: 10, rarity: 'Rare' },

  // Performance and improvement
  { type: 'Achievement', icon: 'my_location', title: 'Bullseye', desc: 'Receive a 5.0 verified score, the highest under the five-point grading standard.', category: 'Assessment Performance', condition: 'perfect_scores', threshold: 1, rarity: 'Rare' },
  { type: 'Achievement', icon: 'trending_up', title: 'On the Right Track', desc: 'Improve your score on a succeeding essay in the same subject.', category: 'Improvement', condition: 'score_improved', threshold: 1 },
  { type: 'Achievement', icon: 'trending_up', title: 'Rising Counsel', desc: 'Raise your competency in a subject by 10 percentage points.', category: 'Improvement', condition: 'competency_gain', threshold: 10, xp: 50 },

  // Mastery
  { type: 'Achievement', icon: 'psychology', title: 'Mastery Initiate', desc: 'Earn your first Mastery Point (a verified essay scored 3.0 or higher).', category: 'Mastery', condition: 'mastery_points', threshold: 1, xp: 50 },
  { type: 'Achievement', icon: 'psychology', title: 'Subject Specialist', desc: 'Reach the mastery level (85%) in one Bar subject.', category: 'Mastery', condition: 'subjects_mastered', threshold: 1, xp: 100 },
  { type: 'Achievement', icon: 'psychology', title: 'Multi-Subject Scholar', desc: 'Reach mastery in 3 subjects.', category: 'Mastery', condition: 'subjects_mastered', threshold: 3, xp: 100, rarity: 'Rare' },
  { type: 'Achievement', icon: 'account_balance', title: 'Well-Rounded Reviewee', desc: 'Reach the passing competency (75%) across all six Bar subject groups.', category: 'Mastery', condition: 'groups_competent', threshold: 6, xp: 50, rarity: 'Legendary' },

  // Subject group mastery
  { type: 'Achievement', icon: 'menu_book', title: 'Remedial Law Specialist', desc: 'Meet the mastery requirement for Remedial Law, Legal Ethics and Legal Forms.', category: 'Subject', condition: 'group_score', threshold: 85, group: 'remedial', xp: 100, rarity: 'Rare' },
  { type: 'Achievement', icon: 'menu_book', title: 'Commercial & Tax Specialist', desc: 'Meet the mastery requirement for Commercial and Taxation Laws.', category: 'Subject', condition: 'group_score', threshold: 85, group: 'commercial', xp: 100, rarity: 'Rare' },
  { type: 'Achievement', icon: 'menu_book', title: 'Civil Law Specialist', desc: 'Meet the mastery requirement for Civil Law.', category: 'Subject', condition: 'group_score', threshold: 85, group: 'civil', xp: 100, rarity: 'Rare' },
  { type: 'Achievement', icon: 'menu_book', title: 'Political Law Specialist', desc: 'Meet the mastery requirement for Political and Public International Law.', category: 'Subject', condition: 'group_score', threshold: 85, group: 'political', xp: 100, rarity: 'Rare' },
  { type: 'Achievement', icon: 'menu_book', title: 'Labor Law Specialist', desc: 'Meet the mastery requirement for Labor Law and Social Legislation.', category: 'Subject', condition: 'group_score', threshold: 85, group: 'labor', xp: 100, rarity: 'Rare' },
  { type: 'Achievement', icon: 'menu_book', title: 'Criminal Law Specialist', desc: 'Meet the mastery requirement for Criminal Law.', category: 'Subject', condition: 'group_score', threshold: 85, group: 'criminal', xp: 100, rarity: 'Rare' },

  // Time management
  { type: 'Badge', icon: 'timer', title: 'Under Pressure', desc: 'Complete an assessment before its time limit.', category: 'Time Management', condition: 'timed_completed', threshold: 1 },
  { type: 'Badge', icon: 'timer', title: 'Timekeeper', desc: 'Complete 10 timed assessments without exceeding the limit.', category: 'Time Management', condition: 'timed_completed', threshold: 10 },

  // Mock exam
  { type: 'Achievement', icon: 'science', title: 'Mock Bar Rookie', desc: 'Complete your first Mock Bar Examination.', category: 'Mock Exam', condition: 'study_sessions', threshold: 1 },
  { type: 'Achievement', icon: 'emoji_events', title: 'Mock Bar Finisher', desc: 'Answer every essay in a Mock Bar session.', category: 'Mock Exam', condition: 'mock_full', threshold: 1 },
  { type: 'Achievement', icon: 'emoji_events', title: 'Mock Bar Veteran', desc: 'Complete 3 Mock Bar Examinations.', category: 'Mock Exam', condition: 'study_sessions', threshold: 3, rarity: 'Rare' },

  // Daily review
  { type: 'Badge', icon: 'event_available', title: 'Daily Counsel', desc: "Answer all of a day's daily questions.", category: 'Daily Review', condition: 'daily_complete', threshold: 1 },
  { type: 'Badge', icon: 'calendar_month', title: 'Perfect Review Week', desc: 'Complete the full daily questions for 7 consecutive days.', category: 'Daily Review', condition: 'daily_full_streak', threshold: 7, rarity: 'Rare' },

  // Challenges (subject practice sets)
  { type: 'Badge', icon: 'task_alt', title: 'Challenge Accepted', desc: 'Complete your first BarBuddy challenge (subject practice set).', category: 'Challenge', condition: 'challenges_completed', threshold: 1 },
  { type: 'Badge', icon: 'task_alt', title: 'Challenge Regular', desc: 'Complete 5 challenges.', category: 'Challenge', condition: 'challenges_completed', threshold: 5 },
  { type: 'Badge', icon: 'military_tech', title: 'Challenge Champion', desc: 'Complete 20 challenges.', category: 'Challenge', condition: 'challenges_completed', threshold: 20, rarity: 'Rare' },

  // Feedback and re-engagement
  { type: 'Achievement', icon: 'forum', title: 'Feedback Explorer', desc: 'Review the AI and lawyer feedback of a submitted assessment.', category: 'Feedback', condition: 'feedback_reviewed', threshold: 1 },
  { type: 'Achievement', icon: 'autorenew', title: 'Learn and Improve', desc: 'Complete another assessment after reviewing feedback.', category: 'Feedback', condition: 'learn_improve', threshold: 1 },
  { type: 'Achievement', icon: 'restart_alt', title: 'Comeback Counsel', desc: 'Return and complete an assessment after 7 or more days away.', category: 'Re-engagement', condition: 'comeback', threshold: 1 },

  // Overall
  { type: 'Achievement', icon: 'workspace_premium', title: 'BarBuddy Achiever', desc: 'Unlock 15 achievements (number set by the Review Administrator).', category: 'Overall', condition: 'achievements_unlocked', threshold: 15, rarity: 'Rare' },
  { type: 'Achievement', icon: 'diamond', title: 'BarBuddy Completionist', desc: 'Unlock every standard achievement.', category: 'Overall', condition: 'completionist', threshold: 1, rarity: 'Legendary' },
];

// Placeholder catalog seeded before the badges document existed
const STARTER_TITLES = [
  'political law prodigy', 'midnight scholar', 'civil law sage', 'labor force', 'criminal law vanguard',
  'remedial law strategist', 'perfect scholar', 'iron streak', 'first step', 'consistent reviewer',
  'dedicated reviewer', 'question master', 'century reviewer', 'perfect run', 'subject specialist', 'bar ready',
];

async function main() {
  const { data: types, error: typeError } = await supabaseAdmin
    .from('bb_achievement_types_tbl')
    .select('achievement_type_id, achievement_type_desc');
  if (typeError) throw typeError;
  const typeId = (desc: string) => types?.find((t) => t.achievement_type_desc === desc)?.achievement_type_id;
  if (!typeId('Badge') || !typeId('Achievement')) throw new Error('Achievement types are missing. Run the migrations first.');

  const { data: existing, error } = await supabaseAdmin.from('bb_achievements_tbl').select('achievement_id, achievement_title, is_archived');
  if (error) throw error;
  const byTitle = new Map((existing || []).map((a) => [a.achievement_title.toLowerCase(), a]));

  let created = 0;
  let updated = 0;
  for (const c of CATALOG) {
    const row = {
      achievement_type_id: typeId(c.type),
      achievement_title: c.title,
      achievement_icon: c.icon,
      achievement_desc: c.desc,
      achievement_condition: c.condition,
      achievement_threshold: c.threshold,
      achievement_xp_reward: c.xp ?? 0,
      achievement_category: c.category,
      achievement_rarity: c.rarity ?? 'Common',
      achievement_subject_group: c.group ?? null,
      question_subject_id: null,
      is_archived: false,
      updated_at: new Date().toISOString(),
    };
    const match = byTitle.get(c.title.toLowerCase());
    const { error: saveError } = match
      ? await supabaseAdmin.from('bb_achievements_tbl').update(row).eq('achievement_id', match.achievement_id)
      : await supabaseAdmin.from('bb_achievements_tbl').insert(row);
    if (saveError) throw new Error(`${c.title}: ${saveError.message}`);
    match ? updated++ : created++;
  }

  // Only the earlier starter entries are retired; badges admins created stay
  const keep = new Set(CATALOG.map((c) => c.title.toLowerCase()));
  const retire = (existing || []).filter(
    (a) => STARTER_TITLES.includes(a.achievement_title.toLowerCase()) && !keep.has(a.achievement_title.toLowerCase()) && !a.is_archived
  );
  if (retire.length) {
    const { error: archiveError } = await supabaseAdmin
      .from('bb_achievements_tbl')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .in('achievement_id', retire.map((a) => a.achievement_id));
    if (archiveError) throw archiveError;
  }

  console.log(`Catalog: ${created} created, ${updated} updated, ${retire.length} older entries archived.`);
  if (retire.length) console.log('Archived:', retire.map((a) => a.achievement_title).join(', '));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
