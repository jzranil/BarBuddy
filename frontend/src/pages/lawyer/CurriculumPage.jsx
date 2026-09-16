import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LawyerLayout from '../../layouts/LawyerLayout';
import NewSyllabusItemModal from '../../components/lawyer/NewSyllabusItemModal';
import { supabase } from '../../lib/supabaseClient';


export default function CurriculumPage() {
  const navigate = useNavigate();
const [searchTerm, setSearchTerm] = useState('');
const [syllabusModalOpen, setSyllabusModalOpen] = useState(false);

const [syllabi, setSyllabi] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

const loadSyllabi = async () => {
  setLoading(true);
  setError('');

  try {
    // Find the Syllabus resource tag
    const { data: tag, error: tagError } = await supabase
      .from('bb_resource_tags_tbl')
      .select('resource_tag_id, resource_tag_title')
      .eq('resource_tag_title', 'Syllabus')
      .maybeSingle();

    if (tagError) {
      throw tagError;
    }

    if (!tag) {
      throw new Error(
        'The Syllabus resource tag does not exist.'
      );
    }

    // Get resources tagged as Syllabus
    const { data, error: resourceError } = await supabase
      .from('bb_resources_tbl')
      .select(`
        resource_id,
        user_id,
        resource_tags,
        resource_desc,
        is_archived,
        created_at,
        updated_at
      `)
      .eq('resource_tags', tag.resource_tag_id)
      .order('created_at', { ascending: false });

    if (resourceError) {
      throw resourceError;
    }

    setSyllabi(data || []);

  } catch (err) {
    console.error('Error loading syllabi:', err);
    setError(err.message || 'Failed to load syllabi.');
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  loadSyllabi();
}, []);

const visibleRows = syllabi.filter((row) =>
  row.resource_desc
    ?.toLowerCase()
    .includes(searchTerm.toLowerCase())
);

  return (
    <LawyerLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>Syllabus Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '560px' }}>
            Manage and update the Bar Examination curriculum, upload syllabus documents, and
Manage and update uploaded Bar Examination syllabus documents for reviewees.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* <button
            onClick={() => navigate('/coming-soon', { state: { title: 'Upload Syllabus', description: 'Uploading a syllabus document connects here once file storage (e.g. S3) is wired up.' } })}
            style={outlineButtonStyle}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>upload</span>
            Upload Syllabus
          </button> */}
          <button
            onClick={() => setSyllabusModalOpen(true)}
            style={navyButtonStyle}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            New Syllabus Item
          </button>
        </div>
      </div>

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
    value={String(syllabi.length).padStart(2, '0')}
  />

  <SummaryTile
    icon="check_circle"
    label="ACTIVE SYLLABI"
    value={String(
      syllabi.filter((item) => !item.is_archived).length
    ).padStart(2, '0')}
  />

  <SummaryTile
    icon="archive"
    label="ARCHIVED SYLLABI"
    value={String(
      syllabi.filter((item) => item.is_archived).length
    ).padStart(2, '0')}
  />
</div>

      {/* Curriculum inventory */}
      <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 22px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '2px' }}>Curriculum Inventory</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Overview of all examination subjects and their current documentation status.
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
                {['Syllabus', 'Resource Type', 'Upload Date', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 22px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
  {loading ? (
    <tr>
      <td
        colSpan={5}
        style={{
          padding: '30px',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}
      >
        Loading syllabi...
      </td>
    </tr>
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
    visibleRows.map((row) => (
      <tr
        key={row.resource_id}
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
                {row.resource_desc}
              </div>

              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                }}
              >
                Resource ID: {row.resource_id}
              </div>
            </div>
          </div>
        </td>

        {/* Resource Type */}
        <td
          style={{
            padding: '16px 22px',
            color: 'var(--text-muted)',
          }}
        >
          Syllabus
        </td>

        {/* Upload Date */}
        <td
          style={{
            padding: '16px 22px',
            color: 'var(--text-muted)',
          }}
        >
          {new Date(row.created_at).toLocaleDateString()}
        </td>

        {/* Status */}
        <td style={{ padding: '16px 22px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '999px',
              background: row.is_archived
                ? 'var(--bg)'
                : 'var(--navy)',
              color: row.is_archived
                ? 'var(--text-muted)'
                : '#fff',
              border: row.is_archived
                ? '1px solid var(--card-border)'
                : 'none',
            }}
          >
            {row.is_archived ? 'ARCHIVED' : 'ACTIVE'}
          </span>
        </td>

        {/* Actions */}
        <td style={{ padding: '16px 22px' }}>
          <button
            onClick={() =>
              navigate('/coming-soon', {
                state: {
                  title: row.resource_desc,
                  description:
                    'Syllabus viewing and archive actions will be connected here next.',
                },
              })
            }
            aria-label="More actions"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '18px' }}
            >
              more_vert
            </span>
          </button>
        </td>
      </tr>
    ))
  )}
</tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderTop: '1px solid var(--card-border)', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
Showing {visibleRows.length} syllabus resource(s).
          </span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
  All syllabus resources
</span>
          </div>
        </div>
      </div>

<NewSyllabusItemModal
  open={syllabusModalOpen}
  onClose={() => setSyllabusModalOpen(false)}
  onCreated={loadSyllabi}
/>
    </LawyerLayout>
  );
}

function SummaryTile({ icon, label, value }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--navy)', fontSize: '18px' }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{label}</div>
        <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '22px' }}>{value}</div>
      </div>
    </div>
  );
}

function PagerButton({ label, active }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/coming-soon', { state: { title: 'Curriculum Pagination', description: 'Paging beyond the first page connects once the backend can return more results.' } })}
      style={{
        background: active ? 'var(--navy)' : '#fff',
        color: active ? '#fff' : 'var(--navy)',
        border: '1px solid var(--card-border)',
        borderRadius: '8px',
        padding: '7px 12px',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
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

const outlineButtonStyle = {
  background: '#fff',
  color: 'var(--navy)',
  border: '1px solid var(--card-border)',
  borderRadius: '8px',
  padding: '10px 16px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};