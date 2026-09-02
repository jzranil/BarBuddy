// ---------------------------------------------------------------------------
// LAWYER SETTINGS DATA
//
// Same pattern as src/data/settings.js (reviewee), adapted for the Lawyer /
// Answer Verifier role: registration fields become professional info,
// notification options are verification-workflow-related, and there's an
// additional Verification Preferences section with no reviewee equivalent.
//
// BACKEND TODO markers throughout show exactly what each piece should be
// replaced with once Cognito + Supabase are wired up.
// ---------------------------------------------------------------------------

import { getZeroedLawyerDeskSummary, SUBJECT_PERFORMANCE } from './lawyer';

// GET /api/lawyer/registration — professional details, not a reviewee's
// bar-application registration.
export function getZeroedLawyerProfile() {
  const { lawyerName, lawyerEmail } = getZeroedLawyerDeskSummary();
  const [firstName = '', ...rest] = lawyerName.split(' ');
  return {
    firstName,
    lastName: rest.join(' '),
    email: lawyerEmail,
    contactNumber: '',
  };
}

// Subjects the Super Admin has assigned this lawyer to verify — read-only
// here since assignment is an admin action, not something the lawyer edits.
// BACKEND TODO: GET /api/lawyer/assigned-subjects
export const ASSIGNED_SUBJECTS = SUBJECT_PERFORMANCE.map((s) => s.label);

export function getDefaultLawyerNotificationPreferences() {
  return {
    newAnswerAssigned: true,
    verificationReminder: true,
    verificationDeadlineReminder: true,
    answerReassigned: true,
    systemAnnouncements: true,
  };
}

export const LAWYER_NOTIFICATION_OPTIONS = [
  { key: 'newAnswerAssigned', label: 'New Answer Assigned', description: 'Get notified when a new reviewee answer is routed to your queue.' },
  { key: 'verificationReminder', label: 'Verification Reminder', description: 'Reminders about answers still waiting in your verification queue.' },
  { key: 'verificationDeadlineReminder', label: 'Verification Deadline Reminder', description: 'Alerts when an assigned answer is approaching its review deadline.' },
  { key: 'answerReassigned', label: 'Answer Reassigned', description: 'Notified when an answer is moved off or onto your queue.' },
  { key: 'systemAnnouncements', label: 'System Announcements', description: 'Important BarBuddy announcements and platform updates.' },
];

// Verification Preferences — workflow settings, local UI state only until a
// preferences table exists. Anything the verification process treats as
// mandatory (AI evaluation, competency info) is shown automatically further
// down and is NOT one of these toggles — see VerificationPreferencesSection.
// BACKEND TODO: GET/PUT /api/lawyer/verification-preferences
export function getDefaultVerificationPreferences() {
  return {
    pendingAnswersFirst: true,
    autoOpenNextAnswer: false,
    confirmBeforeSubmitting: true,
    showBehavioralAnalytics: true,
  };
}

export const VERIFICATION_QUEUE_OPTIONS = [
  { key: 'pendingAnswersFirst', label: 'Pending Answers First', description: 'Sort your queue so unverified answers surface before flagged ones.' },
  { key: 'autoOpenNextAnswer', label: 'Automatically Open Next Answer', description: 'Jump straight to the next queued answer after you submit a verdict.' },
  { key: 'confirmBeforeSubmitting', label: 'Confirm Before Submitting', description: 'Show a confirmation step before a verification decision is final.' },
];

// AI Evaluation and Competency Information are required parts of the
// verification workflow, so they're always shown — only Behavioral
// Analytics (a supplementary signal) is left as a toggle.
export const ANSWER_REVIEW_DISPLAY_OPTIONS = [
  { key: 'showBehavioralAnalytics', label: 'Show Behavioral Analytics', description: 'Display the reviewee\'s supplementary behavioral/engagement signals alongside the answer.' },
];

// FAQ content — verification-workflow-specific.
export const LAWYER_FAQ_CATEGORIES = [
  {
    category: 'Account',
    questions: [
      { q: 'How do I update my profile information?', a: 'Go to Settings > Account & Profile, update your personal details, then select Save Changes.' },
      { q: 'How do I change my password?', a: 'Go to Settings > Privacy & Security > Change Password, enter your current password and a new one, then confirm the update.' },
    ],
  },
  {
    category: 'Verification',
    questions: [
      { q: 'How is an answer routed to my queue?', a: 'Answers are assigned based on your assigned subjects, set by the Super Admin, and appear in your Verification queue in submission order.' },
      { q: 'What does the AI evaluation score mean?', a: 'It\'s a preliminary score generated against the syllabus rubric — your verification is the final word on the reviewee\'s grade.' },
      { q: 'Can I change my assigned subjects?', a: 'Assigned subjects are managed by the Super Admin. Reach out through Contact Support if yours need to change.' },
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

export const LAWYER_SUPPORT_CATEGORIES = ['Account', 'Verification Workflow', 'Technical Issue', 'Curriculum Content', 'Other'];
export const LAWYER_REPORT_CATEGORIES = ['Technical Issue', 'Incorrect AI Evaluation', 'Assignment Issue', 'Account Issue', 'Other'];
