import { forwardRef } from 'react';

const InputField = forwardRef(
  (
    {
      type = 'text',
      placeholder,
      value,
      onChange,
      onKeyDown,
      onBlur,
      disabled = false,
      className = '',
      label,
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--pv-neutral-grey-700)] mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          disabled={disabled}
          className={`w-full px-3 py-2 border border-[var(--pv-neutral-grey-300)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pv-primary-500)] focus:border-[var(--pv-primary-500)] disabled:bg-[var(--pv-neutral-grey-50)] disabled:text-[var(--pv-neutral-grey-500)] disabled:cursor-not-allowed ${className}`}
        />
      </div>
    );
  }
);

InputField.displayName = 'InputField';

export default InputField;
