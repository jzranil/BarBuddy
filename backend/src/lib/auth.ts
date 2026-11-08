
import type { Context } from 'hono';
import type { User } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from './supabase';
import { verifyCognitoToken, type CognitoIdentity } from './cognito';

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

export type Identity =
  | ({ kind: 'cognito' } & CognitoIdentity)
  | { kind: 'supabase'; user: User };

// Who sent the request (Authorization: Bearer <token>): an Amazon Cognito ID
// token, or a Supabase Auth access token from before the move to Cognito.
// SUPABASE_AUTH=off stops accepting Supabase tokens once everyone has moved.
export async function identify(token: string): Promise<Identity | null> {
  const cognito = await verifyCognitoToken(token);
  if (cognito) return { kind: 'cognito', ...cognito };
  if (process.env.SUPABASE_AUTH === 'off') return null;

  const { data, error } = await supabase.auth.getUser(token);
  return error || !data.user ? null : { kind: 'supabase', user: data.user };
}

// Authentication (Cognito) → authorization (BarBuddy profile in Supabase):
// validates the token, then loads the matching active BarBuddy profile. When
// `roles` is given, the user's permission must be one of them.
export async function requireUser(c: Context, roles?: string[]): Promise<AuthResult> {
  const authorization = c.req.header('Authorization') || '';

  if (!authorization.startsWith('Bearer ')) {
    return { response: c.json({ message: 'Authentication required.' }, 401) };
  }

  const identity = await identify(authorization.slice(7).trim());

  if (!identity) {
    return { response: c.json({ message: 'Your session has expired. Please log in again.' }, 401) };
  }

  const { data: user } = await supabaseAdmin
    .from('bb_users_tbl')
    .select('user_id, user_fname, user_lname, permission_id, user_status, is_archived')
    .eq(identity.kind === 'cognito' ? 'cognito_sub' : 'auth_user_id', identity.kind === 'cognito' ? identity.sub : identity.user.id)
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
