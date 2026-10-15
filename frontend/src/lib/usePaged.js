import { useState } from 'react';

// Client-side pagination for lists that are already loaded in full.
// The page is clamped, so a shrinking list (filter, delete) never shows an empty page.
export function usePaged(items, pageSize = 10) {
  const list = items || [];
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;
  return {
    page: current,
    setPage,
    totalPages,
    total: list.length,
    from: list.length ? start + 1 : 0,
    to: Math.min(start + pageSize, list.length),
    pageItems: list.slice(start, start + pageSize),
  };
}
