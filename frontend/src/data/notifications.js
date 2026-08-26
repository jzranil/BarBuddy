// ---------------------------------------------------------------------------
// DUMMY notifications — for layout-checking only, same pattern as the exam
// flow's dummy exams.
// BACKEND TODO: replace each list with GET /api/notifications, filtered
// server-side by the signed-in user's role. Keep the same field shape:
// { id, icon, title, description, time, unread }
// ---------------------------------------------------------------------------

export const REVIEWEE_NOTIFICATIONS = [
  { id: 'n1', icon: 'check_circle', title: 'Your submission was verified', description: 'A lawyer reviewed your Remedial Law essay and published feedback.', time: '2 hours ago', unread: true },
  { id: 'n2', icon: 'local_fire_department', title: "You're on a 3-day streak!", description: 'Keep going — daily practice boosts retention.', time: '1 day ago', unread: true },
  { id: 'n3', icon: 'campaign', title: 'Syllabus updated', description: 'Civil Law syllabus was updated to version 2024.2.0.', time: '3 days ago', unread: false },
];

export const LAWYER_NOTIFICATIONS = [
  { id: 'n1', icon: 'fact_check', title: 'New submission awaiting verification', description: 'Jose Rizal submitted a Taxation Law answer flagged for low AI confidence.', time: '10 mins ago', unread: true },
  { id: 'n2', icon: 'schedule', title: 'Verification queue growing', description: '42 submissions are now pending review.', time: '3 hours ago', unread: true },
  { id: 'n3', icon: 'menu_book', title: 'Syllabus draft ready for review', description: 'Special Penal Laws draft was submitted by a colleague.', time: '1 day ago', unread: false },
];

export const ADMIN_NOTIFICATIONS = [
  { id: 'n1', icon: 'error', title: 'Failed payment retry exhausted', description: 'Subscription ID 1042 could not be charged after 3 attempts.', time: '5 hours ago', unread: true },
  { id: 'n2', icon: 'warning', title: 'Verification override attempt', description: 'lawyer_cruz attempted to bypass a legal-compliance check.', time: '1 hour ago', unread: true },
  { id: 'n3', icon: 'check_circle', title: 'Daily backup completed', description: 'Standard incremental database backup finished successfully.', time: '15 mins ago', unread: false },
];
