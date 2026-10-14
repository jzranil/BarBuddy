
import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase';
import { CONTENT_MANAGER_ROLES, requireUser } from '../lib/auth';
import { loadSubjects } from '../lib/subjects';
import { addXp, awardEarnedAchievements } from '../lib/engagement';
import { REVIEWEE_PERMISSION_ID, WEIGHT_GROUPS } from '../lib/competency';
import { logEvent } from '../lib/logs';

// Badges and Achievements Management (paper Figures 1.9, 3.9): Review
// Administrators create, edit, assign, archive and delete badges and set the
// conditions used for automatic awarding.
export const achievementRoutes = new Hono();

// Automatic conditions ("BarBuddy Achievements and Badges")
export const CONDITIONS = [
  'manual',
  'study_streak',
  'xp_earned',
  'questions_completed',
  'exams_completed',
  'alac_complete',
  'alac_master',
  'perfect_scores',
  'score_improved',
  'competency_gain',
  'mastery_points',
  'subjects_mastered',
  'groups_competent',
  'group_score',
  'subject_score',
  'bar_readiness',
  'timed_completed',
  'study_sessions',
  'mock_full',
  'daily_complete',
  'daily_full_streak',
  'challenges_completed',
  'feedback_reviewed',
  'learn_improve',
  'comeback',
  'achievements_unlocked',
  'completionist',
];

export const SUBJECT_GROUPS = WEIGHT_GROUPS.map((g) => ({ key: g.key, label: g.label }));

async function typeIdFor(kind: string) {
  const desc = kind === 'achievement' ? 'Achievement' : 'Badge';
  const { data } = await supabaseAdmin.from('bb_achievement_types_tbl').select('achievement_type_id').eq('achievement_type_desc', desc).maybeSingle();
  return data?.achievement_type_id as string | undefined;
}

async function validate(body: any, partial = false) {
  const errors: string[] = [];
  const row: Record<string, unknown> = {};

  if (!partial || body.title !== undefined) {
    const title = String(body.title || '').trim();
    if (title.length < 3 || title.length > 80) errors.push('Title must be 3-80 characters.');
    row.achievement_title = title;
  }
  if (!partial || body.description !== undefined) {
    const desc = String(body.description || '').trim();
    if (desc.length > 300) errors.push('Description must be 300 characters or fewer.');
    row.achievement_desc = desc || null;
  }
  if (!partial || body.icon !== undefined) {
    const icon = String(body.icon || 'military_tech').trim();
    if (!/^[a-z0-9_]{2,40}$/.test(icon)) errors.push('Choose a valid icon.');
    row.achievement_icon = icon;
  }
  if (!partial || body.condition !== undefined) {
    if (!CONDITIONS.includes(body.condition)) errors.push('Choose a valid condition.');
    row.achievement_condition = body.condition;
  }
  if (!partial || body.threshold !== undefined) {
    const threshold = Number(body.threshold);
    if (body.condition !== 'manual' && (!Number.isFinite(threshold) || threshold < 1 || threshold > 100000)) {
      errors.push('Threshold must be a number from 1 to 100,000.');
    }
    row.achievement_threshold = body.condition === 'manual' ? 0 : threshold;
  }
  if (!partial || body.xpReward !== undefined) {
    const xp = Number(body.xpReward ?? 0);
    if (!Number.isInteger(xp) || xp < 0 || xp > 10000) errors.push('XP reward must be a whole number from 0 to 10,000.');
    row.achievement_xp_reward = xp;
  }
  if (!partial || body.rarity !== undefined) row.achievement_rarity = ['Common', 'Rare', 'Legendary'].includes(body.rarity) ? body.rarity : 'Common';
  if (!partial || body.category !== undefined) row.achievement_category = String(body.category || '').trim().slice(0, 60) || null;

  if (!partial || body.subjectSlug !== undefined || body.condition === 'subject_score') {
    if (body.condition === 'subject_score') {
      const { resolve, subjects } = await loadSubjects();
      const subject = subjects.find((s) => s.question_subject_id === body.subjectId) || resolve(String(body.subjectName || ''));
      if (!subject) errors.push('Choose the subject for a subject competency condition.');
      row.question_subject_id = subject?.question_subject_id ?? null;
    } else {
      row.question_subject_id = null;
    }
  }

  if (!partial || body.subjectGroup !== undefined || body.condition === 'group_score') {
    if (body.condition === 'group_score') {
      if (!SUBJECT_GROUPS.some((g) => g.key === body.subjectGroup)) errors.push('Choose the Bar subject group for a group mastery condition.');
      row.achievement_subject_group = body.subjectGroup;
    } else {
      row.achievement_subject_group = null;
    }
  }

  if (!partial || body.kind !== undefined) {
    const typeId = await typeIdFor(body.kind);
    if (!typeId) errors.push('Achievement types are missing. Run the database migration.');
    row.achievement_type_id = typeId;
  }

  return { errors, row };
}

// GET /api/achievements — full catalog with award counts
achievementRoutes.get('/', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  const [{ data, error }, { data: awards }] = await Promise.all([
    supabaseAdmin
      .from('bb_achievements_tbl')
      .select('*, bb_achievement_types_tbl ( achievement_type_desc ), bb_question_subjects_tbl ( question_subject_id, question_subject_desc )')
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('bb_user_achievements_tbl').select('achievement_id'),
  ]);

  if (error) return c.json({ message: 'Unable to load badges.' }, 500);

  const counts = new Map<string, number>();
  for (const a of awards || []) counts.set(a.achievement_id, (counts.get(a.achievement_id) || 0) + 1);

  return c.json({
    conditions: CONDITIONS,
    subjectGroups: SUBJECT_GROUPS,
    items: (data || []).map((a: any) => ({
      id: a.achievement_id,
      kind: a.bb_achievement_types_tbl?.achievement_type_desc === 'Achievement' ? 'achievement' : 'badge',
      title: a.achievement_title,
      description: a.achievement_desc || '',
      icon: a.achievement_icon || 'military_tech',
      condition: a.achievement_condition,
      threshold: Number(a.achievement_threshold),
      xpReward: a.achievement_xp_reward,
      rarity: a.achievement_rarity || 'Common',
      category: a.achievement_category || '',
      subjectId: a.bb_question_subjects_tbl?.question_subject_id || null,
      subjectName: a.bb_question_subjects_tbl?.question_subject_desc || null,
      subjectGroup: a.achievement_subject_group || null,
      isArchived: a.is_archived,
      awardedCount: counts.get(a.achievement_id) || 0,
      createdAt: a.created_at,
    })),
  });
});

// POST /api/achievements
achievementRoutes.post('/', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ message: 'Invalid JSON.' }, 400);

  const { errors, row } = await validate(body);
  if (errors.length) return c.json({ message: errors.join(' ') }, 400);

  const { data: same } = await supabaseAdmin.from('bb_achievements_tbl').select('achievement_id').ilike('achievement_title', String(row.achievement_title).replace(/[\\%_]/g, '\\$&')).limit(1);
  if (same?.length) return c.json({ message: 'A badge with this title already exists.' }, 409);

  const { data, error } = await supabaseAdmin.from('bb_achievements_tbl').insert({ ...row, is_archived: false }).select('achievement_id').single();
  if (error) return c.json({ message: error.message }, 400);

  await logEvent(auth.profile.user_id, 'achievements', `Created badge "${row.achievement_title}".`);
  return c.json({ id: data.achievement_id, message: 'Badge created.' }, 201);
});

// PATCH /api/achievements/:id — edit fields or { isArchived }
achievementRoutes.patch('/:id', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ message: 'Invalid JSON.' }, 400);

  let update: Record<string, unknown> = {};
  if (typeof body.isArchived === 'boolean' && Object.keys(body).length === 1) {
    update = { is_archived: body.isArchived };
  } else {
    const { errors, row } = await validate(body);
    if (errors.length) return c.json({ message: errors.join(' ') }, 400);
    update = row;
  }

  const { data, error } = await supabaseAdmin
    .from('bb_achievements_tbl')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('achievement_id', c.req.param('id'))
    .select('achievement_title')
    .maybeSingle();

  if (error) return c.json({ message: error.message }, 400);
  if (!data) return c.json({ message: 'Badge not found.' }, 404);

  await logEvent(auth.profile.user_id, 'achievements', `Updated badge "${data.achievement_title}".`);
  return c.json({ message: 'Badge updated.' });
});

// DELETE /api/achievements/:id — also removes it from reviewees who earned it
achievementRoutes.delete('/:id', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  const { data, error } = await supabaseAdmin
    .from('bb_achievements_tbl')
    .delete()
    .eq('achievement_id', c.req.param('id'))
    .select('achievement_title')
    .maybeSingle();

  if (error) return c.json({ message: error.message }, 400);
  if (!data) return c.json({ message: 'Badge not found.' }, 404);

  await logEvent(auth.profile.user_id, 'achievements', `Deleted badge "${data.achievement_title}".`, 'WARNING');
  return c.json({ message: 'Badge deleted.' });
});

// POST /api/achievements/:id/award — { userId } manual assignment
achievementRoutes.post('/:id/award', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  const body = await c.req.json().catch(() => null);
  const userId = body?.userId;

  const [{ data: badge }, { data: user }] = await Promise.all([
    supabaseAdmin.from('bb_achievements_tbl').select('achievement_title, achievement_xp_reward, is_archived').eq('achievement_id', c.req.param('id')).maybeSingle(),
    supabaseAdmin.from('bb_users_tbl').select('user_fname, user_lname').eq('user_id', userId).eq('permission_id', REVIEWEE_PERMISSION_ID).maybeSingle(),
  ]);

  if (!badge || badge.is_archived) return c.json({ message: 'Badge not found or archived.' }, 404);
  if (!user) return c.json({ message: 'Choose a reviewee.' }, 400);

  const { data: inserted, error } = await supabaseAdmin
    .from('bb_user_achievements_tbl')
    .upsert({ user_id: userId, achievement_id: c.req.param('id'), awarded_by: auth.profile.user_id }, { onConflict: 'user_id,achievement_id', ignoreDuplicates: true })
    .select('user_achievement_id');

  if (error) return c.json({ message: error.message }, 400);
  if (!inserted?.length) return c.json({ message: 'This reviewee already has the badge.' }, 409);

  await addXp(userId, badge.achievement_xp_reward || 0);
  await logEvent(auth.profile.user_id, 'achievements', `Awarded "${badge.achievement_title}" to ${user.user_fname} ${user.user_lname}.`);
  return c.json({ message: 'Badge awarded.' });
});

// POST /api/achievements/recheck — re-evaluate automatic badges for every reviewee
achievementRoutes.post('/recheck', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  const { data: reviewees } = await supabaseAdmin.from('bb_users_tbl').select('user_id').eq('permission_id', REVIEWEE_PERMISSION_ID).eq('is_archived', false);
  let awarded = 0;
  for (const r of reviewees || []) awarded += (await awardEarnedAchievements(r.user_id)).length;

  await logEvent(auth.profile.user_id, 'achievements', `Re-checked badge conditions (${awarded} newly awarded).`);
  return c.json({ message: `${awarded} badge(s) newly awarded.`, awarded });
});
