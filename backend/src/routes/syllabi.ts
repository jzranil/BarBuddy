
import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase';
import { CONTENT_MANAGER_ROLES, requireUser } from '../lib/auth';
import { loadSubjects } from '../lib/subjects';
import { slugForSubject } from '../lib/competency';
import { logEvent } from '../lib/logs';

// Syllabi Management (paper Figures 1.4, 3.4): upload, edit, archive, restore
// and delete Bar syllabi, each assigned to a subject and examination day.
export const syllabusRoutes = new Hono();

const BUCKET = 'syllabi';
const MAX_PDF_BYTES = 20 * 1024 * 1024;
const MIN_TITLE_LENGTH = 3;
const MAX_TITLE_LENGTH = 150;

// Default examination day per subject (Philippine Bar schedule: three
// examination days, two subjects per day). Editable per syllabus.
const DEFAULT_EXAM_DAY: Record<string, number> = {
  'political-law': 1,
  'commercial-law': 1,
  'tax-law': 1,
  'civil-law': 2,
  'labor-law': 2,
  'criminal-law': 3,
  'remedial-law': 3,
  'legal-ethics': 3,
};

async function getSyllabusTagId() {
  const { data, error } = await supabaseAdmin
    .from('bb_resource_tags_tbl')
    .select('resource_tag_id')
    .eq('resource_tag_title', 'Syllabus')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('The Syllabus resource tag does not exist.');

  return data.resource_tag_id as string;
}

function filePath(resourceId: string) {
  return `syllabi/${resourceId}.pdf`;
}

const subjectLabel = (name?: string) => (name === 'Ethics' ? 'Legal Ethics' : name || '');

function toSyllabus(row: any) {
  const subjectName = row.bb_question_subjects_tbl?.question_subject_desc;
  return {
    id: row.resource_id,
    title: row.resource_desc,
    isArchived: row.is_archived,
    subjectId: row.question_subject_id,
    subject: subjectLabel(subjectName),
    subjectSlug: subjectName ? slugForSubject(subjectName) : null,
    examDay: row.exam_day,
    fileName: row.resource_file_name,
    fileSize: row.resource_file_size,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    uploadedBy: row.bb_users_tbl ? `${row.bb_users_tbl.user_fname || ''} ${row.bb_users_tbl.user_lname || ''}`.trim() : '',
  };
}

const SELECT = `
  resource_id, resource_desc, is_archived, question_subject_id, exam_day, resource_file_name, resource_file_size,
  created_at, updated_at,
  bb_users_tbl ( user_fname, user_lname ),
  bb_question_subjects_tbl ( question_subject_desc )
`;

async function readPdf(file: unknown) {
  if (!(file instanceof File)) return { error: 'Please attach the syllabus PDF.' };
  if (file.size === 0) return { error: 'The PDF is empty.' };
  if (file.size > MAX_PDF_BYTES) return { error: 'The PDF must be 20 MB or smaller.' };

  const bytes = new Uint8Array(await file.arrayBuffer());

  // Real PDFs start with "%PDF-"; this rejects renamed files (paper TC: invalid syllabus file)
  const isPdf = file.name.toLowerCase().endsWith('.pdf') && new TextDecoder().decode(bytes.subarray(0, 5)) === '%PDF-';
  if (!isPdf) return { error: 'Only PDF files are allowed.' };

  return { bytes, name: file.name.slice(0, 200), size: file.size };
}

async function validateMeta(input: { title: unknown; subjectId: unknown; examDay: unknown }) {
  const title = String(input.title || '').replace(/\s+/g, ' ').trim();
  if (title.length < MIN_TITLE_LENGTH || title.length > MAX_TITLE_LENGTH) {
    return { error: `Title must be ${MIN_TITLE_LENGTH}-${MAX_TITLE_LENGTH} characters.` };
  }

  const { subjects } = await loadSubjects();
  const subject = subjects.find((s) => s.question_subject_id === input.subjectId);
  if (!subject) return { error: 'Choose the Bar subject this syllabus covers.' };

  const slug = slugForSubject(subject.question_subject_desc);
  const examDay = input.examDay === undefined || input.examDay === '' ? DEFAULT_EXAM_DAY[slug] ?? null : Number(input.examDay);
  if (examDay !== null && (!Number.isInteger(examDay) || examDay < 1 || examDay > 4)) {
    return { error: 'Examination day must be 1 to 4.' };
  }

  return { title, subjectId: subject.question_subject_id, examDay };
}

async function titleTaken(tagId: string, title: string, exceptId?: string) {
  let q = supabaseAdmin
    .from('bb_resources_tbl')
    .select('resource_id')
    .eq('resource_tags', tagId)
    .eq('is_archived', false)
    .ilike('resource_desc', title.replace(/[\\%_]/g, '\\$&'));
  if (exceptId) q = q.neq('resource_id', exceptId);
  const { data } = await q.limit(1);
  return Boolean(data?.length);
}

// GET /api/syllabi — every syllabus document, newest first (content managers)
syllabusRoutes.get('/', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  try {
    const tagId = await getSyllabusTagId();
    const { data, error } = await supabaseAdmin
      .from('bb_resources_tbl')
      .select(SELECT)
      .eq('resource_tags', tagId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const { subjects } = await loadSubjects();
    return c.json({
      syllabi: (data || []).map(toSyllabus),
      subjects: subjects.map((s) => ({
        id: s.question_subject_id,
        name: subjectLabel(s.question_subject_desc),
        defaultExamDay: DEFAULT_EXAM_DAY[slugForSubject(s.question_subject_desc)] ?? null,
      })),
    });
  } catch (error: any) {
    console.error('Syllabus list error:', error);
    return c.json({ message: error?.message || 'Unable to load syllabi.' }, 500);
  }
});

// POST /api/syllabi — multipart form: title, subjectId, examDay?, file (PDF)
syllabusRoutes.post('/', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  let form: Record<string, unknown>;
  try {
    form = await c.req.parseBody();
  } catch {
    return c.json({ message: 'Invalid upload.' }, 400);
  }

  const meta = await validateMeta({ title: form.title, subjectId: form.subjectId, examDay: form.examDay });
  if ('error' in meta) return c.json({ message: meta.error }, 400);

  const pdf = await readPdf(form.file);
  if (pdf.error !== undefined) return c.json({ message: pdf.error }, pdf.error.includes('20 MB') ? 413 : 400);

  try {
    const tagId = await getSyllabusTagId();
    if (await titleTaken(tagId, meta.title)) {
      return c.json({ message: `A syllabus titled "${meta.title}" already exists.` }, 409);
    }

    const { data: resource, error: insertError } = await supabaseAdmin
      .from('bb_resources_tbl')
      .insert({
        user_id: auth.profile.user_id,
        resource_tags: tagId,
        resource_desc: meta.title,
        question_subject_id: meta.subjectId,
        exam_day: meta.examDay,
        resource_file_name: pdf.name,
        resource_file_size: pdf.size,
        is_archived: false,
      })
      .select(SELECT)
      .single();

    if (insertError) throw insertError;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath(resource.resource_id), pdf.bytes, { contentType: 'application/pdf', cacheControl: '3600', upsert: false });

    if (uploadError) {
      // Remove the record we just created so no syllabus points at a missing file
      await supabaseAdmin.from('bb_resources_tbl').delete().eq('resource_id', resource.resource_id);
      throw uploadError;
    }

    await logEvent(auth.profile.user_id, 'syllabi', `Uploaded syllabus "${meta.title}".`);
    return c.json({ message: 'Syllabus uploaded successfully.', syllabus: toSyllabus(resource) }, 201);
  } catch (error: any) {
    console.error('Syllabus upload error:', error);
    return c.json({ message: error?.message || 'Failed to upload syllabus.' }, 500);
  }
});

// GET /api/syllabi/:id/url — short-lived link to view the PDF.
// Reviewees may open active syllabi; content managers may open any.
syllabusRoutes.get('/:id/url', async (c) => {
  const auth = await requireUser(c);
  if (auth.response) return auth.response;

  const { data: row } = await supabaseAdmin.from('bb_resources_tbl').select('is_archived').eq('resource_id', c.req.param('id')).maybeSingle();
  const isStaff = CONTENT_MANAGER_ROLES.includes(auth.profile.role.toLowerCase());
  if (!row || (row.is_archived && !isStaff)) return c.json({ message: 'Syllabus not found.' }, 404);

  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(filePath(c.req.param('id')), 60 * 10);
  if (error || !data) return c.json({ message: 'The PDF for this syllabus could not be found.' }, 404);

  return c.json({ url: data.signedUrl });
});

// PATCH /api/syllabi/:id — { title, subjectId, examDay } or { isArchived }
syllabusRoutes.patch('/:id', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  const id = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ message: 'Invalid JSON.' }, 400);

  let update: Record<string, unknown>;
  let message: string;

  if (typeof body.isArchived === 'boolean' && body.title === undefined) {
    update = { is_archived: body.isArchived };
    message = body.isArchived ? 'Syllabus archived.' : 'Syllabus restored.';
  } else {
    const meta = await validateMeta(body);
    if ('error' in meta) return c.json({ message: meta.error }, 400);
    if (await titleTaken(await getSyllabusTagId(), meta.title, id)) {
      return c.json({ message: `A syllabus titled "${meta.title}" already exists.` }, 409);
    }
    update = { resource_desc: meta.title, question_subject_id: meta.subjectId, exam_day: meta.examDay };
    message = 'Syllabus updated.';
  }

  const { data, error } = await supabaseAdmin
    .from('bb_resources_tbl')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('resource_id', id)
    .select('resource_desc')
    .maybeSingle();

  if (error) {
    console.error('Syllabus update error:', error);
    return c.json({ message: 'Unable to update syllabus.' }, 500);
  }
  if (!data) return c.json({ message: 'Syllabus not found.' }, 404);

  await logEvent(auth.profile.user_id, 'syllabi', `${message.replace('.', '')}: "${data.resource_desc}".`);
  return c.json({ message });
});

// POST /api/syllabi/:id/file — replace the PDF (multipart: file)
syllabusRoutes.post('/:id/file', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  const id = c.req.param('id');
  const { data: row } = await supabaseAdmin.from('bb_resources_tbl').select('resource_desc').eq('resource_id', id).maybeSingle();
  if (!row) return c.json({ message: 'Syllabus not found.' }, 404);

  const form = await c.req.parseBody().catch(() => null);
  const pdf = await readPdf(form?.file);
  if (pdf.error !== undefined) return c.json({ message: pdf.error }, 400);

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filePath(id), pdf.bytes, { contentType: 'application/pdf', cacheControl: '3600', upsert: true });
  if (error) return c.json({ message: 'Unable to replace the PDF.' }, 500);

  await supabaseAdmin
    .from('bb_resources_tbl')
    .update({ resource_file_name: pdf.name, resource_file_size: pdf.size, updated_at: new Date().toISOString() })
    .eq('resource_id', id);

  await logEvent(auth.profile.user_id, 'syllabi', `Replaced the PDF of "${row.resource_desc}".`);
  return c.json({ message: 'PDF replaced.' });
});

// DELETE /api/syllabi/:id — removes the record and its PDF
syllabusRoutes.delete('/:id', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  const id = c.req.param('id');
  const { data, error } = await supabaseAdmin.from('bb_resources_tbl').delete().eq('resource_id', id).select('resource_desc').maybeSingle();

  if (error) return c.json({ message: 'Unable to delete syllabus.' }, 500);
  if (!data) return c.json({ message: 'Syllabus not found.' }, 404);

  await supabaseAdmin.storage.from(BUCKET).remove([filePath(id)]);
  await logEvent(auth.profile.user_id, 'syllabi', `Deleted syllabus "${data.resource_desc}".`, 'WARNING');
  return c.json({ message: 'Syllabus deleted.' });
});
