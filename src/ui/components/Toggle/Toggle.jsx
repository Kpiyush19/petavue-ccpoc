import { useId } from 'react';
import './Toggle.css';

/**
 * Toggle (switch) component — matches Figma design system.
 * 30×16 track, 14×14 thumb, pill-shaped.
 *
 * @param {object} props
 * @param {string} props.label
 * @param {boolean} props.checked
 * @param {function} props.onChange
 * @param {boolean} props.disabled
 * @param {string} props.className
 */
export function Toggle({
  label = '',
  checked = false,
  onChange,
  disabled = false,
  className = '',
  ...rest
}) {
  const id = useId();

  const classes = [
    'toggle',
    disabled ? 'toggle--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label className={classes} htmlFor={id}>
      <input
        id={id}
        className="toggle__input"
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-checked={checked}
        {...rest}
      />
      <span className="toggle__track" />
      {label && <span className="toggle__label">{label}</span>}
    </label>
  );
}
