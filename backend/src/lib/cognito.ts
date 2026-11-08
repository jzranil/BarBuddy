import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { AdminDeleteUserCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { supabase, supabaseAdmin } from './supabase';

// Amazon Cognito signs users in (paper Table 3.3: logins, registration,
// tokens). Supabase keeps the BarBuddy profile, role and status, and the
// backend grants access from those (lib/auth.ts).
//   COGNITO_USER_POOL_ID  e.g. ap-southeast-1_AbCdEf123
//   COGNITO_CLIENT_ID     the user pool's app client (no secret)

export const cognitoConfigured = () => Boolean(process.env.COGNITO_USER_POOL_ID && process.env.COGNITO_CLIENT_ID);

// The region is the pool ID's prefix
const poolRegion = () => String(process.env.COGNITO_USER_POOL_ID).split('_')[0];

let verifier: ReturnType<typeof createVerifier> | null = null;
function createVerifier() {
  return CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_USER_POOL_ID!,
    clientId: process.env.COGNITO_CLIENT_ID!,
    tokenUse: 'id', // the ID token carries the email the profile is linked by
  });
}

export type CognitoIdentity = {
  sub: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  phone: string | null;
};

// Checks the signature, issuer, audience and expiry of a Cognito ID token.
// Returns null for anything that is not a valid token from this user pool.
export async function verifyCognitoToken(token: string): Promise<CognitoIdentity | null> {
  if (!cognitoConfigured()) return null;
  verifier ??= createVerifier();
  try {
    const claims: any = await verifier.verify(token);
    return {
      sub: claims.sub,
      email: String(claims.email || '').toLowerCase(),
      emailVerified: claims.email_verified === true || claims.email_verified === 'true',
      firstName: String(claims.given_name || '').trim(),
      lastName: String(claims.family_name || '').trim(),
      phone: claims.phone_number ? String(claims.phone_number) : null,
    };
  } catch {
    return null;
  }
}

// Removes the Cognito user when a Super Admin deletes the account. Needs
// cognito-idp:AdminDeleteUser on the user pool in the Lambda role.
export async function deleteCognitoUser(sub: string) {
  if (!cognitoConfigured()) return;
  const client = new CognitoIdentityProviderClient({ region: poolRegion() });
  try {
    await client.send(new AdminDeleteUserCommand({ UserPoolId: process.env.COGNITO_USER_POOL_ID, Username: sub }));
  } catch (error: any) {
    if (error?.name !== 'UserNotFoundException') throw error;
  }
}

// ---------------------------------------------------------------------------
// User migration trigger (Cognito → Lambda). Accounts created before Cognito
// live in Supabase Auth. When such a user signs in (or asks for a password
// reset) and Cognito does not know them yet, Cognito asks this function:
//   UserMigration_Authentication: the password is checked against Supabase;
//     if it is right, Cognito creates the user with that same password.
//   UserMigration_ForgotPassword: the user exists in BarBuddy, so Cognito
//     creates them and emails the reset code.
// Cognito waits at most 5 seconds for the answer.
// ---------------------------------------------------------------------------

async function legacyProfile(email: string) {
  const { data } = await supabaseAdmin
    .from('bb_users_tbl')
    .select('user_fname, user_lname, auth_user_id, user_status, is_archived')
    .ilike('user_email', email.replace(/[\\%_]/g, '\\$&'))
    .not('auth_user_id', 'is', null)
    .maybeSingle();
  return data;
}

const attributesFor = (email: string, profile: any) => ({
  email,
  email_verified: 'true',
  ...(profile?.user_fname ? { given_name: profile.user_fname } : {}),
  ...(profile?.user_lname ? { family_name: profile.user_lname } : {}),
});

export async function migrateUser(event: any) {
  const email = String(event.userName || '').trim().toLowerCase();

  if (event.triggerSource === 'UserMigration_Authentication') {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: event.request?.password || '' });
    if (error || !data.user) throw new Error('Incorrect username or password.');
    event.response.userAttributes = attributesFor(email, await legacyProfile(email));
    event.response.finalUserStatus = 'CONFIRMED';
    event.response.messageAction = 'SUPPRESS';
    return event;
  }

  if (event.triggerSource === 'UserMigration_ForgotPassword') {
    const profile = await legacyProfile(email);
    if (!profile) throw new Error('User does not exist.');
    event.response.userAttributes = attributesFor(email, profile);
    event.response.messageAction = 'SUPPRESS';
    return event;
  }

  throw new Error(`Unsupported trigger ${event.triggerSource}.`);
}
