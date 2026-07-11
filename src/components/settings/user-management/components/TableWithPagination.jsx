import { useState } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import CheckBox from './CheckBox';

const TableWithPagination = ({
  items = [],
  columns = [],
  itemsPerPage = 10,
  checkBoxOnChange,
  checkBoxValue,
  checkBoxDisabled,
  tableWrapperClassName = '',
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const hasCheckBox = columns.includes('CheckBox');

  return (
    <div className={tableWrapperClassName}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--color-grey-50)]">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--color-grey-700)]"
                >
                  {column === 'CheckBox' ? (
                    <CheckBox
                      checked={checkBoxValue}
                      onChange={checkBoxOnChange}
                      disabled={checkBoxDisabled}
                    />
                  ) : (
                    column
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-t border-[var(--color-grey-100)] hover:bg-[var(--color-grey-50)]"
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-4 py-3 text-sm text-[var(--color-grey-900)]"
                  >
                    {item[column]}
                  </td>
                ))}
              </tr>
            ))}
            {currentItems.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-[var(--color-grey-500)]"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded hover:bg-[var(--color-grey-100)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CaretLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => {
              return (
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1
              );
            })
            .map((page, index, arr) => (
              <span key={page}>
                {index > 0 && arr[index - 1] !== page - 1 && (
                  <span className="px-2 text-[var(--color-grey-400)]">...</span>
                )}
                <button
                  onClick={() => goToPage(page)}
                  className={`w-8 h-8 rounded ${
                    currentPage === page
                      ? 'bg-[var(--color-primary-500)] text-white'
                      : 'hover:bg-[var(--color-grey-100)]'
                  }`}
                >
                  {page}
                </button>
              </span>
            ))}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded hover:bg-[var(--color-grey-100)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CaretRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TableWithPagination;
