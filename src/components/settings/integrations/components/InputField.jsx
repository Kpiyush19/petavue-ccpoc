import { forwardRef, useState } from 'react';
import { Eye, EyeSlash } from '@phosphor-icons/react';

const InputField = forwardRef(
  (
    {
      label,
      type = 'text',
      placeholder,
      value,
      onChange,
      disabled = false,
      error,
      className = '',
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className={`flex flex-col gap-2 w-full ${className}`}>
        {label && (
          <label className="text-sm text-[var(--pv-neutral-grey-700)] font-medium">{label}</label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors
              ${disabled ? 'bg-[var(--pv-neutral-grey-50)] cursor-not-allowed' : 'bg-white'}
              ${error ? 'border-[var(--pv-error-text)] focus:ring-[var(--pv-error-text)]' : 'border-[var(--pv-neutral-grey-300)] focus:ring-[var(--pv-primary-500)] focus:border-[var(--pv-primary-500)]'}
              focus:outline-none focus:ring-1`}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--pv-neutral-grey-500)] hover:text-[var(--pv-neutral-grey-700)]"
            >
              {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && <span className="text-xs text-[var(--pv-error-text)]">{error}</span>}
      </div>
    );
  }
);

InputField.displayName = 'InputField';

export default InputField;
