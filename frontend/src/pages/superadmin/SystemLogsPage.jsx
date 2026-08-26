import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SuperAdminLayout from '../../layouts/SuperAdminLayout';
import KpiTile from '../../components/superadmin/KpiTile';
import Pagination from '../../components/common/Pagination';
import { getZeroedSystemLogsSummary, DUMMY_SYSTEM_LOGS, TOTAL_SYSTEM_LOGS } from '../../data/superadmin';

// BACKEND TODO: fetch from the API instead of these zeroed/dummy helpers.
const summary = getZeroedSystemLogsSummary();

export default function SystemLogsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(''); // BACKEND TODO: wire up once GET /api/admin/system-logs supports search

  const goComingSoon = (title, description) => navigate('/coming-soon', { state: { title, description } });

  const visibleLogs = DUMMY_SYSTEM_LOGS.filter(
    (log) =>
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SuperAdminLayout>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>System Log Auditing</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '600px' }}>
          Comprehensive oversight of BarBuddy's administrative activities and automated system
          events. Maintain compliance through immutable governance tracking.
        </p>
      </div>

      {/* KPI tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <KpiTile icon="terminal" label="TOTAL EVENTS (24H)" value={summary.totalEvents24h.toLocaleString()} />
        <KpiTile icon="shield" label="SYSTEM FAILURES" value={summary.systemFailures} />
        <KpiTile icon="verified_user" label="SUCCESS RATE" value={`${summary.successRate}%`} trendLabel=" " trendPositive />
        <KpiTile icon="person" label="ACTIVE ADMIN SESSIONS" value={summary.activeAdminSessions} />
      </div>

      {/* Filter / actions row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'var(--text-muted)' }}>search</span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by ID, action, or user..."
              style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', background: '#fff' }}
            />
          </div>
          <button onClick={() => goComingSoon('Filters', 'Filtering by role, actor, or date range connects here once the backend exists.')} style={outlineButtonStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>filter_list</span>
            Filters
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => goComingSoon('Export CSV', 'Exporting logs connects here once the backend exists.')} style={outlineButtonStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
            Export CSV
          </button>
          <button onClick={() => goComingSoon('System Refresh', 'Manually re-syncing system logs connects here once the backend exists.')} style={navyButtonStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
            System Refresh
          </button>
        </div>
      </div>

      {/* Logs table */}
      <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', textAlign: 'left' }}>
                {['Log ID', 'Action Details', 'Performed By', 'Timestamp', 'Role', ''].map((h) => (
                  <th key={h} style={{ padding: '12px 22px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleLogs.map((log) => (
                <tr key={log.id} style={{ borderTop: '1px solid var(--card-border)' }}>
                  <td style={{ padding: '14px 22px', color: 'var(--text-muted)' }}>{log.id}</td>
                  <td style={{ padding: '14px 22px', fontWeight: 600, maxWidth: '320px' }}>{log.description}</td>
                  <td style={{ padding: '14px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--navy)' }}>person</span>
                      <span style={{ fontWeight: 600 }}>{log.performedBy}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 22px', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
                      {log.timestamp}
                    </span>
                  </td>
                  <td style={{ padding: '14px 22px' }}>{log.role}</td>
                  <td style={{ padding: '14px 22px' }}>
                    <button
                      onClick={() => goComingSoon(log.id, 'Full log detail (diff, request payload, related events) connects here once the backend exists.')}
                      aria-label="More actions"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
              {visibleLogs.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No logs match "{searchTerm}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderTop: '1px solid var(--card-border)', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing {visibleLogs.length} of {TOTAL_SYSTEM_LOGS.toLocaleString()} events
          </span>
          <Pagination pages={[1, 2, 3, '...', 124]} activePage={1} context="system logs" />
        </div>
      </div>
    </SuperAdminLayout>
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
