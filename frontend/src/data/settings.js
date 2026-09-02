// ---------------------------------------------------------------------------
// SETTINGS PAGE DATA — Reviewee portal
//
// Same pattern as the rest of the app (see src/data/subjects.js,
// src/data/lawyer.js): registration fields that come from Cognito sign-up
// are zeroed/pulled from the shared user summary, while things like active
// sessions and login history ship with a small set of DUMMY rows so the
// layout can be reviewed before the backend exists.
//
// BACKEND TODO markers throughout show exactly what each piece should be
// replaced with once Cognito + Supabase are wired up.
// ---------------------------------------------------------------------------

import { getZeroedUserSummary } from './subjects';

export const BAR_APPLICATION_TYPES = ['New Applicant', 'Retaker', 'Refresher'];

// GET /api/reviewee/registration — the reviewee's original sign-up details.
// BACKEND TODO: replace with a real fetch; keep the same field names so the
// Account & Profile form doesn't need to change.
export function getZeroedRegistrationDetails() {
  const { displayName, email } = getZeroedUserSummary();
  const [firstName = '', ...rest] = displayName.split(' ');
  return {
    firstName,
    lastName: rest.join(' '),
    email,
    contactNumber: '',
    lawSchool: '',
    barApplication: BAR_APPLICATION_TYPES[0],
  };
}

// PUT /api/reviewee/notification-preferences — default state until a
// preferences table exists.
export function getDefaultNotificationPreferences() {
  return {
    studyReminders: true,
    dailyQuestionReminders: true,
    studyStreakReminders: true,
    achievementNotifications: true,
    subscriptionNotifications: true,
    systemAnnouncements: true,
  };
}

export const NOTIFICATION_OPTIONS = [
  { key: 'studyReminders', label: 'Study Reminders', description: 'Receive reminders to continue your review schedule.' },
  { key: 'dailyQuestionReminders', label: 'Daily Question Reminders', description: 'Get reminded when your daily questions are waiting.' },
  { key: 'studyStreakReminders', label: 'Study Streak Reminders', description: 'Receive reminders to maintain your study streak.' },
  { key: 'achievementNotifications', label: 'Achievement Notifications', description: 'Get notified when you unlock an achievement or milestone.' },
  { key: 'subscriptionNotifications', label: 'Subscription Notifications', description: 'Confirmations, upcoming renewals, and status changes for your plan.' },
  { key: 'systemAnnouncements', label: 'System Announcements', description: 'Important BarBuddy announcements and platform updates.' },
];

// Appearance — FRONTEND TODO: connect Theme to a real global theme context
// and Font Size to a real typography scale once one exists. Local UI state
// only for now (same treatment as the Night Mode toggle in ProfileMenu.jsx).
export const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: 'light_mode' },
  { value: 'dark', label: 'Dark', icon: 'dark_mode' },
  { value: 'system', label: 'System', icon: 'brightness_auto' },
];

export const FONT_SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

// DUMMY sessions — for layout-checking only, same pattern as the exam flow's
// dummy exams (see src/data/exams.js). BACKEND TODO: GET /api/reviewee/sessions
export const ACTIVE_SESSIONS = [
  { id: 's1', device: 'Windows PC', browser: 'Chrome', os: 'Windows', lastActive: 'Just now', current: true },
  { id: 's2', device: 'Mobile Device', browser: 'Chrome', os: 'Android', lastActive: '2 hours ago', current: false },
];

// DUMMY login history — BACKEND TODO: GET /api/reviewee/login-history
export const LOGIN_HISTORY = [
  { id: 'l1', dateTime: 'Aug 31, 2026 · 10:24 AM', device: 'Windows / Chrome', status: 'Successful' },
  { id: 'l2', dateTime: 'Aug 30, 2026 · 9:15 PM', device: 'Android / Chrome', status: 'Successful' },
  { id: 'l3', dateTime: 'Aug 30, 2026 · 8:48 PM', device: 'Windows / Chrome', status: 'Failed' },
];

// FAQ content — BarBuddy-specific, grouped by category.
export const FAQ_CATEGORIES = [
  {
    category: 'Account',
    questions: [
      { q: 'How do I update my profile information?', a: 'Go to Settings > Account & Profile, update your personal or registration details, then select Save Changes.' },
      { q: 'How do I change my password?', a: 'Go to Settings > Privacy & Security > Change Password, enter your current password and a new one, then confirm the update.' },
    ],
  },
  {
    category: 'Review',
    questions: [
      { q: 'How do daily questions work?', a: 'Each day BarBuddy surfaces a short set of practice questions based on your weakest subjects to help build a consistent review habit.' },
      { q: 'How is my answer evaluated?', a: 'Your written answers are scored against the syllabus rubric and routed to a verified lawyer for review before feedback is finalized.' },
      { q: 'How does the competency assessment work?', a: 'Your readiness per subject is measured using a mix of accuracy, consistency, and coverage across the bar syllabus.' },
    ],
  },
  {
    category: 'Subscription',
    questions: [
      { q: 'How do I manage my subscription?', a: 'Visit the Subscription page from the sidebar to view your current plan, upgrade, or renew.' },
      { q: 'When does my subscription expire?', a: 'Your renewal date is shown on the Subscription page and in the confirmation email sent when you subscribe.' },
    ],
  },
  {
    category: 'Technical',
    questions: [
      { q: 'What should I do if I encounter an error?', a: 'Try refreshing the page first. If the issue persists, use Report a Problem in Settings > Help & Support with a short description.' },
      { q: 'How do I report a problem?', a: 'Go to Settings > Help & Support > Report a Problem, choose a category, describe the issue, and submit it to the BarBuddy team.' },
    ],
  },
];

export const SUPPORT_CATEGORIES = ['Account', 'Subscription', 'Technical Issue', 'Review Content', 'Other'];
export const REPORT_CATEGORIES = ['Technical Issue', 'Incorrect Question', 'Incorrect AI Feedback', 'Account Issue', 'Subscription Issue', 'Other'];

// Mirrors backend/package.json until a shared version source exists.
export const APP_VERSION = '1.0.0';
