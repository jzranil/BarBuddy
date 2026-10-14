
import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase';
import { CONTENT_MANAGER_ROLES, requireUser } from '../lib/auth';

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

// GET /api/syllabi — every syllabus document, newest first
syllabusRoutes.get('/', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  try {
    const tagId = await getSyllabusTagId();

    const { data, error } = await supabaseAdmin
      .from('bb_resources_tbl')
      .select(`
        resource_id,
        resource_desc,
        is_archived,
        created_at,
        updated_at,
        bb_users_tbl ( user_fname, user_lname )
      `)
      .eq('resource_tags', tagId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return c.json({
      syllabi: (data || []).map((row: any) => ({
        id: row.resource_id,
        title: row.resource_desc,
        isArchived: row.is_archived,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        uploadedBy: row.bb_users_tbl
          ? `${row.bb_users_tbl.user_fname || ''} ${row.bb_users_tbl.user_lname || ''}`.trim()
          : '',
      })),
    });
  } catch (error: any) {
    console.error('Syllabus list error:', error);
    return c.json({ message: error?.message || 'Unable to load syllabi.' }, 500);
  }
});

// POST /api/syllabi — multipart form: title, file (PDF)
syllabusRoutes.post('/', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  let form: Record<string, unknown>;

  try {
    form = await c.req.parseBody();
  } catch {
    return c.json({ message: 'Invalid upload.' }, 400);
  }

  const title = String(form.title || '').replace(/\s+/g, ' ').trim();
  const file = form.file;

  if (title.length < MIN_TITLE_LENGTH || title.length > MAX_TITLE_LENGTH) {
    return c.json(
      { message: `Title must be ${MIN_TITLE_LENGTH}-${MAX_TITLE_LENGTH} characters.` },
      400
    );
  }

  if (!(file instanceof File)) {
    return c.json({ message: 'Please attach the syllabus PDF.' }, 400);
  }

  if (file.size === 0) {
    return c.json({ message: 'The PDF is empty.' }, 400);
  }

  if (file.size > MAX_PDF_BYTES) {
    return c.json({ message: 'The PDF must be 20 MB or smaller.' }, 413);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  // Real PDFs start with "%PDF-"; this rejects renamed files
  const isPdf =
    file.name.toLowerCase().endsWith('.pdf') &&
    new TextDecoder().decode(bytes.subarray(0, 5)) === '%PDF-';

  if (!isPdf) {
    return c.json({ message: 'Only PDF files are allowed.' }, 400);
  }

  try {
    const tagId = await getSyllabusTagId();

    // No two active syllabi with the same title
    const { data: sameTitle, error: titleError } = await supabaseAdmin
      .from('bb_resources_tbl')
      .select('resource_id')
      .eq('resource_tags', tagId)
      .eq('is_archived', false)
      .ilike('resource_desc', title.replace(/[\\%_]/g, '\\$&'))
      .limit(1);

    if (titleError) throw titleError;

    if (sameTitle && sameTitle.length > 0) {
      return c.json({ message: `A syllabus titled "${title}" already exists.` }, 409);
    }

    const { data: resource, error: insertError } = await supabaseAdmin
      .from('bb_resources_tbl')
      .insert({
        user_id: auth.profile.user_id,
        resource_tags: tagId,
        resource_desc: title,
        is_archived: false,
      })
      .select('resource_id, resource_desc, is_archived, created_at, updated_at')
      .single();

    if (insertError) throw insertError;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath(resource.resource_id), bytes, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      // Remove the record we just created so no syllabus points at a missing file
      await supabaseAdmin.from('bb_resources_tbl').delete().eq('resource_id', resource.resource_id);
      throw uploadError;
    }

    return c.json(
      {
        message: 'Syllabus uploaded successfully.',
        syllabus: {
          id: resource.resource_id,
          title: resource.resource_desc,
          isArchived: resource.is_archived,
          createdAt: resource.created_at,
          updatedAt: resource.updated_at,
          uploadedBy: auth.profile.full_name,
        },
      },
      201
    );
  } catch (error: any) {
    console.error('Syllabus upload error:', error);
    return c.json({ message: error?.message || 'Failed to upload syllabus.' }, 500);
  }
});

// GET /api/syllabi/:id/url — short-lived link to view the PDF
syllabusRoutes.get('/:id/url', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(filePath(c.req.param('id')), 60 * 10);

  if (error || !data) {
    return c.json({ message: 'The PDF for this syllabus could not be found.' }, 404);
  }

  return c.json({ url: data.signedUrl });
});

// PATCH /api/syllabi/:id — Body: { isArchived: boolean }
syllabusRoutes.patch('/:id', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  let body: any;

  try {
    body = await c.req.json();
  } catch {
    return c.json({ message: 'Invalid JSON.' }, 400);
  }

  if (typeof body?.isArchived !== 'boolean') {
    return c.json({ message: 'isArchived must be true or false.' }, 400);
  }

  const { data, error } = await supabaseAdmin
    .from('bb_resources_tbl')
    .update({ is_archived: body.isArchived, updated_at: new Date().toISOString() })
    .eq('resource_id', c.req.param('id'))
    .select('resource_id')
    .maybeSingle();

  if (error) {
    console.error('Syllabus update error:', error);
    return c.json({ message: 'Unable to update syllabus.' }, 500);
  }

  if (!data) {
    return c.json({ message: 'Syllabus not found.' }, 404);
  }

  return c.json({ message: body.isArchived ? 'Syllabus archived.' : 'Syllabus restored.' });
});
