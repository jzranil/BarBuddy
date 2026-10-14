import { supabase } from './supabaseClient';

// Calls the Hono backend with the current Supabase session token.
// `body` is sent as JSON unless it is FormData (file uploads).
export async function apiRequest(path, { method = 'GET', body } = {}) {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!apiUrl) {
    throw new Error('VITE_API_URL is missing in frontend/.env');
  }

  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Your session has expired. Please log in again.');
  }

  const isForm = body instanceof FormData;

  let response;

  try {
    response = await fetch(`${apiUrl}/api${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
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
