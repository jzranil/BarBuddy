import { useApi } from '../../../lib/useApi';
import { formatDateTime } from '../../../lib/format';
import { SkeletonList } from '../Skeleton';

// The user's last ten sign-ins, read from the audit log
export default function LoginHistoryCard() {
  const { data, error } = useApi('/user/login-history');
  const logins = data?.logins ?? [];

  return (
    <div style={cardStyle}>
      <h3 style={{ fontSize: '15px', marginBottom: '14px' }}>Login History</h3>

      {error ? (
        <p style={{ fontSize: '13px', color: '#c0392b', margin: 0 }}>{error}</p>
      ) : !data ? (
        <SkeletonList rows={3} />
      ) : logins.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>No sign-ins recorded yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '480px' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', textAlign: 'left' }}>
                {['Date & Time', 'Device', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logins.map((row) => (
                <tr key={row.id} style={{ borderTop: '1px solid var(--card-border)' }}>
                  <td style={{ padding: '12px', color: 'var(--navy)' }}>{formatDateTime(row.at)}</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{row.device || 'Not recorded'}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#2e7d32' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>check_circle</span>
                      Successful
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const cardStyle = {
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--radius-md)',
  padding: '20px',
};
