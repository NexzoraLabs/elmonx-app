import { useEffect, useState } from 'react';

import type { PagedResult } from '@/services/drops-api';

/**
 * Generic "load page 1, then append on demand" list state.
 * `fetchPage` is expected to be a stable top-level API function (its identity
 * isn't tracked as a dependency); pass it fresh each render, it's only read
 * when the effect actually (re)fires.
 */
export function usePaginatedList<T>(fetchPage: (page: number) => Promise<PagedResult<T>>) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPage(1)
      .then((result) => {
        if (cancelled) return;
        setItems(result.items);
        setTotalRecords(result.totalRecords);
        setPage(1);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasMore = totalRecords === null ? false : items.length < totalRecords;

  const loadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    fetchPage(nextPage)
      .then((result) => {
        setItems((prev) => [...prev, ...result.items]);
        setTotalRecords(result.totalRecords);
        setPage(nextPage);
      })
      .catch(() => setError(true))
      .finally(() => setLoadingMore(false));
  };

  return { items, loading, loadingMore, error, hasMore, loadMore };
}
