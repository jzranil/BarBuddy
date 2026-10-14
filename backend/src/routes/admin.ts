
import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase';
import { CONTENT_MANAGER_ROLES, requireUser } from '../lib/auth';
import { logEvent } from '../lib/logs';
import { getAssessmentConfig, saveAssessmentConfig, type AssessmentType } from '../lib/settings';
import { loadAllRevieweeSummaries, REVIEWEE_PERMISSION_ID } from '../lib/competency';

// Super Admin: user and role management, audit logs, platform overview and
// system settings (paper Figure 3.12, Super Admin use cases).
export const adminRoutes = new Hono();

const SUPER_ADMIN = ['super admin'];
const STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];

function escapeLike(value: string) {
  return value.replace(/[\\%_,()]/g, '\\$&');
}

async function permissions() {
  const { data } = await supabaseAdmin.from('bb_permissions_tbl').select('user_permission_id, user_permission_desc');
  return data || [];
}

// GET /api/admin/summary — User Control KPI tiles
adminRoutes.get('/summary', async (c) => {
  const auth = await requireUser(c, SUPER_ADMIN);
  if (auth.response) return auth.response;

  const perms = await permissions();
  const adminIds = perms.filter((p) => /admin|lawyer/i.test(p.user_permission_desc)).map((p) => p.user_permission_id);

  const [{ count: totalUsers }, { count: lockedAccounts }, { count: adminsCount }, { count: newThisMonth }] = await Promise.all([
    supabaseAdmin.from('bb_users_tbl').select('user_id', { count: 'exact', head: true }).eq('is_archived', false),
    supabaseAdmin.from('bb_users_tbl').select('user_id', { count: 'exact', head: true }).neq('user_status', 'ACTIVE'),
    supabaseAdmin.from('bb_users_tbl').select('user_id', { count: 'exact', head: true }).in('permission_id', adminIds),
    supabaseAdmin.from('bb_users_tbl').select('user_id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
  ]);

  return c.json({
    totalUsers: totalUsers || 0,
    adminsCount: adminsCount || 0,
    lockedAccounts: lockedAccounts || 0,
    newThisMonth: newThisMonth || 0,
  });
});

// GET /api/admin/users?search=&role=&page=&limit=
adminRoutes.get('/users', async (c) => {
  const auth = await requireUser(c, SUPER_ADMIN);
  if (auth.response) return auth.response;

  const search = (c.req.query('search') || '').trim().slice(0, 100);
  const role = c.req.query('role') || '';
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query('limit') || '10', 10) || 10));
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('bb_users_tbl')
    .select('user_id, user_fname, user_lname, user_email, user_status, created_at, user_activity, is_archived, permission_id, bb_permissions_tbl ( user_permission_desc )', { count: 'exact' });

  if (search) {
    const s = escapeLike(search);
    query = query.or(`user_fname.ilike.%${s}%,user_lname.ilike.%${s}%,user_email.ilike.%${s}%`);
  }
  if (role) query = query.eq('permission_id', role);

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (error) return c.json({ error: error.message }, 500);

  return c.json({
    users: (data || []).map((u: any) => ({
      id: u.user_id,
      name: `${u.user_fname || ''} ${u.user_lname || ''}`.trim() || u.user_email,
      email: u.user_email,
      role: u.bb_permissions_tbl?.user_permission_desc || 'User',
      permissionId: u.permission_id,
      status: u.user_status,
      isArchived: u.is_archived,
      joinedDate: u.created_at,
      lastActivity: u.user_activity,
    })),
    total: count || 0,
    page,
    limit,
    roles: (await permissions()).map((p) => ({ id: p.user_permission_id, name: p.user_permission_desc })),
  });
});

// POST /api/admin/users — invite a new user by email { firstName, lastName, email, permissionId }
adminRoutes.post('/users', async (c) => {
  const auth = await requireUser(c, SUPER_ADMIN);
  if (auth.response) return auth.response;

  const body = await c.req.json().catch(() => null);
  const firstName = String(body?.firstName || '').trim();
  const lastName = String(body?.lastName || '').trim();
  const email = String(body?.email || '').trim().toLowerCase();
  const permissionId = String(body?.permissionId || '');

  if (firstName.length < 2 || lastName.length < 2) return c.json({ error: 'First and last name are required.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return c.json({ error: 'Enter a valid email address.' }, 400);
  if (!(await permissions()).some((p) => p.user_permission_id === permissionId)) return c.json({ error: 'Choose a role.' }, 400);

  const { data: existing } = await supabaseAdmin.from('bb_users_tbl').select('user_id').eq('user_email', email).maybeSingle();
  if (existing) return c.json({ error: 'A user with this email already exists.' }, 409);

  // Supabase sends the invitation email; the signup trigger creates the profile
  const origin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
  const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { first_name: firstName, last_name: lastName },
    redirectTo: `${origin}/confirm-password`,
  });

  if (error || !invited.user) return c.json({ error: error?.message || 'Unable to invite the user.' }, 400);

  await supabaseAdmin
    .from('bb_users_tbl')
    .update({ permission_id: permissionId, user_fname: firstName, user_lname: lastName })
    .eq('auth_user_id', invited.user.id);

  await logEvent(auth.profile.user_id, 'user-control', `Invited ${email} as a new user.`);
  return c.json({ message: `Invitation sent to ${email}.` }, 201);
});

// PATCH /api/admin/users/:id — { permissionId?, status?, isArchived? }
adminRoutes.patch('/users/:id', async (c) => {
  const auth = await requireUser(c, SUPER_ADMIN);
  if (auth.response) return auth.response;

  const id = c.req.param('id');
  if (id === auth.profile.user_id) return c.json({ error: 'You cannot change your own role or status.' }, 400);

  const body = await c.req.json().catch(() => null);
  const update: Record<string, unknown> = {};

  if (body?.permissionId !== undefined) {
    if (!(await permissions()).some((p) => p.user_permission_id === body.permissionId)) return c.json({ error: 'Invalid role.' }, 400);
    update.permission_id = body.permissionId;
  }
  if (body?.status !== undefined) {
    const status = String(body.status).toUpperCase();
    if (!STATUSES.includes(status)) return c.json({ error: 'Invalid status.' }, 400);
    update.user_status = status;
  }
  if (typeof body?.isArchived === 'boolean') update.is_archived = body.isArchived;
  if (Object.keys(update).length === 0) return c.json({ error: 'Nothing to update.' }, 400);

  const { data, error } = await supabaseAdmin
    .from('bb_users_tbl')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('user_id', id)
    .select('user_email')
    .maybeSingle();

  if (error) return c.json({ error: error.message }, 500);
  if (!data) return c.json({ error: 'User not found.' }, 404);

  await logEvent(auth.profile.user_id, 'user-control', `Updated ${data.user_email}: ${Object.entries(update).map(([k, v]) => `${k}=${v}`).join(', ')}.`, 'WARNING');
  return c.json({ message: 'User updated.' });
});

// GET /api/admin/overview — Super Admin dashboard metrics
adminRoutes.get('/overview', async (c) => {
  const auth = await requireUser(c, SUPER_ADMIN);
  if (auth.response) return auth.response;

  const count = async (table: string, apply?: (q: any) => any) => {
    let q = supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
    if (apply) q = apply(q);
    const { count: n } = await q;
    return n || 0;
  };

  const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
  const [reviewees, lawyers, admins, questions, syllabi, submissions, pending, assessments30, errors24] = await Promise.all([
    count('bb_users_tbl', (q) => q.eq('permission_id', REVIEWEE_PERMISSION_ID)),
    count('bb_users_tbl', (q) => q.eq('permission_id', '6642db37-fe3f-4c6f-8b82-427b381a9c69')),
    count('bb_users_tbl', (q) => q.eq('permission_id', '5bac543c-5f03-436a-85a8-2c8fc3c6b0e3')),
    count('bb_questions_tbl', (q) => q.eq('is_archived', false)),
    count('bb_resources_tbl', (q) => q.eq('is_archived', false)),
    count('bb_user_submissions_tbl', (q) => q.eq('submission_status', 'submitted')),
    count('bb_feedbacks_tbl', (q) => q.eq('feedback_status', 'pending')),
    count('bb_assessments_tbl', (q) => q.gte('started_at', since30)),
    count('bb_logs_tbl', (q) => q.eq('log_level', 'ERROR').gte('created_at', new Date(Date.now() - 86400000).toISOString())),
  ]);

  // Monthly assessment activity for the last 6 months
  const { data: recentAssessments } = await supabaseAdmin
    .from('bb_assessments_tbl')
    .select('started_at, assessment_status')
    .gte('started_at', new Date(Date.now() - 183 * 86400000).toISOString());

  const months = [...Array(6)].map((_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return { key: d.toISOString().slice(0, 7), label: d.toLocaleDateString('en-US', { month: 'short' }) };
  });
  const activity = months.map((m) => ({
    label: m.label,
    started: (recentAssessments || []).filter((a) => a.started_at.slice(0, 7) === m.key).length,
    submitted: (recentAssessments || []).filter((a) => a.started_at.slice(0, 7) === m.key && a.assessment_status === 'submitted').length,
  }));

  const { data: revieweeRows } = await supabaseAdmin.from('bb_users_tbl').select('user_id').eq('permission_id', REVIEWEE_PERMISSION_ID).eq('is_archived', false);
  const summaries = [...(await loadAllRevieweeSummaries((revieweeRows || []).map((r) => r.user_id))).values()].filter((s) => s.readinessRated);

  const { data: logs } = await supabaseAdmin
    .from('bb_logs_tbl')
    .select('log_id, log_level, log_proc_service, log_proc_desc, created_at, bb_users_tbl ( user_fname, user_lname )')
    .order('created_at', { ascending: false })
    .limit(6);

  return c.json({
    users: { reviewees, lawyers, admins, total: reviewees + lawyers + admins },
    content: { questions, syllabi },
    assessments: { submissions, pendingVerification: pending, startedLast30Days: assessments30 },
    avgReadiness: summaries.length ? Math.round(summaries.reduce((s, x) => s + x.readinessScore, 0) / summaries.length) : 0,
    errorsLast24h: errors24,
    activity,
    recentLogs: (logs || []).map((l: any) => ({
      id: l.log_id,
      level: l.log_level,
      service: l.log_proc_service,
      description: l.log_proc_desc,
      createdAt: l.created_at,
      user: l.bb_users_tbl ? `${l.bb_users_tbl.user_fname} ${l.bb_users_tbl.user_lname}`.trim() : 'System',
    })),
  });
});

// GET /api/admin/logs?level=&service=&search=&page=&limit=
adminRoutes.get('/logs', async (c) => {
  const auth = await requireUser(c, SUPER_ADMIN);
  if (auth.response) return auth.response;

  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20', 10) || 20));
  const level = c.req.query('level') || '';
  const service = c.req.query('service') || '';
  const search = (c.req.query('search') || '').trim().slice(0, 100);

  let query = supabaseAdmin
    .from('bb_logs_tbl')
    .select('log_id, log_level, log_proc_service, log_proc_desc, log_trace_id, created_at, bb_users_tbl ( user_fname, user_lname, user_email )', { count: 'exact' })
    .eq('is_archived', false);
  if (level) query = query.eq('log_level', level);
  if (service) query = query.eq('log_proc_service', service);
  if (search) query = query.ilike('log_proc_desc', `%${escapeLike(search)}%`);

  const { data, count, error } = await query.order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1);
  if (error) return c.json({ error: error.message }, 500);

  const levelCount = async (lvl: string) => {
    const { count: n } = await supabaseAdmin.from('bb_logs_tbl').select('log_id', { count: 'exact', head: true }).eq('log_level', lvl).gte('created_at', new Date(Date.now() - 86400000).toISOString());
    return n || 0;
  };

  return c.json({
    logs: (data || []).map((l: any) => ({
      id: l.log_id,
      level: l.log_level,
      service: l.log_proc_service,
      description: l.log_proc_desc,
      traceId: l.log_trace_id,
      createdAt: l.created_at,
      user: l.bb_users_tbl ? `${l.bb_users_tbl.user_fname} ${l.bb_users_tbl.user_lname}`.trim() || l.bb_users_tbl.user_email : 'System',
    })),
    total: count || 0,
    page,
    limit,
    last24h: { info: await levelCount('INFO'), warning: await levelCount('WARNING'), error: await levelCount('ERROR') },
  });
});

// GET /api/admin/settings/assessments — readable by Review Administrators too
adminRoutes.get('/settings/assessments', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;
  return c.json({ config: await getAssessmentConfig() });
});

// PUT /api/admin/settings/assessments — { daily, mock, practice } (paper TC-SM-009: configure answer time limit)
adminRoutes.put('/settings/assessments', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  const body = await c.req.json().catch(() => null);
  const limits = { daily: [1, 10], practice: [1, 20], mock: [5, 40] } as const;

  for (const type of ['daily', 'mock', 'practice'] as AssessmentType[]) {
    const v = body?.[type];
    if (!v) continue;
    const questions = Number(v.questions);
    const time = Number(v.time_limit_minutes);
    const reading = Number(v.reading_minutes);
    if (!Number.isInteger(questions) || questions < limits[type][0] || questions > limits[type][1]) {
      return c.json({ error: `${type}: questions must be ${limits[type][0]}-${limits[type][1]}.` }, 400);
    }
    if (!Number.isInteger(time) || time < 5 || time > 600) return c.json({ error: `${type}: time limit must be 5-600 minutes.` }, 400);
    if (!Number.isInteger(reading) || reading < 0 || reading > 60) return c.json({ error: `${type}: reading period must be 0-60 minutes.` }, 400);
    await saveAssessmentConfig(type, { questions, time_limit_minutes: time, reading_minutes: reading }, auth.profile.user_id);
  }

  await logEvent(auth.profile.user_id, 'settings', 'Updated assessment time limits and question counts.');
  return c.json({ message: 'Assessment settings saved.', config: await getAssessmentConfig() });
});
