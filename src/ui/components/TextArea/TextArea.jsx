import { useId } from 'react';
import './TextArea.css';

/**
 * TextArea component — matches Figma design system.
 *
 * @param {object} props
 * @param {string} props.label - Field label
 * @param {string} props.placeholder
 * @param {string} props.value
 * @param {function} props.onChange
 * @param {boolean} props.disabled
 * @param {boolean} props.error
 * @param {string} props.errorMessage
 * @param {number} props.rows - Number of visible rows
 * @param {string} props.className
 */
export function TextArea({
  label = 'Form label',
  placeholder = 'Placeholder',
  value,
  onChange,
  disabled = false,
  error = false,
  errorMessage = '',
  rows = 3,
  className = '',
  ...rest
}) {
  const id = useId();

  const wrapperClasses = [
    'text-area',
    error ? 'text-area--error' : '',
    disabled ? 'text-area--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses}>
      <label className="text-area__label" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        className="text-area__field"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={rows}
        aria-invalid={error || undefined}
        aria-describedby={error && errorMessage ? `${id}-error` : undefined}
        {...rest}
      />
      {error && errorMessage && (
        <div className="text-area__error" id={`${id}-error`} role="alert">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
