import Pagination from './Pagination';

// "Showing 11-20 of 46" + page buttons, for lists paged with usePaged().
// Hidden when everything fits on one page.
export default function ListPager({ paged, noun = 'items', style }) {
  if (paged.totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '16px', ...style }}>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
        Showing {paged.from}–{paged.to} of {paged.total} {noun}
      </span>
      <Pagination totalPages={paged.totalPages} activePage={paged.page} onPageChange={paged.setPage} />
    </div>
  );
}
