
import { Hono } from 'hono';
import { supabase, supabaseAdmin } from '../lib/supabase';


export const questionRoutes = new Hono();

type QuestionInput = {
  subject: string;
  question_text: string;
  question_model_answer: string;
};

const ALLOWED_ROLES = new Set([
  'lawyer',
  'review administrator',
  'review admin',
]);

questionRoutes.post('/import', async (c) => {
  try {
    // STEP 1: Authenticate user
    const authHeader = c.req.header('Authorization') || '';

    if (!authHeader.startsWith('Bearer ')) {
      return c.json(
        { message: 'Authentication required.' },
        401
      );
    }

    const token = authHeader.slice(7).trim();

    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return c.json(
        { message: 'Invalid or expired session.' },
        401
      );
    }

    // STEP 2: Verify role from database
   
const { data: user, error: userError } =
  await supabaseAdmin
    .from('bb_users_tbl')
    .select('user_id, permission_id, user_status, is_archived')
    .eq('auth_user_id', authData.user.id)
    .single();

    if (userError || !user) {
      return c.json(
        { message: 'User profile not found.' },
        403
      );
    }

    
if (
  String(user.user_status || '').trim().toUpperCase() !== 'ACTIVE' ||
  user.is_archived === true
) {
  return c.json(
    { message: 'Account is inactive or archived.' },
    403
  );
}


    const { data: permission, error: permissionError } =
      await supabaseAdmin
        .from('bb_permissions_tbl')
        .select('user_permission_desc')
.eq('user_permission_id', user.permission_id)
        .single();

    if (permissionError || !permission) {
      return c.json(
        { message: 'Permission not found.' },
        403
      );
    }

    const role = String(
      permission.user_permission_desc
    ).trim().toLowerCase();

    if (!ALLOWED_ROLES.has(role)) {
      return c.json(
        { message: 'Only Review Administrators can import questions.' },
        403
      );
    }

    // STEP 3: Validate incoming request
    const contentLength = Number(
      c.req.header('content-length') || 0
    );

    const MAX_BYTES = 12 * 1024 * 1024;

    if (contentLength > MAX_BYTES) {
      return c.json(
        { message: 'Import exceeds 12 MB.' },
        413
      );
    }

    const rawBody = await c.req.text();

    if (
      new TextEncoder().encode(rawBody).length >
      MAX_BYTES
    ) {
      return c.json(
        { message: 'Import exceeds 12 MB.' },
        413
      );
    }

    let body: unknown;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return c.json(
        { message: 'Invalid JSON.' },
        400
      );
    }

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      return c.json(
        { message: 'Invalid request body.' },
        400
      );
    }

    const questions = (
      body as { questions?: unknown }
    ).questions;

    if (
      !Array.isArray(questions) ||
      questions.length < 1 ||
      questions.length > 2000
    ) {
      return c.json(
        { message: 'Upload between 1 and 2000 questions.' },
        400
      );
    }

    // STEP 4: Validate required fields and duplicates
    const validatedQuestions: QuestionInput[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < questions.length; i++) {
      const row = questions[i];

      if (
        !row ||
        typeof row !== 'object' ||
        Array.isArray(row)
      ) {
        return c.json(
          { message: `Invalid row ${i + 1}.` },
          400
        );
      }

      const {
        subject,
        question_text,
        question_model_answer,
      } = row;

      if (
        typeof subject !== 'string' ||
        typeof question_text !== 'string' ||
        typeof question_model_answer !== 'string'
      ) {
        return c.json(
          { message: `Row ${i + 1}: Invalid field types.` },
          400
        );
      }

      const cleanSubject = subject.trim();
      const cleanQuestion = question_text.trim();
      const cleanAnswer = question_model_answer.trim();

      if (
        !cleanSubject ||
        !cleanQuestion ||
        !cleanAnswer
      ) {
        return c.json(
          { message: `Row ${i + 1}: Missing required data.` },
          400
        );
      }

      if (
        cleanSubject.length > 200 ||
        cleanQuestion.length > 100000 ||
        cleanAnswer.length > 100000
      ) {
        return c.json(
          { message: `Row ${i + 1}: Text too long.` },
          400
        );
      }

      const duplicateKey = JSON.stringify([
        cleanSubject.toLowerCase(),
        cleanQuestion.toLowerCase(),
      ]);

      if (seen.has(duplicateKey)) {
        return c.json(
          { message: `Duplicate in CSV at row ${i + 1}.` },
          400
        );
      }

      seen.add(duplicateKey);

      validatedQuestions.push({
        subject: cleanSubject,
        question_text: cleanQuestion,
        question_model_answer: cleanAnswer,
      });
    }

    // STEP 5: Import using a database transaction
    // The SQL function resolves subjects into UUIDs,
    // skips existing duplicates, and inserts records.
    const { data: result, error: importError } =
      await supabaseAdmin.rpc(
        'import_barbuddy_questions',
        { p_questions: validatedQuestions }
      );

    if (importError) {
      console.error('Import failed:', importError);

      return c.json(
        {
          message:
            'Import failed. Check subjects and database configuration.',
        },
        400
      );
    }

    // STEP 6: Return accurate counts
    return c.json({
      success: true,
      message: 'Import completed successfully.',
      inserted: Number(result?.inserted ?? 0),
      skipped: Number(result?.skipped ?? 0),
      total: validatedQuestions.length,
    });

  } catch (error) {
    console.error('Question import error:', error);

    return c.json(
      { message: 'Internal server error.' },
      500
    );
  }
});
