
import { Hono } from 'hono';
import type { User } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from '../lib/supabase';

export const loginRoutes = new Hono();

// Reviewee permission (matches ROLE_ROUTES in frontend LoginPage.jsx)
const REVIEWEE_PERMISSION_ID = 'a11498ab-0a57-4ed2-9315-29167e6a2f63';

const PROFILE_COLUMNS = `
  user_id,
  auth_user_id,
  user_fname,
  user_lname,
  user_email,
  permission_id,
  user_status,
  is_archived
`;

// Escape LIKE wildcards so emails such as "juan_dc@x.com" match exactly
function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, '\\$&');
}

// Finds the BarBuddy profile for a Supabase Auth user.
// 1. Profile already linked through auth_user_id (created by the signup trigger)
// 2. Older BarBuddy account with the same email that was never linked
// 3. No profile at all: create a Reviewee profile from the signup metadata
async function findOrLinkProfile(authUser: User) {
  const { data: linked, error: linkedError } = await supabaseAdmin
    .from('bb_users_tbl')
    .select(PROFILE_COLUMNS)
    .eq('auth_user_id', authUser.id)
    .maybeSingle();

  if (linkedError) throw linkedError;
  if (linked) return linked;

  if (!authUser.email) return null;

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('bb_users_tbl')
    .select(PROFILE_COLUMNS)
    .ilike('user_email', escapeLike(authUser.email))
    .is('auth_user_id', null)
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('bb_users_tbl')
      .update({ auth_user_id: authUser.id })
      .eq('user_id', existing.user_id)
      .select(PROFILE_COLUMNS)
      .single();

    if (updateError) throw updateError;
    return updated;
  }

  const meta = authUser.user_metadata || {};

  const { data: created, error: createError } = await supabaseAdmin
    .from('bb_users_tbl')
    .insert({
      auth_user_id: authUser.id,
      user_fname: String(meta.first_name || '').trim(),
      user_lname: String(meta.last_name || '').trim(),
      user_email: authUser.email,
      user_contact: meta.contact_number || null,
      permission_id: REVIEWEE_PERMISSION_ID,
      user_status: 'ACTIVE',
      user_progress: 0,
      user_attempts: 0,
      is_archived: false,
    })
    .select(PROFILE_COLUMNS)
    .single();

  if (createError) throw createError;
  return created;
}

loginRoutes.post('/', async (c) => {
  try {
    // STEP 1: Get Authorization token
    const authorization = c.req.header('Authorization') || '';

    if (!authorization.startsWith('Bearer ')) {
      return c.json({ error: 'Authentication required.' }, 401);
    }

    const token = authorization.slice(7).trim();

    // STEP 2: Validate Supabase Auth user
    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return c.json({ error: 'Invalid or expired session.' }, 401);
    }

    // STEP 3: Retrieve (or link) the BarBuddy user profile
    let user;

    try {
      user = await findOrLinkProfile(authData.user);
    } catch (profileError: any) {
      console.error('BarBuddy profile lookup error:', {
        code: profileError?.code,
        message: profileError?.message,
      });

      return c.json({ error: 'Unable to retrieve BarBuddy profile.' }, 500);
    }

    if (!user) {
      return c.json(
        { error: 'Your account is not linked to a BarBuddy profile.' },
        403
      );
    }

    // STEP 4: Check account status
    if (
      String(user.user_status || '').trim().toUpperCase() !== 'ACTIVE' ||
      user.is_archived === true
    ) {
      return c.json({ error: 'Your account is inactive or archived.' }, 403);
    }

    // STEP 5: Retrieve user permission
    const { data: permission, error: permissionError } = await supabaseAdmin
      .from('bb_permissions_tbl')
      .select('user_permission_desc')
      .eq('user_permission_id', user.permission_id)
      .maybeSingle();

    if (permissionError || !permission) {
      return c.json({ error: 'User permission not found.' }, 403);
    }

    // STEP 6: Record last activity
    await supabaseAdmin
      .from('bb_users_tbl')
      .update({ user_activity: new Date().toISOString() })
      .eq('user_id', user.user_id);

    // STEP 7: Return safe profile information
    return c.json({
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        user_name: `${user.user_fname} ${user.user_lname}`.trim(),
        user_email: user.user_email,
        user_status: user.user_status,

        // Preserve existing frontend ROLE_ROUTES compatibility
        user_permission_id: user.permission_id,

        role: permission.user_permission_desc,
      },
    });

  } catch (error) {
    console.error('Login error:', error);

    return c.json({ error: 'Internal server error.' }, 500);
  }
});
