import { useState } from 'react';
import { CaretDown, Check } from '@phosphor-icons/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
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
    <div className={classes}>
      {/* The list is the product dropdown (components/shadcn/dropdown-menu). */}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          disabled={disabled}
          render={<button type="button" className="list-dropdown__trigger" />}
        >
          <span className="list-dropdown__trigger-text">{label}</span>
          <CaretDown
            size={12}
            weight="regular"
            color={disabled ? 'var(--color-grey-300)' : 'var(--color-text-primary)'}
          />
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
    </div>
  );
}
