import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../common/Modal';
import FormField from '../common/FormField';
import { SUBJECTS } from '../../data/subjects';

const STATUS_OPTIONS = ['Draft', 'Published', 'Archived'];
const SUBJECT_OPTIONS = SUBJECTS.map((s) => s.name);

const EMPTY_FORM = { title: '', subject: SUBJECT_OPTIONS[0], version: '', status: 'Draft', notes: '' };

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NewSyllabusItemModal({ open, onClose }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null); // client-side only — BACKEND TODO: upload to S3 once storage exists
  const fileInputRef = useRef(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // BACKEND TODO: POST /api/lawyer/curriculum (multipart/form-data,
    // including `file` if attached) with this form data, then refresh the
    // Curriculum Inventory table once the server confirms.
    setForm(EMPTY_FORM);
    setFile(null);
    onClose();
    navigate('/coming-soon', { state: { title: 'New Syllabus Item', description: 'Saving a new syllabus record (and uploading the attached document) connects here once the curriculum API and file storage exist.' } });
  };

  return (
    <Modal open={open} onClose={onClose} title="New Syllabus Item">
      <form onSubmit={handleSubmit}>
        <FormField label="Title" name="title" value={form.title} onChange={handleChange} placeholder="e.g. 2024 Pre-Week Remedial" required />
        <FormField label="Bar Subject" type="select" name="subject" value={form.subject} onChange={handleChange} options={SUBJECT_OPTIONS} required />
        <FormField label="Version" name="version" value={form.version} onChange={handleChange} placeholder="e.g. 2024.1.0" required />
        <FormField label="Status" type="select" name="status" value={form.status} onChange={handleChange} options={STATUS_OPTIONS} required />

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Syllabus Document (optional)
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
              <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--navy)' }}>upload_file</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>Click to upload a file</span>
              <span style={{ fontSize: '11px' }}>PDF or Word document, up to 20MB</span>
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--navy)' }}>description</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatFileSize(file.size)}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                aria-label="Remove file"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        <FormField label="Notes (optional)" type="textarea" name="notes" value={form.notes} onChange={handleChange} placeholder="What's covered in this syllabus item..." />

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button type="button" onClick={onClose} style={outlineButtonStyle}>Cancel</button>
          <button type="submit" style={navyButtonStyle}>Save Syllabus Item</button>
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
