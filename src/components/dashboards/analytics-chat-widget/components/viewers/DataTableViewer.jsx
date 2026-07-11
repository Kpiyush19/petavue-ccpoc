import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Maximize2,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useDataTable } from '../../hooks/useDataTable';

function formatCell(cell) {
  if (cell == null) return '';
  if (typeof cell === 'object') {
    try {
      return JSON.stringify(cell, null, 1);
    } catch {
      return String(cell);
    }
  }
  return String(cell);
}

function SortIcon({ active, dir }) {
  if (!active) {
    return <ChevronsUpDown size={10} className="ml-1 inline opacity-30" />;
  }
  return dir === 'asc' ? (
    <ChevronUp size={10} className="ml-1 inline" />
  ) : (
    <ChevronDown size={10} className="ml-1 inline" />
  );
}

function CellContent({ value }) {
  const text = formatCell(value);
  const isObject = typeof value === 'object' && value !== null;
  const isLong = text.length > 80;

  const [expanded, setExpanded] = useState(false);

  if (!isObject && !isLong) {
    return <span>{text}</span>;
  }

  return (
    <div className="relative group/cell">
      <div
        className={cn(
          'cursor-pointer',
          expanded ? 'data-table__cell-expanded' : 'truncate max-w-[280px]'
        )}
        onClick={() => setExpanded(!expanded)}
        title={expanded ? 'Click to collapse' : 'Click to expand'}
      >
        {isObject && !expanded ? (
          <span className="text-[var(--text-muted)] text-[12px] font-mono">
            {Array.isArray(value)
              ? `[${value.length} items]`
              : `{${Object.keys(value).length} keys}`}
          </span>
        ) : (
          <pre className="text-[12px] font-mono whitespace-pre-wrap break-words m-0">
            {text}
          </pre>
        )}
      </div>
      {!expanded && (isObject || isLong) && (
        <button
          onClick={() => setExpanded(true)}
          className="data-table__expand-btn group-hover/cell:opacity-100"
        >
          <Maximize2 size={9} />
        </button>
      )}
    </div>
  );
}

function ResizableHeader({
  col,
  width,
  onResize,
  onSort,
  sortColumn,
  sortDir,
}) {
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      startX.current = e.clientX;
      startWidth.current = width;

      const handleMouseMove = (e) => {
        const delta = e.clientX - startX.current;
        const newWidth = Math.max(50, startWidth.current + delta);
        onResize(col, newWidth);
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [col, width, onResize]
  );

  return (
    <th style={{ width: `${width}px` }} onClick={() => onSort(col)}>
      <div className="flex items-center">
        <span className="truncate flex-1 min-w-0">{col}</span>
        <SortIcon active={sortColumn === col} dir={sortDir} />
      </div>
      <div
        onMouseDown={handleMouseDown}
        className="data-table__resize-handle"
        onClick={(e) => e.stopPropagation()}
      />
    </th>
  );
}

export default function DataTableViewer({ sessionId, path, type }) {
  const {
    columns,
    rows,
    totalRows,
    totalPages,
    currentPage,
    isLoading,
    error,
    sortColumn,
    sortDir,
    loadPage,
    sort,
  } = useDataTable(sessionId, path);

  const [colWidths, setColWidths] = useState({});

  useEffect(() => {
    if (columns.length > 0) {
      setColWidths((prev) => {
        const next = {};
        for (const col of columns) {
          next[col] = prev[col] || 150;
        }
        return next;
      });
    }
  }, [columns]);

  const handleResize = useCallback((col, width) => {
    setColWidths((prev) => ({ ...prev, [col]: width }));
  }, []);

  if (error) {
    return (
      <div className="data-table__error">Failed to load data: {error}</div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto m-4">
        {isLoading && rows.length === 0 ? (
          <div className="data-table__loading">Loading data...</div>
        ) : (
          <table className="data-table data-table--resizable">
            <colgroup>
              {columns.map((col) => (
                <col
                  key={col}
                  style={{ width: `${colWidths[col] || 150}px` }}
                />
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

      <div className="data-table__pagination">
        <span className="data-table__row-count">
          {totalRows.toLocaleString()} rows
        </span>

        <div className="data-table__pagination-controls">
          <button
            onClick={() => loadPage(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
            className="data-table__page-btn"
            title="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="data-table__page-info">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => loadPage(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
            className="data-table__page-btn"
            title="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
