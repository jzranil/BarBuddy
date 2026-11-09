// Amazon Cognito sign-in (paper Table 3.3: logins, registration, tokens),
// called through Cognito's public API so no SDK is needed. The backend checks
// the ID token, then grants access from the BarBuddy profile in Supabase.
//   VITE_COGNITO_USER_POOL_ID  e.g. ap-southeast-1_AbCdEf123 (region = prefix)
//   VITE_COGNITO_CLIENT_ID     the user pool's app client (no secret)

const POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID || '';
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '';
const ENDPOINT = `https://cognito-idp.${POOL_ID.split('_')[0]}.amazonaws.com/`;
const SESSION_KEY = 'bb-cognito-session';

export class CognitoError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const TOO_MANY = 'Too many attempts. Please wait a few minutes, then try again.';
const MESSAGES = {
  NotAuthorizedException: 'Invalid email or password.',
  UserNotFoundException: 'Invalid email or password.',
  UserNotConfirmedException: 'Please confirm your email first. Enter the code we sent to your inbox.',
  UsernameExistsException: 'An account with this email already exists. Please log in or reset your password.',
  CodeMismatchException: 'That code is incorrect. Check the latest email from BarBuddy and try again.',
  ExpiredCodeException: 'That code has expired. Request a new one.',
  InvalidPasswordException: 'Password needs at least 8 characters with an uppercase letter, a lowercase letter and a number.',
  CodeDeliveryFailureException: 'We could not send the code. Check the email address and try again.',
  LimitExceededException: TOO_MANY,
  TooManyRequestsException: TOO_MANY,
  TooManyFailedAttemptsException: TOO_MANY,
  PasswordResetRequiredException: 'Your password must be reset. Use "Forgot password?" to set a new one.',
};

async function call(action, body) {
  if (!POOL_ID || !CLIENT_ID) {
    throw new CognitoError('NotConfigured', 'Sign-in is not set up yet (VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID are missing).');
  }
  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': `AWSCognitoIdentityProviderService.${action}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new CognitoError('NetworkError', "Can't reach BarBuddy's sign-in service. Check your internet connection, then try again.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = String(data.__type || '').split('#').pop();
    // Cognito names the exact password rule that failed (e.g. "Password must
    // have symbol characters"); show it so the reviewee knows what to change
    if (code === 'InvalidPasswordException' && data.message) {
      throw new CognitoError(code, `That password isn't accepted: ${String(data.message).replace(/^Password did not conform with policy:\s*/i, '')}.`.replace(/\.\.$/, '.'));
    }
    throw new CognitoError(code, MESSAGES[code] || data.message || 'Something went wrong. Please try again.');
  }
  return data;
}

// ---- Session (tokens kept in this browser) ----

export function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}

function saveSession(result, email, refreshToken) {
  const session = {
    idToken: result.IdToken,
    accessToken: result.AccessToken,
    refreshToken: result.RefreshToken || refreshToken,
    expiresAt: Date.now() + (result.ExpiresIn || 3600) * 1000,
    email,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

let refreshing = null;

// The current session, refreshed when the ID token is about to expire.
// null when signed out or when the refresh token is no longer valid.
export async function getSession() {
  const session = readSession();
  if (!session?.refreshToken) return null;
  if (session.expiresAt - Date.now() > 60_000) return session;

  refreshing ??= call('InitiateAuth', {
    ClientId: CLIENT_ID,
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    AuthParameters: { REFRESH_TOKEN: session.refreshToken },
  })
    .then((data) => saveSession(data.AuthenticationResult, session.email, session.refreshToken))
    .catch((error) => {
      if (error.code === 'NetworkError') throw error;
      clearSession();
      return null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

// ---- Sign-in, registration, password recovery ----

const username = (email) => email.trim().toLowerCase();

export async function signIn(email, password) {
  // USER_PASSWORD_AUTH sends the password to Cognito over HTTPS so the user
  // migration trigger can check accounts created before Cognito
  const data = await call('InitiateAuth', {
    ClientId: CLIENT_ID,
    AuthFlow: 'USER_PASSWORD_AUTH',
    AuthParameters: { USERNAME: username(email), PASSWORD: password },
  });
  if (!data.AuthenticationResult) {
    throw new CognitoError(data.ChallengeName || 'Challenge', 'This account needs extra steps BarBuddy does not support. Contact support.');
  }
  return saveSession(data.AuthenticationResult, username(email));
}

export async function signOut() {
  const session = readSession();
  clearSession();
  if (session?.refreshToken) {
    // Ends the refresh token on Cognito too; signing out locally is enough if this fails
    await call('RevokeToken', { ClientId: CLIENT_ID, Token: session.refreshToken }).catch(() => {});
  }
}

// attributes: given_name, family_name, phone_number (+639XXXXXXXXX)
export function signUp(email, password, attributes) {
  return call('SignUp', {
    ClientId: CLIENT_ID,
    Username: username(email),
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: username(email) },
      ...Object.entries(attributes)
        .filter(([, value]) => value)
        .map(([Name, Value]) => ({ Name, Value })),
    ],
  });
}

export const confirmSignUp = (email, code) =>
  call('ConfirmSignUp', { ClientId: CLIENT_ID, Username: username(email), ConfirmationCode: code });

export const resendSignUpCode = (email) =>
  call('ResendConfirmationCode', { ClientId: CLIENT_ID, Username: username(email) });

export const forgotPassword = (email) =>
  call('ForgotPassword', { ClientId: CLIENT_ID, Username: username(email) });

export const confirmForgotPassword = (email, code, password) =>
  call('ConfirmForgotPassword', { ClientId: CLIENT_ID, Username: username(email), ConfirmationCode: code, Password: password });

// Settings → Change password (checks the current password itself)
export async function changePassword(currentPassword, newPassword) {
  const session = await getSession();
  if (!session) throw new CognitoError('NotAuthorizedException', 'Your session has expired. Please log in again.');
  return call('ChangePassword', { AccessToken: session.accessToken, PreviousPassword: currentPassword, ProposedPassword: newPassword });
}

// Cognito wants mobile numbers as +639XXXXXXXXX
export const toE164 = (mobile) => (mobile.startsWith('09') ? `+63${mobile.slice(1)}` : mobile);
