import { useEffect, useState } from 'react';
import SuperAdminLayout from '../../layouts/SuperAdminLayout';
import LawyerLayout from '../../layouts/LawyerLayout';
import KpiTile from '../../components/superadmin/KpiTile';
import Pagination from '../../components/common/Pagination';
import { apiRequest } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { downloadCsv, formatDateTime } from '../../lib/format';
import { SkeletonTableRows } from '../../components/common/Skeleton';

const LIMIT = 20;
const SERVICES = ['auth', 'assessments', 'verification', 'questionnaire', 'syllabi', 'achievements', 'announcements', 'user-control', 'settings', 'account'];
const LEVEL_STYLE = {
  INFO: { bg: '#eef0f4', color: 'var(--navy)' },
  WARNING: { bg: '#fdf7e9', color: '#8a6514' },
  ERROR: { bg: '#fdf0f0', color: '#9b1c1c' },
};

// System log auditing (paper: Super Admin audits system logs). Entries come
// from bb_logs_tbl and are written by the backend for every important action.
// portal: 'superadmin' (default) or 'lawyer' (Review Administrator, read-only)
export default function SystemLogsPage({ portal = 'superadmin' }) {
  const Layout = portal === 'lawyer' ? LawyerLayout : SuperAdminLayout;
  const [searchTerm, setSearchTerm] = useState('');
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('');
  const [service, setService] = useState('');
  const [page, setPage] = useState(1);
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
  if (query) params.set('search', query);
  if (level) params.set('level', level);
  if (service) params.set('service', service);
  const { data, error, reload, loading } = useApi(`/admin/logs?${params}`);
  const logs = data?.logs ?? [];
  const last24h = data?.last24h ?? { info: 0, warning: 0, error: 0 };
  const total24h = last24h.info + last24h.warning + last24h.error;

  const exportCsv = async () => {
    setExportError('');
    try {
      const all = [];
      for (let p = 1; p <= 20; p++) {
        const q = new URLSearchParams(params);
        q.set('page', String(p));
        q.set('limit', '100');
        const r = await apiRequest(`/admin/logs?${q}`);
        all.push(...r.logs);
        if (all.length >= r.total || r.logs.length === 0) break;
      }
      downloadCsv(`barbuddy-system-logs-${new Date().toISOString().slice(0, 10)}.csv`, [
        ['Timestamp', 'Level', 'Module', 'Description', 'Performed By', 'Trace ID'],
        ...all.map((l) => [formatDateTime(l.createdAt), l.level, l.service, l.description, l.user, l.traceId]),
      ]);
    } catch (err) {
      setExportError(err.message);
    }
  };

  const resetPage = (fn) => (e) => {
    fn(e.target.value);
    setPage(1);
  };

  return (
    <Layout>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>System Log Auditing</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '600px' }}>
          Every sign-in, submission, verification, content change and role change is recorded here with who did it and when.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <KpiTile icon="terminal" label="TOTAL EVENTS (24H)" value={total24h.toLocaleString()} />
        <KpiTile icon="info" label="INFO (24H)" value={last24h.info} />
        <KpiTile icon="warning" label="WARNINGS (24H)" value={last24h.warning} trendLabel="Deletions, role changes" />
        <KpiTile icon="error" label="ERRORS (24H)" value={last24h.error} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '320px' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'var(--text-muted)' }}>search</span>
            <input
              value={searchTerm}
              onChange={resetPage(setSearchTerm)}
              placeholder="Search log descriptions..."
              aria-label="Search logs"
              style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', background: '#fff', color: 'var(--navy)' }}
            />
          </div>
          <select value={level} onChange={resetPage(setLevel)} aria-label="Filter by level" style={selectStyle}>
            <option value="">All levels</option>
            {['INFO', 'WARNING', 'ERROR'].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={service} onChange={resetPage(setService)} aria-label="Filter by module" style={selectStyle}>
            <option value="">All modules</option>
            {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={exportCsv} style={outlineButtonStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
            Export CSV
          </button>
          <button onClick={reload} style={navyButtonStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {(error || exportError) && <p style={{ color: '#c0392b', fontSize: '13px' }}>{error || exportError}</p>}

      <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', opacity: loading ? 0.6 : 1 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', textAlign: 'left' }}>
                {['Level', 'Action Details', 'Module', 'Performed By', 'Timestamp'].map((h) => (
                  <th key={h} style={{ padding: '12px 22px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderTop: '1px solid var(--card-border)' }}>
                  <td style={{ padding: '14px 22px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, borderRadius: '999px', padding: '3px 8px', ...LEVEL_STYLE[log.level] }}>{log.level}</span>
                  </td>
                  <td style={{ padding: '14px 22px', fontWeight: 600, maxWidth: '420px' }}>{log.description}</td>
                  <td style={{ padding: '14px 22px', color: 'var(--text-muted)' }}>{log.service}</td>
                  <td style={{ padding: '14px 22px', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--navy)' }}>person</span>
                      {log.user}
                    </span>
                  </td>
                  <td style={{ padding: '14px 22px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDateTime(log.createdAt)}</td>
                </tr>
              ))}
              {data && logs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    {query || level || service ? 'No logs match these filters.' : 'No events recorded yet.'}
                  </td>
                </tr>
              )}
              {!data && !error && <SkeletonTableRows rows={8} cols={5} />}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderTop: '1px solid var(--card-border)', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing {logs.length} of {(data?.total ?? 0).toLocaleString()} events
          </span>
          <Pagination totalPages={Math.ceil((data?.total ?? 0) / LIMIT) || 1} activePage={page} onPageChange={setPage} />
        </div>
      </div>
    </Layout>
  );
}

const selectStyle = { padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', background: '#fff', color: 'var(--navy)' };
const navyButtonStyle = { background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' };
const outlineButtonStyle = { background: '#fff', color: 'var(--navy)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' };
