
import { Hono } from 'hono';
import type { User } from '@supabase/supabase-js';
import { supabaseAdmin } from '../lib/supabase';
import { logEvent } from '../lib/logs';
import { identify } from '../lib/auth';
import type { CognitoIdentity } from '../lib/cognito';

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

// Finds the BarBuddy profile for a Cognito user.
// 1. Profile already linked through cognito_sub
// 2. Profile with the same email not linked to Cognito yet: an account moved
//    over from Supabase Auth, an invited user, or an older BarBuddy account.
//    Cognito only signs in users who confirmed their email, so the inbox owner
//    is the one claiming it.
// 3. No profile at all: a new sign-up; create a Reviewee profile from the
//    name and mobile number given at registration
async function findOrLinkCognitoProfile(identity: CognitoIdentity) {
  const { data: linked, error: linkedError } = await supabaseAdmin
    .from('bb_users_tbl')
    .select(PROFILE_COLUMNS)
    .eq('cognito_sub', identity.sub)
    .maybeSingle();

  if (linkedError) throw linkedError;
  if (linked) return linked;

  if (!identity.email || !identity.emailVerified) return null;

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('bb_users_tbl')
    .select(PROFILE_COLUMNS)
    .ilike('user_email', escapeLike(identity.email))
    .is('cognito_sub', null)
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('bb_users_tbl')
      .update({ cognito_sub: identity.sub, updated_at: new Date().toISOString() })
      .eq('user_id', existing.user_id)
      .select(PROFILE_COLUMNS)
      .single();

    if (updateError) throw updateError;
    return updated;
  }

  const { data: created, error: createError } = await supabaseAdmin
    .from('bb_users_tbl')
    .insert({
      cognito_sub: identity.sub,
      user_fname: identity.firstName,
      user_lname: identity.lastName,
      user_email: identity.email,
      user_contact: identity.phone,
      permission_id: REVIEWEE_PERMISSION_ID,
      user_status: 'ACTIVE',
      user_progress: 0,
      user_attempts: 0,
      is_archived: false,
    })
    .select(PROFILE_COLUMNS)
    .single();

  if (createError) throw createError;
  // The sign-up form requires accepting both documents (paper TC-REGIS-009);
  // the profile is created on the first sign-in after registering
  await logEvent(created.user_id, 'auth', `Registered ${identity.email} and accepted the Terms of Service and Privacy Policy.`);
  return created;
}

// Finds the BarBuddy profile for a Supabase Auth user (sign-ins from before
// the move to Amazon Cognito).
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

// "Chrome on Windows" from a User-Agent header
function describeDevice(userAgent = '') {
  const browser = /Edg\//.test(userAgent) ? 'Edge'
    : /OPR\/|Opera/.test(userAgent) ? 'Opera'
    : /Firefox\//.test(userAgent) ? 'Firefox'
    : /Chrome\/|CriOS\//.test(userAgent) ? 'Chrome'
    : /Safari\//.test(userAgent) ? 'Safari'
    : 'a browser';
  const os = /iPhone|iPad|iPod/.test(userAgent) ? 'iOS'
    : /Android/.test(userAgent) ? 'Android'
    : /Windows/.test(userAgent) ? 'Windows'
    : /Mac OS X|Macintosh/.test(userAgent) ? 'macOS'
    : /Linux/.test(userAgent) ? 'Linux'
    : 'an unknown device';
  return `${browser} on ${os}`;
}

loginRoutes.post('/', async (c) => {
  try {
    // STEP 1: Get Authorization token
    const authorization = c.req.header('Authorization') || '';

    if (!authorization.startsWith('Bearer ')) {
      return c.json({ error: 'Authentication required.' }, 401);
    }

    const token = authorization.slice(7).trim();

    // STEP 2: Validate the sign-in (Amazon Cognito, or Supabase Auth for
    // sessions from before the move to Cognito)
    const identity = await identify(token);

    if (!identity) {
      return c.json({ error: 'Invalid or expired session.' }, 401);
    }

    // STEP 3: Retrieve (or link) the BarBuddy user profile
    let user;

    try {
      user = identity.kind === 'cognito' ? await findOrLinkCognitoProfile(identity) : await findOrLinkProfile(identity.user);
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

    // The device ends the entry ("… signed in on Chrome on Windows.") so
    // Settings → Login History can show it
    await logEvent(user.user_id, 'auth', `${permission.user_permission_desc} signed in on ${describeDevice(c.req.header('User-Agent'))}.`);

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
