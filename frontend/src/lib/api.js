import { supabase } from './supabaseClient';

const isLocalHost = (host) => ['localhost', '127.0.0.1', '[::1]'].includes(host);

// Opened through a tunnel (e.g. ngrok) in dev: a localhost API is not
// reachable from the visitor's device, so use the Vite /api proxy instead.
function resolveApiUrl() {
  const url = import.meta.env.VITE_API_URL;
  if (import.meta.env.DEV && !isLocalHost(window.location.hostname) && isLocalHost(new URL(url).hostname)) return '';
  return url;
}

// Calls the Hono backend with the current Supabase session token.
// `body` is sent as JSON unless it is FormData (file uploads).
// `auth: false` skips the token (public endpoints such as /payments/link).
export async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  if (!import.meta.env.VITE_API_URL) {
    throw new Error('VITE_API_URL is missing in frontend/.env');
  }

  const apiUrl = resolveApiUrl();

  const { data: { session } } = auth ? await supabase.auth.getSession() : { data: { session: null } };

  if (auth && !session?.access_token) {
    throw new Error('Your session has expired. Please log in again.');
  }

  const isForm = body instanceof FormData;

  let response;

  try {
    response = await fetch(`${apiUrl}/api${path}`, {
      method,
      headers: {
        ...(auth ? { Authorization: `Bearer ${session.access_token}` } : {}),
        ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the BarBuddy server. Check that the backend is running.');
  }

  let result = {};

  try {
    result = await response.json();
  } catch {
    // Non-JSON response; handled below
  }

  if (!response.ok) {
    const error = new Error(result.message || result.error || `Request failed (HTTP ${response.status}).`);
    error.status = response.status;
    error.details = result;
    throw error;
  }

  return result;
}
