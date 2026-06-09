import { useId } from 'react';
import './TextInput.css';

/**
 * TextInput component — matches Figma design system.
 *
 * @param {object} props
 * @param {string} props.label - Field label
 * @param {string} props.placeholder
 * @param {string} props.value
 * @param {function} props.onChange
 * @param {boolean} props.disabled
 * @param {boolean} props.error
 * @param {string} props.errorMessage
 * @param {string} props.type - Input type (text, password, email, etc.)
 * @param {string} props.className
 */
export function TextInput({
  label = 'Form label',
  placeholder = 'Placeholder',
  value,
  onChange,
  disabled = false,
  error = false,
  errorMessage = '',
  type = 'text',
  className = '',
  ...rest
}) {
  const id = useId();

  const wrapperClasses = [
    'text-input',
    error ? 'text-input--error' : '',
    disabled ? 'text-input--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses}>
      <label className="text-input__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="text-input__field"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={error || undefined}
        aria-describedby={error && errorMessage ? `${id}-error` : undefined}
        {...rest}
      />
      {error && errorMessage && (
        <div className="text-input__error" id={`${id}-error`} role="alert">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
