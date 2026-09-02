import { LOGIN_HISTORY } from '../../../data/settings';

export default function LoginHistoryCard() {
  return (
    <div style={cardStyle}>
      <h3 style={{ fontSize: '15px', marginBottom: '14px' }}>Login History</h3>

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
            {LOGIN_HISTORY.map((row) => {
              const failed = row.status === 'Failed';
              return (
                <tr key={row.id} style={{ borderTop: '1px solid var(--card-border)' }}>
                  <td style={{ padding: '12px', color: 'var(--navy)' }}>{row.dateTime}</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{row.device}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: failed ? '#c0392b' : '#2e7d32' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>{failed ? 'cancel' : 'check_circle'}</span>
                      {row.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const cardStyle = {
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--radius-md)',
  padding: '20px',
};
