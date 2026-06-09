import { useState, useCallback, useMemo } from 'react';
import { useGetFileData } from '../api';

export function useDataTable(sessionId, path) {
  const [page, setPage] = useState(1);
  const pageSize = 20; // Fixed page size
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  // Use React Query for data fetching
  const { data, isLoading, error, refetch } = useGetFileData(
    sessionId,
    path,
    page,
    pageSize,
    {
      enabled: !!sessionId && !!path,
    }
  );

  const columns = data?.columns || [];
  const rows = data?.rows || [];
  const totalRows = data?.total_rows || 0;
  const totalPages = data?.total_pages || 0;
  const currentPage = data?.page || 1;

  const loadPage = useCallback((newPage) => {
    setPage(newPage);
    // Reset sort when changing pages
    setSortColumn(null);
    setSortDir('asc');
  }, []);

  const sort = useCallback((column) => {
    setSortColumn((prev) => {
      const isSame = prev === column;
      if (isSame) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortDir('asc');
      }
      return column;
    });
  }, []);

  // Client-side sorting (for current page)
  const sortedRows = useMemo(() => {
    if (sortColumn === null) return rows;

    const idx = columns.indexOf(sortColumn);
    if (idx < 0) return rows;

    return [...rows].sort((a, b) => {
      const va = a[idx] ?? '';
      const vb = b[idx] ?? '';
      const na = Number(va);
      const nb = Number(vb);
      const cmp =
        !isNaN(na) && !isNaN(nb)
          ? na - nb
          : String(va).localeCompare(String(vb));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, columns, sortColumn, sortDir]);

  return {
    columns,
    rows: sortedRows,
    totalRows,
    totalPages,
    currentPage,
    pageSize,
    isLoading,
    error: error?.message || null,
    sortColumn,
    sortDir,
    loadPage,
    sort,
    refetch,
  };
}
