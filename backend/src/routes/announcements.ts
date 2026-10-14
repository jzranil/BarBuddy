
import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase';
import { requireUser } from '../lib/auth';
import { logEvent } from '../lib/logs';

// System announcements (paper TC-SA-001: "Publish a System Announcement").
export const announcementRoutes = new Hono();

const AUDIENCES = ['all', 'reviewee', 'lawyer', 'super_admin'];

const audienceForRole = (role: string) => {
  const r = role.toLowerCase();
  if (r === 'super admin') return 'super_admin';
  if (r === 'reviewee') return 'reviewee';
  return 'lawyer';
};

const toItem = (a: any) => ({
  id: a.announcement_id,
  title: a.announcement_title,
  body: a.announcement_body,
  audience: a.announcement_audience,
  isPublished: a.is_published,
  isArchived: a.is_archived,
  createdAt: a.created_at,
  updatedAt: a.updated_at,
  author: a.author ? `${a.author.user_fname} ${a.author.user_lname}`.trim() : null,
});

// GET /api/announcements — published announcements for the current user
announcementRoutes.get('/', async (c) => {
  const auth = await requireUser(c);
  if (auth.response) return auth.response;

  const { data, error } = await supabaseAdmin
    .from('bb_announcements_tbl')
    .select('*, author:bb_users_tbl ( user_fname, user_lname )')
    .eq('is_published', true)
    .eq('is_archived', false)
    .in('announcement_audience', ['all', audienceForRole(auth.profile.role)])
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return c.json({ message: 'Unable to load announcements.' }, 500);
  return c.json({ announcements: (data || []).map(toItem) });
});

// GET /api/announcements/manage — every announcement (Super Admin)
announcementRoutes.get('/manage', async (c) => {
  const auth = await requireUser(c, ['super admin']);
  if (auth.response) return auth.response;

  const { data, error } = await supabaseAdmin
    .from('bb_announcements_tbl')
    .select('*, author:bb_users_tbl ( user_fname, user_lname )')
    .order('created_at', { ascending: false });

  if (error) return c.json({ message: 'Unable to load announcements.' }, 500);
  return c.json({ announcements: (data || []).map(toItem) });
});

function validate(body: any) {
  const title = String(body?.title || '').trim();
  const text = String(body?.body || '').trim();
  const audience = String(body?.audience || 'all');
  if (title.length < 3 || title.length > 120) return { error: 'Title must be 3-120 characters.' };
  if (text.length < 5 || text.length > 3000) return { error: 'Message must be 5-3,000 characters.' };
  if (!AUDIENCES.includes(audience)) return { error: 'Choose who should see this announcement.' };
  return { row: { announcement_title: title, announcement_body: text, announcement_audience: audience, is_published: body?.isPublished !== false } };
}

// POST /api/announcements — { title, body, audience, isPublished }
announcementRoutes.post('/', async (c) => {
  const auth = await requireUser(c, ['super admin']);
  if (auth.response) return auth.response;

  const { error: invalid, row } = validate(await c.req.json().catch(() => null));
  if (invalid) return c.json({ message: invalid }, 400);

  const { data, error } = await supabaseAdmin
    .from('bb_announcements_tbl')
    .insert({ ...row, created_by: auth.profile.user_id })
    .select('announcement_id')
    .single();

  if (error) return c.json({ message: error.message }, 400);
  await logEvent(auth.profile.user_id, 'announcements', `${row!.is_published ? 'Published' : 'Drafted'} announcement "${row!.announcement_title}".`);
  return c.json({ id: data.announcement_id, message: row!.is_published ? 'Announcement published.' : 'Announcement saved as draft.' }, 201);
});

// PATCH /api/announcements/:id — edit, publish/unpublish or archive
announcementRoutes.patch('/:id', async (c) => {
  const auth = await requireUser(c, ['super admin']);
  if (auth.response) return auth.response;

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ message: 'Invalid JSON.' }, 400);

  let update: Record<string, unknown>;
  if (body.title !== undefined || body.body !== undefined) {
    const { error: invalid, row } = validate(body);
    if (invalid) return c.json({ message: invalid }, 400);
    update = row!;
  } else {
    update = {};
    if (typeof body.isPublished === 'boolean') update.is_published = body.isPublished;
    if (typeof body.isArchived === 'boolean') update.is_archived = body.isArchived;
  }

  const { data, error } = await supabaseAdmin
    .from('bb_announcements_tbl')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('announcement_id', c.req.param('id'))
    .select('announcement_title')
    .maybeSingle();

  if (error) return c.json({ message: error.message }, 400);
  if (!data) return c.json({ message: 'Announcement not found.' }, 404);

  await logEvent(auth.profile.user_id, 'announcements', `Updated announcement "${data.announcement_title}".`);
  return c.json({ message: 'Announcement updated.' });
});

// DELETE /api/announcements/:id
announcementRoutes.delete('/:id', async (c) => {
  const auth = await requireUser(c, ['super admin']);
  if (auth.response) return auth.response;

  const { data, error } = await supabaseAdmin
    .from('bb_announcements_tbl')
    .delete()
    .eq('announcement_id', c.req.param('id'))
    .select('announcement_title')
    .maybeSingle();

  if (error) return c.json({ message: error.message }, 400);
  if (!data) return c.json({ message: 'Announcement not found.' }, 404);

  await logEvent(auth.profile.user_id, 'announcements', `Deleted announcement "${data.announcement_title}".`, 'WARNING');
  return c.json({ message: 'Announcement deleted.' });
});
