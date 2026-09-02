// ---------------------------------------------------------------------------
// SUPER ADMIN SETTINGS DATA
//
// Same pattern as src/data/settings.js (reviewee), adapted for the
// Super Admin / Owner role: registration fields become administrator info,
// notification options are platform/operations-related, and there are two
// admin-only sections — System Preferences and Subscription & Billing —
// with no reviewee or lawyer equivalent.
//
// BACKEND TODO markers throughout show exactly what each piece should be
// replaced with once Cognito + Supabase are wired up.
// ---------------------------------------------------------------------------

import { getZeroedAdminProfile } from './superadmin';

// GET /api/admin/registration — administrator account details.
export function getZeroedAdminAccountDetails() {
  const { name, email } = getZeroedAdminProfile();
  const [firstName = '', ...rest] = name.split(' ');
  return {
    firstName,
    lastName: rest.join(' '),
    email,
    contactNumber: '',
    accountStatus: 'Active', // read-only — this is the currently signed-in admin's own account
    dateCreated: '—', // BACKEND TODO: pull from Cognito user's created_at
  };
}

export function getDefaultAdminNotificationPreferences() {
  return {
    newUserRegistration: true,
    newLawyerRegistration: true,
    verificationBacklog: true,
    subscriptionNotifications: true,
    systemErrors: true,
    securityAlerts: true,
    systemAnnouncements: true,
  };
}

export const ADMIN_NOTIFICATION_OPTIONS = [
  { key: 'newUserRegistration', label: 'New User Registration', description: 'Get notified whenever a new reviewee signs up.' },
  { key: 'newLawyerRegistration', label: 'New Lawyer Registration', description: 'Get notified whenever a new lawyer account is created.' },
  { key: 'verificationBacklog', label: 'Verification Backlog', description: 'Alerts when the platform-wide answer-verification queue backs up.' },
  { key: 'subscriptionNotifications', label: 'Subscription Notifications', description: 'Plan changes, failed payments, and renewal activity across the platform.' },
  { key: 'systemErrors', label: 'System Errors', description: 'Be notified when the platform reports elevated error rates or outages.' },
  { key: 'securityAlerts', label: 'Security Alerts', description: 'Suspicious sign-ins or unusual activity on any admin account.' },
  { key: 'systemAnnouncements', label: 'System Announcements', description: 'Important BarBuddy platform and policy updates.' },
];

// System Preferences — platform-wide configuration. BACKEND TODO:
// GET/PUT /api/admin/system-preferences
export function getDefaultSystemPreferences() {
  return {
    platformName: 'BarBuddy',
    systemEmail: 'no-reply@barbuddy.ai',
    timeZone: 'Asia/Manila (UTC+8)',
    maintenanceMode: false,
  };
}

export const TIME_ZONE_OPTIONS = ['Asia/Manila (UTC+8)', 'UTC', 'America/Los_Angeles (UTC-8)', 'America/New_York (UTC-5)'];

// FAQ content — admin/operations-specific.
export const ADMIN_FAQ_CATEGORIES = [
  {
    category: 'Account',
    questions: [
      { q: 'How do I update my profile information?', a: 'Go to Settings > Account & Profile, update your personal details, then select Save Changes.' },
      { q: 'How do I change my password?', a: 'Go to Settings > Privacy & Security > Change Password, enter your current password and a new one, then confirm the update.' },
    ],
  },
  {
    category: 'Platform Management',
    questions: [
      { q: 'How do I manage user accounts?', a: 'Visit User Control from the sidebar to view, suspend, or update any reviewee, lawyer, or admin account.' },
      { q: 'How do I review system activity?', a: 'System Logs in the sidebar lists platform-wide events, including admin actions and automated jobs.' },
      { q: 'Where do I manage subscriptions and payments?', a: 'Visit Payment Management from the sidebar for transaction history and billing configuration.' },
    ],
  },
  {
    category: 'Technical',
    questions: [
      { q: 'What should I do if I encounter an error?', a: 'Check System Logs for related events first. If the issue persists, use Report a Problem in Settings > Help & Support.' },
      { q: 'How do I report a problem?', a: 'Go to Settings > Help & Support > Report a Problem, choose a category, describe the issue, and submit it to the BarBuddy team.' },
    ],
  },
];

export const ADMIN_SUPPORT_CATEGORIES = ['Account', 'Platform Management', 'Billing', 'Technical Issue', 'Other'];
export const ADMIN_REPORT_CATEGORIES = ['Technical Issue', 'Data Discrepancy', 'Billing Issue', 'Account Issue', 'Other'];
