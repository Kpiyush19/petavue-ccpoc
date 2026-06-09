import { useState } from 'react';
import {
  MagnifyingGlass,
  XCircle,
} from '@phosphor-icons/react';
import { Button } from '../Button/Button';
import './DropdownMenu.css';

/**
 * DropdownMenu — floating dropdown panel with optional search, list items, and footer.
 *
 * @param {object} props
 * @param {boolean} props.searchable - Show search bar
 * @param {Array<{label:string, value:string}>} props.items - List items
 * @param {function} props.onSelect - Called with item value on click
 * @param {function} props.onApply - Called when Apply is clicked
 * @param {function} props.onCancel - Called when Cancel is clicked
 * @param {function} props.onReset - Called when Reset is clicked
 * @param {string} props.className - External override class
 */
export function DropdownMenu({
  searchable = false,
  items = [],
  onSelect,
  onApply,
  onCancel,
  onReset,
  className = '',
}) {
  const [search, setSearch] = useState('');

  const filtered = search
    ? items.filter((item) =>
        item.label.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  const hasResults = filtered.length > 0;

  function handleClearSearch() {
    setSearch('');
  }

  const classes = ['dropdown-menu', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {/* Search bar */}
      {searchable && (
        <div className="dropdown-menu__search-wrap">
          <div className={`dropdown-menu__search ${search ? 'dropdown-menu__search--active' : ''}`}>
            <span className="dropdown-menu__search-icon">
              <MagnifyingGlass
                size={12}
                weight="regular"
                color={search ? 'var(--color-primary-500)' : 'var(--color-neutral-400)'}
              />
            </span>
            <input
              type="text"
              className="dropdown-menu__search-input"
              placeholder="Search Item"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="dropdown-menu__search-clear"
                onClick={handleClearSearch}
                aria-label="Clear search"
                type="button"
              >
                <XCircle size={12} weight="regular" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search status text */}
      {searchable && search && (
        <div className="dropdown-menu__search-status">
          <span className="dropdown-menu__search-status-text">
            {hasResults ? 'Search results for' : 'No results for'}
          </span>
          {' '}
          <span className="dropdown-menu__search-status-term">"{search}"</span>
        </div>
      )}

      {/* Items list */}
      <div className="dropdown-menu__list">
        {(!searchable || !search || hasResults) &&
          filtered.map((item, i) => (
            <button
              key={item.value || i}
              className="dropdown-menu__item"
              onClick={() => onSelect && onSelect(item.value)}
              type="button"
            >
              {item.label}
            </button>
          ))}

        {searchable && search && !hasResults && (
          <div className="dropdown-menu__empty">
            <Button
              variant="secondary"
              size="sm"
              label="Clear search"
              onClick={handleClearSearch}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="dropdown-menu__footer">
        <button
          className="dropdown-menu__footer-reset"
          onClick={onReset}
          type="button"
        >
          Reset
        </button>
        <div className="dropdown-menu__footer-actions">
          <Button
            variant="secondary"
            size="sm"
            label="Cancel"
            onClick={onCancel}
          />
          <Button
            variant="primary"
            size="sm"
            label="Apply"
            onClick={onApply}
          />
        </div>
      </div>
    </div>
  );
}
