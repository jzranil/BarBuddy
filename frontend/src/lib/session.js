import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSession, readSession } from './cognito';

// The login page with a way back here, e.g. /login?next=%2Fassessments%2Fstart%2Fdaily
export const loginPathFor = (path) => `/login?next=${encodeURIComponent(path)}`;

// Role IDs (bb_users_tbl.user_permission_id) and each role's dashboard
export const ROLES = {
  superadmin: '5bac543c-5f03-436a-85a8-2c8fc3c6b0e3', // Super Admin
  lawyer: '6642db37-fe3f-4c6f-8b82-427b381a9c69', // Lawyer / Review Administrator
  reviewee: 'a11498ab-0a57-4ed2-9315-29167e6a2f63', // Reviewee
};

export const ROLE_HOME = {
  [ROLES.superadmin]: '/superadmin',
  [ROLES.lawyer]: '/lawyer',
  [ROLES.reviewee]: '/dashboard',
};

// Where a role may be sent back to after logging in: only pages inside
// its own portal, and never another site ("//evil.com" or "https://...")
const PORTAL_PREFIXES = {
  [ROLES.superadmin]: ['/superadmin'],
  [ROLES.lawyer]: ['/lawyer'],
  [ROLES.reviewee]: ['/dashboard', '/subjects', '/achievements', '/subscription', '/settings', '/help-center', '/legal', '/assessments', '/resources'],
};

const storedRole = () => {
  try {
    return JSON.parse(localStorage.getItem('user'))?.pid || null;
  } catch {
    return null;
  }
};

export function safeReturnPath(next, permissionId) {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return null;
  const path = next.split(/[?#]/)[0];
  return (PORTAL_PREFIXES[permissionId] || []).some((prefix) => path === prefix || path.startsWith(`${prefix}/`)) ? next : null;
}

// Portal pages: without a signed-in session (e.g. opening the daily
// questions link from the email), go to login and come back here afterwards.
// With `role` ('superadmin' | 'lawyer' | 'reviewee'), someone signed in with
// another role goes to their own dashboard instead. The backend still checks
// the role on every request; this only keeps people out of the wrong portal.
export function useRequireSession(role) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let active = true;
    const pid = storedRole();
    if (role && pid && pid !== ROLES[role]) {
      navigate(ROLE_HOME[pid] || '/login', { replace: true });
      return undefined;
    }
    getSession()
      .catch(() => readSession()) // offline: keep the stored session
      .then((session) => {
        if (active && (!session || !pid)) {
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
