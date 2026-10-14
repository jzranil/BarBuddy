
import { Hono } from 'hono';
import { supabase, supabaseAdmin } from '../lib/supabase';

export const loginRoutes = new Hono();

loginRoutes.post('/', async (c) => {
  try {
    // STEP 1: Get Authorization token
    const authorization =
      c.req.header('Authorization') || '';

    if (!authorization.startsWith('Bearer ')) {
      return c.json(
        { error: 'Authentication required.' },
        401
      );
    }

    const token = authorization.slice(7).trim();

    // STEP 2: Validate Supabase Auth user
    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return c.json(
        { error: 'Invalid or expired session.' },
        401
      );
    }

    // STEP 3: Retrieve BarBuddy user profile
    const { data: user, error: userError } =
      await supabaseAdmin
        .from('bb_users_tbl')
        .select(`
          user_id,
          auth_user_id,
          user_fname,
          user_lname,
          user_email,
          permission_id,
          user_status,
          is_archived
        `)
        .eq('auth_user_id', authData.user.id)
        .single();

    if (userError) {
  console.error('BarBuddy profile lookup error:', {
    code: userError.code,
    message: userError.message,
  });

  if (userError.code !== 'PGRST116') {
    return c.json(
      { error: 'Unable to retrieve BarBuddy profile.' },
      500
    );
  }
}

if (!user) {
  return c.json(
    {
      error:
        'Your Supabase Auth account is not linked to a BarBuddy profile.',
    },
    403
  );
}

    // STEP 4: Check account status
    if (
      String(user.user_status || '')
        .trim()
        .toUpperCase() !== 'ACTIVE' ||
      user.is_archived === true
    ) {
      return c.json(
        { error: 'Your account is inactive or archived.' },
        403
      );
    }

    // STEP 5: Retrieve user permission
    const { data: permission, error: permissionError } =
      await supabaseAdmin
        .from('bb_permissions_tbl')
        .select('user_permission_desc')
        .eq('user_permission_id', user.permission_id)
        .single();

    if (permissionError || !permission) {
      return c.json(
        { error: 'User permission not found.' },
        403
      );
    }

    // STEP 6: Return safe profile information
    return c.json({
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        user_name:
          `${user.user_fname} ${user.user_lname}`.trim(),
        user_email: user.user_email,
        user_status: user.user_status,

        // Preserve existing frontend ROLE_ROUTES compatibility
        user_permission_id: user.permission_id,

        role: permission.user_permission_desc,
      },
    });

  } catch (error) {
    console.error('Login error:', error);

    return c.json(
      { error: 'Internal server error.' },
      500
    );
  }
});
