
import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase';
import { CONTENT_MANAGER_ROLES, requireUser } from '../lib/auth';
import { awardEarnedAchievements, refreshAverageScore } from '../lib/engagement';
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
    ai_status, ai_feedback, ai_accuracy, ai_model, ai_score, ai_alac,
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
    aiScore: fb.ai_score === null || fb.ai_score === undefined ? null : Number(fb.ai_score),
    aiStatus: fb.ai_status,
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
    ai: {
      status: fb.ai_status,
      feedback: fb.ai_feedback,
      accuracy: fb.ai_accuracy,
      model: fb.ai_model,
      score: fb.ai_score === null || fb.ai_score === undefined ? null : Number(fb.ai_score),
      alac: fb.ai_alac,
    },
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
// The AI scores every essay and rates its ALAC components. The Review
// Administrator never changes the score; they either confirm the AI result:
//   { action: 'verify' }                 -> "Lawyer Verified"
// or flag it with an annotation:
//   { action: 'flag', annotation }       -> "Flagged" (annotation shown to the reviewee)
verificationRoutes.put('/:submissionId', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ message: 'Invalid JSON.' }, 400);
  }

  const action = body?.action ?? (body?.status === 'verified' ? 'verify' : body?.status === 'flagged' ? 'flag' : null);
  if (!['verify', 'flag'].includes(action)) return c.json({ message: 'Choose to verify the AI result or flag it.' }, 400);

  const annotation = String(body.annotation ?? body.comment ?? '').trim().slice(0, 5000);
  if (action === 'flag' && annotation.length < 5) {
    return c.json({ message: 'Add an annotation explaining what the AI result got wrong.' }, 400);
  }

  const { data: submission } = await supabaseAdmin
    .from('bb_user_submissions_tbl')
    .select('user_id, feedback_id, bb_feedbacks_tbl ( feedback_status, ai_status, ai_score )')
    .eq('user_submission_id', c.req.param('submissionId'))
    .eq('submission_status', 'submitted')
    .maybeSingle();

  if (!submission?.feedback_id) return c.json({ message: 'Submission not found.' }, 404);
  const fb: any = (submission as any).bb_feedbacks_tbl;

  if (action === 'verify' && (fb?.ai_status !== 'done' || fb?.ai_score === null || fb?.ai_score === undefined)) {
    return c.json({ message: 'The AI has not scored this essay yet, so there is nothing to verify.' }, 409);
  }

  const now = new Date().toISOString();
  const status = action === 'verify' ? 'verified' : 'flagged';

  const { error } = await supabaseAdmin
    .from('bb_feedbacks_tbl')
    .update({
      feedback_status: status,
      feedback_verified: status === 'verified',
      feedback_comment: action === 'flag' ? annotation : null,
      verified_by: auth.profile.user_id,
      verified_at: now,
      updated_at: now,
    })
    .eq('feedback_id', submission.feedback_id);

  if (error) {
    console.error('Verification save error:', error);
    return c.json({ message: 'Unable to save the verification.' }, 500);
  }

  // Competency, readiness and badges follow the verified score (XP rewards effort, not the score)
  await refreshAverageScore(submission.user_id);
  const newAchievements = await awardEarnedAchievements(submission.user_id);

  await logEvent(
    auth.profile.user_id,
    'verification',
    status === 'verified'
      ? `Verified the AI score of submission ${c.req.param('submissionId')} (${fb.ai_score}/5).`
      : `Flagged the AI result of submission ${c.req.param('submissionId')} with an annotation.`
  );

  return c.json({ message: status === 'verified' ? 'Marked as lawyer verified.' : 'Flagged with your annotation.', newAchievements });
});
