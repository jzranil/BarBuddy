import { useNavigate } from 'react-router-dom';
import Pagination from '../common/Pagination';

// cases: array from src/data/lawyer.js (DUMMY_VERIFICATION_QUEUE)
// totalCount: shown in the "Showing X of Y pending verifications" footer
export default function VerificationTable({ cases, totalCount, selectedId }) {
  const navigate = useNavigate();

  return (
    <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg)', textAlign: 'left' }}>
              {['Full Name', 'Subject', 'AI Initial Score', 'Submission', 'Status', ''].map((h) => (
                <th key={h} style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => {
              const flagged = c.status === 'flagged';
              const isSelected = c.id === selectedId;
              return (
                <tr key={c.id} style={{ borderTop: '1px solid var(--card-border)', background: isSelected ? 'var(--bg)' : 'transparent' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: c.avatarColor,
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {c.initials}
                      </span>
                      <div>
                        <div style={{ fontWeight: 700 }}>{c.reviewee}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{c.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: '11px', border: '1px solid var(--card-border)', borderRadius: '999px', padding: '3px 10px' }}>
                      {c.subject}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', minWidth: '120px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '50px', height: '4px', borderRadius: '999px', background: 'var(--card-border)' }}>
                        <div style={{ width: `${c.aiScore}%`, height: '100%', borderRadius: '999px', background: flagged ? '#c0392b' : 'var(--navy)' }} />
                      </div>
                      <span style={{ fontWeight: 600 }}>{c.aiScore}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{c.submittedLabel}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: flagged ? '#c0392b' : 'var(--text-muted)', fontSize: '12px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>{flagged ? 'error' : 'schedule'}</span>
                      {flagged ? 'Flagged (Low Confidence)' : 'Unverified'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => navigate(`/lawyer/verification?case=${c.id}`)}
                      style={{
                        background: 'var(--navy)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Verify Feedback
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: '1px solid var(--card-border)', flexWrap: 'wrap', gap: '10px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Showing {cases.length} of {totalCount} pending verifications
        </span>
        <Pagination pages={[1, 2, 3]} activePage={1} context="the verification queue" />
      </div>
    </div>
  );
}
