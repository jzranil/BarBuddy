
import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase';
import { CONTENT_MANAGER_ROLES, requireUser } from '../lib/auth';
import { loadSubjects } from '../lib/subjects';
import { getAssessmentConfig, type AssessmentType } from '../lib/settings';
import { checkStructure, structureSummary } from '../lib/structure';
import { loadRevieweeSummary, readinessLabel, slugForSubject, WEIGHT_GROUPS } from '../lib/competency';
import { awardEarnedAchievements, recordStudyActivity, XP_RULES } from '../lib/engagement';
import { logEvent } from '../lib/logs';

export const assessmentRoutes = new Hono();

const GRACE_SECONDS = 120; // network slack after the timer reaches zero
const MAX_ANSWER_LENGTH = 50000;

const countWords = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Short title for the question navigator: first sentence, trimmed
export function questionTitle(text: string) {
  const first = text.replace(/\s+/g, ' ').trim().split(/(?<=[.?!])\s/)[0];
  return first.length > 70 ? `${first.slice(0, 67).trim()}...` : first;
}

// Splits `total` questions across subject groups by Bar weight (largest remainder)
function allocateByWeight(total: number) {
  const raw = WEIGHT_GROUPS.map((g) => ({ g, exact: (total * g.weight) / 100 }));
  const result = raw.map((r) => ({ g: r.g, n: Math.floor(r.exact), rem: r.exact - Math.floor(r.exact) }));
  let left = total - result.reduce((s, r) => s + r.n, 0);
  for (const r of [...result].sort((a, b) => b.rem - a.rem)) {
    if (left-- <= 0) break;
    r.n += 1;
  }
  return result;
}

async function pickQuestions(userId: string, type: AssessmentType, count: number, subjectId: string | null) {
  const { subjects } = await loadSubjects();
  const slugToId = new Map(subjects.map((s) => [slugForSubject(s.question_subject_desc), s.question_subject_id]));

  // Every active question (id + subject only)
  const pool: { question_id: string; question_subject_id: string }[] = [];
  for (let from = 0; ; from += 1000) {
    let q = supabaseAdmin.from('bb_questions_tbl').select('question_id, question_subject_id').eq('is_archived', false);
    if (subjectId) q = q.eq('question_subject_id', subjectId);
    const { data, error } = await q.order('question_id').range(from, from + 999);
    if (error) throw error;
    pool.push(...(data || []));
    if (!data || data.length < 1000) break;
  }

  // Questions this reviewee already answered are used only when unseen ones run out
  const { data: seenRows } = await supabaseAdmin
    .from('bb_user_submissions_tbl')
    .select('question_id')
    .eq('user_id', userId)
    .eq('submission_status', 'submitted');
  const seen = new Set((seenRows || []).map((r) => r.question_id));

  const take = (candidates: typeof pool, n: number, exclude: Set<string>) => {
    const available = candidates.filter((q) => !exclude.has(q.question_id));
    const unseen = shuffle(available.filter((q) => !seen.has(q.question_id)));
    const repeat = shuffle(available.filter((q) => seen.has(q.question_id)));
    return [...unseen, ...repeat].slice(0, n);
  };

  const chosen: typeof pool = [];
  const used = new Set<string>();
  const add = (items: typeof pool) => items.forEach((q) => { chosen.push(q); used.add(q.question_id); });

  if (type === 'practice') {
    add(take(pool, count, used));
  } else if (type === 'mock') {
    // Twenty-essay mock Bar: questions spread by the Table 1.3 subject weights
    for (const { g, n } of allocateByWeight(count)) {
      const ids = g.slugs.map((slug) => slugToId.get(slug)).filter(Boolean);
      for (let i = 0; i < n; i++) {
        const sid = ids[i % ids.length];
        add(take(pool.filter((q) => q.question_subject_id === sid), 1, used));
      }
    }
    if (chosen.length < count) add(take(pool, count - chosen.length, used));
  } else {
    // Daily questions — adaptive: start with the reviewee's weakest subject
    const { summary } = await loadRevieweeSummary(userId);
    const ranked = Object.entries(summary.subjects)
      .map(([slug, s]) => ({ id: slugToId.get(slug)!, rank: s.hasScore ? s.score : -1 }))
      .filter((s) => s.id)
      .sort((a, b) => a.rank - b.rank);

    for (const subject of ranked) {
      if (chosen.length >= count) break;
      add(take(pool.filter((q) => q.question_subject_id === subject.id), 1, used));
    }
    if (chosen.length < count) add(take(pool, count - chosen.length, used));
  }

  return shuffle(chosen.slice(0, count));
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
              is_archived: false,
            }
          : {
              feedback_status: 'pending',
              feedback_verified: false,
              structure_check: structure,
              feedback_answer_comment: structureSummary(structure!),
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

  const xp =
    answered * XP_RULES.answerSubmitted +
    XP_RULES.assessmentCompleted +
    (claimed.assessment_type === 'daily' ? XP_RULES.dailyBonus : 0);

  await recordStudyActivity(userId, answered, xp);
  const newAchievements = await awardEarnedAchievements(userId);

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

const isExpired = (a: { expires_at: string }) => Date.now() > new Date(a.expires_at).getTime() + GRACE_SECONDS * 1000;

// POST /api/assessments — { type: 'daily' | 'mock' | 'practice', subjectSlug? }
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
    // Resume instead of starting a second session of the same kind
    let existingQuery = supabaseAdmin
      .from('bb_assessments_tbl')
      .select('assessment_id, expires_at, question_subject_id')
      .eq('user_id', userId)
      .eq('assessment_type', type)
      .eq('assessment_status', 'in_progress');

    const { subjects } = await loadSubjects();
    let subjectId: string | null = null;
    let subjectName = '';

    if (type === 'practice') {
      const subject = subjects.find((s) => slugForSubject(s.question_subject_desc) === body.subjectSlug);
      if (!subject) return c.json({ message: 'Choose a valid subject for a practice set.' }, 400);
      subjectId = subject.question_subject_id;
      subjectName = subject.question_subject_desc === 'Ethics' ? 'Legal Ethics' : subject.question_subject_desc;
      existingQuery = existingQuery.eq('question_subject_id', subjectId);
    }

    const { data: existing } = await existingQuery.maybeSingle();
    if (existing) {
      if (!isExpired(existing)) return c.json({ assessmentId: existing.assessment_id, resumed: true });
      await finalizeAssessment(existing.assessment_id, userId, true);
    }

    if (type === 'daily') {
      const { data: today } = await supabaseAdmin
        .from('bb_assessments_tbl')
        .select('assessment_id, assessment_status')
        .eq('user_id', userId)
        .eq('assessment_type', 'daily')
        .gte('started_at', new Date(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }) + 'T00:00:00+08:00').toISOString())
        .maybeSingle();
      if (today) {
        return c.json(
          { message: "You've already completed today's daily questions. Come back tomorrow!", assessmentId: today.assessment_id, completed: true },
          409
        );
      }
    }

    const config = (await getAssessmentConfig())[type];
    const questions = await pickQuestions(userId, type, config.questions, subjectId);

    if (questions.length === 0) {
      return c.json({ message: 'No questions are available yet. Please check back once questions are uploaded.' }, 409);
    }

    const title =
      type === 'daily'
        ? `Daily Questions — ${new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' })}`
        : type === 'mock'
          ? 'Mock Bar Examination'
          : `${subjectName} Practice Set`;

    const now = Date.now();
    const { data: assessment, error } = await supabaseAdmin
      .from('bb_assessments_tbl')
      .insert({
        user_id: userId,
        assessment_type: type,
        question_subject_id: subjectId,
        assessment_title: title,
        reading_minutes: config.reading_minutes,
        time_limit_minutes: config.time_limit_minutes,
        started_at: new Date(now).toISOString(),
        expires_at: new Date(now + (config.reading_minutes + config.time_limit_minutes) * 60000).toISOString(),
      })
      .select('assessment_id')
      .single();

    if (error) throw error;

    const { error: draftError } = await supabaseAdmin.from('bb_user_submissions_tbl').insert(
      questions.map((q, index) => ({
        user_id: userId,
        question_id: q.question_id,
        assessment_id: assessment.assessment_id,
        question_order: index + 1,
        user_submission_answer: '',
        submission_status: 'draft',
        is_archived: false,
      }))
    );
    if (draftError) throw draftError;

    await logEvent(userId, 'assessments', `Started "${title}" (${questions.length} questions).`);

    return c.json({ assessmentId: assessment.assessment_id, resumed: false }, 201);
  } catch (error: any) {
    console.error('Start assessment error:', error);
    return c.json({ message: error?.message || 'Unable to start the assessment.' }, 500);
  }
});

// GET /api/assessments?sort=newest|oldest|score_high|score_low&type=&subject=
assessmentRoutes.get('/', async (c) => {
  const auth = await requireUser(c, ['reviewee']);
  if (auth.response) return auth.response;

  const { data, error } = await supabaseAdmin
    .from('bb_assessments_tbl')
    .select(`
      assessment_id, assessment_type, assessment_title, assessment_status, started_at, submitted_at,
      time_limit_minutes, reading_minutes, expires_at, auto_submitted,
      bb_question_subjects_tbl ( question_subject_desc ),
      bb_user_submissions_tbl ( word_count, bb_feedbacks_tbl ( feedback_status, feedback_score ) )
    `)
    .eq('user_id', auth.profile.user_id)
    .eq('is_archived', false)
    .order('started_at', { ascending: false });

  if (error) return c.json({ message: 'Unable to load your assessments.' }, 500);

  let rows = (data || []).map((a: any) => {
    const subs = a.bb_user_submissions_tbl || [];
    const verified = subs.filter((s: any) => s.bb_feedbacks_tbl?.feedback_status === 'verified');
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
      startedAt: a.started_at,
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

  if (assessment.assessment_status === 'in_progress' && isExpired(assessment)) {
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
      startedAt: assessment!.started_at,
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

  const timeUp = Date.now() >= new Date(assessment.expires_at).getTime();
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
          }
        : null,
    };
  });

  const verified = questions.filter((q) => q.feedback?.status === 'verified');
  const score = verified.length ? Math.round(verified.reduce((sum, q) => sum + (q.feedback!.percent ?? 0), 0) / verified.length) : null;
  const subjectName = assessment.bb_question_subjects_tbl?.question_subject_desc;

  return c.json({
    assessment: {
      id: assessment.assessment_id,
      type: assessment.assessment_type,
      title: assessment.assessment_title,
      subject: subjectName ? (subjectName === 'Ethics' ? 'Legal Ethics' : subjectName) : null,
      subjectSlug: subjectName ? slugForSubject(subjectName) : null,
      startedAt: assessment.started_at,
      submittedAt: assessment.submitted_at,
      autoSubmitted: assessment.auto_submitted,
    },
    summary: {
      totalQuestions: questions.length,
      answered: questions.filter((q) => q.wordCount > 0).length,
      verified: verified.length,
      pending: questions.filter((q) => q.feedback?.status === 'pending').length,
      flagged: questions.filter((q) => q.feedback?.status === 'flagged').length,
      score,
      readinessLabel: score === null ? 'AWAITING VERIFICATION' : readinessLabel(score),
      fullyVerified: verified.length === questions.length,
    },
    questions,
  });
});
