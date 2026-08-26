import { useNavigate } from 'react-router-dom';

// pages: array of page labels to show between Previous/Next, e.g. [1,2,3] or [1,2,3,'...',124]
export default function Pagination({ pages = [1], activePage = 1, context = 'this list' }) {
  const navigate = useNavigate();
  const goComingSoon = () =>
    navigate('/coming-soon', { state: { title: 'Pagination', description: `Paging through ${context} connects once the backend can return more than the first page.` } });

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      <PagerButton label="Previous" onClick={goComingSoon} />
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '0 4px' }}>…</span>
        ) : (
          <PagerButton key={p} label={String(p)} active={p === activePage} onClick={goComingSoon} />
        )
      )}
      <PagerButton label="Next" onClick={goComingSoon} />
    </div>
  );
}

function PagerButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
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
