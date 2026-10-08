import { useState, useId } from 'react';
import { CaretDown, Check } from '@phosphor-icons/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
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
  const id = useId();

  const selectedOption = options.find((opt) => opt.value === value);

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
    <div className={wrapperClasses} {...rest}>
      <label className="dropdown__label" id={`${id}-label`}>
        {label}
      </label>

      {/* The list is the product dropdown (components/shadcn/dropdown-menu). */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger
          disabled={disabled}
          render={<button type="button" className="dropdown__trigger" aria-labelledby={`${id}-label`} />}
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
        </DropdownMenuTrigger>
        {options.length > 0 && (
          <DropdownMenuContent className="max-h-[280px]">
            {options.map((opt) => (
              <DropdownMenuItem key={opt.value} onClick={() => onChange?.(opt.value)}>
                <span className="min-w-0 flex-1">{opt.label}</span>
                {opt.value === value && <Check size={16} weight="bold" color="var(--color-primary-500)" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        )}
      </DropdownMenu>

      {error && errorMessage && (
        <div className="dropdown__error" role="alert">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
