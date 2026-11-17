
import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase';
import { CONTENT_MANAGER_ROLES, requireUser } from '../lib/auth';
import { logEvent } from '../lib/logs';
import { loadSubjects } from '../lib/subjects';
import { slugForSubject } from '../lib/competency';
import { EXAM_DAYS } from '../lib/packages';

// Syllabi Management (paper Figures 1.4, 3.4). Each upload is one syllabus PDF
// covering one Bar subject, one examination day, or every subject. Everyone
// signed in can read and download it; Review Administrators upload, rename,
// re-tag, replace, archive and delete.
export const syllabusRoutes = new Hono();

const BUCKET = 'syllabi';
const MAX_PDF_BYTES = 20 * 1024 * 1024;
const MIN_TITLE_LENGTH = 3;
const MAX_TITLE_LENGTH = 150;

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

function toSyllabus(row: any) {
  return {
    id: row.resource_id,
    title: row.resource_desc,
    isArchived: row.is_archived,
    fileName: row.resource_file_name,
    fileSize: row.resource_file_size,
    subjectId: row.question_subject_id ?? null,
    subject: row.bb_question_subjects_tbl?.question_subject_desc ?? null,
    examDay: row.exam_day ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    uploadedBy: row.bb_users_tbl ? `${row.bb_users_tbl.user_fname || ''} ${row.bb_users_tbl.user_lname || ''}`.trim() : '',
  };
}

const SELECT = `
  resource_id, resource_desc, is_archived, resource_file_name, resource_file_size,
  question_subject_id, exam_day, created_at, updated_at,
  bb_question_subjects_tbl ( question_subject_desc ),
  bb_users_tbl ( user_fname, user_lname )
`;

// PDFs go from the browser straight to Storage (API Gateway and Lambda cap a
// request body at a few MB), into a staging folder of the uploader. Saving
// then checks that upload and copies it to the syllabus's own path.
const uploadPrefix = (userId: string) => `uploads/${userId}/`;
const UPLOAD_NAME = /^[0-9a-f-]{36}\.pdf$/;

function checkPdfMeta(name: unknown, size: unknown) {
  const fileName = String(name || '');
  const fileSize = Number(size);
  if (!fileName.toLowerCase().endsWith('.pdf')) return { error: 'Only PDF files are allowed.' };
  if (!Number.isFinite(fileSize) || fileSize <= 0) return { error: 'The PDF is empty.' };
  if (fileSize > MAX_PDF_BYTES) return { error: 'The PDF must be 20 MB or smaller.' };
  return { fileName };
}

// Reads the staged upload. Whatever the outcome, the staging copy is removed.
async function readPdf(userId: string, uploadPath: unknown, fileName: unknown) {
  const path = String(uploadPath || '');
  const prefix = uploadPrefix(userId);
  if (!path.startsWith(prefix) || !UPLOAD_NAME.test(path.slice(prefix.length))) {
    return { error: 'Please attach the syllabus PDF.' };
  }

  const { data: blob, error } = await supabaseAdmin.storage.from(BUCKET).download(path);
  await supabaseAdmin.storage.from(BUCKET).remove([path]);
  if (error || !blob) return { error: 'The uploaded PDF could not be found. Please upload it again.' };

  const meta = checkPdfMeta(fileName, blob.size);
  if (meta.error !== undefined) return { error: meta.error };

  const bytes = new Uint8Array(await blob.arrayBuffer());

  // Real PDFs start with "%PDF-"; this rejects renamed files (paper TC: invalid syllabus file)
  if (new TextDecoder().decode(bytes.subarray(0, 5)) !== '%PDF-') return { error: 'Only PDF files are allowed.' };

  return { bytes, name: meta.fileName.slice(0, 200), size: blob.size };
}

function validateTitle(input: unknown) {
  const title = String(input || '').replace(/\s+/g, ' ').trim();
  if (title.length < MIN_TITLE_LENGTH || title.length > MAX_TITLE_LENGTH) {
    return { error: `Title must be ${MIN_TITLE_LENGTH}-${MAX_TITLE_LENGTH} characters.` };
  }
  return { title };
}

// Coverage (paper Figure 1.4): a Bar subject (its examination day follows the
// Bar schedule), an examination day, or every subject when both are empty
async function resolveCoverage(subjectId: unknown, examDay: unknown) {
  if (subjectId) {
    const { subjects } = await loadSubjects();
    const subject = subjects.find((s) => s.question_subject_id === subjectId);
    if (!subject) return { error: 'Choose a valid Bar subject.' };
    const slug = slugForSubject(subject.question_subject_desc);
    const day = EXAM_DAYS.find((d) => d.slugs.includes(slug))?.day ?? null;
    return { columns: { question_subject_id: subject.question_subject_id, exam_day: day } };
  }
  if (examDay === null || examDay === undefined || examDay === '') {
    return { columns: { question_subject_id: null, exam_day: null } };
  }
  const day = Number(examDay);
  if (!EXAM_DAYS.some((d) => d.day === day)) return { error: 'Choose a valid examination day.' };
  return { columns: { question_subject_id: null, exam_day: day } };
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
    return c.json({ syllabi: (data || []).map(toSyllabus) });
  } catch (error: any) {
    console.error('Syllabus list error:', error);
    return c.json({ message: error?.message || 'Unable to load syllabi.' }, 500);
  }
});

// POST /api/syllabi/upload-url — { fileName, fileSize } → { path, token } for
// supabase.storage.from('syllabi').uploadToSignedUrl(path, token, file)
syllabusRoutes.post('/upload-url', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ message: 'Invalid JSON.' }, 400);

  const meta = checkPdfMeta(body.fileName, body.fileSize);
  if (meta.error !== undefined) return c.json({ message: meta.error }, meta.error.includes('20 MB') ? 413 : 400);

  const path = `${uploadPrefix(auth.profile.user_id)}${crypto.randomUUID()}.pdf`;
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error('Syllabus upload URL error:', error);
    return c.json({ message: 'Unable to start the upload.' }, 500);
  }

  return c.json({ path: data.path, token: data.token });
});

// POST /api/syllabi — { title, subjectId?, examDay?, uploadPath, fileName }
// after the PDF was uploaded
syllabusRoutes.post('/', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ message: 'Invalid JSON.' }, 400);

  const meta = validateTitle(body.title);
  if ('error' in meta) return c.json({ message: meta.error }, 400);

  try {
    const coverage = await resolveCoverage(body.subjectId, body.examDay);
    if (coverage.error !== undefined) {
      if (body.uploadPath) await readPdf(auth.profile.user_id, body.uploadPath, body.fileName); // clears the staged upload
      return c.json({ message: coverage.error }, 400);
    }

    // Read first: it also clears the staged upload when saving stops below
    const pdf = await readPdf(auth.profile.user_id, body.uploadPath, body.fileName);
    if (pdf.error !== undefined) return c.json({ message: pdf.error }, pdf.error.includes('20 MB') ? 413 : 400);

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
        ...coverage.columns,
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

// GET /api/syllabi/:id/url?download=1 — short-lived link to view or download
// the PDF. Everyone may open active syllabi; content managers may open any.
syllabusRoutes.get('/:id/url', async (c) => {
  const auth = await requireUser(c);
  if (auth.response) return auth.response;

  const { data: row } = await supabaseAdmin.from('bb_resources_tbl').select('is_archived, resource_desc, resource_file_name').eq('resource_id', c.req.param('id')).maybeSingle();
  const isStaff = CONTENT_MANAGER_ROLES.includes(auth.profile.role.toLowerCase());
  if (!row || (row.is_archived && !isStaff)) return c.json({ message: 'Syllabus not found.' }, 404);

  const download = c.req.query('download') === '1';
  const downloadName = `${String(row.resource_desc).replace(/[^\w\- ]+/g, '').trim() || 'BarBuddy Syllabus'}.pdf`;
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(filePath(c.req.param('id')), 60 * 10, download ? { download: downloadName } : undefined);
  if (error || !data) return c.json({ message: 'The PDF for this syllabus could not be found.' }, 404);

  return c.json({ url: data.signedUrl });
});

// PATCH /api/syllabi/:id — { title, subjectId?, examDay? } or { isArchived }
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
    const meta = validateTitle(body.title);
    if ('error' in meta) return c.json({ message: meta.error }, 400);
    if (await titleTaken(await getSyllabusTagId(), meta.title, id)) {
      return c.json({ message: `A syllabus titled "${meta.title}" already exists.` }, 409);
    }
    update = { resource_desc: meta.title };
    // Coverage changes only when the form sends it
    if ('subjectId' in body || 'examDay' in body) {
      const coverage = await resolveCoverage(body.subjectId, body.examDay);
      if (coverage.error !== undefined) return c.json({ message: coverage.error }, 400);
      update = { ...update, ...coverage.columns };
    }
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

// POST /api/syllabi/:id/file — replace the PDF: { uploadPath, fileName }
syllabusRoutes.post('/:id/file', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  const id = c.req.param('id');
  const { data: row } = await supabaseAdmin.from('bb_resources_tbl').select('resource_desc').eq('resource_id', id).maybeSingle();
  if (!row) return c.json({ message: 'Syllabus not found.' }, 404);

  const body = await c.req.json().catch(() => null);
  const pdf = await readPdf(auth.profile.user_id, body?.uploadPath, body?.fileName);
  if (pdf.error !== undefined) return c.json({ message: pdf.error }, pdf.error.includes('20 MB') ? 413 : 400);

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
