import { useEffect, useRef, useState } from 'react';
import Modal from '../common/Modal';
import FormField from '../common/FormField';
import { apiRequest } from '../../lib/api';

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

// Default Bar examination day per subject (editable per syllabus)
const DEFAULT_EXAM_DAY = {
  'Political Law': 1,
  'Commercial Law': 1,
  'Taxation Law': 1,
  'Civil Law': 2,
  'Labor Law': 2,
  'Criminal Law': 3,
  'Remedial Law': 3,
  Ethics: 3,
};

// Real PDFs start with "%PDF-"; this catches files that were only renamed
async function looksLikePdf(file) {
  const header = await file.slice(0, 5).text();
  return header === '%PDF-';
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
  const [subjectId, setSubjectId] = useState(syllabus?.subjectId ?? '');
  const [examDay, setExamDay] = useState(syllabus?.examDay ? String(syllabus.examDay) : '');
  const [subjects, setSubjects] = useState([]);
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (!open) return;
    apiRequest('/questions/subjects')
      .then((r) => setSubjects(r.subjects))
      .catch(() => setSubjects([]));
  }, [open]);

  const chooseSubject = (id) => {
    setSubjectId(id);
    const name = subjects.find((s) => s.id === id)?.name;
    if (name && DEFAULT_EXAM_DAY[name]) setExamDay(String(DEFAULT_EXAM_DAY[name]));
  };

  const [saving, setSaving] = useState(false);

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
    setSubjectId(syllabus?.subjectId ?? '');
    setExamDay(syllabus?.examDay ? String(syllabus.examDay) : '');
    setFile(null);
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

    if (!subjectId) {
      setError('Choose the Bar subject this syllabus covers.');
      return;
    }

    if (!file && !editing) {
      setError('Please select the syllabus PDF.');
      return;
    }

    setSaving(true);

    try {
      // The backend checks the user's role, stores the PDF and saves the record
      if (editing) {
        await apiRequest(`/syllabi/${syllabus.id}`, {
          method: 'PATCH',
          body: { title: cleanTitle, subjectId, examDay: examDay ? Number(examDay) : '' },
        });
        if (file) {
          const form = new FormData();
          form.append('file', file);
          await apiRequest(`/syllabi/${syllabus.id}/file`, { method: 'POST', body: form });
        }
        if (onCreated) await onCreated({ ...syllabus, title: cleanTitle });
      } else {
        const form = new FormData();
        form.append('title', cleanTitle);
        form.append('subjectId', subjectId);
        if (examDay) form.append('examDay', examDay);
        form.append('file', file);

        const result = await apiRequest('/syllabi', { method: 'POST', body: form });

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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
          <label style={{ display: 'block', marginBottom: '16px' }}>
            <span style={fieldLabelStyle}>Bar Subject <span style={{ color: 'var(--gold)' }}>*</span></span>
            <select value={subjectId} onChange={(e) => chooseSubject(e.target.value)} style={selectStyle}>
              <option value="">Choose subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name === 'Ethics' ? 'Legal Ethics' : s.name}</option>
              ))}
            </select>
          </label>
          <label style={{ display: 'block', marginBottom: '16px' }}>
            <span style={fieldLabelStyle}>Examination Day</span>
            <select value={examDay} onChange={(e) => setExamDay(e.target.value)} style={selectStyle}>
              <option value="">Not set</option>
              {[1, 2, 3, 4].map((d) => <option key={d} value={d}>Day {d}</option>)}
            </select>
          </label>
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
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Upload Syllabus'}
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
const fieldLabelStyle = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  display: 'block',
  marginBottom: '6px',
};

const selectStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid var(--card-border)',
  fontSize: '13px',
  background: '#fff',
  color: 'var(--navy)',
};
