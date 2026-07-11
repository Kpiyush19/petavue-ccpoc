import { useId, useRef, useEffect } from 'react';
import { Check, Minus } from '@phosphor-icons/react';
import './Checkbox.css';

/**
 * Checkbox component — matches Figma design system.
 * 16×16 box. States: unchecked, checked, indeterminate.
 *
 * @param {object} props
 * @param {string} props.label
 * @param {boolean} props.checked
 * @param {boolean} props.indeterminate - Indeterminate (dash) state
 * @param {function} props.onChange
 * @param {boolean} props.disabled
 * @param {string} props.className
 */
export function Checkbox({
  label = '',
  checked = false,
  indeterminate = false,
  onChange,
  disabled = false,
  className = '',
  ...rest
}) {
  const id = useId();
  const inputRef = useRef(null);

  /* Sync the indeterminate DOM property (not settable via HTML attribute) */
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const classes = [
    'checkbox',
    disabled ? 'checkbox--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label className={classes} htmlFor={id}>
      <input
        ref={inputRef}
        id={id}
        className="checkbox__input"
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        {...rest}
      />
      <span className="checkbox__box">
        <span className="checkbox__icon checkbox__icon--check">
          <Check size={12} weight="bold" />
        </span>
        <span className="checkbox__icon checkbox__icon--indeterminate">
          <Minus size={12} weight="bold" />
        </span>
      </span>
      {label && <span className="checkbox__label">{label}</span>}
    </label>
  );
}
