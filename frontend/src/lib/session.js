import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSession, readSession } from './cognito';

// The login page with a way back here, e.g. /login?next=%2Fassessments%2Fstart%2Fdaily
export const loginPathFor = (path) => `/login?next=${encodeURIComponent(path)}`;

// Where a role may be sent back to after logging in: only pages inside
// its own portal, and never another site ("//evil.com" or "https://...")
const PORTAL_PREFIXES = {
  '5bac543c-5f03-436a-85a8-2c8fc3c6b0e3': ['/superadmin'], // Super Admin
  '6642db37-fe3f-4c6f-8b82-427b381a9c69': ['/lawyer'], // Lawyer / Review Administrator
  'a11498ab-0a57-4ed2-9315-29167e6a2f63': ['/dashboard', '/subjects', '/achievements', '/subscription', '/settings', '/help-center', '/legal', '/assessments', '/resources'], // Reviewee
};

export function safeReturnPath(next, permissionId) {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return null;
  const path = next.split(/[?#]/)[0];
  return (PORTAL_PREFIXES[permissionId] || []).some((prefix) => path === prefix || path.startsWith(`${prefix}/`)) ? next : null;
}

// Portal pages: without a signed-in session (e.g. opening the daily
// questions link from the email), go to login and come back here afterwards
export function useRequireSession() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let active = true;
    const signedIn = Boolean(localStorage.getItem('user'));
    getSession()
      .catch(() => readSession()) // offline: keep the stored session
      .then((session) => {
        if (active && (!session || !signedIn)) {
          navigate(loginPathFor(location.pathname + location.search), { replace: true });
        }
      });
    return () => {
      active = false;
    };
    // Checked once when a portal page opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
