import { RadioButton as PRRadio } from 'primereact/radiobutton';
import { twJoin, twMerge } from 'tailwind-merge';

export default function Radio({
  id,
  label,
  className,
  onChange = () => {},
  checked = false,
  disabled = false,
}) {
  return (
    <label
      {...(id && { htmlFor: id })}
      className={twMerge(
        'group flex items-center gap-3',
        disabled ? 'bg-pv-neutral-grey-50 hover:bg-pv-neutral-grey-50' : '',
        twJoin(className?.wrapper && className.wrapper),
        disabled ? `cursor-not-allowed` : ``
      )}
    >
      <PRRadio
        {...(id && { inputId: id })}
        {...(label && { value: label })}
        pt={{
          root: {
            className: twMerge('w-3 h-3 cursor-pointer select-none'),
          },
          box: ({ props }) => ({
            className: twMerge(
              'w-3 h-3 border border-pv-neutral-grey-900 rounded-full bg-white group-hover:bg-pv-primary-primary-100',
              twJoin(props.checked && 'border-brand-ai-100'),
              disabled && 'group-hover:bg-white'
            ),
          }),
          icon: ({ props }) => ({
            className: twJoin(props.checked && 'bg-brand-ai-100'),
          }),
        }}
        onChange={onChange}
        checked={checked}
        disabled={disabled}
      />
      {label ? (
        <span
          className={twMerge(
            'text-sm text-brand-ai-1100 select-none',
            twJoin(className?.label && className.label),
            disabled && 'text-pv-text-secondary-text'
          )}
        >
          {label}
        </span>
      ) : null}
    </label>
  );
}
