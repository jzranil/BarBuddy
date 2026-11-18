import { supabaseAdmin } from './supabase';

// Login lockout (paper TC-LOGIN-008): 3 failed logins in a row lock the
// account for 15 minutes. Cognito checks passwords, so the count is kept by
// its "Pre authentication" trigger (it runs before every password check) in
// the profile's user_attempts / user_lockout_end columns, and a successful
// sign-in (POST /api/login) clears it.
export const MAX_LOGIN_ATTEMPTS = 3;
export const LOCK_MINUTES = 15;

// Prefix the frontend recognises in Cognito's "PreAuthentication failed with
// error …" message
export const LOCKED_PREFIX = 'BB_LOCKED:';

const normalize = (email: unknown) => String(email || '').trim().toLowerCase();
const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');
const minutesUntil = (iso: string) => Math.max(1, Math.ceil((Date.parse(iso) - Date.now()) / 60_000));
const isLocked = (until: string | null) => Boolean(until) && Date.parse(until!) > Date.now();

async function profileByEmail(email: string) {
  const { data } = await supabaseAdmin
    .from('bb_users_tbl')
    .select('user_id, user_attempts, user_lockout_end')
    .ilike('user_email', escapeLike(email))
    .limit(1)
    .maybeSingle();
  return data as { user_id: string; user_attempts: number | null; user_lockout_end: string | null } | null;
}

// Cognito "Pre authentication" trigger. Throwing refuses the sign-in.
// Each attempt counts until a successful sign-in clears it; the attempt that
// reaches the limit still goes through (if its password is right, the login
// clears the lock). If the database can't be reached the attempt is allowed:
// Cognito's own brute-force protection still applies.
export async function preAuthentication(event: any) {
  const email = normalize(event.request?.userAttributes?.email);
  if (!email) return event;

  try {
    const profile = await profileByEmail(email);
    if (!profile) return event; // first sign-in after sign-up: no profile yet
    if (isLocked(profile.user_lockout_end)) {
      throw new LockedError(minutesUntil(profile.user_lockout_end!));
    }
    // An expired lock starts the count over
    const attempts = (profile.user_lockout_end ? 0 : profile.user_attempts || 0) + 1;
    await supabaseAdmin
      .from('bb_users_tbl')
      .update({
        user_attempts: attempts,
        user_lockout_end: attempts >= MAX_LOGIN_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null,
      })
      .eq('user_id', profile.user_id);
  } catch (error: any) {
    if (error instanceof LockedError) throw new Error(`${LOCKED_PREFIX}${error.minutes}`);
    console.error('Login attempt not recorded:', error?.message || error);
  }
  return event;
}

class LockedError extends Error {
  constructor(public minutes: number) {
    super('locked');
  }
}

// After a failed password: is the account locked now, and how many tries are left
export async function loginLockStatus(rawEmail: unknown) {
  const email = normalize(rawEmail);
  const empty = { locked: false, minutesLeft: 0, attemptsLeft: MAX_LOGIN_ATTEMPTS };
  if (!email) return empty;

  const profile = await profileByEmail(email);
  if (!profile) return empty;
  if (isLocked(profile.user_lockout_end)) {
    return { locked: true, minutesLeft: minutesUntil(profile.user_lockout_end!), attemptsLeft: 0 };
  }
  const failed = profile.user_lockout_end ? 0 : profile.user_attempts || 0;
  return { locked: false, minutesLeft: 0, attemptsLeft: Math.max(0, MAX_LOGIN_ATTEMPTS - failed) };
}

// A successful sign-in starts the count over
export async function clearLoginAttempts(userId: string) {
  const { error } = await supabaseAdmin
    .from('bb_users_tbl')
    .update({ user_attempts: 0, user_lockout_end: null })
    .eq('user_id', userId);
  if (error) console.error('Login attempts not cleared:', error.message);
}
