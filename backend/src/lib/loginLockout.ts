import { supabaseAdmin } from './supabase';

// Login lockout (paper TC-LOGIN-008), with waits that grow geometrically:
// the first 3 failed logins in a row are free, then each further one locks
// the account for twice as long as the last: 15 s, 30 s, 1 min, 2 min, 4 min
// and so on, up to 1 hour. Cognito checks passwords, so the count is kept by
// its "Pre authentication" trigger (it runs before every password check) in
// the profile's user_attempts / user_lockout_end columns, and a successful
// sign-in (POST /api/login) clears it.
export const MAX_LOGIN_ATTEMPTS = 3;
export const FIRST_LOCK_SECONDS = 15;
export const MAX_LOCK_SECONDS = 60 * 60;
// A lock that ended this long ago no longer counts: the next mistake is
// treated as the first again
const FORGET_AFTER_MS = 24 * 60 * 60 * 1000;

// Prefix the frontend recognises in Cognito's "PreAuthentication failed with
// error …" message; the number after it is the wait in seconds
export const LOCKED_PREFIX = 'BB_LOCKED:';

const normalize = (email: unknown) => String(email || '').trim().toLowerCase();
const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');
const secondsUntil = (iso: string) => Math.max(1, Math.ceil((Date.parse(iso) - Date.now()) / 1000));
const isLocked = (until: string | null) => Boolean(until) && Date.parse(until!) > Date.now();

// Attempt n (counting from 1) locks the account for this many seconds;
// 0 while n is within the free attempts
export function lockSecondsFor(attempt: number) {
  if (attempt < MAX_LOGIN_ATTEMPTS) return 0;
  return Math.min(MAX_LOCK_SECONDS, FIRST_LOCK_SECONDS * 2 ** Math.min(attempt - MAX_LOGIN_ATTEMPTS, 20));
}

type Profile = { user_id: string; user_attempts: number | null; user_lockout_end: string | null };

async function profileByEmail(email: string) {
  const { data } = await supabaseAdmin
    .from('bb_users_tbl')
    .select('user_id, user_attempts, user_lockout_end')
    .ilike('user_email', escapeLike(email))
    .limit(1)
    .maybeSingle();
  return data as Profile | null;
}

// Failed attempts so far, forgetting a run whose last lock ended long ago
function attemptsSoFar(profile: Profile) {
  const ended = profile.user_lockout_end ? Date.parse(profile.user_lockout_end) : NaN;
  if (Number.isFinite(ended) && Date.now() - ended > FORGET_AFTER_MS) return 0;
  return profile.user_attempts || 0;
}

// Cognito "Pre authentication" trigger. Throwing refuses the sign-in.
// Each attempt counts until a successful sign-in clears it; an attempt that
// sets a lock still goes through (if its password is right, the login clears
// the lock). If the database can't be reached the attempt is allowed:
// Cognito's own brute-force protection still applies.
export async function preAuthentication(event: any) {
  const email = normalize(event.request?.userAttributes?.email);
  if (!email) return event;

  try {
    const profile = await profileByEmail(email);
    if (!profile) return event; // first sign-in after sign-up: no profile yet
    if (isLocked(profile.user_lockout_end)) {
      throw new LockedError(secondsUntil(profile.user_lockout_end!));
    }
    const previous = attemptsSoFar(profile);
    const attempts = previous + 1;
    const lockSeconds = lockSecondsFor(attempts);
    await supabaseAdmin
      .from('bb_users_tbl')
      .update({
        user_attempts: attempts,
        // Free attempts keep the last (expired) lock time, unless the run
        // started over
        user_lockout_end: lockSeconds
          ? new Date(Date.now() + lockSeconds * 1000).toISOString()
          : previous
            ? profile.user_lockout_end
            : null,
      })
      .eq('user_id', profile.user_id);
  } catch (error: any) {
    if (error instanceof LockedError) throw new Error(`${LOCKED_PREFIX}${error.seconds}`);
    console.error('Login attempt not recorded:', error?.message || error);
  }
  return event;
}

class LockedError extends Error {
  constructor(public seconds: number) {
    super('locked');
  }
}

// After a failed password: is the account locked now, how many free tries
// are left, and how long the next lock would be
export async function loginLockStatus(rawEmail: unknown) {
  const email = normalize(rawEmail);
  const empty = { locked: false, secondsLeft: 0, attemptsLeft: MAX_LOGIN_ATTEMPTS, nextLockSeconds: FIRST_LOCK_SECONDS };
  if (!email) return empty;

  const profile = await profileByEmail(email);
  if (!profile) return empty;
  const failed = attemptsSoFar(profile);
  const nextLockSeconds = lockSecondsFor(Math.max(failed + 1, MAX_LOGIN_ATTEMPTS));
  if (isLocked(profile.user_lockout_end)) {
    return { locked: true, secondsLeft: secondsUntil(profile.user_lockout_end!), attemptsLeft: 0, nextLockSeconds };
  }
  return { locked: false, secondsLeft: 0, attemptsLeft: Math.max(0, MAX_LOGIN_ATTEMPTS - failed), nextLockSeconds };
}

// A successful sign-in starts the count over
export async function clearLoginAttempts(userId: string) {
  const { error } = await supabaseAdmin
    .from('bb_users_tbl')
    .update({ user_attempts: 0, user_lockout_end: null })
    .eq('user_id', userId);
  if (error) console.error('Login attempts not cleared:', error.message);
}
