
import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase';
import { logEvent } from '../lib/logs';
import { CONTENT_MANAGER_ROLES, requireUser } from '../lib/auth';
import {
  loadExistingQuestionKeys,
  loadSubjects,
  questionKey,
} from '../lib/subjects';

export const questionRoutes = new Hono();

type QuestionInput = {
  subject: string;
  question_text: string;
  question_model_answer: string;
};

const MAX_ROWS_PER_REQUEST = 2000;
const MAX_CHECK_ROWS = 10000;
const MAX_SUBJECT_LENGTH = 200;
const MIN_QUESTION_LENGTH = 10;
const MAX_TEXT_LENGTH = 100000;

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, '\\$&');
}

// GET /api/questions/subjects — question bank summary per subject
questionRoutes.get('/subjects', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  try {
    const { subjects } = await loadSubjects();

    const summary = await Promise.all(
      subjects.map(async (s) => {
        const [{ count }, { data: latest }] = await Promise.all([
          supabaseAdmin
            .from('bb_questions_tbl')
            .select('question_id', { count: 'exact', head: true })
            .eq('question_subject_id', s.question_subject_id)
            .eq('is_archived', false),
          supabaseAdmin
            .from('bb_questions_tbl')
            .select('updated_at')
            .eq('question_subject_id', s.question_subject_id)
            .eq('is_archived', false)
            .order('updated_at', { ascending: false })
            .limit(1),
        ]);

        return {
          id: s.question_subject_id,
          name: s.question_subject_desc,
          questionCount: count || 0,
          lastUpdated: latest?.[0]?.updated_at ?? null,
        };
      })
    );

    return c.json({
      subjects: summary,
      totalQuestions: summary.reduce((sum, s) => sum + s.questionCount, 0),
    });
  } catch (error) {
    console.error('Question subjects error:', error);
    return c.json({ message: 'Unable to load the question bank.' }, 500);
  }
});

// GET /api/questions?subjectId=&search=&page=1&pageSize=20
questionRoutes.get('/', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  const subjectId = c.req.query('subjectId') || '';
  const search = (c.req.query('search') || '').trim().slice(0, 200);
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(c.req.query('pageSize') || '20', 10) || 20));
  const from = (page - 1) * pageSize;

  // status: active (default) | archived
  const archived = c.req.query('status') === 'archived';

  let query = supabaseAdmin
    .from('bb_questions_tbl')
    .select(
      'question_id, question_subject_id, question_text, question_model_answer, is_archived, created_at, updated_at',
      { count: 'exact' }
    )
    .eq('is_archived', archived);

  if (subjectId) query = query.eq('question_subject_id', subjectId);
  if (search) query = query.ilike('question_text', `%${escapeLike(search)}%`);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .order('question_id')
    .range(from, from + pageSize - 1);

  if (error) {
    console.error('Question list error:', error);
    return c.json({ message: 'Unable to load questions.' }, 500);
  }

  return c.json({ questions: data || [], total: count || 0, page, pageSize });
});

// POST /api/questions/check — dry run used by the CSV preview.
// Body: { rows: [{ subject, question_text }] }
// Returns, for every row, whether it can be imported.
questionRoutes.post('/check', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  let body: any;

  try {
    body = await c.req.json();
  } catch {
    return c.json({ message: 'Invalid JSON.' }, 400);
  }

  const rows = body?.rows;

  if (!Array.isArray(rows) || rows.length < 1 || rows.length > MAX_CHECK_ROWS) {
    return c.json({ message: `Check between 1 and ${MAX_CHECK_ROWS} rows.` }, 400);
  }

  try {
    const { resolve } = await loadSubjects();

    const resolved = rows.map((row: any) =>
      resolve(String(row?.subject || ''))
    );

    const subjectIds = [
      ...new Set(resolved.filter(Boolean).map((s) => s!.question_subject_id)),
    ];

    const existing = await loadExistingQuestionKeys(subjectIds);

    const results = rows.map((row: any, index: number) => {
      const subject = resolved[index];

      if (!subject) {
        return { status: 'unknown_subject' };
      }

      const key = questionKey(subject.question_subject_id, String(row?.question_text || ''));

      return {
        status: existing.has(key) ? 'existing' : 'ok',
        subject: subject.question_subject_desc,
      };
    });

    return c.json({ results });
  } catch (error) {
    console.error('Question check error:', error);
    return c.json({ message: 'Unable to check questions against the question bank.' }, 500);
  }
});

// POST /api/questions/import — Body: { questions: QuestionInput[] }
questionRoutes.post('/import', async (c) => {
  try {
    const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
    if (auth.response) return auth.response;

    const MAX_BYTES = 12 * 1024 * 1024;

    if (Number(c.req.header('content-length') || 0) > MAX_BYTES) {
      return c.json({ message: 'Import exceeds 12 MB.' }, 413);
    }

    let body: any;

    try {
      body = await c.req.json();
    } catch {
      return c.json({ message: 'Invalid JSON.' }, 400);
    }

    const questions = body?.questions;

    if (
      !Array.isArray(questions) ||
      questions.length < 1 ||
      questions.length > MAX_ROWS_PER_REQUEST
    ) {
      return c.json(
        { message: `Upload between 1 and ${MAX_ROWS_PER_REQUEST} questions per request.` },
        400
      );
    }

    const { resolve } = await loadSubjects();
    const validatedQuestions: QuestionInput[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < questions.length; i++) {
      const row = questions[i];

      if (
        !row ||
        typeof row !== 'object' ||
        typeof row.subject !== 'string' ||
        typeof row.question_text !== 'string' ||
        typeof row.question_model_answer !== 'string'
      ) {
        return c.json({ message: `Row ${i + 1}: Invalid field types.` }, 400);
      }

      const cleanSubject = row.subject.trim();
      const cleanQuestion = row.question_text.trim();
      const cleanAnswer = row.question_model_answer.trim();

      if (!cleanSubject || !cleanQuestion || !cleanAnswer) {
        return c.json({ message: `Row ${i + 1}: Missing required data.` }, 400);
      }

      if (cleanQuestion.length < MIN_QUESTION_LENGTH) {
        return c.json({ message: `Row ${i + 1}: Question is too short.` }, 400);
      }

      if (
        cleanSubject.length > MAX_SUBJECT_LENGTH ||
        cleanQuestion.length > MAX_TEXT_LENGTH ||
        cleanAnswer.length > MAX_TEXT_LENGTH
      ) {
        return c.json({ message: `Row ${i + 1}: Text too long.` }, 400);
      }

      const subject = resolve(cleanSubject);

      if (!subject) {
        return c.json({ message: `Row ${i + 1}: Unknown subject "${cleanSubject}".` }, 400);
      }

      const key = questionKey(subject.question_subject_id, cleanQuestion);

      if (seen.has(key)) {
        return c.json({ message: `Row ${i + 1}: Duplicate question in this upload.` }, 400);
      }

      seen.add(key);

      validatedQuestions.push({
        // Send the database's own subject name so the SQL function matches it
        subject: subject.question_subject_desc,
        question_text: cleanQuestion,
        question_model_answer: cleanAnswer,
      });
    }

    // The SQL function inserts in one transaction and skips questions that
    // already exist (unique index on subject + lower(trim(question_text))).
    const { data: result, error: importError } = await supabaseAdmin.rpc(
      'import_barbuddy_questions',
      { p_questions: validatedQuestions }
    );

    if (importError) {
      console.error('Import failed:', importError);
      return c.json({ message: `Import failed: ${importError.message}` }, 400);
    }

    await logEvent(
      auth.profile.user_id,
      'questionnaire',
      `CSV import: ${Number(result?.inserted ?? 0)} added, ${Number(result?.skipped ?? 0)} duplicate(s) skipped.`
    );

    return c.json({
      success: true,
      message: 'Import completed successfully.',
      inserted: Number(result?.inserted ?? 0),
      skipped: Number(result?.skipped ?? 0),
      total: validatedQuestions.length,
    });
  } catch (error) {
    console.error('Question import error:', error);
    return c.json({ message: 'Internal server error.' }, 500);
  }
});

// ---------------------------------------------------------------------------
// Manual questionnaire management (paper Figure 3.6): create, edit, archive,
// restore and delete questions with their lawyer-approved model answers.
// ---------------------------------------------------------------------------

async function validateQuestion(body: any) {
  const subjectId = String(body?.subjectId || '');
  const questionText = String(body?.questionText || '').trim();
  const modelAnswer = String(body?.modelAnswer || '').trim();

  const { subjects } = await loadSubjects();
  if (!subjects.some((s) => s.question_subject_id === subjectId)) return { error: 'Choose the Bar subject.' };
  if (questionText.length < MIN_QUESTION_LENGTH) return { error: `The question must be at least ${MIN_QUESTION_LENGTH} characters.` };
  if (!modelAnswer) return { error: 'The lawyer-approved model answer is required.' };
  if (questionText.length > MAX_TEXT_LENGTH || modelAnswer.length > MAX_TEXT_LENGTH) return { error: 'Text is too long.' };

  return { subjectId, questionText, modelAnswer };
}

// Same rule as the database unique index: subject + question text, ignoring case and spaces
async function isDuplicate(subjectId: string, questionText: string, exceptId?: string) {
  const keys = await loadExistingQuestionKeys([subjectId]);
  if (!keys.has(questionKey(subjectId, questionText))) return false;
  if (!exceptId) return true;
  const { data } = await supabaseAdmin.from('bb_questions_tbl').select('question_subject_id, question_text').eq('question_id', exceptId).maybeSingle();
  return !(data && questionKey(data.question_subject_id, data.question_text) === questionKey(subjectId, questionText));
}

// POST /api/questions — { subjectId, questionText, modelAnswer }
questionRoutes.post('/', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  const valid = await validateQuestion(await c.req.json().catch(() => null));
  if ('error' in valid) return c.json({ message: valid.error }, 400);

  if (await isDuplicate(valid.subjectId, valid.questionText)) {
    return c.json({ message: 'This question already exists in the question bank for that subject.' }, 409);
  }

  const { data, error } = await supabaseAdmin
    .from('bb_questions_tbl')
    .insert({ question_subject_id: valid.subjectId, question_text: valid.questionText, question_model_answer: valid.modelAnswer, is_archived: false })
    .select('question_id')
    .single();

  if (error) return c.json({ message: error.code === '23505' ? 'This question already exists.' : error.message }, 400);

  await logEvent(auth.profile.user_id, 'questionnaire', `Added question ${data.question_id}.`);
  return c.json({ id: data.question_id, message: 'Question added.' }, 201);
});

// PATCH /api/questions/:id — { subjectId, questionText, modelAnswer } or { isArchived }
questionRoutes.patch('/:id', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  const id = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ message: 'Invalid JSON.' }, 400);

  let update: Record<string, unknown>;
  let action: string;

  if (typeof body.isArchived === 'boolean' && body.questionText === undefined) {
    update = { is_archived: body.isArchived };
    action = body.isArchived ? 'Archived' : 'Restored';
  } else {
    const valid = await validateQuestion(body);
    if ('error' in valid) return c.json({ message: valid.error }, 400);
    if (await isDuplicate(valid.subjectId, valid.questionText, id)) {
      return c.json({ message: 'Another question with the same text already exists for that subject.' }, 409);
    }
    update = { question_subject_id: valid.subjectId, question_text: valid.questionText, question_model_answer: valid.modelAnswer };
    action = 'Edited';
  }

  const { data, error } = await supabaseAdmin
    .from('bb_questions_tbl')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('question_id', id)
    .select('question_id')
    .maybeSingle();

  if (error) return c.json({ message: error.code === '23505' ? 'This question already exists.' : error.message }, 400);
  if (!data) return c.json({ message: 'Question not found.' }, 404);

  await logEvent(auth.profile.user_id, 'questionnaire', `${action} question ${id}.`);
  return c.json({ message: `Question ${action.toLowerCase()}.` });
});

// DELETE /api/questions/:id — only when no reviewee has answered it
questionRoutes.delete('/:id', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  const id = c.req.param('id');
  const { count } = await supabaseAdmin.from('bb_user_submissions_tbl').select('user_submission_id', { count: 'exact', head: true }).eq('question_id', id);
  if (count) {
    return c.json({ message: `Reviewees have answered this question ${count} time(s), so it can't be deleted. Archive it instead to keep their history.` }, 409);
  }

  const { data, error } = await supabaseAdmin.from('bb_questions_tbl').delete().eq('question_id', id).select('question_id').maybeSingle();
  if (error) return c.json({ message: error.message }, 400);
  if (!data) return c.json({ message: 'Question not found.' }, 404);

  await logEvent(auth.profile.user_id, 'questionnaire', `Deleted question ${id}.`, 'WARNING');
  return c.json({ message: 'Question deleted.' });
});
