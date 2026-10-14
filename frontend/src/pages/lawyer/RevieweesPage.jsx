import { useEffect, useState } from 'react';
import LawyerLayout from '../../layouts/LawyerLayout';
import { apiRequest } from '../../lib/api';
import { downloadCsv, formatDate } from '../../lib/format';

const SORTS = {
  name: { label: 'Name', fn: (a, b) => a.name.localeCompare(b.name) },
  readiness: { label: 'Readiness (high → low)', fn: (a, b) => (b.readiness ?? -1) - (a.readiness ?? -1) },
  pending: { label: 'Pending essays', fn: (a, b) => b.essaysPending - a.essaysPending },
  activity: { label: 'Most recently active', fn: (a, b) => String(b.lastActive || '').localeCompare(String(a.lastActive || '')) },
};

const LABEL_STYLES = {
  'EXAM READY': { bg: '#e8f5e9', color: '#2e7d32' },
  'ON TRACK': { bg: '#eef0f4', color: 'var(--navy)' },
  DEVELOPING: { bg: '#fdf7e9', color: '#8a6514' },
  'NEEDS FOCUS': { bg: '#fdf0f0', color: '#9b1c1c' },
};

// Reviewee monitoring and competency/performance report (paper: Review
// Administrators "monitor reviewee progress, and generate competency and
// performance reports").
export default function RevieweesPage() {
  const [data, setData] = useState({ loaded: false, rows: [], error: '' });
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('readiness');

  useEffect(() => {
    apiRequest('/lawyer/reviewees')
      .then((r) => setData({ loaded: true, rows: r.reviewees, error: '' }))
      .catch((err) => setData({ loaded: true, rows: [], error: err.message }));
  }, []);

  const term = search.trim().toLowerCase();
  const rows = data.rows
    .filter((r) => !term || r.name.toLowerCase().includes(term) || r.email.toLowerCase().includes(term))
    .sort(SORTS[sort].fn);

  const exportReport = () => {
    downloadCsv(`barbuddy-reviewee-report-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Name', 'Email', 'Readiness', 'Readiness Level', 'Overall Competency', 'Accuracy', 'Essays Submitted', 'Essays Verified', 'Essays Pending', 'Assessments Completed', 'Strongest Subject', 'Weakest Subject', 'Streak (days)', 'Level', 'XP', 'Last Active', 'Joined'],
      ...rows.map((r) => [
        r.name, r.email, r.readiness ?? '', r.readinessLabel, r.competency ?? '', r.accuracy ?? '',
        r.essaysSubmitted, r.essaysVerified, r.essaysPending, r.assessmentsCompleted,
        r.strongest, r.weakest, r.streakDays, r.level, r.xp, r.lastActive ?? '', formatDate(r.joinedAt),
      ]),
    ]);
  };

  return (
    <LawyerLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>Reviewee Monitoring</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '620px' }}>
            Competency and performance report for every reviewee. Readiness and competency use lawyer-verified essays only.
          </p>
        </div>
        <button onClick={exportReport} disabled={!rows.length} style={{ ...buttonStyle, opacity: rows.length ? 1 : 0.5 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
          Export Report (CSV)
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '360px' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'var(--text-muted)' }}>search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            aria-label="Search reviewees"
            style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', background: '#fff', color: 'var(--navy)' }}
          />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort reviewees" style={selectStyle}>
          {Object.entries(SORTS).map(([key, s]) => <option key={key} value={key}>Sort: {s.label}</option>)}
        </select>
      </div>

      {data.error && <p style={{ color: '#9b1c1c', fontSize: '13px' }}>{data.error}</p>}

      <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', textAlign: 'left' }}>
                {['Reviewee', 'Readiness', 'Competency', 'Essays (verified / pending)', 'Strongest', 'Weakest', 'Streak', 'Last Active'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!data.loaded && <EmptyRow text="Loading reviewees..." />}
              {data.loaded && rows.length === 0 && <EmptyRow text={term ? `No reviewees match "${search}".` : 'No reviewees yet.'} />}
              {rows.map((r) => {
                const style = LABEL_STYLES[r.readinessLabel];
                return (
                  <tr key={r.id} style={{ borderTop: '1px solid var(--card-border)' }}>
                    <td style={cell}>
                      <div style={{ fontWeight: 700 }}>{r.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.email}</div>
                    </td>
                    <td style={cell}>
                      {r.readiness === null ? (
                        <span style={{ color: 'var(--text-muted)' }}>Not yet rated</span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <strong>{r.readiness}%</strong>
                          <span style={{ fontSize: '10px', fontWeight: 700, borderRadius: '999px', padding: '2px 8px', background: style?.bg, color: style?.color }}>{r.readinessLabel}</span>
                        </span>
                      )}
                    </td>
                    <td style={cell}>{r.competency === null ? '—' : `${r.competency}%`}</td>
                    <td style={cell}>{r.essaysVerified} / {r.essaysPending}</td>
                    <td style={cell}>{r.strongest}</td>
                    <td style={cell}>{r.weakest}</td>
                    <td style={cell}>{r.streakDays} day{r.streakDays === 1 ? '' : 's'}</td>
                    <td style={{ ...cell, color: 'var(--text-muted)' }}>{r.lastActive ? formatDate(r.lastActive) : 'Never'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--card-border)', fontSize: '12px', color: 'var(--text-muted)' }}>
          Showing {rows.length} of {data.rows.length} reviewee{data.rows.length === 1 ? '' : 's'}
        </div>
      </div>
    </LawyerLayout>
  );
}

function EmptyRow({ text }) {
  return (
    <tr>
      <td colSpan={8} style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)' }}>{text}</td>
    </tr>
  );
}

const cell = { padding: '14px 16px', whiteSpace: 'nowrap' };

const buttonStyle = {
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

const selectStyle = { padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', background: '#fff', color: 'var(--navy)' };
