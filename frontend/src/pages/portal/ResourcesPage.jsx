import { useState } from 'react';
import PortalLayout from '../../layouts/PortalLayout';
import { useApi } from '../../lib/useApi';
import { downloadSyllabusPdf, openSyllabusPdf } from '../../lib/useLawyerContent';
import { formatDate } from '../../lib/format';

const fileSize = (bytes) => (bytes ? `${(bytes / 1024 / 1024).toFixed(bytes < 1024 * 1024 ? 2 : 1)} MB` : '');

// Published Bar syllabi (paper TC-SM-008: "Display updated syllabus to
// reviewees"). Each syllabus is one complete PDF to read online or download.
export default function ResourcesPage() {
  const { data, error } = useApi('/reviewee/resources');
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(null);

  const term = search.trim().toLowerCase();
  const resources = (data?.resources ?? []).filter((r) => !term || `${r.title} ${r.fileName || ''}`.toLowerCase().includes(term));

  const run = async (key, action) => {
    setActionError('');
    setBusy(key);
    try {
      await action();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <PortalLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap', marginBottom: '22px' }}>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>Bar Syllabi</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '560px' }}>
            The official Bar syllabus documents, published by your Review Administrators. Read them online or download a copy.
          </p>
        </div>
        <div style={{ position: 'relative', flex: '0 1 280px' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'var(--text-muted)' }}>search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search syllabi..."
            aria-label="Search syllabi"
            style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', background: '#fff', color: 'var(--navy)' }}
          />
        </div>
      </div>

      {(error || actionError) && <p role="alert" style={{ color: '#c0392b', fontSize: '13px' }}>{error || actionError}</p>}
      {!data && !error && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading syllabi...</p>}
      {data && resources.length === 0 && (
        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
          {term ? `No syllabi match "${search}".` : 'No syllabi have been published yet.'}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
        {resources.map((r) => (
          <div key={r.id} style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '28px' }}>picture_as_pdf</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px', overflowWrap: 'anywhere' }}>{r.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  PDF{r.fileSize ? ` • ${fileSize(r.fileSize)}` : ''} • Updated {formatDate(r.updatedAt)}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <button
                onClick={() => run(`view-${r.id}`, () => openSyllabusPdf(r.id))}
                disabled={busy !== null}
                style={actionStyle(true)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                View
              </button>
              <button
                onClick={() => run(`dl-${r.id}`, () => downloadSyllabusPdf(r.id))}
                disabled={busy !== null}
                style={actionStyle(false)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                {busy === `dl-${r.id}` ? 'Preparing...' : 'Download'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </PortalLayout>
  );
}

const actionStyle = (primary) => ({
  flex: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '8px 12px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  border: primary ? '1px solid var(--navy)' : '1px solid var(--card-border)',
  background: primary ? 'var(--navy)' : 'transparent',
  color: primary ? '#fff' : 'var(--navy)',
});
