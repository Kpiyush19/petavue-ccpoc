import { useState, useEffect, useCallback } from 'react'
import { apiGet } from '../api'

export function useDataTable(sessionId, path) {
  const [columns, setColumns] = useState([])
  const [rows, setRows] = useState([])
  const [totalRows, setTotalRows] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(50)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const fetchPage = useCallback(async (page, size) => {
    if (!sessionId || !path) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiGet(`/api/sessions/${sessionId}/files/${path}/data?page=${page}&page_size=${size}`)
      setColumns(data.columns || [])
      setRows(data.rows || [])
      setTotalRows(data.total_rows || 0)
      setTotalPages(data.total_pages || 0)
      setCurrentPage(data.page || 1)
      setSortColumn(null)
      setSortDir('asc')
    } catch (e) {
      setError(e.message)
      setRows([])
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, path])

  useEffect(() => {
    fetchPage(1, pageSize)
  }, [fetchPage, pageSize])

  const loadPage = useCallback((page) => {
    fetchPage(page, pageSize)
  }, [fetchPage, pageSize])

  const setPageSize = useCallback((size) => {
    setPageSizeState(size)
    // fetchPage will re-trigger via useEffect
  }, [])

  const sort = useCallback((column) => {
    setSortColumn((prev) => {
      const isSame = prev === column
      if (isSame) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortDir('asc')
      }
      return column
    })
  }, [])

  // Client-side sort on the current page
  const sortedRows = sortColumn !== null
    ? [...rows].sort((a, b) => {
        const idx = columns.indexOf(sortColumn)
        if (idx < 0) return 0
        const va = a[idx] ?? ''
        const vb = b[idx] ?? ''
        const na = Number(va)
        const nb = Number(vb)
        const cmp = !isNaN(na) && !isNaN(nb) ? na - nb : String(va).localeCompare(String(vb))
        return sortDir === 'asc' ? cmp : -cmp
      })
    : rows

  return {
    columns,
    rows: sortedRows,
    totalRows,
    totalPages,
    currentPage,
    pageSize,
    isLoading,
    error,
    sortColumn,
    sortDir,
    loadPage,
    setPageSize,
    sort,
  }
}
