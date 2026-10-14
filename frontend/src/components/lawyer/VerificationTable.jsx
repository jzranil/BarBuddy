import { timeAgo } from '../../lib/format';

const AVATAR_COLORS = ['#2563eb', '#b91c1c', '#92400e', '#7c3aed', '#0f766e', '#be185d', '#1d4ed8', '#4d7c0f'];
const colorFor = (text = '') => AVATAR_COLORS[[...text].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATAR_COLORS.length];

const STATUS = {
  pending: { icon: 'schedule', label: 'Unverified', color: 'var(--text-muted)' },
  flagged: { icon: 'error', label: 'Flagged for Review', color: '#c0392b' },
  verified: { icon: 'verified', label: 'Lawyer Verified', color: '#2e7d32' },
};

// items: from GET /api/verification
// onSelect(item): open the review panel; selectedId highlights the row
// page/pageSize/total/onPageChange: server-side pagination (omit for a preview)
export default function VerificationTable({ items, total, selectedId, onSelect, page = 1, pageSize = 10, onPageChange, emptyText = 'No submissions waiting for verification.' }) {
  const totalPages = Math.max(1, Math.ceil((total ?? items.length) / pageSize));

  return (
    <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg)', textAlign: 'left' }}>
              {['Full Name', 'Subject', 'Structure / Score', 'Submitted', 'Status', ''].map((h) => (
                <th key={h} style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)' }}>{emptyText}</td>
              </tr>
            )}
            {items.map((c) => {
              const status = STATUS[c.status] ?? STATUS.pending;
              const isSelected = c.id === selectedId;
              const percent = c.score !== null && c.score !== undefined ? (c.score / 5) * 100 : ((c.structureFound ?? 0) / 4) * 100;
              return (
                <tr key={c.id} style={{ borderTop: '1px solid var(--card-border)', background: isSelected ? 'var(--bg)' : 'transparent' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: colorFor(c.reviewee), color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {c.initials}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700 }}>{c.reviewee}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.questionTitle}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: '11px', border: '1px solid var(--card-border)', borderRadius: '999px', padding: '3px 10px', whiteSpace: 'nowrap' }}>{c.subject}</span>
                  </td>
                  <td style={{ padding: '14px 16px', minWidth: '130px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '50px', height: '4px', borderRadius: '999px', background: 'var(--card-border)' }}>
                        <div style={{ width: `${percent}%`, height: '100%', borderRadius: '999px', background: c.status === 'flagged' ? '#c0392b' : 'var(--navy)' }} />
                      </div>
                      <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {c.score !== null && c.score !== undefined ? `${c.score}/5` : c.structureFound !== null ? `ALAC ${c.structureFound}/4` : '—'}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{timeAgo(c.submittedAt)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: status.color, fontSize: '12px', whiteSpace: 'nowrap' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>{status.icon}</span>
                      {status.label}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => onSelect?.(c)}
                      style={{ background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {c.status === 'verified' ? 'Review' : 'Verify Feedback'}
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
          Showing {items.length} of {total ?? items.length} submission{(total ?? items.length) === 1 ? '' : 's'}
        </span>
        {onPageChange && totalPages > 1 && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <PageButton icon="chevron_left" disabled={page <= 1} onClick={() => onPageChange(page - 1)} label="Previous page" />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
            <PageButton icon="chevron_right" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} label="Next page" />
          </div>
        )}
      </div>
    </div>
  );
}

function PageButton({ icon, disabled, onClick, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.4 : 1, color: 'var(--navy)' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>
    </button>
  );
}
