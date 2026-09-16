import { Hono } from 'hono';
import { supabase } from '../lib/supabase';

export const userRoutes = new Hono();

userRoutes.get('/profile', async (c) => {
  const uid = c.req.query('uid');
  const pid = c.req.query('pid');

  if (!uid || !pid) {
    return c.json({ error: 'Missing uid or pid' }, 400);
  }

  // Fetch user details from database
  const { data: userData } = await supabase
    .from('bb_users_tbl')
    .select('user_name, user_email')
    .eq('user_id', uid)
    .single();

  // Fetch permission details from database
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