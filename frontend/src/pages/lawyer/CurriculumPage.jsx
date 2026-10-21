import { useEffect, useState } from 'react';

import LawyerLayout from '../../layouts/LawyerLayout';
import NewSyllabusItemModal from '../../components/lawyer/NewSyllabusItemModal';

import { apiRequest } from '../../lib/api';
import { openSyllabusPdf } from '../../lib/useLawyerContent';
import { confirmAction } from '../../lib/swal';
import { usePaged } from '../../lib/usePaged';
import ListPager from '../../components/common/ListPager';
import { Skeleton, SkeletonTableRows } from '../../components/common/Skeleton';


export default function CurriculumPage() {
const [searchTerm, setSearchTerm] = useState('');
const [syllabusModalOpen, setSyllabusModalOpen] = useState(false);

const [syllabi, setSyllabi] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [notice, setNotice] = useState(null);
const [busyId, setBusyId] = useState(null);
const [editing, setEditing] = useState(null);

const fetchSyllabi = async () => {
  try {
    const { syllabi: rows } = await apiRequest('/syllabi');
    return { rows, error: '' };
  } catch (err) {
    console.error('Error loading syllabi:', err);
    return { rows: [], error: err.message || 'Failed to load syllabi.' };
  }
};

const applySyllabi = ({ rows, error: loadError }) => {
  setSyllabi(rows);
  setError(loadError);
  setLoading(false);
};

const loadSyllabi = async () => applySyllabi(await fetchSyllabi());

const openPdf = async (row) => {
  try {
    await openSyllabusPdf(row.id);
  } catch (err) {
    setNotice({ tone: 'error', text: err.message });
  }
};

const removeSyllabus = async (row) => {
  if (!(await confirmAction({ title: `Delete "${row.title}"?`, text: 'The syllabus and its PDF are permanently deleted for everyone. This cannot be undone.', confirmText: 'Yes, delete', danger: true }))) return;
  setBusyId(row.id);
  try {
    const result = await apiRequest(`/syllabi/${row.id}`, { method: 'DELETE' });
    setNotice({ tone: 'success', text: result.message });
    await loadSyllabi();
  } catch (err) {
    setNotice({ tone: 'error', text: err.message });
  } finally {
    setBusyId(null);
  }
};

const toggleArchive = async (row) => {
  const ok = await confirmAction({
    title: row.isArchived ? `Restore "${row.title}"?` : `Archive "${row.title}"?`,
    text: row.isArchived ? 'Reviewees will be able to read and download it again.' : 'Reviewees will no longer see it. You can restore it later.',
    confirmText: row.isArchived ? 'Yes, restore' : 'Yes, archive',
  });
  if (!ok) return;
  setBusyId(row.id);

  try {
    const result = await apiRequest(`/syllabi/${row.id}`, {
      method: 'PATCH',
      body: { isArchived: !row.isArchived },
    });
    setNotice({ tone: 'success', text: result.message });
    await loadSyllabi();
  } catch (err) {
    setNotice({ tone: 'error', text: err.message });
  } finally {
    setBusyId(null);
  }
};

useEffect(() => {
  let active = true;
  fetchSyllabi().then((result) => {
    if (active) applySyllabi(result);
  });
  return () => {
    active = false;
  };
}, []);

const visibleRows = syllabi.filter((row) =>
  `${row.title} ${row.fileName || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
);
const paged = usePaged(visibleRows, 8);

  return (
    <LawyerLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>Syllabus Management</h1>
          <p
  style={{
    fontSize: '13px',
    color: 'var(--text-muted)',
    margin: 0,
    maxWidth: '560px',
  }}
>
  Manage and update Bar Examination syllabus documents for reviewees.
</p>
        </div>
       
<div style={{ display: 'flex', gap: '10px' }}>

  {/* Existing New Syllabus Item */}
  <button
    onClick={() => setSyllabusModalOpen(true)}
    style={navyButtonStyle}
  >
    <span
      className="material-symbols-outlined"
      style={{ fontSize: '16px' }}
    >
      add
    </span>
    New Syllabus Item
  </button>

</div>

      </div>

      {notice && (
        <div
          role="status"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '18px',
            background: notice.tone === 'error' ? '#fdf0f0' : '#e8f5e9',
            color: notice.tone === 'error' ? '#9b1c1c' : '#2e7d32',
            border: `1px solid ${notice.tone === 'error' ? '#e5b8b8' : '#b7dfba'}`,
          }}
        >
          {notice.text}
          <button onClick={() => setNotice(null)} aria-label="Dismiss" style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>
      )}

      {/* KPI tiles */}
<div
  style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '28px',
  }}
>
  <SummaryTile
    icon="description"
    label="TOTAL SYLLABI"
    loading={loading}
    value={String(syllabi.length).padStart(2, '0')}
  />

  <SummaryTile
    icon="check_circle"
    label="ACTIVE SYLLABI"
    loading={loading}
    value={String(
      syllabi.filter((item) => !item.isArchived).length
    ).padStart(2, '0')}
  />

  <SummaryTile
    icon="archive"
    label="ARCHIVED SYLLABI"
    loading={loading}
    value={String(
      syllabi.filter((item) => item.isArchived).length
    ).padStart(2, '0')}
  />
</div>

      {/* Curriculum inventory */}
      <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 22px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '2px' }}>Curriculum Inventory</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Each syllabus is one complete PDF. Everyone can read and download it; only administrators upload, rename, archive or delete.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'var(--text-muted)' }}>search</span>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
placeholder="Search syllabi..."
                style={{ padding: '8px 12px 8px 32px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', width: '190px' }}
              />
            </div>
        
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', textAlign: 'left' }}>
                {['Syllabus', 'File', 'Upload Date', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 22px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
  {loading ? (
    <SkeletonTableRows rows={4} cols={5} />
  ) : error ? (
    <tr>
      <td
        colSpan={5}
        style={{
          padding: '30px',
          textAlign: 'center',
          color: '#9b1c1c',
        }}
      >
        {error}
      </td>
    </tr>
  ) : visibleRows.length === 0 ? (
    <tr>
      <td
        colSpan={5}
        style={{
          padding: '30px',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}
      >
        {searchTerm
          ? `No syllabi match "${searchTerm}".`
          : 'No syllabi have been uploaded yet.'}
      </td>
    </tr>
  ) : (
    paged.pageItems.map((row) => (
      <tr
        key={row.id}
        style={{
          borderTop: '1px solid var(--card-border)',
        }}
      >
        {/* Syllabus */}
        <td style={{ padding: '16px 22px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                color: 'var(--navy)',
                fontSize: '18px',
              }}
            >
              picture_as_pdf
            </span>

            <div>
              <div style={{ fontWeight: 700 }}>
                {row.title}
              </div>

              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                }}
              >
                {row.uploadedBy ? `Uploaded by ${row.uploadedBy}` : 'Syllabus PDF'}
              </div>
            </div>
          </div>
        </td>

        {/* File */}
        <td style={{ padding: '16px 22px', color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>
          {row.fileName || 'PDF'}
          {row.fileSize ? <span style={{ display: 'block', fontSize: '11px' }}>{(row.fileSize / 1024 / 1024).toFixed(2)} MB</span> : null}
        </td>

        {/* Upload Date */}
        <td
          style={{
            padding: '16px 22px',
            color: 'var(--text-muted)',
          }}
        >
          {new Date(row.createdAt).toLocaleDateString()}
        </td>

        {/* Status */}
        <td style={{ padding: '16px 22px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '999px',
              background: row.isArchived
                ? 'var(--bg)'
                : 'var(--navy)',
              color: row.isArchived
                ? 'var(--text-muted)'
                : '#fff',
              border: row.isArchived
                ? '1px solid var(--card-border)'
                : 'none',
            }}
          >
            {row.isArchived ? 'ARCHIVED' : 'ACTIVE'}
          </span>
        </td>

        {/* Actions */}
        <td style={{ padding: '16px 22px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => openPdf(row)} style={rowActionStyle}>
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>visibility</span>
              View
            </button>
            <button onClick={() => setEditing(row)} style={rowActionStyle}>
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>edit</span>
              Edit
            </button>
            <button
              onClick={() => toggleArchive(row)}
              disabled={busyId === row.id}
              style={{ ...rowActionStyle, color: 'var(--text-muted)', opacity: busyId === row.id ? 0.5 : 1 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                {row.isArchived ? 'unarchive' : 'archive'}
              </span>
              {row.isArchived ? 'Restore' : 'Archive'}
            </button>
            <button
              onClick={() => removeSyllabus(row)}
              disabled={busyId === row.id}
              style={{ ...rowActionStyle, color: '#c0392b', opacity: busyId === row.id ? 0.5 : 1 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete</span>
              Delete
            </button>
          </div>
        </td>
      </tr>
    ))
  )}
</tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderTop: '1px solid var(--card-border)', flexWrap: 'wrap', gap: '10px' }}>
          {loading ? (
            <Skeleton width={200} height={12} />
          ) : (
            <span style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
Showing {paged.from}–{paged.to} of {visibleRows.length} syllabus resource(s).
            </span>
          )}
          <ListPager paged={paged} noun="syllabi" style={{ marginTop: 0 }} />
        </div>
      </div>

<NewSyllabusItemModal
  key={editing ? `edit-${editing.id}` : 'new'}
  syllabus={editing}
  open={syllabusModalOpen || Boolean(editing)}
  onClose={() => {
    setSyllabusModalOpen(false);
    setEditing(null);
  }}
  existingTitles={syllabi.filter((row) => !row.isArchived).map((row) => row.title)}
  onCreated={async (syllabus) => {
    setNotice({ tone: 'success', text: editing ? `"${syllabus.title}" was updated.` : `"${syllabus.title}" was uploaded.` });
    await loadSyllabi();
  }}
/>

    </LawyerLayout>
  );
}

function SummaryTile({ icon, label, value, loading }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--navy)', fontSize: '18px' }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{label}</div>
        {loading ? (
          <Skeleton width={44} height={22} style={{ margin: '4px 0 3px' }} />
        ) : (
          <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '22px' }}>{value}</div>
        )}
      </div>
    </div>
  );
}

const navyButtonStyle = {
  background: 'var(--navy)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '10px 16px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const rowActionStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--navy)',
  fontSize: '12px',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: 0,
};
