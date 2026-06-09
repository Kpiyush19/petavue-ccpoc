import { Checkbox as PRCheckbox } from 'primereact/checkbox';
import { twJoin, twMerge } from 'tailwind-merge';
import { Check, Minus } from '@phosphor-icons/react';
import spinner from '../assets/spinner.gif';
import Tooltip from '../Tooltip';

export default function Checkbox({
  id,
  label,
  className,
  onChange = () => {},
  checked = false,
  intermediate = false,
  disabled = false,
  loading = false,
  displayTooltip = false,
  displayTooltipOnOverflow = false,
}) {
  return (
    <label
      {...(id && { htmlFor: id })}
      className={twMerge(
        'flex items-center gap-3',
        twJoin(className?.wrapper && className.wrapper)
      )}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {!loading ? (
        <PRCheckbox
          {...(id && { inputId: id })}
          {...(label && { value: label })}
          pt={{
            root: {
              className: twMerge(
                'w-4 h-4 cursor-pointer inline-flex relative select-none align-bottom p-0.5 group',
                className?.checkboxWrapper && className.checkboxWrapper
              ),
            },
            input: {
              className:
                'absolute appearance-none top-0 left-0 size-full p-0 m-0 opacity-0 z-10 outline-none cursor-pointer',
            },
            box: ({ props, context }) => ({
              className: twMerge(
                'w-3 h-3 flex items-center justify-center border border-transparent rounded-sm',
                twJoin(
                  !context.checked &&
                    'border-brand-ai-1100 bg-white group-hover:bg-brand-ai-gray-500',
                  context.checked &&
                    'bg-brand-ai-100 group-hover:bg-pv-primary-primary-800',
                  props.disabled && !context.checked && 'border-brand-ai-800',
                  props.disabled &&
                    context.checked &&
                    'bg-pv-primary-primary-300'
                ),
                className?.checkbox && className.checkbox
              ),
            }),
            icon: 'm-1',
          }}
          icon={
            intermediate ? (
              <Minus size={8} weight="bold" className="text-white" />
            ) : (
              <Check size={8} weight="bold" className="text-white" />
            )
          }
          onChange={onChange}
          checked={checked}
          disabled={disabled}
        />
      ) : (
        <img src={spinner} alt="loading" height="14px" width="14px" />
      )}
      {typeof label === 'string' ? (
        <Tooltip
          title={displayTooltip && label}
          placement="top"
          displayTooltipOnOverflow={displayTooltipOnOverflow}
        >
          <span
            className={twMerge(
              'text-sm text-brand-ai-1100 select-none',
              twJoin(className?.label && className.label)
            )}
          >
            {label}
          </span>
        </Tooltip>
      ) : (
        label
      )}
    </label>
  );
}
