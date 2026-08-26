// ---------------------------------------------------------------------------
// DUMMY / DEMO DATA ONLY.
// Everything in this file exists so the exam-taking flow (intro -> take ->
// results) can be clicked through and checked visually before the backend
// exists. None of this is real — BACKEND TODO markers show what each part
// should be replaced with.
// ---------------------------------------------------------------------------

// One completed exam + one not-started exam per subject, so
// SubjectDetailPage always has something to render and both button states
// (View vs Start Exam) are visible.
//
// BACKEND TODO: replace with GET /api/subjects/{slug}/exams — keep the same
// field names (id, title, type, status, durationMinutes, totalQuestions,
// score, completedLabel) so the SubjectDetailPage list doesn't need to change.
export function getDummyExamsForSubject(subjectSlug, subjectName) {
  return [
    {
      id: `${subjectSlug}-exam-1`,
      title: `${subjectName} Exam 1`,
      type: 'Mock Exam',
      mockNumber: 14,
      status: 'completed',
      durationMinutes: 120,
      totalQuestions: 10,
      score: 82,
      completedLabel: 'Completed 2 hours ago',
    },
    {
      id: `${subjectSlug}-exam-2`,
      title: `${subjectName} Practice Set 1`,
      type: 'Practice Exam',
      status: 'not_started',
      durationMinutes: 120,
      totalQuestions: 10,
    },
  ];
}

export function getDummyExamById(subjectSlug, subjectName, examId) {
  return getDummyExamsForSubject(subjectSlug, subjectName).find((e) => e.id === examId) || null;
}

// ---------------------------------------------------------------------------
// QUESTION BANK for the exam-taking page. Only question #3 has full demo
// content (matches the mockup) — the rest are stubs so the question list UI
// still has 10 rows to navigate between.
//
// BACKEND TODO: replace with GET /api/exams/{examId}/questions
// ---------------------------------------------------------------------------
export const DEMO_QUESTION_BANK = [
  { title: 'Validity of Marriage', initialStatus: 'completed' },
  { title: 'Psychological Incapacity', initialStatus: 'completed' },
  {
    title: 'Property Relations Between Spouses',
    initialStatus: 'current',
    legalProblem: [
      "Juan and Maria were married in 2010 without any pre-nuptial agreement. In 2015, Juan inherited a 500-square meter prime lot in Makati from his late father. Juan subsequently decided to build a three-story commercial building on the lot using a loan of PHP 10 Million from a local bank, which was secured by a mortgage on the same property.",
      "The loan amortizations were paid using the rentals collected from the building's tenants. In 2022, the couple decided to file for legal separation due to irreconcilable differences. During the liquidation of their properties, Maria claimed that the Makati lot and the commercial building are part of their Absolute Community of Property (ACP) because the improvements were made during the marriage and the loan was paid using fruits of the property.",
    ],
    prompt:
      "Decide with reasons whether Maria's claim is legally tenable under the Family Code of the Philippines. Discuss the nature of the property and the improvements made.",
    note:
      'NOTE: Focus your answer on the distinction between separate property and community property as defined under Articles 91 to 93 of the Family Code.',
  },
  { title: 'Legitimacy of Children', initialStatus: 'flagged' },
  { title: 'Support & Custody', initialStatus: 'unanswered' },
  { title: 'Succession & Wills', initialStatus: 'unanswered' },
  { title: 'Legal Separation', initialStatus: 'unanswered' },
  { title: 'Adoption Laws', initialStatus: 'unanswered' },
  { title: 'Easements & Nuisance', initialStatus: 'unanswered' },
  { title: 'Prescription & Ownership', initialStatus: 'unanswered' },
];

// ---------------------------------------------------------------------------
// FULL DEMO RESULT for the completed exam (`${slug}-exam-1`), used on the
// results/AI-feedback page. Same sample content regardless of which subject
// you clicked through from — this is only here so the layout can be
// reviewed end-to-end.
//
// BACKEND TODO: replace with GET /api/exams/{examId}/results, which should
// come from the telemetry-ai-parser Lambda (AI critique) + the lawyer
// verification workflow (lawyer feedback).
// ---------------------------------------------------------------------------
export const DEMO_RESULT = {
  score: 82,
  maxScore: 100,
  readinessLabel: 'EXAM READY',
  percentile: 89,
  lawyerVerified: true,
  question: {
    title: 'The Motion for Reconsideration Requirement in Certiorari',
    body: "XYZ Corporation filed a special civil action for Certiorari under Rule 65 against the decision of the Regional Trial Court. The respondent judge, however, moved to dismiss the petition on the ground that the petitioner failed to file a Motion for Reconsideration prior to filing the petition for Certiorari. XYZ Corp. argues that a Motion for Reconsideration is not necessary when the question involved is purely legal. Is XYZ Corporation's contention correct? Explain briefly.",
  },
  originalAnswer: {
    wordCount: 245,
    text: "Yes, XYZ Corporation is correct. Generally, a motion for reconsideration is a condition sine qua non for the filing of a petition for certiorari. However, this rule is not absolute and admits of several exceptions. One of these exceptions is when the question involved is purely one of law. In this case, since the issue raised by XYZ Corp is a legal one, the prior filing of an MR is no longer necessary to give the court the opportunity to correct its errors. Thus, the petition should not be dismissed.",
  },
  modelAnswer:
    "Yes, XYZ Corporation is correct. Generally, a motion for reconsideration is a condition sine qua non for the filing of a petition for certiorari. However, this rule is not absolute and admits of several exceptions. One of these exceptions is when the question involved is purely one of law. In this case, since the issue raised by XYZ Corp is a legal one, the prior filing of an MR is no longer necessary to give the court the opportunity to correct its errors. Thus, the petition should not be dismissed.",
  aiCritique:
    "Yes, XYZ Corporation is correct. Generally, a motion for reconsideration is a condition sine qua non for the filing of a petition for certiorari. However, this rule is not absolute and admits of several exceptions. One of these exceptions is when the question involved is purely one of law. In this case, since the issue raised by XYZ Corp is a legal one, the prior filing of an MR is no longer necessary to give the court the opportunity to correct its errors. Thus, the petition should not be dismissed.",
  lawyerFeedback: {
    name: 'Atty. Maria Santos, LL.M.',
    role: 'Senior Partner, Santos & Associates',
    verifiedDate: 'Verified on Oct 24, 2024',
    disposition:
      "The AI correctly identified the lack of nuance in the application of the 'Doctrine of Exhaustion of Administrative Remedies'. While the candidate correctly cited the general rule, the answer missed the specific exception related to 'purely legal questions' which was pivotal to this problem. Overall, the logic is sound, but the candidate must work on identifying exceptions to general principles to reach the 'Model' level of readiness.",
  },
};
