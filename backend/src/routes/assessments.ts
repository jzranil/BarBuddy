import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase';
import { CONTENT_MANAGER_ROLES, requireUser } from '../lib/auth';
import { getAssessmentConfig, getMockUnlockRule, type AssessmentType } from '../lib/settings';
import { checkStructure, structureSummary } from '../lib/structure';
import { loadRevieweeSummary, readinessLabel, slugForSubject, type RevieweeSummary } from '../lib/competency';
import { addXp, assessmentXp, awardEarnedAchievements, recordStudyActivity, XP_RULES } from '../lib/engagement';
import { EXAM_DAYS, loadSubscription, mockAllocation } from '../lib/packages';
import { createDailySet, insertDrafts, pickQuestions, todaysDailySet } from '../lib/rollout';
import { aiConfigured, runAiComparisons } from '../lib/gemini';
import { loadSubjects } from '../lib/subjects';
import { logEvent } from '../lib/logs';

export const assessmentRoutes = new Hono();

const GRACE_SECONDS = 120; // network slack after the timer reaches zero
const MAX_ANSWER_LENGTH = 50000;

const countWords = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

// Short title for the question navigator: first sentence, trimmed
export function questionTitle(text: string) {
  const first = text.replace(/\s+/g, ' ').trim().split(/(?<=[.?!])\s/)[0];
  return first.length > 70 ? `${first.slice(0, 67).trim()}...` : first;
}

// Mock Bar Examinations unlock at the configured level or learning streak
export async function mockUnlockStatus(summary: RevieweeSummary) {
  const rule = await getMockUnlockRule();
  const streak = Math.max(summary.streakDays, summary.longestStreak);
  return {
    unlocked: summary.level >= rule.level || streak >= rule.streak_days,
    rule,
    level: summary.level,
    streak,
    xp: summary.xpCurrent,
  };
}

// Gemini runs in the background so submitting is never slowed down
function startAiComparisons(assessmentId: string) {
  if (!aiConfigured()) return;
  runAiComparisons(assessmentId).catch((error) => console.error('AI comparison error:', error?.message || error));
}

// Submits an assessment exactly once. Blank answers are recorded with the
// Table 1.2 score of 0.0 ("no answer given"); everything else waits for a lawyer.
async function finalizeAssessment(assessmentId: string, userId: string, auto: boolean) {
  const now = new Date().toISOString();

  // Conditional update = only one request can finalize (prevents duplicate submissions)
  const { data: claimed } = await supabaseAdmin
    .from('bb_assessments_tbl')
    .update({ assessment_status: 'submitted', submitted_at: now, auto_submitted: auto, updated_at: now })
    .eq('assessment_id', assessmentId)
    .eq('assessment_status', 'in_progress')
    .select('assessment_id, assessment_type, assessment_title')
    .maybeSingle();

  if (!claimed) return { alreadySubmitted: true, newAchievements: [] as string[] };

  const { data: drafts } = await supabaseAdmin
    .from('bb_user_submissions_tbl')
    .select('user_submission_id, user_submission_answer')
    .eq('assessment_id', assessmentId);

  let answered = 0;
  const aiStatus = aiConfigured() ? 'pending' : 'not_configured';

  for (const draft of drafts || []) {
    const text = String(draft.user_submission_answer || '');
    const words = countWords(text);
    const blank = words === 0;
    const structure = blank ? null : checkStructure(text);
    if (!blank) answered += 1;

    const { data: feedback, error: feedbackError } = await supabaseAdmin
      .from('bb_feedbacks_tbl')
      .insert(
        blank
          ? {
              feedback_status: 'verified',
              feedback_verified: true,
              feedback_score: 0,
              feedback_comment: 'No answer given. Scored 0.0 under the five-point grading standard (Bar Bulletin No. 4, s. 2025).',
              verified_at: now,
              ai_status: 'skipped',
              is_archived: false,
            }
          : {
              feedback_status: 'pending',
              feedback_verified: false,
              structure_check: structure,
              feedback_answer_comment: structureSummary(structure!),
              ai_status: aiStatus,
              is_archived: false,
            }
      )
      .select('feedback_id')
      .single();

    if (feedbackError) throw feedbackError;

    await supabaseAdmin
      .from('bb_user_submissions_tbl')
      .update({
        submission_status: 'submitted',
        submitted_at: now,
        word_count: words,
        feedback_id: feedback.feedback_id,
        updated_at: now,
      })
      .eq('user_submission_id', draft.user_submission_id);
  }

  // Only the first practice set each Philippine day earns XP
  let practiceXpUsedToday = false;
  if (claimed.assessment_type === 'practice') {
    const dayStart = new Date(`${new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })}T00:00:00+08:00`).toISOString();
    const { count } = await supabaseAdmin
      .from('bb_assessments_tbl')
      .select('assessment_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('assessment_type', 'practice')
      .eq('assessment_status', 'submitted')
      .gte('submitted_at', dayStart)
      .neq('assessment_id', assessmentId);
    practiceXpUsedToday = (count ?? 0) > 0;
  }
  const xp = assessmentXp(claimed.assessment_type, answered, drafts?.length ?? 0, practiceXpUsedToday);

  await recordStudyActivity(userId, answered, xp);
  const newAchievements = await awardEarnedAchievements(userId);
  startAiComparisons(assessmentId);

  await logEvent(
    userId,
    'assessments',
    `${auto ? 'Auto-submitted' : 'Submitted'} "${claimed.assessment_title}" (${answered}/${drafts?.length ?? 0} answered).`
  );

  return { alreadySubmitted: false, newAchievements, xpEarned: xp, answered };
}

async function loadOwnedAssessment(assessmentId: string, userId: string) {
  const { data } = await supabaseAdmin
    .from('bb_assessments_tbl')
    .select('*, bb_question_subjects_tbl ( question_subject_desc )')
    .eq('assessment_id', assessmentId)
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

const isExpired = (a: { expires_at: string | null }) =>
  Boolean(a.expires_at) && Date.now() > new Date(a.expires_at!).getTime() + GRACE_SECONDS * 1000;

// A released daily set waits as "ready"; opening it starts the timer
async function openAssessment(assessmentId: string) {
  const { data: a } = await supabaseAdmin
    .from('bb_assessments_tbl')
    .select('reading_minutes, time_limit_minutes')
    .eq('assessment_id', assessmentId)
    .maybeSingle();
  if (!a) return;
  const now = Date.now();
  await supabaseAdmin
    .from('bb_assessments_tbl')
    .update({
      assessment_status: 'in_progress',
      opened_at: new Date(now).toISOString(),
      expires_at: new Date(now + (a.reading_minutes + a.time_limit_minutes) * 60000).toISOString(),
      updated_at: new Date(now).toISOString(),
    })
    .eq('assessment_id', assessmentId)
    .eq('assessment_status', 'ready');
}

const NO_QUESTIONS_LEFT =
  "You've been given every available question in your package. New questions appear here as soon as the Review Administrators upload them.";

// POST /api/assessments — { type: 'daily' | 'mock' | 'practice', examDay?, subjectSlug? }
assessmentRoutes.post('/', async (c) => {
  const auth = await requireUser(c, ['reviewee']);
  if (auth.response) return auth.response;
  const userId = auth.profile.user_id;

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ message: 'Invalid JSON.' }, 400);
  }

  const type = body?.type as AssessmentType;
  if (!['daily', 'mock', 'practice'].includes(type)) {
    return c.json({ message: 'Choose daily, mock or practice.' }, 400);
  }

  try {
    const subscription = await loadSubscription(userId);
    if (!subscription) return c.json({ message: 'Choose a review package first.', needsPackage: true }, 403);
    if (!subscription.active) return c.json({ message: 'Your review package has ended. Choose a package to continue.', needsPackage: true }, 403);

    // ---- Daily questions: today's released set (released now if 7 AM has not run yet)
    if (type === 'daily') {
      let today = await todaysDailySet(userId);
      if (!today) {
        const created = await createDailySet(userId, subscription);
        if (!created.assessmentId) return c.json({ message: NO_QUESTIONS_LEFT }, 409);
        today = await todaysDailySet(userId);
      }
      if (!today) return c.json({ message: "Unable to load today's questions." }, 500);

      if (today.assessment_status === 'submitted') {
        return c.json(
          { message: "You've already completed today's daily questions. Come back tomorrow at 7:00 AM!", assessmentId: today.assessment_id, completed: true },
          409
        );
      }
      if (today.assessment_status === 'ready') {
        await openAssessment(today.assessment_id);
      } else {
        const current = await loadOwnedAssessment(today.assessment_id, userId);
        if (current && isExpired(current)) {
          await finalizeAssessment(today.assessment_id, userId, true);
          return c.json(
            { message: "Time ran out for today's daily questions, so your answers were submitted.", assessmentId: today.assessment_id, completed: true },
            409
          );
        }
      }
      return c.json({ assessmentId: today.assessment_id, resumed: today.assessment_status === 'in_progress' });
    }

    const { subjects } = await loadSubjects();
    let subjectId: string | null = null;
    let subjectName = '';
    let examDay: number | null = null;

    if (type === 'practice') {
      const subject = subjects.find((s) => slugForSubject(s.question_subject_desc) === body.subjectSlug);
      if (!subject) return c.json({ message: 'Choose a valid subject for a practice set.' }, 400);
      if (!subscription.subjectIds.includes(subject.question_subject_id)) {
        return c.json({ message: `${subject.question_subject_desc} is not part of ${subscription.name}.` }, 403);
      }
      subjectId = subject.question_subject_id;
      subjectName = subject.question_subject_desc === 'Ethics' ? 'Legal Ethics' : subject.question_subject_desc;
    } else {
      examDay = Number(body.examDay);
      if (!subscription.days.includes(examDay)) {
        return c.json({ message: `Choose an examination day included in ${subscription.name}.` }, 400);
      }
      const { summary } = await loadRevieweeSummary(userId);
      const unlock = await mockUnlockStatus(summary);
      if (!unlock.unlocked) {
        return c.json(
          { message: `Mock Bar Examinations unlock at Level ${unlock.rule.level} or a ${unlock.rule.streak_days}-day learning streak.`, locked: true },
          403
        );
      }
    }

    // Resume instead of starting a second session of the same kind
    let existingQuery = supabaseAdmin
      .from('bb_assessments_tbl')
      .select('assessment_id, expires_at')
      .eq('user_id', userId)
      .eq('assessment_type', type)
      .eq('assessment_status', 'in_progress');
    if (subjectId) existingQuery = existingQuery.eq('question_subject_id', subjectId);
    if (examDay) existingQuery = existingQuery.eq('exam_day', examDay);

    const { data: existing } = await existingQuery.limit(1).maybeSingle();
    if (existing) {
      if (!isExpired(existing)) return c.json({ assessmentId: existing.assessment_id, resumed: true });
      await finalizeAssessment(existing.assessment_id, userId, true);
    }

    const config = (await getAssessmentConfig())[type];
    const daySlugs = EXAM_DAYS.find((d) => d.day === examDay)?.slugs ?? [];
    const daySubjectIds = subjects.filter((s) => daySlugs.includes(slugForSubject(s.question_subject_desc))).map((s) => s.question_subject_id);

    const questions =
      type === 'mock'
        ? await pickQuestions(userId, { type: 'mock', examDay: examDay!, count: config.questions, subjectIds: daySubjectIds })
        : await pickQuestions(userId, { type: 'practice', count: config.questions, subjectIds: [subjectId!] });

    if (questions.length === 0) return c.json({ message: NO_QUESTIONS_LEFT }, 409);

    const title = type === 'mock' ? `Mock Bar Examination — Day ${examDay}` : `${subjectName} Practice Set`;

    const now = Date.now();
    const { data: assessment, error } = await supabaseAdmin
      .from('bb_assessments_tbl')
      .insert({
        user_id: userId,
        assessment_type: type,
        question_subject_id: subjectId,
        exam_day: examDay,
        assessment_title: title,
        assessment_status: 'in_progress',
        reading_minutes: config.reading_minutes,
        time_limit_minutes: config.time_limit_minutes,
        started_at: new Date(now).toISOString(),
        opened_at: new Date(now).toISOString(),
        expires_at: new Date(now + (config.reading_minutes + config.time_limit_minutes) * 60000).toISOString(),
      })
      .select('assessment_id')
      .single();

    if (error) throw error;
    await insertDrafts(userId, assessment.assessment_id, questions);

    await logEvent(userId, 'assessments', `Started "${title}" (${questions.length} questions).`);

    return c.json({ assessmentId: assessment.assessment_id, resumed: false, questionCount: questions.length }, 201);
  } catch (error: any) {
    console.error('Start assessment error:', error);
    return c.json({ message: error?.message || 'Unable to start the assessment.' }, 500);
  }
});

// GET /api/assessments/mock-plan — per-day Mock Bar availability for the reviewee
assessmentRoutes.get('/mock-plan', async (c) => {
  const auth = await requireUser(c, ['reviewee']);
  if (auth.response) return auth.response;

  const [subscription, { summary }, config] = await Promise.all([
    loadSubscription(auth.profile.user_id),
    loadRevieweeSummary(auth.profile.user_id),
    getAssessmentConfig(),
  ]);

  return c.json({
    unlock: await mockUnlockStatus(summary),
    config: config.mock,
    days: EXAM_DAYS.map((d) => ({
      day: d.day,
      label: d.label,
      subjects: d.subjects,
      included: Boolean(subscription?.days.includes(d.day)),
      allocation: mockAllocation(d.day, config.mock.questions),
    })),
  });
});

// GET /api/assessments?sort=newest|oldest|score_high|score_low&type=&subject=
assessmentRoutes.get('/', async (c) => {
  const auth = await requireUser(c, ['reviewee']);
  if (auth.response) return auth.response;

  const { data, error } = await supabaseAdmin
    .from('bb_assessments_tbl')
    .select(`
      assessment_id, assessment_type, assessment_title, assessment_status, started_at, submitted_at,
      time_limit_minutes, reading_minutes, expires_at, auto_submitted, exam_day, opened_at,
      bb_question_subjects_tbl ( question_subject_desc ),
      bb_user_submissions_tbl ( word_count, bb_feedbacks_tbl ( feedback_status, feedback_score ) )
    `)
    .eq('user_id', auth.profile.user_id)
    .eq('is_archived', false)
    .order('started_at', { ascending: false });

  if (error) return c.json({ message: 'Unable to load your assessments.' }, 500);

  let rows = (data || []).map((a: any) => {
    const subs = a.bb_user_submissions_tbl || [];
    const verified = subs.filter((s: any) => s.bb_feedbacks_tbl && s.bb_feedbacks_tbl.feedback_score !== null);
    const percent = verified.length
      ? Math.round((verified.reduce((sum: number, s: any) => sum + Number(s.bb_feedbacks_tbl.feedback_score), 0) / verified.length / 5) * 100)
      : null;
    const subjectName = a.bb_question_subjects_tbl?.question_subject_desc;
    return {
      id: a.assessment_id,
      type: a.assessment_type,
      title: a.assessment_title,
      status: a.assessment_status === 'in_progress' && isExpired(a) ? 'expired' : a.assessment_status,
      subject: subjectName ? (subjectName === 'Ethics' ? 'Legal Ethics' : subjectName) : null,
      subjectSlug: subjectName ? slugForSubject(subjectName) : null,
      examDay: a.exam_day,
      startedAt: a.opened_at || a.started_at,
      submittedAt: a.submitted_at,
      expiresAt: a.expires_at,
      durationMinutes: a.time_limit_minutes + a.reading_minutes,
      autoSubmitted: a.auto_submitted,
      totalQuestions: subs.length,
      answered: subs.filter((s: any) => s.word_count > 0).length,
      verified: verified.length,
      pending: subs.filter((s: any) => s.bb_feedbacks_tbl?.feedback_status === 'pending').length,
      score: percent,
    };
  });

  const type = c.req.query('type');
  const subject = c.req.query('subject');
  if (type) rows = rows.filter((r) => r.type === type);
  if (subject) rows = rows.filter((r) => r.subjectSlug === subject || r.type !== 'practice');

  const sort = c.req.query('sort') || 'newest';
  const by: Record<string, (a: any, b: any) => number> = {
    newest: (a, b) => String(b.submittedAt || b.startedAt).localeCompare(String(a.submittedAt || a.startedAt)),
    oldest: (a, b) => String(a.submittedAt || a.startedAt).localeCompare(String(b.submittedAt || b.startedAt)),
    score_high: (a, b) => (b.score ?? -1) - (a.score ?? -1),
    score_low: (a, b) => (a.score ?? 101) - (b.score ?? 101),
  };
  rows.sort(by[sort] || by.newest);

  return c.json({ assessments: rows });
});

// GET /api/assessments/:id — questions + saved drafts for the exam screen
assessmentRoutes.get('/:id', async (c) => {
  const auth = await requireUser(c, ['reviewee']);
  if (auth.response) return auth.response;

  let assessment = await loadOwnedAssessment(c.req.param('id'), auth.profile.user_id);
  if (!assessment) return c.json({ message: 'Assessment not found.' }, 404);

  if (assessment.assessment_status === 'ready') {
    await openAssessment(assessment.assessment_id);
    assessment = await loadOwnedAssessment(assessment.assessment_id, auth.profile.user_id);
  } else if (assessment.assessment_status === 'in_progress' && isExpired(assessment)) {
    await finalizeAssessment(assessment.assessment_id, auth.profile.user_id, true);
    assessment = await loadOwnedAssessment(assessment.assessment_id, auth.profile.user_id);
  }

  const { data: items, error } = await supabaseAdmin
    .from('bb_user_submissions_tbl')
    .select('question_id, question_order, user_submission_answer, is_flagged, word_count, bb_questions_tbl ( question_text, bb_question_subjects_tbl ( question_subject_desc ) )')
    .eq('assessment_id', assessment!.assessment_id)
    .order('question_order');

  if (error) return c.json({ message: 'Unable to load questions.' }, 500);

  return c.json({
    serverNow: new Date().toISOString(),
    assessment: {
      id: assessment!.assessment_id,
      type: assessment!.assessment_type,
      title: assessment!.assessment_title,
      status: assessment!.assessment_status,
      readingMinutes: assessment!.reading_minutes,
      timeLimitMinutes: assessment!.time_limit_minutes,
      examDay: assessment!.exam_day,
      startedAt: assessment!.opened_at || assessment!.started_at,
      expiresAt: assessment!.expires_at,
      submittedAt: assessment!.submitted_at,
    },
    questions: (items || []).map((q: any) => {
      const subject = q.bb_questions_tbl?.bb_question_subjects_tbl?.question_subject_desc || '';
      return {
        questionId: q.question_id,
        order: q.question_order,
        subject: subject === 'Ethics' ? 'Legal Ethics' : subject,
        title: questionTitle(q.bb_questions_tbl?.question_text || ''),
        text: q.bb_questions_tbl?.question_text || '',
        answer: q.user_submission_answer || '',
        flagged: q.is_flagged,
      };
    }),
  });
});

// PUT /api/assessments/:id/answers/:questionId — auto-save { answer, flagged? }
assessmentRoutes.put('/:id/answers/:questionId', async (c) => {
  const auth = await requireUser(c, ['reviewee']);
  if (auth.response) return auth.response;

  const assessment = await loadOwnedAssessment(c.req.param('id'), auth.profile.user_id);
  if (!assessment) return c.json({ message: 'Assessment not found.' }, 404);
  if (assessment.assessment_status !== 'in_progress') return c.json({ message: 'This assessment was already submitted.' }, 409);
  if (isExpired(assessment)) return c.json({ message: 'Time is up for this assessment.', expired: true }, 409);

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ message: 'Invalid JSON.' }, 400);
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.answer === 'string') {
    if (body.answer.length > MAX_ANSWER_LENGTH) return c.json({ message: 'Answer is too long.' }, 400);
    update.user_submission_answer = body.answer;
    update.word_count = countWords(body.answer);
  }
  if (typeof body.flagged === 'boolean') update.is_flagged = body.flagged;

  const { data, error } = await supabaseAdmin
    .from('bb_user_submissions_tbl')
    .update(update)
    .eq('assessment_id', assessment.assessment_id)
    .eq('question_id', c.req.param('questionId'))
    .eq('submission_status', 'draft')
    .select('question_id')
    .maybeSingle();

  if (error) return c.json({ message: 'Unable to save your answer.' }, 500);
  if (!data) return c.json({ message: 'Question not found in this assessment.' }, 404);

  return c.json({ savedAt: new Date().toISOString() });
});

// POST /api/assessments/:id/submit — { answers?: [{ questionId, answer }], auto?: boolean }
assessmentRoutes.post('/:id/submit', async (c) => {
  const auth = await requireUser(c, ['reviewee']);
  if (auth.response) return auth.response;
  const userId = auth.profile.user_id;

  const assessment = await loadOwnedAssessment(c.req.param('id'), userId);
  if (!assessment) return c.json({ message: 'Assessment not found.' }, 404);
  if (assessment.assessment_status === 'submitted') return c.json({ submitted: true, alreadySubmitted: true });
  if (assessment.assessment_status === 'ready') return c.json({ message: 'Open the assessment before submitting it.' }, 409);

  let body: any = {};
  try {
    body = await c.req.json();
  } catch {
    // body is optional
  }

  // Save any last answers sent with the submission (e.g. queued while offline)
  if (Array.isArray(body.answers) && !isExpired(assessment)) {
    for (const item of body.answers.slice(0, 50)) {
      if (typeof item?.questionId !== 'string' || typeof item?.answer !== 'string') continue;
      await supabaseAdmin
        .from('bb_user_submissions_tbl')
        .update({ user_submission_answer: item.answer.slice(0, MAX_ANSWER_LENGTH), word_count: countWords(item.answer) })
        .eq('assessment_id', assessment.assessment_id)
        .eq('question_id', item.questionId)
        .eq('submission_status', 'draft');
    }
  }

  const timeUp = Boolean(assessment.expires_at) && Date.now() >= new Date(assessment.expires_at).getTime();
  const auto = body.auto === true && timeUp;

  if (!auto) {
    const { data: drafts } = await supabaseAdmin
      .from('bb_user_submissions_tbl')
      .select('word_count')
      .eq('assessment_id', assessment.assessment_id);
    if (!(drafts || []).some((d) => d.word_count > 0)) {
      return c.json({ message: 'Write an answer to at least one question before submitting.' }, 400);
    }
  }

  try {
    const result = await finalizeAssessment(assessment.assessment_id, userId, auto);
    return c.json({ submitted: true, ...result });
  } catch (error: any) {
    console.error('Submit assessment error:', error);
    return c.json({ message: error?.message || 'Unable to submit the assessment.' }, 500);
  }
});

// GET /api/assessments/:id/results — reviewee (own) or content managers
assessmentRoutes.get('/:id/results', async (c) => {
  const auth = await requireUser(c);
  if (auth.response) return auth.response;

  const isStaff = CONTENT_MANAGER_ROLES.includes(auth.profile.role.toLowerCase());
  let query = supabaseAdmin
    .from('bb_assessments_tbl')
    .select('*, bb_question_subjects_tbl ( question_subject_desc )')
    .eq('assessment_id', c.req.param('id'));
  if (!isStaff) query = query.eq('user_id', auth.profile.user_id);

  const { data: assessment } = await query.maybeSingle();
  if (!assessment) return c.json({ message: 'Assessment not found.' }, 404);
  if (assessment.assessment_status !== 'submitted') return c.json({ message: 'Submit the assessment to see results.' }, 409);

  const { data: items, error } = await supabaseAdmin
    .from('bb_user_submissions_tbl')
    .select(`
      user_submission_id, question_id, question_order, user_submission_answer, word_count, submitted_at,
      bb_questions_tbl ( question_text, question_model_answer, bb_question_subjects_tbl ( question_subject_desc ) ),
      bb_feedbacks_tbl (
        feedback_status, feedback_score, feedback_comment, feedback_answer_comment, structure_check,
        alac_answer, alac_legal_basis, alac_application, alac_conclusion, verified_at,
        ai_status, ai_feedback, ai_accuracy, ai_model, ai_generated_at, ai_score,
        verifier:bb_users_tbl ( user_fname, user_lname )
      )
    `)
    .eq('assessment_id', assessment.assessment_id)
    .order('question_order');

  if (error) {
    console.error('Results error:', error);
    return c.json({ message: 'Unable to load results.' }, 500);
  }

  const questions = (items || []).map((s: any) => {
    const fb = s.bb_feedbacks_tbl;
    const subject = s.bb_questions_tbl?.bb_question_subjects_tbl?.question_subject_desc || '';
    return {
      submissionId: s.user_submission_id,
      order: s.question_order,
      subject: subject === 'Ethics' ? 'Legal Ethics' : subject,
      title: questionTitle(s.bb_questions_tbl?.question_text || ''),
      question: s.bb_questions_tbl?.question_text || '',
      modelAnswer: s.bb_questions_tbl?.question_model_answer || '',
      answer: s.user_submission_answer,
      wordCount: s.word_count,
      feedback: fb
        ? {
            status: fb.feedback_status,
            score: fb.feedback_score === null ? null : Number(fb.feedback_score),
            percent: fb.feedback_score === null ? null : Math.round((Number(fb.feedback_score) / 5) * 100),
            comment: fb.feedback_comment,
            structureSummary: fb.feedback_answer_comment,
            structure: fb.structure_check,
            alac: {
              answer: fb.alac_answer,
              legalBasis: fb.alac_legal_basis,
              application: fb.alac_application,
              conclusion: fb.alac_conclusion,
            },
            verifiedAt: fb.verified_at,
            verifiedBy: fb.verifier ? `Atty. ${fb.verifier.user_fname} ${fb.verifier.user_lname}`.trim() : null,
            ai: {
              status: fb.ai_status,
              feedback: fb.ai_feedback,
              accuracy: fb.ai_accuracy,
              model: fb.ai_model,
              generatedAt: fb.ai_generated_at,
              score: fb.ai_score === null || fb.ai_score === undefined ? null : Number(fb.ai_score),
            },
          }
        : null,
    };
  });

  // Reviewing feedback for the first time earns XP ("Feedback Explorer")
  let newAchievements: string[] = [];
  if (!isStaff && !assessment.feedback_viewed_at) {
    const { data: firstView } = await supabaseAdmin
      .from('bb_assessments_tbl')
      .update({ feedback_viewed_at: new Date().toISOString() })
      .eq('assessment_id', assessment.assessment_id)
      .is('feedback_viewed_at', null)
      .select('assessment_id')
      .maybeSingle();
    if (firstView) {
      await addXp(assessment.user_id, XP_RULES.feedbackReview);
      newAchievements = await awardEarnedAchievements(assessment.user_id);
    }
  }

  // Retry AI reviews that are still waiting (e.g. Gemini was added after submitting)
  if (aiConfigured() && questions.some((q) => ['pending', 'not_configured', 'failed'].includes(q.feedback?.ai?.status ?? '') && q.wordCount > 0)) {
    startAiComparisons(assessment.assessment_id);
  }

  const verified = questions.filter((q) => q.feedback && q.feedback.score !== null);
  const score = verified.length ? Math.round(verified.reduce((sum, q) => sum + (q.feedback!.percent ?? 0), 0) / verified.length) : null;
  const subjectName = assessment.bb_question_subjects_tbl?.question_subject_desc;

  return c.json({
    assessment: {
      id: assessment.assessment_id,
      type: assessment.assessment_type,
      title: assessment.assessment_title,
      subject: subjectName ? (subjectName === 'Ethics' ? 'Legal Ethics' : subjectName) : null,
      subjectSlug: subjectName ? slugForSubject(subjectName) : null,
      examDay: assessment.exam_day,
      startedAt: assessment.opened_at || assessment.started_at,
      submittedAt: assessment.submitted_at,
      autoSubmitted: assessment.auto_submitted,
    },
    ai: { configured: aiConfigured() },
    newAchievements,
    summary: {
      totalQuestions: questions.length,
      answered: questions.filter((q) => q.wordCount > 0).length,
      verified: verified.length,
      pending: questions.filter((q) => q.feedback?.status === 'pending').length,
      flagged: questions.filter((q) => q.feedback?.status === 'flagged').length,
      aiScored: questions.filter((q) => q.feedback?.ai?.score !== null && q.feedback?.ai?.score !== undefined).length,
      score,
      readinessLabel: score === null ? 'AWAITING VERIFICATION' : readinessLabel(score),
      fullyVerified: verified.length === questions.length,
    },
    questions,
  });
});
