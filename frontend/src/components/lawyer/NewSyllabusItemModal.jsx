import { useEffect, useRef, useState } from 'react';
import Modal from '../common/Modal';
import FormField from '../common/FormField';
import { apiRequest } from '../../lib/api';
import * as tus from 'tus-js-client';
import { confirmAction } from '../../lib/swal';

const MAX_PDF_BYTES = 20 * 1024 * 1024;
const MIN_TITLE_LENGTH = 3;
const MAX_TITLE_LENGTH = 150;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Real PDFs start with "%PDF-"; this catches files that were only renamed
async function looksLikePdf(file) {
  const header = await file.slice(0, 5).text();
  return header === '%PDF-';
}

// Supabase recommends its direct storage hostname for large uploads
const RESUMABLE_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL.replace('.supabase.co', '.storage.supabase.co')}/storage/v1/upload/resumable/sign`;

// The PDF goes straight to Supabase Storage (the API only takes small
// requests); the backend then checks it and attaches it to the syllabus.
// Resumable (TUS) upload in 6 MB chunks: a dropped connection retries the
// current chunk instead of failing the whole file.
async function uploadPdf(file, onProgress) {
  const { path, token } = await apiRequest('/syllabi/upload-url', {
    method: 'POST',
    body: { fileName: file.name, fileSize: file.size },
  });

  await new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: RESUMABLE_ENDPOINT,
      retryDelays: [0, 1000, 3000, 5000, 10000, 20000],
      headers: { 'x-signature': token, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: { bucketName: 'syllabi', objectName: path, contentType: 'application/pdf', cacheControl: '3600' },
      chunkSize: 6 * 1024 * 1024, // required by Supabase
      onProgress: (sent, total) => onProgress?.(Math.round((sent / total) * 100)),
      onError: () => reject(new Error('The PDF could not be uploaded. Check your connection and try again.')),
      onSuccess: resolve,
    });
    upload.start();
  });

  return { uploadPath: path, fileName: file.name };
}

export default function NewSyllabusItemModal({
  open,
  onClose,
  onCreated,
  existingTitles = [],
  syllabus = null, // pass an existing syllabus to edit it
}) {
  const editing = Boolean(syllabus);
  const [title, setTitle] = useState(syllabus?.title ?? '');
  const [file, setFile] = useState(null);

  // Coverage (paper Figure 1.4): one Bar subject (its exam day follows the
  // Bar schedule), one examination day, or all subjects
  const [subjects, setSubjects] = useState(null);
  const [subjectId, setSubjectId] = useState(syllabus?.subjectId ?? '');
  const [examDay, setExamDay] = useState(syllabus && !syllabus.subjectId && syllabus.examDay ? String(syllabus.examDay) : '');

  useEffect(() => {
    if (!open || subjects) return;
    apiRequest('/questions/subjects')
      .then((result) => setSubjects(result.subjects))
      .catch(() => setSubjects([]));
  }, [open, subjects]);

  const chosenSubject = subjects?.find((s) => s.id === subjectId) ?? null;
  const examDays = [...new Set((subjects || []).map((s) => s.examDay).filter(Boolean))].sort();
  const subjectOptions = [
    { value: '', label: 'All subjects' },
    ...(subjects || []).map((s) => ({ value: s.id, label: s.name === 'Ethics' ? 'Legal Ethics' : s.name })),
  ];
  const dayOptions = chosenSubject
    ? [{ value: String(chosenSubject.examDay ?? ''), label: chosenSubject.examDay ? `Day ${chosenSubject.examDay} (follows the subject)` : 'Not on the exam schedule' }]
    : [{ value: '', label: 'All examination days' }, ...examDays.map((d) => ({ value: String(d), label: `Day ${d}` }))];
  const coverage = { subjectId: subjectId || null, examDay: subjectId || !examDay ? null : Number(examDay) };

  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(null);

  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0];

    if (!selected) return;

    const isPdf =
      selected.name.toLowerCase().endsWith('.pdf') &&
      (await looksLikePdf(selected));

    if (!isPdf) {
      setError('Please select a valid PDF file.');
      e.target.value = '';
      return;
    }

    if (selected.size === 0) {
      setError('The selected PDF is empty.');
      e.target.value = '';
      return;
    }

    if (selected.size > MAX_PDF_BYTES) {
      setError('The PDF must be 20MB or smaller.');
      e.target.value = '';
      return;
    }

    setError('');
    setFile(selected);

    // Suggest a title from the file name when none was typed yet
    if (!title.trim()) {
      setTitle(selected.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim().slice(0, MAX_TITLE_LENGTH));
    }
  };

  const resetForm = () => {
    setTitle(syllabus?.title ?? '');
    setFile(null);
    setSubjectId(syllabus?.subjectId ?? '');
    setExamDay(syllabus && !syllabus.subjectId && syllabus.examDay ? String(syllabus.examDay) : '');
    setError('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (saving) return;

    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    const cleanTitle = title.replace(/\s+/g, ' ').trim();

    if (cleanTitle.length < MIN_TITLE_LENGTH || cleanTitle.length > MAX_TITLE_LENGTH) {
      setError(`The title must be ${MIN_TITLE_LENGTH}-${MAX_TITLE_LENGTH} characters.`);
      return;
    }

    if (existingTitles.some((t) => t.toLowerCase() === cleanTitle.toLowerCase() && t.toLowerCase() !== syllabus?.title?.toLowerCase())) {
      setError(`A syllabus titled "${cleanTitle}" already exists.`);
      return;
    }

    if (!file && !editing) {
      setError('Please select the syllabus PDF.');
      return;
    }

    const ok = await confirmAction({
      title: editing ? 'Save changes to this syllabus?' : 'Upload this syllabus?',
      text: editing
        ? `"${cleanTitle}" will be updated${file ? ' and its PDF replaced' : ''}. Everyone sees the change right away.`
        : `"${cleanTitle}" will be published for every reviewee to read and download.`,
      confirmText: editing ? 'Yes, save' : 'Yes, upload',
    });
    if (!ok) return;

    setSaving(true);

    try {
      // The backend checks the user's role and the uploaded PDF, then saves the record
      if (editing) {
        await apiRequest(`/syllabi/${syllabus.id}`, {
          method: 'PATCH',
          body: { title: cleanTitle, ...coverage },
        });
        if (file) {
          await apiRequest(`/syllabi/${syllabus.id}/file`, { method: 'POST', body: await uploadPdf(file, setProgress) });
        }
        if (onCreated) {
          await onCreated({
            ...syllabus,
            title: cleanTitle,
            subjectId: coverage.subjectId,
            subject: chosenSubject?.name ?? null,
            examDay: chosenSubject ? chosenSubject.examDay : coverage.examDay,
          });
        }
      } else {
        const result = await apiRequest('/syllabi', {
          method: 'POST',
          body: { title: cleanTitle, ...coverage, ...(await uploadPdf(file, setProgress)) },
        });

        if (onCreated) {
          await onCreated(result.syllabus);
        }
      }

      resetForm();
      onClose();

    } catch (err) {
      console.error('Syllabus upload error:', err);

      setError(
        err.message || 'Failed to upload syllabus.'
      );
    } finally {
      setSaving(false);
      setProgress(null);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={editing ? 'Edit Syllabus' : 'Upload Syllabus'}
    >
      <form onSubmit={handleSubmit}>

        {error && (
          <div
            style={{
              background: '#fdf0f0',
              color: '#9b1c1c',
              border: '1px solid #e5b8b8',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '12px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <FormField
          label="Syllabus Title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Bar Exam 2026 Syllabus"
          required
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', columnGap: '12px' }}>
          <FormField
            label="Bar Subject"
            type="select"
            name="subjectId"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            options={subjectOptions}
            loading={!subjects}
          />
          <FormField
            label="Examination Day"
            type="select"
            name="examDay"
            value={chosenSubject ? String(chosenSubject.examDay ?? '') : examDay}
            onChange={(e) => setExamDay(e.target.value)}
            options={dayOptions}
            loading={!subjects}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            {editing ? 'Replace PDF (optional)' : 'Syllabus PDF'}
          </label>

          {!file ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                border: '1.5px dashed var(--card-border)',
                borderRadius: '8px',
                background: 'var(--bg)',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: '24px',
                  color: 'var(--navy)',
                }}
              >
                upload_file
              </span>

              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--navy)',
                }}
              >
                Click to upload a PDF
              </span>

              <span style={{ fontSize: '11px' }}>
                PDF only, up to 20MB
              </span>
            </button>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid var(--card-border)',
                borderRadius: '8px',
                padding: '10px 12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: 0,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '18px',
                    color: 'var(--navy)',
                  }}
                >
                  picture_as_pdf
                </span>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {file.name}
                  </div>

                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {formatFileSize(file.size)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFile(null);

                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                <span className="material-symbols-outlined">
                  close
                </span>
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
            marginTop: '8px',
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            style={outlineButtonStyle}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            style={{
              ...navyButtonStyle,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (progress !== null && progress < 100 ? `Uploading PDF... ${progress}%` : 'Saving...') : editing ? 'Save Changes' : 'Upload Syllabus'}
          </button>
        </div>

      </form>
    </Modal>
  );
}

const navyButtonStyle = {
  background: 'var(--navy)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '10px 18px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
};

const outlineButtonStyle = {
  background: '#fff',
  color: 'var(--navy)',
  border: '1px solid var(--card-border)',
  borderRadius: '8px',
  padding: '10px 18px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
};

