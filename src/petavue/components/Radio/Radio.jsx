import { useId } from 'react';
import './Radio.css';

/**
 * Single Radio button — matches Figma design system.
 * 16×16 outer, 12×12 border ring, 6×6 selection dot.
 */
export function Radio({
  label = '',
  name = '',
  value = '',
  checked = false,
  onChange,
  disabled = false,
  className = '',
  ...rest
}) {
  const id = useId();

  const classes = [
    'radio',
    disabled ? 'radio--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label className={classes} htmlFor={id}>
      <input
        id={id}
        className="radio__input"
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        {...rest}
      />
      <span className="radio__circle" />
      {label && <span className="radio__label">{label}</span>}
    </label>
  );
}

/**
 * RadioGroup — renders a group of Radio buttons.
 */
export function RadioGroup({
  label = '',
  name = '',
  options = [],
  value = '',
  onChange,
  disabled = false,
  className = '',
}) {
  return (
    <fieldset className={`radio-group ${className}`.trim()} role="radiogroup">
      {label && <legend className="radio-group__label">{label}</legend>}
      <div className="radio-group__options">
        {options.map((opt) => (
          <Radio
            key={opt.value}
            label={opt.label}
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange?.(opt.value)}
            disabled={disabled || opt.disabled}
          />
        ))}
      </div>
    </fieldset>
  );
}
