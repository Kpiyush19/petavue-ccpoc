import { useState, useRef, useEffect } from 'react';
import { CaretDown, Check } from '@phosphor-icons/react';
import './ListDropdown.css';

/**
 * ListDropdown — lightweight floating menu triggered by a borderless button.
 *
 * @param {object} props
 * @param {Array<{value: string|number, label: string}>} props.options
 * @param {string|number} props.value - Currently selected value
 * @param {function} props.onChange - Called with selected value
 * @param {function} [props.renderLabel] - Custom label renderer; receives selected option
 * @param {boolean} [props.disabled]
 * @param {string} [props.className]
 */
export function ListDropdown({
  options = [],
  value,
  onChange,
  renderLabel,
  disabled = false,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const label = renderLabel
    ? renderLabel(selected)
    : selected?.label || '';

  const classes = [
    'list-dropdown',
    disabled ? 'list-dropdown--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} ref={wrapperRef}>
      <button
        type="button"
        className="list-dropdown__trigger"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="list-dropdown__trigger-text">{label}</span>
        <CaretDown
          size={12}
          weight="regular"
          color={disabled ? 'var(--color-neutral-300)' : 'var(--color-text-primary)'}
        />
      </button>

      {open && options.length > 0 && (
        <div className="list-dropdown__menu" role="listbox">
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`list-dropdown__item ${isActive ? 'list-dropdown__item--active' : ''}`}
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onChange?.(opt.value);
                  setOpen(false);
                }}
              >
                <span className={isActive ? 'text-body-1-medium' : 'text-body-1-regular'}>
                  {opt.label}
                </span>
                {isActive && (
                  <Check size={16} weight="regular" color="var(--color-text-primary)" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
