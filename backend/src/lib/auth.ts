
import type { Context } from 'hono';
import { supabase, supabaseAdmin } from './supabase';

export type AuthedProfile = {
  user_id: string;
  permission_id: string | null;
  full_name: string;
  role: string;
};

// Roles allowed to manage the question bank and syllabus documents
export const CONTENT_MANAGER_ROLES = [
  'lawyer',
  'review administrator',
  'review admin',
  'super admin',
];

type AuthResult =
  | { profile: AuthedProfile; response?: undefined }
  | { profile?: undefined; response: Response };

// Validates the Supabase access token (Authorization: Bearer <token>) and
// loads the matching active BarBuddy profile. When `roles` is given, the
// user's permission must be one of them.
export async function requireUser(c: Context, roles?: string[]): Promise<AuthResult> {
  const authorization = c.req.header('Authorization') || '';

  if (!authorization.startsWith('Bearer ')) {
    return { response: c.json({ message: 'Authentication required.' }, 401) };
  }

  const { data: authData, error: authError } =
    await supabase.auth.getUser(authorization.slice(7).trim());

  if (authError || !authData.user) {
    return { response: c.json({ message: 'Your session has expired. Please log in again.' }, 401) };
  }

  const { data: user } = await supabaseAdmin
    .from('bb_users_tbl')
    .select('user_id, user_fname, user_lname, permission_id, user_status, is_archived')
    .eq('auth_user_id', authData.user.id)
    .maybeSingle();

  if (!user) {
    return { response: c.json({ message: 'BarBuddy profile not found.' }, 403) };
  }

  if (
    String(user.user_status || '').trim().toUpperCase() !== 'ACTIVE' ||
    user.is_archived === true
  ) {
    return { response: c.json({ message: 'Account is inactive or archived.' }, 403) };
  }

  const { data: permission } = await supabaseAdmin
    .from('bb_permissions_tbl')
    .select('user_permission_desc')
    .eq('user_permission_id', user.permission_id)
    .maybeSingle();

  const role = String(permission?.user_permission_desc || '').trim();

  if (roles && !roles.includes(role.toLowerCase())) {
    return { response: c.json({ message: 'You do not have permission to do this.' }, 403) };
  }

  return {
    profile: {
      user_id: user.user_id,
      permission_id: user.permission_id,
      full_name: `${user.user_fname || ''} ${user.user_lname || ''}`.trim(),
      role,
    },
  };
}
