
import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase';
import { CONTENT_MANAGER_ROLES, requireUser } from '../lib/auth';
import { logEvent } from '../lib/logs';
import { getAssessmentConfig, getMockUnlockRule, saveAssessmentConfig, saveMockUnlockRule, type AssessmentType } from '../lib/settings';
import { runDailyRollout } from '../lib/rollout';
import { appUrl, invitationEmail, sendMail } from '../lib/mailer';
import { LAWYER_PERMISSION_ID, loadAllRevieweeSummaries, REVIEWEE_PERMISSION_ID, SUPER_ADMIN_PERMISSION_ID } from '../lib/competency';

// Super Admin: user and role management, audit logs, platform overview and
// system settings (paper Figure 3.12, Super Admin use cases).
export const adminRoutes = new Hono();

const SUPER_ADMIN = ['super admin'];
// Roles a Super Admin can give: Reviewee or Review Administrator (Lawyer)
const ASSIGNABLE_ROLES = [
  { id: REVIEWEE_PERMISSION_ID, name: 'Reviewee' },
  { id: LAWYER_PERMISSION_ID, name: 'Review Administrator (Lawyer)' },
];
const roleLabel = (permissionId: string | null, desc?: string) =>
  ASSIGNABLE_ROLES.find((r) => r.id === permissionId)?.name ?? (permissionId === SUPER_ADMIN_PERMISSION_ID ? 'Super Admin' : desc || 'User');

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
    supabaseAdmin.from('bb_users_tbl').select('user_id', { count: 'exact', head: true }).eq('is_archived', true),
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
    .select('user_id, user_fname, user_lname, user_email, user_status, created_at, user_activity, is_archived, permission_id, auth_user_id, user_subscription_expiry, bb_permissions_tbl ( user_permission_desc ), bb_subscriptions_tbl ( subscription_package, subscription_duration )', { count: 'exact' });

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
      firstName: u.user_fname || '',
      lastName: u.user_lname || '',
      email: u.user_email,
      role: roleLabel(u.permission_id, u.bb_permissions_tbl?.user_permission_desc),
      permissionId: u.permission_id,
      isSuperAdmin: u.permission_id === SUPER_ADMIN_PERMISSION_ID,
      invitePending: !u.auth_user_id,
      package: u.bb_subscriptions_tbl ? `Package ${u.bb_subscriptions_tbl.subscription_package} (${u.bb_subscriptions_tbl.subscription_duration} days)` : null,
      packageEnds: u.user_subscription_expiry,
      isArchived: u.is_archived,
      joinedDate: u.created_at,
      lastActivity: u.user_activity,
    })),
    total: count || 0,
    page,
    limit,
    roles: ASSIGNABLE_ROLES,
    filterRoles: [...ASSIGNABLE_ROLES, { id: SUPER_ADMIN_PERMISSION_ID, name: 'Super Admin' }],
  });
});

// Invitations: BarBuddy creates the profile with the chosen role and emails a
// link to the registration page. When the person registers with that email,
// the signup trigger / login links the new Supabase account to this profile,
// so the role is kept.
type InviteInput = { firstName: string; lastName: string; email: string; permissionId: string };

const NAME_RE = /^[\p{L} .'-]{1,50}$/u;

function validateInvite(raw: any): { invite?: InviteInput; error?: string } {
  const firstName = String(raw?.firstName ?? '').replace(/\s+/g, ' ').trim();
  const lastName = String(raw?.lastName ?? '').replace(/\s+/g, ' ').trim();
  const email = String(raw?.email ?? '').trim().toLowerCase();
  const permissionId = String(raw?.permissionId ?? '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: 'Enter a valid email address.' };
  if (!NAME_RE.test(firstName) || !NAME_RE.test(lastName)) return { error: 'First and last name are required (letters only).' };
  if (!ASSIGNABLE_ROLES.some((r) => r.id === permissionId)) return { error: 'Choose Reviewee or Review Administrator.' };
  return { invite: { firstName, lastName, email, permissionId } };
}

async function sendInvitation(invite: InviteInput) {
  const { data: existing } = await supabaseAdmin
    .from('bb_users_tbl')
    .select('user_id, auth_user_id')
    .ilike('user_email', invite.email)
    .maybeSingle();
  if (existing?.auth_user_id) return { status: 'exists' as const, message: 'already has a BarBuddy account' };

  const profile = {
    permission_id: invite.permissionId,
    user_fname: invite.firstName,
    user_lname: invite.lastName,
    user_email: invite.email,
    updated_at: new Date().toISOString(),
  };
  const { error } = existing
    ? await supabaseAdmin.from('bb_users_tbl').update(profile).eq('user_id', existing.user_id)
    : await supabaseAdmin.from('bb_users_tbl').insert({ ...profile, user_status: 'ACTIVE', user_progress: 0, user_attempts: 0, is_archived: false });
  if (error) return { status: 'failed' as const, message: error.message };

  const params = new URLSearchParams({ invite: '1', email: invite.email, first: invite.firstName, last: invite.lastName });
  const role = ASSIGNABLE_ROLES.find((r) => r.id === invite.permissionId)!.name;
  try {
    const sent = await sendMail(invite.email, invitationEmail({ name: invite.firstName, role, link: `${appUrl()}/signup?${params}` }));
    if (!sent.sent) return { status: 'failed' as const, message: sent.reason };
  } catch (err: any) {
    return { status: 'failed' as const, message: `email could not be sent (${err?.message || 'SMTP error'})` };
  }
  return { status: existing ? ('resent' as const) : ('invited' as const), message: existing ? 'invitation sent again' : 'invitation sent' };
}

// POST /api/admin/users — invite one user { firstName, lastName, email, permissionId }
adminRoutes.post('/users', async (c) => {
  const auth = await requireUser(c, SUPER_ADMIN);
  if (auth.response) return auth.response;

  const { invite, error } = validateInvite(await c.req.json().catch(() => null));
  if (!invite) return c.json({ error }, 400);

  const result = await sendInvitation(invite);
  if (result.status === 'exists') return c.json({ error: `${invite.email} already has a BarBuddy account.` }, 409);
  if (result.status === 'failed') return c.json({ error: `Unable to invite ${invite.email}: ${result.message}.` }, 500);

  await logEvent(auth.profile.user_id, 'user-control', `Invited ${invite.email} (${result.message}).`);
  return c.json({ message: `Invitation sent to ${invite.email}. They can register from the link in the email.` }, 201);
});

// POST /api/admin/users/bulk-invite — { invites: [{ email, firstName, lastName, role }] } (up to 200)
// role: "reviewee" (default) or "lawyer" / "review administrator"
adminRoutes.post('/users/bulk-invite', async (c) => {
  const auth = await requireUser(c, SUPER_ADMIN);
  if (auth.response) return auth.response;

  const body = await c.req.json().catch(() => null);
  const rows: any[] = Array.isArray(body?.invites) ? body.invites : [];
  if (rows.length === 0) return c.json({ error: 'The file has no invitations.' }, 400);
  if (rows.length > 200) return c.json({ error: 'Invite at most 200 people per file.' }, 400);

  const seen = new Set<string>();
  const results: { row: number; email: string; status: string; message?: string }[] = [];
  for (const [index, row] of rows.entries()) {
    const roleText = String(row?.role ?? '').trim().toLowerCase();
    const permissionId = /lawyer|admin/.test(roleText) ? LAWYER_PERMISSION_ID : REVIEWEE_PERMISSION_ID;
    const { invite, error } = validateInvite({ ...row, permissionId });
    const email = String(row?.email ?? '').trim().toLowerCase();
    if (!invite) {
      results.push({ row: index + 1, email, status: 'invalid', message: error });
      continue;
    }
    if (seen.has(invite.email)) {
      results.push({ row: index + 1, email, status: 'duplicate', message: 'listed more than once in this file' });
      continue;
    }
    seen.add(invite.email);
    const result = await sendInvitation(invite);
    results.push({ row: index + 1, email, ...result });
  }

  const count = (status: string) => results.filter((r) => r.status === status).length;
  const summary = { invited: count('invited') + count('resent'), exists: count('exists'), invalid: count('invalid') + count('duplicate'), failed: count('failed') };
  await logEvent(auth.profile.user_id, 'user-control', `Bulk invite: ${summary.invited} sent, ${summary.exists} existing, ${summary.invalid} invalid, ${summary.failed} failed.`);
  return c.json({ message: `${summary.invited} invitation(s) sent.`, summary, results });
});

// PATCH /api/admin/users/:id — edit { firstName?, lastName?, permissionId? } or { isArchived }
adminRoutes.patch('/users/:id', async (c) => {
  const auth = await requireUser(c, SUPER_ADMIN);
  if (auth.response) return auth.response;

  const id = c.req.param('id');
  if (id === auth.profile.user_id) return c.json({ error: 'You cannot change your own account here.' }, 400);

  const { data: target } = await supabaseAdmin.from('bb_users_tbl').select('permission_id').eq('user_id', id).maybeSingle();
  if (!target) return c.json({ error: 'User not found.' }, 404);
  if (target.permission_id === SUPER_ADMIN_PERMISSION_ID) return c.json({ error: 'Super Admin accounts cannot be changed here.' }, 403);

  const body = await c.req.json().catch(() => null);
  const update: Record<string, unknown> = {};

  if (body?.permissionId !== undefined) {
    if (!ASSIGNABLE_ROLES.some((r) => r.id === body.permissionId)) return c.json({ error: 'Choose Reviewee or Review Administrator.' }, 400);
    update.permission_id = body.permissionId;
  }
  for (const [key, column, label] of [['firstName', 'user_fname', 'First name'], ['lastName', 'user_lname', 'Last name']] as const) {
    if (body?.[key] === undefined) continue;
    const value = String(body[key]).replace(/\s+/g, ' ').trim();
    if (value.length < 1 || value.length > 50 || !/^[\p{L} .'-]+$/u.test(value)) return c.json({ error: `${label} must be 1-50 letters.` }, 400);
    update[column] = value;
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

  const what =
    update.is_archived === true ? 'Archived' : update.is_archived === false ? 'Restored' : 'Edited';
  await logEvent(auth.profile.user_id, 'user-control', `${what} ${data.user_email}.`, 'WARNING');
  return c.json({ message: what === 'Edited' ? 'User updated.' : `User ${what.toLowerCase()}.` });
});

// DELETE /api/admin/users/:id — permanently removes the account, its sign-in
// and its review history. Content the user authored is kept (author cleared).
adminRoutes.delete('/users/:id', async (c) => {
  const auth = await requireUser(c, SUPER_ADMIN);
  if (auth.response) return auth.response;

  const id = c.req.param('id');
  if (id === auth.profile.user_id) return c.json({ error: 'You cannot delete your own account.' }, 400);

  const { data: target } = await supabaseAdmin
    .from('bb_users_tbl')
    .select('user_email, permission_id, auth_user_id, user_analytics_id')
    .eq('user_id', id)
    .maybeSingle();
  if (!target) return c.json({ error: 'User not found.' }, 404);
  if (target.permission_id === SUPER_ADMIN_PERMISSION_ID) return c.json({ error: 'Super Admin accounts cannot be deleted.' }, 403);

  try {
    // The user's own review history
    const { data: subs } = await supabaseAdmin.from('bb_user_submissions_tbl').select('feedback_id').eq('user_id', id);
    const feedbackIds = (subs || []).map((s) => s.feedback_id).filter(Boolean) as string[];
    const steps: [string, PromiseLike<{ error: any }>][] = [
      ['submissions', supabaseAdmin.from('bb_user_submissions_tbl').delete().eq('user_id', id)],
      ['assessments', supabaseAdmin.from('bb_assessments_tbl').delete().eq('user_id', id)],
      ['badges', supabaseAdmin.from('bb_user_achievements_tbl').delete().eq('user_id', id)],
      ['payments', supabaseAdmin.from('bb_payments_tbl').delete().eq('user_id', id)],
      ['tokens', supabaseAdmin.from('bb_hash_tokens_tbl').delete().eq('user_id', id)],
      ['authenticator', supabaseAdmin.from('bb_authenticator_tbl').delete().eq('user_id', id)],
    ];
    for (const [name, step] of steps) {
      const { error } = await step;
      if (error) throw new Error(`${name}: ${error.message}`);
    }
    if (feedbackIds.length) {
      const { error } = await supabaseAdmin.from('bb_feedbacks_tbl').delete().in('feedback_id', feedbackIds);
      if (error) throw new Error(`feedback: ${error.message}`);
    }

    // Keep content and records they acted on, without the author link
    const unlink: [string, string][] = [
      ['bb_feedbacks_tbl', 'verified_by'],
      ['bb_user_achievements_tbl', 'awarded_by'],
      ['bb_settings_tbl', 'updated_by'],
      ['bb_resources_tbl', 'user_id'],
      ['bb_announcements_tbl', 'created_by'],
      ['bb_logs_tbl', 'user_id'],
    ];
    for (const [table, column] of unlink) {
      const { error } = await supabaseAdmin.from(table).update({ [column]: null }).eq(column, id);
      if (error) throw new Error(`${table}: ${error.message}`);
    }

    const { error: profileError } = await supabaseAdmin.from('bb_users_tbl').delete().eq('user_id', id);
    if (profileError) throw new Error(profileError.message);
    if (target.user_analytics_id) await supabaseAdmin.from('bb_user_analytics_tbl').delete().eq('user_analytics_id', target.user_analytics_id);
    if (target.auth_user_id) await supabaseAdmin.auth.admin.deleteUser(target.auth_user_id);
  } catch (error: any) {
    console.error('Delete user error:', error);
    return c.json({ error: `Unable to delete this account (${error.message}). Archive it instead.` }, 500);
  }

  await logEvent(auth.profile.user_id, 'user-control', `Deleted the account ${target.user_email}.`, 'WARNING');
  return c.json({ message: 'User deleted.' });
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
// Readable by Super Admins and Review Administrators
adminRoutes.get('/logs', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
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
  return c.json({ config: await getAssessmentConfig(), mockUnlock: await getMockUnlockRule() });
});

// PUT /api/admin/settings/assessments — { daily, mock, practice } (paper TC-SM-009: configure answer time limit)
adminRoutes.put('/settings/assessments', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  const body = await c.req.json().catch(() => null);
  const limits = { daily: [1, 10], practice: [1, 20], mock: [5, 40] } as const;

  if (body?.mockUnlock) {
    const level = Number(body.mockUnlock.level);
    const streak = Number(body.mockUnlock.streak_days);
    if (!Number.isInteger(level) || level < 1 || level > 100) return c.json({ error: 'Mock Bar unlock level must be 1-100.' }, 400);
    if (!Number.isInteger(streak) || streak < 1 || streak > 365) return c.json({ error: 'Mock Bar unlock streak must be 1-365 days.' }, 400);
    await saveMockUnlockRule({ level, streak_days: streak }, auth.profile.user_id);
  }

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
  return c.json({ message: 'Assessment settings saved.', config: await getAssessmentConfig(), mockUnlock: await getMockUnlockRule() });
});

// POST /api/admin/rollout/run — release (and email) today's daily questions now.
// The same job runs automatically every day at 7:00 AM Philippine time.
adminRoutes.post('/rollout/run', async (c) => {
  const auth = await requireUser(c, SUPER_ADMIN);
  if (auth.response) return auth.response;
  const totals = await runDailyRollout();
  await logEvent(auth.profile.user_id, 'rollout', `Ran the daily rollout manually (${totals.released} released, ${totals.emailed} emailed).`);
  return c.json({ message: `Released ${totals.released} daily set(s); emailed ${totals.emailed}.`, totals });
});
