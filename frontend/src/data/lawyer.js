// ---------------------------------------------------------------------------
// LAWYER PORTAL DATA
//
// Same pattern as the reviewee portal: aggregate KPI numbers are zeroed
// (nobody's used the platform yet, so "Active Reviewees: 1,248" would be a
// lie), but the verification queue and curriculum inventory ship with a
// small set of DUMMY rows so the table/detail layouts can actually be
// clicked through and reviewed before the backend exists.
//
// BACKEND TODO markers throughout show exactly what each piece should be
// replaced with.
// ---------------------------------------------------------------------------

// GET /api/lawyer/desk-summary
export function getZeroedLawyerDeskSummary() {
  return {
    lawyerName: 'Atty. Verifier', // BACKEND TODO: pull from Cognito lawyer profile
    lawyerEmail: 'verifier@barbuddy.ai', // BACKEND TODO: pull from Cognito lawyer profile
    activeReviewees: 0,
    activeRevieweesTrendLabel: 'No data yet',
    pendingVerificationCount: 0,
    pendingCriticalCount: 0,
    avgReadiness: 0,
    avgReadinessTarget: 75.0,
    questionBankCount: 0,
    questionBankSubjectCount: 8,
  };
}

// GET /api/lawyer/cohort-performance — zeroed until real cohort submissions exist.
// `target` (Bar Pass Target) is an institutional goal, not reviewee data, so
// it's fine to keep that part static.
export const SUBJECT_PERFORMANCE = [
  { label: 'Political Law', current: 0, target: 75 },
  { label: 'Civil Law', current: 0, target: 75 },
  { label: 'Labor Law', current: 0, target: 75 },
  { label: 'Taxation', current: 0, target: 75 },
  { label: 'Remedial', current: 0, target: 75 },
  { label: 'Ethics', current: 0, target: 75 },
];

// GET /api/lawyer/competency-distribution
export const COMPETENCY_DISTRIBUTION = [
  { label: 'Analysis', value: 0 },
  { label: 'Legality', value: 0 },
  { label: 'Clarity', value: 0 },
  { label: 'Logic', value: 0 },
  { label: 'Precision', value: 0 },
];

// ---------------------------------------------------------------------------
// DUMMY verification queue — for layout-checking only.
// BACKEND TODO: replace with GET /api/lawyer/verification-queue
// ---------------------------------------------------------------------------
export const TOTAL_PENDING_VERIFICATIONS = 42; // matches the "Showing 5 of 42" footer in the mockup

export const DUMMY_VERIFICATION_QUEUE = [
  { id: 'VQ-102', reviewee: 'Juan Dela Cruz', initials: 'JD', avatarColor: '#2563eb', subject: 'Civil Law', aiScore: 78, submittedLabel: '2 hours ago', status: 'unverified' },
  { id: 'VQ-103', reviewee: 'Maria Clara', initials: 'M', avatarColor: '#b91c1c', subject: 'Political Law', aiScore: 84, submittedLabel: '5 hours ago', status: 'unverified' },
  { id: 'VQ-104', reviewee: 'Jose Rizal', initials: 'JR', avatarColor: '#92400e', subject: 'Taxation', aiScore: 62, submittedLabel: '1 day ago', status: 'flagged' },
  { id: 'VQ-105', reviewee: 'Leonor Rivera', initials: 'L', avatarColor: '#7c3aed', subject: 'Remedial Law', aiScore: 91, submittedLabel: '1 day ago', status: 'unverified' },
  { id: 'VQ-106', reviewee: 'Andres Bonifacio', initials: 'A', avatarColor: '#0f766e', subject: 'Labor Law', aiScore: 75, submittedLabel: '2 days ago', status: 'unverified' },
];

// Full case content for the detail panel — only VQ-103 has it filled in as a
// demo; every other row shows a lightweight placeholder instead of fake
// legal content.
// BACKEND TODO: replace with GET /api/lawyer/verification-queue/{id}
export const CASE_DETAILS = {
  'VQ-103': {
    submittedLabel: 'Submitted Nov 12, 10:45 AM',
    question: "Does the right to privacy extend to the public disclosure of a public official's medical records?",
    revieweeAnswer:
      "Yes, the right to privacy is absolute under the Bill of Rights. Even for public officials, their personal medical records are protected from any form of disclosure without their express consent, as established in the case of Morfe v. Mutuc. Public interest does not override the fundamental right to individual privacy...",
    aiCritique:
      "Yes, XYZ Corporation is correct. Generally, a motion for reconsideration is a condition sine qua non for the filing of a petition for certiorari. However, this rule is not absolute and admits of several exceptions. One of these exceptions is when the question involved is purely one of law. In this case, since the issue raised by XYZ Corp is a legal one, the prior filing of an MR is no longer necessary to give the court the opportunity to correct its errors. Thus, the petition should not be dismissed.",
    qualityAlert: 'Model answer is based on the 2023 Bar Syllabus. Ensure compliance with 2024 updates.',
  },
};

// ---------------------------------------------------------------------------
// DUMMY syllabus/questionnaire cards — shown on both the Lawyer Desk preview
// grid and the full Questionnaire Management page.
// BACKEND TODO: replace with GET /api/lawyer/syllabus (dashboard passes
// ?limit=4, the full page paginates through everything)
// ---------------------------------------------------------------------------
export const SUBJECT_TABS = ['All Subjects', 'Active Exams', 'Drafts', 'Question Bank'];

export const DUMMY_SYLLABUS_CARDS = [
  { id: 'q1', title: '2024 Pre-Week Remedial', subject: 'Remedial Law', status: 'Published', questionCount: 25, lastEdited: 'Oct 12, 2023' },
  { id: 'q2', title: 'Special Penal Laws', subject: 'Criminal Law', status: 'Draft', questionCount: 15, lastEdited: 'Oct 14, 2023' },
  { id: 'q3', title: 'Estate & Donor Taxation', subject: 'Taxation', status: 'Archived', questionCount: 10, lastEdited: 'Sep 30, 2023' },
  { id: 'q4', title: 'Constitutional Law I: Bill of Rights', subject: 'Political Law', status: 'Published', questionCount: 30, lastEdited: 'Oct 05, 2023' },
];

// ---------------------------------------------------------------------------
// DUMMY curriculum inventory for the Syllabus Management page.
// BACKEND TODO: replace with GET /api/lawyer/curriculum
// ---------------------------------------------------------------------------
export const DUMMY_CURRICULUM = [
  { id: 'SYL-001', subject: 'Political and International Law', status: 'Published', version: '2024.1.2', uploadDate: 'Oct 15, 2023', author: 'Atty. Maria Santos' },
  { id: 'SYL-002', subject: 'Labor Law and Social Legislation', status: 'Published', version: '2024.1.0', uploadDate: 'Oct 18, 2023', author: 'Atty. James Wilson' },
  { id: 'SYL-003', subject: 'Civil Law', status: 'Draft', version: '2024.2.0-beta', uploadDate: 'Nov 10, 2023', author: 'Atty. Ricardo Dela Cruz' },
  { id: 'SYL-004', subject: 'Taxation Law', status: 'Published', version: '2024.1.1', uploadDate: 'Oct 20, 2023', author: 'Atty. Elena Garcia' },
  { id: 'SYL-005', subject: 'Mercantile Law', status: 'Published', version: '2024.1.0', uploadDate: 'Oct 22, 2023', author: 'Atty. James Wilson' },
  { id: 'SYL-006', subject: 'Criminal Law', status: 'Archived', version: '2023.4.5', uploadDate: 'Aug 12, 2023', author: 'Atty. Maria Santos' },
];

// Derived straight from the dummy rows above so the numbers on screen always
// match what's actually listed. BACKEND TODO: once real data exists, this
// should just be whatever GET /api/lawyer/curriculum-summary returns instead
// of being computed client-side.
export function getCurriculumSummary() {
  return {
    activeSubjects: DUMMY_CURRICULUM.filter((c) => c.status === 'Published').length,
    pendingDrafts: DUMMY_CURRICULUM.filter((c) => c.status === 'Draft').length,
    updatesNeeded: 0, // BACKEND TODO: flag syllabi that reference an outdated bar-syllabus year
  };
}
