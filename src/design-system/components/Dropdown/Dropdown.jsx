import { useState, useRef, useEffect, useId } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import './Dropdown.css';

/**
 * Dropdown component — matches Figma design system.
 *
 * @param {object} props
 * @param {string} props.label - Field label
 * @param {string} props.placeholder
 * @param {Array<{value: string, label: string}>} props.options
 * @param {string} props.value - Currently selected value
 * @param {function} props.onChange - Called with selected value
 * @param {boolean} props.disabled
 * @param {boolean} props.error
 * @param {string} props.errorMessage
 * @param {string} props.className
 */
export function Dropdown({
  label = 'Form label',
  placeholder = 'Placeholder',
  options = [],
  value = '',
  onChange,
  disabled = false,
  error = false,
  errorMessage = '',
  className = '',
  ...rest
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const id = useId();

  const selectedOption = options.find((opt) => opt.value === value);

  /* Close on outside click */
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleToggle() {
    if (!disabled) setIsOpen((prev) => !prev);
  }

  function handleSelect(optionValue) {
    onChange?.(optionValue);
    setIsOpen(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') setIsOpen(false);
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  }

  const wrapperClasses = [
    'dropdown',
    isOpen ? 'dropdown--open' : '',
    error ? 'dropdown--error' : '',
    disabled ? 'dropdown--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses} ref={ref} {...rest}>
      <label className="dropdown__label" id={`${id}-label`}>
        {label}
      </label>

      <button
        type="button"
        className="dropdown__trigger"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={`${id}-label`}
      >
        <span
          className={`dropdown__trigger-text ${
            !selectedOption ? 'dropdown__trigger-text--placeholder' : ''
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="dropdown__trigger-icon">
          <CaretDown size={16} weight="regular" />
        </span>
      </button>

      {isOpen && options.length > 0 && (
        <ul className="dropdown__menu" role="listbox" aria-labelledby={`${id}-label`}>
          {options.map((opt) => (
            <li
              key={opt.value}
              className={`dropdown__option ${
                opt.value === value ? 'dropdown__option--selected' : ''
              }`}
              role="option"
              aria-selected={opt.value === value}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}

      {error && errorMessage && (
        <div className="dropdown__error" role="alert">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
