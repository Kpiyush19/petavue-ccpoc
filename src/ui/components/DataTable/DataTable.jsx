import { useState, useMemo } from 'react';
import { CaretUp, CaretDown } from '@phosphor-icons/react';
import './DataTable.css';

/**
 * DataTable component — reusable data table with sorting, scrolling, and pagination.
 * Max 10 rows visible at a time. Supports horizontal and vertical scroll.
 *
 * @param {object} props
 * @param {Array<{key: string, label: string, sortable?: boolean, width?: string}>} props.columns
 * @param {Array<object>} props.rows - Array of row objects keyed by column.key
 * @param {boolean} props.zebra - Enable zebra striping (alternating row bg)
 * @param {boolean} props.stickyHeader - Keep header fixed during vertical scroll
 * @param {string} props.emptyMessage - Message when no rows
 * @param {string} props.className
 */
export function DataTable({
  columns = [],
  rows = [],
  zebra = false,
  stickyHeader = true,
  emptyMessage = 'No data available',
  className = '',
  ...rest
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  /* Max rows shown at once — vertical scroll kicks in beyond this */
  const MAX_VISIBLE_ROWS = 10;

  /* ---- Sorting ---- */
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return sortDir === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, sortKey, sortDir]);

  const classes = [
    'data-table',
    className,
  ].filter(Boolean).join(' ');

  const needsVerticalScroll = rows.length > MAX_VISIBLE_ROWS;

  return (
    <div className={classes} {...rest}>
      <div
        className={[
          'data-table__scroll-container',
          needsVerticalScroll ? 'data-table__scroll-container--scrollable' : '',
        ].filter(Boolean).join(' ')}
      >
        <table className="data-table__table">
          {/* ---- Header ---- */}
          <thead className={stickyHeader ? 'data-table__thead--sticky' : ''}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={[
                    'data-table__th',
                    col.sortable ? 'data-table__th--sortable' : '',
                    sortKey === col.key ? 'data-table__th--active' : '',
                  ].filter(Boolean).join(' ')}
                  style={col.width ? { minWidth: col.width } : undefined}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  aria-sort={
                    sortKey === col.key
                      ? sortDir === 'asc' ? 'ascending' : 'descending'
                      : undefined
                  }
                >
                  <span className="data-table__th-content">
                    <span>{col.label}</span>
                    {col.sortable && (
                      <span className="data-table__sort-icons">
                        <CaretUp
                          size={10}
                          weight="bold"
                          className={
                            sortKey === col.key && sortDir === 'asc'
                              ? 'data-table__sort-icon--active'
                              : 'data-table__sort-icon'
                          }
                        />
                        <CaretDown
                          size={10}
                          weight="bold"
                          className={
                            sortKey === col.key && sortDir === 'desc'
                              ? 'data-table__sort-icon--active'
                              : 'data-table__sort-icon'
                          }
                        />
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          {/* ---- Body ---- */}
          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td className="data-table__empty" colSpan={columns.length}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedRows.map((row, rowIdx) => (
                <tr
                  key={row.id ?? rowIdx}
                  className={[
                    'data-table__row',
                    zebra && rowIdx % 2 !== 0 ? 'data-table__row--striped' : '',
                  ].filter(Boolean).join(' ')}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="data-table__td">
                      {row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
