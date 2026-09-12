import { useRef, useState } from 'react';
import Modal from '../common/Modal';
import FormField from '../common/FormField';
import { supabase } from '../../lib/supabaseClient';

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NewSyllabusItemModal({
  open,
  onClose,
  onCreated,
}) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);

  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');

  const [loadingTags, setLoadingTags] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  const loadTags = async () => {
    setLoadingTags(true);
    setError('');

    const { data, error } = await supabase
      .from('bb_resource_tags_tbl')
      .select('resource_tag_id, resource_tag_title')
      .order('resource_tag_title');

    if (error) {
      console.error(error);
      setError('Unable to load resource tags.');
    } else {
      setTags(data || []);

      const syllabusTag = (data || []).find(
        (tag) =>
          tag.resource_tag_title.toLowerCase() === 'syllabus'
      );

      if (syllabusTag) {
        setSelectedTag(syllabusTag.resource_tag_id);
      }
    }

    setLoadingTags(false);
  };

  const handleOpen = () => {
    loadTags();
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];

    if (!selected) return;

    const isPdf =
      selected.type === 'application/pdf' ||
      selected.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setError('Please select a PDF file only.');
      e.target.value = '';
      return;
    }

    if (selected.size > 20 * 1024 * 1024) {
      setError('The PDF must be 20MB or smaller.');
      e.target.value = '';
      return;
    }

    setError('');
    setFile(selected);
  };

  const resetForm = () => {
    setTitle('');
    setFile(null);
    setSelectedTag('');
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

    if (!title.trim()) {
      setError('Please enter a syllabus title.');
      return;
    }

    if (!selectedTag) {
      setError('Please select the Syllabus resource tag.');
      return;
    }

    if (!file) {
      setError('Please select the syllabus PDF.');
      return;
    }

    setSaving(true);

    let resourceId = null;

    try {
      // Get currently logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error('You must be logged in to upload a syllabus.');
      }

      // 1. Create the resource record
      const { data: resource, error: resourceError } =
        await supabase
          .from('bb_resources_tbl')
          .insert({
            user_id: user.id,
            resource_tags: selectedTag,
            resource_desc: title.trim(),
            is_archived: false,
          })
          .select('resource_id')
          .single();

      if (resourceError) {
        throw resourceError;
      }

      resourceId = resource.resource_id;

      // 2. Upload PDF using the resource ID
      const filePath = `syllabi/${resourceId}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('syllabi')
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: 'application/pdf',
          upsert: false,
        });

      if (uploadError) {
        // Remove resource if PDF upload fails
        await supabase
          .from('bb_resources_tbl')
          .delete()
          .eq('resource_id', resourceId);

        throw uploadError;
      }

      // 3. Refresh the Curriculum page
      if (onCreated) {
        await onCreated();
      }

      // 4. Close modal
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
      title="Upload Syllabus"
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

        <FormField
          label="Resource Tag"
          type="select"
          name="resource_tag"
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          options={
            loadingTags
              ? ['Loading...']
              : tags.map((tag) => ({
                  value: tag.resource_tag_id,
                  label: tag.resource_tag_title,
                }))
          }
          required
        />

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
            Syllabus PDF
          </label>

          {!file ? (
            <button
              type="button"
              onClick={() => {
                handleOpen();
                fileInputRef.current?.click();
              }}
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
            {saving
              ? 'Uploading...'
              : 'Upload Syllabus'}
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