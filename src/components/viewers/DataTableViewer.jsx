import { useState, useRef, useCallback, useEffect } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Maximize2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { Select } from '../ui/Input'
import { cn } from '../../utils/cn'
import { useDataTable } from '../../hooks/useDataTable'

function formatCell(cell) {
  if (cell == null) return ''
  if (typeof cell === 'object') {
    try {
      return JSON.stringify(cell, null, 1)
    } catch {
      return String(cell)
    }
  }
  return String(cell)
}

function SortIcon({ active, dir }) {
  if (!active) {
    return <ChevronsUpDown size={10} className="ml-1 inline opacity-30" />
  }
  return dir === 'asc'
    ? <ChevronUp size={10} className="ml-1 inline" />
    : <ChevronDown size={10} className="ml-1 inline" />
}

function PageSizeSelector({ value, onChange }) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="text-[11px] w-auto h-auto px-1.5 py-0.5 rounded min-h-0"
    >
      <option value={25}>25</option>
      <option value={50}>50</option>
      <option value={100}>100</option>
    </Select>
  )
}

function CellContent({ value }) {
  const text = formatCell(value)
  const isObject = typeof value === 'object' && value !== null
  const isLong = text.length > 80

  const [expanded, setExpanded] = useState(false)

  if (!isObject && !isLong) {
    return <span>{text}</span>
  }

  return (
    <div className="relative group/cell">
      <div
        className={cn(
          'cursor-pointer',
          expanded ? 'whitespace-pre-wrap break-words' : 'truncate max-w-[300px]'
        )}
        onClick={() => setExpanded(!expanded)}
        title={expanded ? 'Click to collapse' : 'Click to expand'}
      >
        {isObject && !expanded ? (
          <span className="text-[var(--text-muted)]">
            {Array.isArray(value) ? `[${value.length} items]` : `{${Object.keys(value).length} keys}`}
          </span>
        ) : (
          text
        )}
      </div>
      {!expanded && (isObject || isLong) && (
        <button
          onClick={() => setExpanded(true)}
          className="absolute right-0 top-0 opacity-0 group-hover/cell:opacity-100 transition-opacity
            bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]
            border-none cursor-pointer p-0.5 rounded"
        >
          <Maximize2 size={9} />
        </button>
      )}
    </div>
  )
}

function ResizableHeader({ col, width, onResize, onSort, sortColumn, sortDir }) {
  const startX = useRef(0)
  const startWidth = useRef(0)

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    startX.current = e.clientX
    startWidth.current = width

    const handleMouseMove = (e) => {
      const delta = e.clientX - startX.current
      const newWidth = Math.max(50, startWidth.current + delta)
      onResize(col, newWidth)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [col, width, onResize])

  return (
    <th style={{ width: `${width}px` }} onClick={() => onSort(col)}>
      <div className="flex items-center">
        <span className="truncate flex-1 min-w-0">{col}</span>
        <SortIcon active={sortColumn === col} dir={sortDir} />
      </div>
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute right-0 top-0 bottom-0 w-[5px] cursor-col-resize z-[2]
          hover:bg-[var(--accent)]/40 transition-colors"
        onClick={(e) => e.stopPropagation()}
      />
    </th>
  )
}

export default function DataTableViewer({ sessionId, path }) {
  const {
    columns, rows, totalRows, totalPages, currentPage, pageSize,
    isLoading, error, sortColumn, sortDir, loadPage, setPageSize, sort,
  } = useDataTable(sessionId, path)

  // Column widths: initialize to 150px per column, reset when columns change
  const [colWidths, setColWidths] = useState({})

  useEffect(() => {
    if (columns.length > 0) {
      setColWidths((prev) => {
        const next = {}
        for (const col of columns) {
          next[col] = prev[col] || 150
        }
        return next
      })
    }
  }, [columns])

  const handleResize = useCallback((col, width) => {
    setColWidths((prev) => ({ ...prev, [col]: width }))
  }, [])

  if (error) {
    return (
      <div className="p-6 text-[var(--error)] text-sm bg-[var(--bg-primary)] h-full flex items-center justify-center">
        Failed to load data: {error}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading && rows.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-[var(--text-muted)] text-sm animate-shimmer">
            Loading data...
          </div>
        ) : (
          <table className="data-table data-table--resizable">
            <colgroup>
              {columns.map((col) => (
                <col key={col} style={{ width: `${colWidths[col] || 150}px` }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {columns.map((col) => (
                  <ResizableHeader
                    key={col}
                    col={col}
                    width={colWidths[col] || 150}
                    onResize={handleResize}
                    onSort={sort}
                    sortColumn={sortColumn}
                    sortDir={sortDir}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci}>
                      <CellContent value={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination bar */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <span className="text-[11px] text-[var(--text-muted)] font-mono">
          {totalRows.toLocaleString()} rows
        </span>

        <div className="flex items-center gap-2">
          <PageSizeSelector value={pageSize} onChange={setPageSize} />

          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadPage(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
            className="text-[11px] px-2 py-0.5 h-auto"
          >
            Prev
          </Button>
          <span className="text-[11px] text-[var(--text-secondary)] tabular-nums font-mono">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadPage(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
            className="text-[11px] px-2 py-0.5 h-auto"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
