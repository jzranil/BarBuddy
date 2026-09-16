import { useNavigate } from 'react-router-dom';

export default function Pagination({
  totalPages,
  pages,
  activePage = 1,
  onPageChange,
  context = 'this list',
}) {
  const navigate = useNavigate();

  const goComingSoon = () =>
    navigate('/coming-soon', {
      state: {
        title: 'Pagination',
        description: `Paging through ${context} connects once the backend can return more than the first page.`,
      },
    });

  // Calculate dynamic page array if totalPages is passed directly
  const computedTotal = totalPages || (Array.isArray(pages) ? Math.max(...pages.filter((p) => typeof p === 'number'), 1) : 1);
  const displayPages = pages || generatePages(computedTotal, activePage);

  const handleClick = (page) => {
    if (typeof page !== 'number' || page < 1 || page > computedTotal) return;

    if (onPageChange) {
      onPageChange(page);
    } else {
      goComingSoon();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      <PagerButton
        label="Previous"
        disabled={activePage <= 1}
        onClick={() => handleClick(activePage - 1)}
      />

      {displayPages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '0 4px' }}>
            …
          </span>
        ) : (
          <PagerButton
            key={`${p}-${i}`}
            label={String(p)}
            active={p === activePage}
            onClick={() => handleClick(Number(p))}
          />
        )
      )}

      <PagerButton
        label="Next"
        disabled={activePage >= computedTotal}
        onClick={() => handleClick(activePage + 1)}
      />
    </div>
  );
}

// Generates dynamic ranges like [1, 2, 3, '...', 124] when totalPages is provided
function generatePages(total, current) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, '...', total];
  if (current >= total - 2) return [1, '...', total - 2, total - 1, total];
  return [1, '...', current, '...', total];
}

function PagerButton({ label, active, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        background: active ? 'var(--navy)' : '#fff',
        color: active ? '#fff' : 'var(--navy)',
        border: '1px solid var(--card-border)',
        borderRadius: '8px',
        padding: '7px 12px',
        fontSize: '12px',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {label}
    </button>
  );
}