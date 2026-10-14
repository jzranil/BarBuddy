
// Seeds the starter badge and achievement catalog (the entries the reviewee
// portal showed before the backend existed). Safe to re-run: titles that
// already exist are skipped. Requires supabase/migrations/20261015_complete_system.sql.
//
//   npx tsx --env-file=.env scripts/seed-achievements.ts

import { supabaseAdmin } from '../src/lib/supabase';
import { loadSubjects } from '../src/lib/subjects';

type Seed = {
  type: 'Badge' | 'Achievement';
  icon: string;
  title: string;
  desc: string;
  condition: string;
  threshold: number;
  subject?: string;
  category?: string;
  rarity?: string;
  xp: number;
};

const CATALOG: Seed[] = [
  { type: 'Achievement', icon: 'shield', title: 'Political Law Prodigy', desc: 'Reach a 95% competency score in Political Law.', condition: 'subject_score', threshold: 95, subject: 'Political Law', category: 'Political Law', rarity: 'Rare', xp: 300 },
  { type: 'Achievement', icon: 'timer', title: 'Midnight Scholar', desc: 'Complete 5 full mock bar examinations.', condition: 'study_sessions', threshold: 5, category: 'Consistency', rarity: 'Common', xp: 200 },
  { type: 'Achievement', icon: 'balance', title: 'Civil Law Sage', desc: 'Reach a 95% competency score in Civil Law.', condition: 'subject_score', threshold: 95, subject: 'Civil Law', category: 'Civil Law', rarity: 'Legendary', xp: 500 },
  { type: 'Achievement', icon: 'gavel', title: 'Labor Force', desc: 'Reach a 100% competency score in Labor Law.', condition: 'subject_score', threshold: 100, subject: 'Labor Law', category: 'Labor Law', rarity: 'Rare', xp: 300 },
  { type: 'Achievement', icon: 'security', title: 'Criminal Law Vanguard', desc: 'Reach a 95% competency score in Criminal Law.', condition: 'subject_score', threshold: 95, subject: 'Criminal Law', category: 'Criminal Law', rarity: 'Rare', xp: 300 },
  { type: 'Achievement', icon: 'fact_check', title: 'Remedial Law Strategist', desc: 'Reach a 95% competency score in Remedial Law.', condition: 'subject_score', threshold: 95, subject: 'Remedial Law', category: 'Remedial Law', rarity: 'Rare', xp: 300 },
  { type: 'Achievement', icon: 'auto_awesome', title: 'Perfect Scholar', desc: 'Earn a perfect 5.0 on three verified essays.', condition: 'perfect_scores', threshold: 3, category: 'Performance', rarity: 'Legendary', xp: 500 },
  { type: 'Achievement', icon: 'local_fire_department', title: 'Iron Streak', desc: 'Maintain a 14-day study streak without missing a day.', condition: 'study_streak', threshold: 14, category: 'Consistency', rarity: 'Common', xp: 200 },
  { type: 'Badge', icon: 'flag', title: 'First Step', desc: 'Submit your first essay answer.', condition: 'questions_completed', threshold: 1, xp: 50 },
  { type: 'Badge', icon: 'local_fire_department', title: 'Consistent Reviewer', desc: 'Maintain a 7-day study streak.', condition: 'study_streak', threshold: 7, xp: 150 },
  { type: 'Badge', icon: 'whatshot', title: 'Dedicated Reviewer', desc: 'Maintain a 30-day study streak.', condition: 'study_streak', threshold: 30, xp: 400 },
  { type: 'Badge', icon: 'quiz', title: 'Question Master', desc: 'Submit 100 essay answers.', condition: 'questions_completed', threshold: 100, xp: 300 },
  { type: 'Badge', icon: 'auto_stories', title: 'Century Reviewer', desc: 'Submit 500 essay answers.', condition: 'questions_completed', threshold: 500, xp: 600 },
  { type: 'Badge', icon: 'military_tech', title: 'Perfect Run', desc: 'Earn a perfect 5.0 on a verified essay.', condition: 'perfect_scores', threshold: 1, xp: 150 },
  { type: 'Badge', icon: 'workspace_premium', title: 'Subject Specialist', desc: 'Reach Mastered status in a Bar subject.', condition: 'subjects_mastered', threshold: 1, xp: 200 },
  { type: 'Badge', icon: 'verified', title: 'Bar Ready', desc: 'Reach a Bar Readiness Score of 80.', condition: 'bar_readiness', threshold: 80, xp: 500 },
];

async function main() {
  const { data: types, error: typeError } = await supabaseAdmin
    .from('bb_achievement_types_tbl')
    .select('achievement_type_id, achievement_type_desc');
  if (typeError) throw typeError;

  const typeId = (desc: string) => types?.find((t) => t.achievement_type_desc === desc)?.achievement_type_id;
  const { resolve } = await loadSubjects();

  const { data: existing } = await supabaseAdmin.from('bb_achievements_tbl').select('achievement_title');
  const existingTitles = new Set((existing || []).map((a) => a.achievement_title.toLowerCase()));

  const rows = CATALOG.filter((c) => !existingTitles.has(c.title.toLowerCase())).map((c) => ({
    achievement_type_id: typeId(c.type),
    achievement_title: c.title,
    achievement_icon: c.icon,
    achievement_desc: c.desc,
    achievement_condition: c.condition,
    achievement_threshold: c.threshold,
    achievement_xp_reward: c.xp,
    achievement_category: c.category ?? null,
    achievement_rarity: c.rarity ?? null,
    question_subject_id: c.subject ? resolve(c.subject)?.question_subject_id ?? null : null,
    is_archived: false,
  }));

  if (rows.some((r) => !r.achievement_type_id)) {
    throw new Error('Achievement types are missing. Run the migration first.');
  }

  if (rows.length === 0) {
    console.log('Catalog already seeded.');
    return;
  }

  const { error } = await supabaseAdmin.from('bb_achievements_tbl').insert(rows);
  if (error) throw error;
  console.log(`Seeded ${rows.length} badge(s)/achievement(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
