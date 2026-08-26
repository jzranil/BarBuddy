import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LawyerLayout from '../../layouts/LawyerLayout';
import NewSyllabusItemModal from '../../components/lawyer/NewSyllabusItemModal';
import { DUMMY_CURRICULUM, getCurriculumSummary } from '../../data/lawyer';

const STATUS_STYLES = {
  Published: { bg: 'var(--navy)', color: '#fff' },
  Draft: { bg: '#fdf7e9', color: 'var(--navy)', border: '1px solid var(--gold)' },
  Archived: { bg: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--card-border)' },
};

export default function CurriculumPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(''); // BACKEND TODO: wire up once GET /api/lawyer/curriculum supports filtering
  const [syllabusModalOpen, setSyllabusModalOpen] = useState(false);
  const summary = getCurriculumSummary();

  const visibleRows = DUMMY_CURRICULUM.filter((row) => row.subject.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <LawyerLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>Syllabus Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '560px' }}>
            Manage and update the Bar Examination curriculum, upload syllabus documents, and
            maintain subject records for the 2024 academic cycle.
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <SummaryTile icon="check_circle" label="ACTIVE SUBJECTS" value={String(summary.activeSubjects).padStart(2, '0')} />
        <SummaryTile icon="schedule" label="PENDING DRAFTS" value={String(summary.pendingDrafts).padStart(2, '0')} />
        <SummaryTile icon="error" label="UPDATES NEEDED" value={String(summary.updatesNeeded).padStart(2, '0')} />
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
                placeholder="Filter subjects..."
                style={{ padding: '8px 12px 8px 32px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', width: '190px' }}
              />
            </div>
            <button
              onClick={() => navigate('/coming-soon', { state: { title: 'Filters', description: 'Advanced filtering (by status, author, version) connects once the backend exists.' } })}
              style={outlineButtonStyle}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>filter_list</span>
              Filter
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', textAlign: 'left' }}>
                {['Subject', 'Status', 'Version', 'Upload Date', 'Author', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 22px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const tagStyle = STATUS_STYLES[row.status] ?? STATUS_STYLES.Archived;
                return (
                  <tr key={row.id} style={{ borderTop: '1px solid var(--card-border)' }}>
                    <td style={{ padding: '16px 22px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--navy)', fontSize: '18px' }}>description</span>
                        <div>
                          <div style={{ fontWeight: 700 }}>{row.subject}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 22px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em', padding: '4px 10px', borderRadius: '999px', ...tagStyle }}>
                        {row.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '16px 22px', color: 'var(--text-muted)' }}>{row.version}</td>
                    <td style={{ padding: '16px 22px', color: 'var(--text-muted)' }}>{row.uploadDate}</td>
                    <td style={{ padding: '16px 22px' }}>{row.author}</td>
                    <td style={{ padding: '16px 22px' }}>
                      <button
                        onClick={() => navigate('/coming-soon', { state: { title: row.subject, description: 'View, edit, version-compare, and archive actions connect here once the backend exists.' } })}
                        aria-label="More actions"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>more_vert</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {visibleRows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No subjects match "{searchTerm}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderTop: '1px solid var(--card-border)', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
            Showing {visibleRows.length} syllabus subjects for the 2024 Philippine Bar Examinations.
          </span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <PagerButton label="Previous" />
            <PagerButton label="1" active />
            <PagerButton label="2" />
            <PagerButton label="Next" />
          </div>
        </div>
      </div>

      <NewSyllabusItemModal open={syllabusModalOpen} onClose={() => setSyllabusModalOpen(false)} />
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
