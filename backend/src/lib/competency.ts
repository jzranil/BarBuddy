
import { supabaseAdmin } from './supabase';
import { loadSubjects, normalizeSubjectName, type Subject } from './subjects';

// ---------------------------------------------------------------------------
// Competency computation — capstone paper, Chapter 1 ("Legal competency"):
//   1. Each verified essay's five-point score → percentage (score / 5 × 100).
//   2. Subject competency = mean of the verified essay percentages in that subject.
//   3. Overall legal competency = weighted mean using the Bar subject weights
//      (Table 1.3), over the subject groups that already have verified essays.
//
// Bar Readiness Score — rule-based weighted scoring (paper, Figure 3.8). The
// formula figure itself is not in the document, so BarBuddy combines:
//   75% overall legal competency
//   15% Bar coverage (share of the subject weight that has verified essays)
//   10% consistency (active study days in the last 14 days)
// ---------------------------------------------------------------------------

export const SUBJECT_SLUGS: Record<string, string> = {
  'political law': 'political-law',
  'labor law': 'labor-law',
  'civil law': 'civil-law',
  'criminal law': 'criminal-law',
  'commercial law': 'commercial-law',
  'taxation law': 'tax-law',
  'remedial law': 'remedial-law',
  ethics: 'legal-ethics',
};

export function slugForSubject(name: string) {
  return SUBJECT_SLUGS[normalizeSubjectName(name)] ?? normalizeSubjectName(name).replace(/\s+/g, '-');
}

// Table 1.3 — Philippine Bar Examination Subject Weight Distribution
export const WEIGHT_GROUPS = [
  { key: 'remedial', label: 'Remedial Law, Legal Ethics and Legal Forms', weight: 25, slugs: ['remedial-law', 'legal-ethics'] },
  { key: 'commercial', label: 'Commercial and Taxation Laws', weight: 20, slugs: ['commercial-law', 'tax-law'] },
  { key: 'civil', label: 'Civil Law', weight: 20, slugs: ['civil-law'] },
  { key: 'political', label: 'Political and Public International Law', weight: 15, slugs: ['political-law'] },
  { key: 'labor', label: 'Labor Law and Social Legislation', weight: 10, slugs: ['labor-law'] },
  { key: 'criminal', label: 'Criminal Law', weight: 10, slugs: ['criminal-law'] },
];

export const MASTERED_AT = 85;
export const PASSING_AT = 75;

export function subjectStatus(score: number | null) {
  if (score === null) return 'Not Started';
  if (score >= MASTERED_AT) return 'Mastered';
  if (score >= 60) return 'Reviewing';
  return 'Weak';
}

export function readinessLabel(score: number | null) {
  if (score === null) return 'NOT YET RATED';
  if (score >= PASSING_AT) return 'EXAM READY';
  if (score >= 60) return 'ON TRACK';
  if (score >= 40) return 'DEVELOPING';
  return 'NEEDS FOCUS';
}

const LEVEL_TITLES = [
  [10, 'Bar Ready Counsel'],
  [8, 'Advocate in Training'],
  [5, 'Bar Aspirant'],
  [3, 'Diligent Reviewee'],
  [1, 'New Candidate'],
] as const;

export const XP_PER_LEVEL = 1000;

export function levelFor(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const title = LEVEL_TITLES.find(([min]) => level >= min)?.[1] ?? 'New Candidate';
  return { level, title, xpCurrent: xp, xpTarget: level * XP_PER_LEVEL };
}

export function manilaDate(date: Date | string = new Date()) {
  return new Date(date).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}

const mean = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);
const round = (value: number | null) => (value === null ? null : Math.round(value * 10) / 10);

export type SubmissionRecord = {
  id: string;
  questionId: string;
  subjectId: string | null;
  assessmentId: string | null;
  submittedAt: string | null;
  wordCount: number;
  feedback: {
    status: 'pending' | 'verified' | 'flagged';
    score: number | null;
    alac: { answer: number | null; legalBasis: number | null; application: number | null; conclusion: number | null };
    structure: { answer?: boolean; legalBasis?: boolean; application?: boolean; conclusion?: boolean } | null;
  } | null;
};

export type AssessmentRecord = {
  id: string;
  type: 'daily' | 'mock' | 'practice';
  status: 'ready' | 'in_progress' | 'submitted';
  subjectId: string | null;
  startedAt: string;
  submittedAt: string | null;
  autoSubmitted: boolean;
  feedbackViewedAt: string | null;
};

// Longest run of consecutive calendar days in a list of YYYY-MM-DD dates
function longestRun(dates: string[]) {
  const sorted = [...new Set(dates)].sort();
  let best = 0;
  let run = 0;
  for (let i = 0; i < sorted.length; i++) {
    run = i > 0 && Date.parse(sorted[i]) - Date.parse(sorted[i - 1]) === 86400000 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

export const COMEBACK_AFTER_DAYS = 7;

export type AnalyticsRecord = { xp: number; streak: number; longestStreak: number; lastActive: string | null };

// Current streak only counts if the reviewee was active today or yesterday
export function currentStreak(analytics: AnalyticsRecord) {
  if (!analytics.lastActive) return 0;
  const today = manilaDate();
  const yesterday = manilaDate(new Date(Date.now() - 86400000));
  return analytics.lastActive === today || analytics.lastActive === yesterday ? analytics.streak : 0;
}

export function summarize(
  subjects: Subject[],
  submissions: SubmissionRecord[],
  assessments: AssessmentRecord[],
  analytics: AnalyticsRecord
) {
  const submitted = submissions.filter((s) => s.submittedAt);
  const answered = submitted.filter((s) => s.wordCount > 0);
  // Graded = every essay the AI has scored (blank answers are scored 0.0)
  const verified = submitted.filter((s) => s.feedback && s.feedback.score !== null);
  const percentOf = (s: SubmissionRecord) => ((s.feedback?.score ?? 0) / 5) * 100;

  // Per-subject competency
  const subjectStats: Record<string, ReturnType<typeof subjectSummary>> = {};

  function subjectSummary(subject: Subject) {
    const inSubject = submitted.filter((s) => s.subjectId === subject.question_subject_id);
    const verifiedInSubject = verified
      .filter((s) => s.subjectId === subject.question_subject_id)
      .sort((a, b) => String(a.submittedAt).localeCompare(String(b.submittedAt)));
    const percents = verifiedInSubject.map(percentOf);
    const score = round(mean(percents));

    let trendDirection: 'up' | 'down' | null = null;
    let trendLabel = verifiedInSubject.length ? 'Steady' : 'No verified essays yet';
    if (percents.length >= 2) {
      const recent = mean(percents.slice(-3))!;
      const earlier = mean(percents.slice(0, Math.max(1, percents.length - 3)))!;
      const change = Math.round(recent - earlier);
      if (change > 0) { trendDirection = 'up'; trendLabel = `+${change}% recently`; }
      else if (change < 0) { trendDirection = 'down'; trendLabel = `${change}% recently`; }
    }

    const structures = inSubject.map((s) => s.feedback?.structure).filter(Boolean) as NonNullable<SubmissionRecord['feedback']>['structure'][];
    const structureRate = mean(structures.map((st) => [st!.answer, st!.legalBasis, st!.application, st!.conclusion].filter(Boolean).length / 4));
    const alacProficiency = structureRate === null ? '—' : structureRate >= 0.75 ? 'High' : structureRate >= 0.5 ? 'Medium' : 'Low';

    const assessmentIds = new Set(inSubject.map((s) => s.assessmentId).filter(Boolean));

    return {
      subjectId: subject.question_subject_id,
      name: subject.question_subject_desc,
      score: score ?? 0,
      hasScore: score !== null,
      status: subjectStatus(score),
      trendDirection,
      trendLabel,
      examsAttempted: assessmentIds.size,
      essaysSubmitted: inSubject.length,
      essaysVerified: verifiedInSubject.length,
      averageScore: score ?? 0,
      aiProficiency: alacProficiency, // ALAC structure proficiency (field name kept for the existing UI)
      currentReadiness: score ?? 0,
      readinessTrendLabel: score === null ? 'Not yet rated' : readinessLabel(score),
    };
  }

  for (const subject of subjects) {
    subjectStats[slugForSubject(subject.question_subject_desc)] = subjectSummary(subject);
  }

  // Weighted overall competency (Table 1.3)
  let weighted = 0;
  let coveredWeight = 0;
  const groups = WEIGHT_GROUPS.map((group) => {
    const percents = verified
      .filter((s) => group.slugs.some((slug) => subjectStats[slug]?.subjectId === s.subjectId))
      .map(percentOf);
    const competency = round(mean(percents));
    if (competency !== null) {
      weighted += competency * group.weight;
      coveredWeight += group.weight;
    }
    return { key: group.key, label: group.label, weight: group.weight, competency, essaysVerified: percents.length };
  });

  const overallCompetency = coveredWeight ? round(weighted / coveredWeight) : null;

  // Consistency: active days in the last 14 days
  const activeDays = (days: number) => {
    const since = Date.now() - days * 86400000;
    return new Set(submitted.filter((s) => new Date(s.submittedAt!).getTime() >= since).map((s) => manilaDate(s.submittedAt!))).size;
  };
  const active14 = activeDays(14);
  const active7 = activeDays(7);
  const consistencyScore = Math.round((active14 / 14) * 100);
  const consistency = active7 >= 4 ? 'High' : active7 >= 2 ? 'Medium' : active7 === 1 ? 'Low' : '—';

  const readinessScore =
    overallCompetency === null ? null : Math.round(0.75 * overallCompetency + 0.15 * coveredWeight + 0.1 * consistencyScore);

  // Accuracy: share of verified essays with a correct legal conclusion (score 3+ per Table 1.2)
  const accuracy = verified.length ? Math.round((verified.filter((s) => (s.feedback?.score ?? 0) >= 3).length / verified.length) * 100) : 0;

  // ALAC component strengths from the lawyer's ratings (0 missing, 1 partial, 2 complete)
  const alacKeys = ['answer', 'legalBasis', 'application', 'conclusion'] as const;
  const alac = Object.fromEntries(
    alacKeys.map((key) => {
      const ratings = verified.map((s) => s.feedback?.alac[key]).filter((v): v is number => v !== null && v !== undefined);
      return [key, ratings.length ? Math.round((mean(ratings)! / 2) * 100) : null];
    })
  ) as Record<(typeof alacKeys)[number], number | null>;

  const streak = currentStreak(analytics);
  const level = levelFor(analytics.xp);
  const submittedAssessments = assessments.filter((a) => a.status === 'submitted');

  // Badge metrics ("BarBuddy Achievements and Badges")
  const byAssessment = new Map<string, SubmissionRecord[]>();
  for (const sub of submitted) {
    if (!sub.assessmentId) continue;
    if (!byAssessment.has(sub.assessmentId)) byAssessment.set(sub.assessmentId, []);
    byAssessment.get(sub.assessmentId)!.push(sub);
  }
  const fullyAnswered = (a: AssessmentRecord) => {
    const list = byAssessment.get(a.id) || [];
    return list.length > 0 && list.every((x) => x.wordCount > 0);
  };
  const lawyerAlac = (x: SubmissionRecord) => (x.feedback && x.feedback.score !== null ? Object.values(x.feedback.alac) : []);
  const alacStrong = (x: SubmissionRecord) => {
    const ratings = lawyerAlac(x);
    return ratings.length === 4 && ratings.every((v) => v === 2);
  };
  const alacPresent = (x: SubmissionRecord) => {
    const st = x.feedback?.structure;
    return alacStrong(x) || Boolean(x.wordCount > 0 && st && st.answer && st.legalBasis && st.application && st.conclusion);
  };

  let scoreImprovements = 0;
  let competencyGain = 0;
  for (const subject of subjects) {
    const percents = verified
      .filter((x) => x.subjectId === subject.question_subject_id)
      .sort((a, b) => String(a.submittedAt).localeCompare(String(b.submittedAt)))
      .map(percentOf);
    for (let i = 1; i < percents.length; i++) if (percents[i] > percents[i - 1]) scoreImprovements += 1;
    if (percents.length >= 2) competencyGain = Math.max(competencyGain, Math.round(mean(percents)! - percents[0]));
  }

  const submittedByTime = [...submittedAssessments].sort((a, b) => String(a.submittedAt).localeCompare(String(b.submittedAt)));
  let comebacks = 0;
  for (let i = 1; i < submittedByTime.length; i++) {
    const gap = Date.parse(submittedByTime[i].submittedAt!) - Date.parse(submittedByTime[i - 1].submittedAt!);
    if (gap >= COMEBACK_AFTER_DAYS * 86400000) comebacks += 1;
  }
  const firstFeedbackView = assessments.map((a) => a.feedbackViewedAt).filter(Boolean).sort()[0] ?? null;
  const fullDailies = submittedAssessments.filter((a) => a.type === 'daily' && fullyAnswered(a));

  const metrics = {
    questionsCompleted: answered.length,
    studyStreakDays: streak,
    examsCompleted: submittedAssessments.length,
    perfectScores: verified.filter((s) => s.feedback?.score === 5).length,
    studySessionsCompleted: submittedAssessments.filter((a) => a.type === 'mock').length,
    subjectsMastered: Object.values(subjectStats).filter((s) => s.status === 'Mastered').length,
    barReadinessScore: readinessScore ?? 0,
    subjectScores: Object.fromEntries(Object.entries(subjectStats).map(([slug, s]) => [slug, s.score])),
    xpEarned: analytics.xp,
    alacComplete: answered.filter(alacPresent).length,
    alacMaster: verified.filter(alacStrong).length,
    scoreImproved: scoreImprovements,
    competencyGain,
    masteryPoints: verified.filter((x) => (x.feedback?.score ?? 0) >= 3).length,
    groupsCompetent: groups.filter((g) => g.competency !== null && g.competency >= PASSING_AT).length,
    groupScores: Object.fromEntries(groups.map((g) => [g.key, g.competency ?? 0])) as Record<string, number>,
    timedCompleted: submittedAssessments.filter((a) => !a.autoSubmitted).length,
    mockFull: submittedAssessments.filter((a) => a.type === 'mock' && fullyAnswered(a)).length,
    dailyComplete: fullDailies.length,
    dailyFullStreak: longestRun(fullDailies.map((a) => manilaDate(a.startedAt))),
    challengesCompleted: submittedAssessments.filter((a) => a.type === 'practice').length,
    feedbackReviewed: assessments.filter((a) => a.feedbackViewedAt).length,
    learnImprove: firstFeedbackView ? submittedAssessments.filter((a) => String(a.submittedAt) > firstFeedbackView).length : 0,
    comebacks,
  };

  return {
    readinessScore: readinessScore ?? 0,
    readinessRated: readinessScore !== null,
    readinessLabel: readinessLabel(readinessScore),
    overallCompetency: overallCompetency ?? 0,
    coverage: coveredWeight,
    accuracy,
    consistency,
    consistencyScore,
    streakDays: streak,
    longestStreak: Math.max(analytics.longestStreak, streak),
    ...level,
    groups,
    subjects: subjectStats,
    alac,
    counts: {
      essaysSubmitted: submitted.length,
      essaysAnswered: answered.length,
      essaysVerified: verified.length,
      essaysPending: submitted.filter((s) => s.feedback?.status === 'pending').length,
      assessmentsCompleted: submittedAssessments.length,
      mockCompleted: metrics.studySessionsCompleted,
    },
    metrics,
  };
}

export type RevieweeSummary = ReturnType<typeof summarize>;

// ---------------------------------------------------------------------------
// Loaders
// ---------------------------------------------------------------------------

const SUBMISSION_SELECT = `
  user_submission_id, user_id, question_id, assessment_id, submitted_at, word_count, submission_status,
  bb_questions_tbl ( question_subject_id ),
  bb_feedbacks_tbl ( feedback_status, feedback_score, alac_answer, alac_legal_basis, alac_application, alac_conclusion, structure_check )
`;

function toSubmissionRecord(row: any): SubmissionRecord & { userId: string } {
  const fb = row.bb_feedbacks_tbl;
  return {
    id: row.user_submission_id,
    userId: row.user_id,
    questionId: row.question_id,
    subjectId: row.bb_questions_tbl?.question_subject_id ?? null,
    assessmentId: row.assessment_id,
    submittedAt: row.submission_status === 'submitted' ? row.submitted_at : null,
    wordCount: row.word_count ?? 0,
    feedback: fb
      ? {
          status: fb.feedback_status,
          score: fb.feedback_score === null ? null : Number(fb.feedback_score),
          alac: {
            answer: fb.alac_answer,
            legalBasis: fb.alac_legal_basis,
            application: fb.alac_application,
            conclusion: fb.alac_conclusion,
          },
          structure: fb.structure_check,
        }
      : null,
  };
}

async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>) {
  const rows: T[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

export async function getAnalytics(userId: string): Promise<AnalyticsRecord & { analyticsId: string | null }> {
  const { data: user } = await supabaseAdmin
    .from('bb_users_tbl')
    .select('user_analytics_id, bb_user_analytics_tbl ( user_analytics_id, user_analytics_xp, user_analytics_days_streak, user_analytics_longest_streak, user_analytics_last_active )')
    .eq('user_id', userId)
    .maybeSingle();

  const a: any = user?.bb_user_analytics_tbl;
  return {
    analyticsId: a?.user_analytics_id ?? null,
    xp: a?.user_analytics_xp ?? 0,
    streak: a?.user_analytics_days_streak ?? 0,
    longestStreak: a?.user_analytics_longest_streak ?? 0,
    lastActive: a?.user_analytics_last_active ?? null,
  };
}

export async function loadRevieweeSummary(userId: string) {
  const [{ subjects }, submissionRows, assessmentRows, analytics] = await Promise.all([
    loadSubjects(),
    fetchAll((from, to) =>
      supabaseAdmin
        .from('bb_user_submissions_tbl')
        .select(SUBMISSION_SELECT)
        .eq('user_id', userId)
        .eq('submission_status', 'submitted')
        .order('user_submission_id')
        .range(from, to)
    ),
    fetchAll((from, to) =>
      supabaseAdmin
        .from('bb_assessments_tbl')
        .select('assessment_id, assessment_type, assessment_status, question_subject_id, started_at, submitted_at, auto_submitted, feedback_viewed_at')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .order('assessment_id')
        .range(from, to)
    ),
    getAnalytics(userId),
  ]);

  const assessments: AssessmentRecord[] = assessmentRows.map((a: any) => ({
    id: a.assessment_id,
    type: a.assessment_type,
    status: a.assessment_status,
    subjectId: a.question_subject_id,
    startedAt: a.started_at,
    submittedAt: a.submitted_at,
    autoSubmitted: Boolean(a.auto_submitted),
    feedbackViewedAt: a.feedback_viewed_at ?? null,
  }));

  return {
    subjects,
    assessments,
    analytics,
    summary: summarize(subjects, submissionRows.map(toSubmissionRecord), assessments, analytics),
  };
}

// Summaries for many reviewees at once (lawyer and admin dashboards)
export async function loadAllRevieweeSummaries(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, RevieweeSummary>();

  const [{ subjects }, submissionRows, assessmentRows, analyticsRows] = await Promise.all([
    loadSubjects(),
    fetchAll((from, to) =>
      supabaseAdmin
        .from('bb_user_submissions_tbl')
        .select(SUBMISSION_SELECT)
        .in('user_id', userIds)
        .eq('submission_status', 'submitted')
        .order('user_submission_id')
        .range(from, to)
    ),
    fetchAll((from, to) =>
      supabaseAdmin
        .from('bb_assessments_tbl')
        .select('assessment_id, user_id, assessment_type, assessment_status, question_subject_id, started_at, submitted_at, auto_submitted, feedback_viewed_at')
        .in('user_id', userIds)
        .eq('is_archived', false)
        .order('assessment_id')
        .range(from, to)
    ),
    fetchAll((from, to) =>
      supabaseAdmin
        .from('bb_users_tbl')
        .select('user_id, bb_user_analytics_tbl ( user_analytics_xp, user_analytics_days_streak, user_analytics_longest_streak, user_analytics_last_active )')
        .in('user_id', userIds)
        .order('user_id')
        .range(from, to)
    ),
  ]);

  const submissionsByUser = new Map<string, SubmissionRecord[]>();
  for (const row of submissionRows) {
    const record = toSubmissionRecord(row);
    if (!submissionsByUser.has(record.userId)) submissionsByUser.set(record.userId, []);
    submissionsByUser.get(record.userId)!.push(record);
  }

  const assessmentsByUser = new Map<string, AssessmentRecord[]>();
  for (const a of assessmentRows as any[]) {
    if (!assessmentsByUser.has(a.user_id)) assessmentsByUser.set(a.user_id, []);
    assessmentsByUser.get(a.user_id)!.push({
      id: a.assessment_id,
      type: a.assessment_type,
      status: a.assessment_status,
      subjectId: a.question_subject_id,
      startedAt: a.started_at,
      submittedAt: a.submitted_at,
      autoSubmitted: Boolean(a.auto_submitted),
      feedbackViewedAt: a.feedback_viewed_at ?? null,
    });
  }

  const result = new Map<string, RevieweeSummary>();
  for (const row of analyticsRows as any[]) {
    const a = row.bb_user_analytics_tbl;
    result.set(
      row.user_id,
      summarize(subjects, submissionsByUser.get(row.user_id) || [], assessmentsByUser.get(row.user_id) || [], {
        xp: a?.user_analytics_xp ?? 0,
        streak: a?.user_analytics_days_streak ?? 0,
        longestStreak: a?.user_analytics_longest_streak ?? 0,
        lastActive: a?.user_analytics_last_active ?? null,
      })
    );
  }

  return result;
}

export const REVIEWEE_PERMISSION_ID = 'a11498ab-0a57-4ed2-9315-29167e6a2f63';
export const LAWYER_PERMISSION_ID = '6642db37-fe3f-4c6f-8b82-427b381a9c69';
export const SUPER_ADMIN_PERMISSION_ID = '5bac543c-5f03-436a-85a8-2c8fc3c6b0e3';
