import { Hono } from 'hono';
import { supabase } from '../lib/supabase';

export const userRoutes = new Hono();

// Existing Profile Endpoint
userRoutes.get('/user/profile', async (c) => {
  const uid = c.req.query('uid');
  const pid = c.req.query('pid');

  if (!uid || !pid) {
    return c.json({ error: 'Missing uid or pid' }, 400);
  }

  const { data: userData } = await supabase
    .from('bb_users_tbl')
    .select('user_name, user_email')
    .eq('user_id', uid)
    .single();

  const { data: permData } = await supabase
    .from('bb_permissions_tbl')
    .select('user_permission_desc')
    .eq('user_permission_id', pid)
    .single();

  return c.json({
    name: userData?.user_name || 'User',
    email: userData?.user_email || '',
    role: permData?.user_permission_desc || '',
  });
});

// ==========================================
// SUPER ADMIN USER CONTROL ENDPOINTS
// ==========================================

// 1. KPI Summary Metrics
// backend/src/routes/user.ts

userRoutes.get('/admin/summary', async (c) => {
  // 1. Total user count
  const { count: totalUsers } = await supabase
    .from('bb_users_tbl')
    .select('*', { count: 'exact', head: true });

  // 2. Locked/Inactive/Suspended accounts count
  const { count: lockedAccounts } = await supabase
    .from('bb_users_tbl')
    .select('*', { count: 'exact', head: true })
    .in('user_status', ['Suspended', 'Inactive']);

  // 3. Admin user count (Inner join directly on permissions description)
  const { count: adminsCount, error } = await supabase
    .from('bb_users_tbl')
    .select('user_id, bb_permissions_tbl!inner(user_permission_desc)', { count: 'exact', head: true })
    .ilike('bb_permissions_tbl.user_permission_desc', '%admin%');

  if (error) {
    console.error('Error fetching admin count:', error);
  }

  return c.json({
    totalUsers: totalUsers || 0,
    adminsCount: adminsCount || 0,
    lockedAccounts: lockedAccounts || 0,
    avgSessionLabel: '14m 20s',
  });
});

// 2. Paginated User List with Search
userRoutes.get('/admin/users', async (c) => {
  const search = c.req.query('search') || '';
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '10', 10);
  const offset = (page - 1) * limit;

  let query = supabase
    .from('bb_users_tbl')
    .select(
      `
      user_id,
      user_name,
      user_email,
      user_status,
      created_at,
      user_activity,
      bb_permissions_tbl (
        user_permission_desc
      )
    `,
      { count: 'exact' }
    );

  if (search) {
    query = query.or(`user_name.ilike.%${search}%,user_email.ilike.%${search}%`);
  }

  const { data, count, error } = await query
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  const users = (data || []).map((u: any) => ({
    id: u.user_id,
    name: u.user_name,
    email: u.user_email,
    role: u.bb_permissions_tbl?.user_permission_desc || 'User',
    status: u.user_status || 'Active',
    joinedDate: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A',
    lastActivity: u.user_activity ? new Date(u.user_activity).toLocaleDateString() : 'Recently',
  }));

  return c.json({
    users,
    total: count || 0,
    page,
    limit,
  });
});

// 3. Provision New User
userRoutes.post('/admin/users', async (c) => {
  const body = await c.req.json();
  const { name, email, permission_id, status } = body;

  if (!name || !email) {
    return c.json({ error: 'Name and email are required' }, 400);
  }

  const { data, error } = await supabase
    .from('bb_users_tbl')
    .insert({
      user_name: name,
      user_email: email,
      user_permission_id: permission_id,
      user_status: status || 'Pending',
    })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data, 201);
});

// 4. Update Role / Status / Info
userRoutes.patch('/admin/users/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const { data, error } = await supabase
    .from('bb_users_tbl')
    .update({
      ...(body.name && { user_name: body.name }),
      ...(body.email && { user_email: body.email }),
      ...(body.permission_id && { user_permission_id: body.permission_id }),
      ...(body.status && { user_status: body.status }),
    })
    .eq('user_id', id)
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});