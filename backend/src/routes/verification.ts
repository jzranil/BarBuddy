
import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase';
import { CONTENT_MANAGER_ROLES, requireUser } from '../lib/auth';
import { addXp, awardEarnedAchievements, refreshAverageScore, XP_RULES } from '../lib/engagement';
import { logEvent } from '../lib/logs';
import { questionTitle } from './assessments';

// Feedback History Management / lawyer verification (paper Figures 1.7, 3.7).
// AI integration is out of scope, so every submitted essay is graded here by a
// lawyer on the five-point standard (Table 1.2) with ALAC component ratings.
export const verificationRoutes = new Hono();

const SUBMISSION_SELECT = `
  user_submission_id, user_submission_answer, word_count, submitted_at, assessment_id,
  reviewee:bb_users_tbl ( user_id, user_fname, user_lname, user_email ),
  bb_questions_tbl!inner ( question_id, question_text, question_model_answer, bb_question_subjects_tbl ( question_subject_id, question_subject_desc ) ),
  bb_assessments_tbl ( assessment_type, assessment_title ),
  bb_feedbacks_tbl!inner (
    feedback_id, feedback_status, feedback_score, feedback_comment, feedback_answer_comment, structure_check,
    alac_answer, alac_legal_basis, alac_application, alac_conclusion, verified_at,
    verifier:bb_users_tbl ( user_fname, user_lname )
  )
`;

const subjectLabel = (name?: string) => (name === 'Ethics' ? 'Legal Ethics' : name || '');

function toItem(row: any, full = false) {
  const fb = row.bb_feedbacks_tbl;
  const reviewee = row.reviewee;
  const name = `${reviewee?.user_fname || ''} ${reviewee?.user_lname || ''}`.trim() || reviewee?.user_email || 'Reviewee';
  const base = {
    id: row.user_submission_id,
    reviewee: name,
    revieweeId: reviewee?.user_id,
    initials: name.split(' ').filter(Boolean).map((p: string) => p[0]).slice(0, 2).join('').toUpperCase(),
    subject: subjectLabel(row.bb_questions_tbl?.bb_question_subjects_tbl?.question_subject_desc),
    subjectId: row.bb_questions_tbl?.bb_question_subjects_tbl?.question_subject_id,
    questionTitle: questionTitle(row.bb_questions_tbl?.question_text || ''),
    assessmentType: row.bb_assessments_tbl?.assessment_type,
    assessmentTitle: row.bb_assessments_tbl?.assessment_title,
    submittedAt: row.submitted_at,
    wordCount: row.word_count,
    status: fb.feedback_status,
    score: fb.feedback_score === null ? null : Number(fb.feedback_score),
    structureFound: fb.structure_check?.componentsFound ?? null,
  };

  if (!full) return base;

  return {
    ...base,
    question: row.bb_questions_tbl?.question_text || '',
    modelAnswer: row.bb_questions_tbl?.question_model_answer || '',
    answer: row.user_submission_answer,
    structure: fb.structure_check,
    structureSummary: fb.feedback_answer_comment,
    comment: fb.feedback_comment || '',
    alac: {
      answer: fb.alac_answer,
      legalBasis: fb.alac_legal_basis,
      application: fb.alac_application,
      conclusion: fb.alac_conclusion,
    },
    verifiedAt: fb.verified_at,
    verifiedBy: fb.verifier ? `Atty. ${fb.verifier.user_fname} ${fb.verifier.user_lname}`.trim() : null,
  };
}

// GET /api/verification?status=pending|flagged|verified|all&subjectId=&search=&page=&pageSize=
verificationRoutes.get('/', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  const status = c.req.query('status') || 'pending';
  const subjectId = c.req.query('subjectId') || '';
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(c.req.query('pageSize') || '10', 10) || 10));
  const from = (page - 1) * pageSize;

  let query = supabaseAdmin
    .from('bb_user_submissions_tbl')
    .select(SUBMISSION_SELECT, { count: 'exact' })
    .eq('submission_status', 'submitted')
    .gt('word_count', 0);

  if (status !== 'all') query = query.eq('bb_feedbacks_tbl.feedback_status', status);
  if (subjectId) query = query.eq('bb_questions_tbl.question_subject_id', subjectId);

  const { data, count, error } = await query
    .order('submitted_at', { ascending: status !== 'verified' })
    .range(from, from + pageSize - 1);

  if (error) {
    console.error('Verification queue error:', error);
    return c.json({ message: 'Unable to load the verification queue.' }, 500);
  }

  // Counts for the queue tabs
  const counts: Record<string, number> = {};
  await Promise.all(
    ['pending', 'flagged', 'verified'].map(async (s) => {
      const { count: n } = await supabaseAdmin
        .from('bb_feedbacks_tbl')
        .select('feedback_id, bb_user_submissions_tbl!inner ( word_count )', { count: 'exact', head: true })
        .eq('feedback_status', s)
        .gt('bb_user_submissions_tbl.word_count', 0);
      counts[s] = n || 0;
    })
  );

  const items = (data || []).map((row) => toItem(row));

  return c.json({ items, total: count || 0, page, pageSize, counts });
});

// GET /api/verification/:submissionId — full review screen
verificationRoutes.get('/:submissionId', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  const { data, error } = await supabaseAdmin
    .from('bb_user_submissions_tbl')
    .select(SUBMISSION_SELECT)
    .eq('user_submission_id', c.req.param('submissionId'))
    .eq('submission_status', 'submitted')
    .maybeSingle();

  if (error) {
    console.error('Verification detail error:', error);
    return c.json({ message: 'Unable to load the submission.' }, 500);
  }
  if (!data) return c.json({ message: 'Submission not found.' }, 404);

  return c.json({ item: toItem(data, true) });
});

const ALAC_FIELDS = { answer: 'alac_answer', legalBasis: 'alac_legal_basis', application: 'alac_application', conclusion: 'alac_conclusion' } as const;

// PUT /api/verification/:submissionId
// { status: 'verified' | 'flagged', score: 0-5, alac: { answer, legalBasis, application, conclusion } (0-2), comment }
verificationRoutes.put('/:submissionId', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ message: 'Invalid JSON.' }, 400);
  }

  const status = body?.status;
  if (!['verified', 'flagged'].includes(status)) return c.json({ message: 'Status must be verified or flagged.' }, 400);

  const score = Number(body.score);
  if (status === 'verified' && (!Number.isInteger(score) || score < 0 || score > 5)) {
    return c.json({ message: 'Choose a score from 0 to 5 (five-point grading standard).' }, 400);
  }

  const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, 5000) : '';
  if (status === 'flagged' && !comment) return c.json({ message: 'Add a comment explaining why this is flagged.' }, 400);

  const alacUpdate: Record<string, number | null> = {};
  for (const [key, column] of Object.entries(ALAC_FIELDS)) {
    const value = body.alac?.[key];
    if (value === null || value === undefined || value === '') alacUpdate[column] = null;
    else if ([0, 1, 2].includes(Number(value))) alacUpdate[column] = Number(value);
    else return c.json({ message: 'ALAC ratings must be 0 (missing), 1 (partial) or 2 (complete).' }, 400);
  }

  const { data: submission } = await supabaseAdmin
    .from('bb_user_submissions_tbl')
    .select('user_id, feedback_id, bb_feedbacks_tbl ( feedback_status )')
    .eq('user_submission_id', c.req.param('submissionId'))
    .eq('submission_status', 'submitted')
    .maybeSingle();

  if (!submission?.feedback_id) return c.json({ message: 'Submission not found.' }, 404);

  const wasVerified = (submission as any).bb_feedbacks_tbl?.feedback_status === 'verified';
  const now = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from('bb_feedbacks_tbl')
    .update({
      feedback_status: status,
      feedback_verified: status === 'verified',
      feedback_score: status === 'verified' ? score : null,
      feedback_comment: comment || null,
      ...alacUpdate,
      verified_by: auth.profile.user_id,
      verified_at: now,
      updated_at: now,
    })
    .eq('feedback_id', submission.feedback_id);

  if (error) {
    console.error('Verification save error:', error);
    return c.json({ message: 'Unable to save the verification.' }, 500);
  }

  // Competency, readiness, XP and badges follow the verified score
  if (status === 'verified' && !wasVerified) await addXp(submission.user_id, score * XP_RULES.verifiedPerPoint);
  await refreshAverageScore(submission.user_id);
  const newAchievements = await awardEarnedAchievements(submission.user_id);

  await logEvent(
    auth.profile.user_id,
    'verification',
    status === 'verified'
      ? `Verified submission ${c.req.param('submissionId')} with a score of ${score}/5.`
      : `Flagged submission ${c.req.param('submissionId')} for further review.`
  );

  return c.json({ message: status === 'verified' ? 'Feedback verified.' : 'Submission flagged for review.', newAchievements });
});
