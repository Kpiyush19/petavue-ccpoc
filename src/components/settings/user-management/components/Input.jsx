const Input = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  icon,
  clearIcon,
  onClear,
  className = '',
  containerClassName = '',
}) => {
  return (
    <div className={`relative flex items-center ${containerClassName}`}>
      {icon && (
        <span className="absolute left-3 pointer-events-none">{icon}</span>
      )}
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-[var(--pv-neutral-grey-300)] rounded-lg text-sm
          ${icon ? 'pl-10' : ''}
          ${clearIcon && value ? 'pr-10' : ''}
          ${disabled ? 'bg-[var(--pv-neutral-grey-50)] cursor-not-allowed' : 'bg-white'}
          focus:outline-none focus:ring-1 focus:ring-[var(--pv-primary-500)] focus:border-[var(--pv-primary-500)]
          ${className}`}
      />
      {clearIcon && value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3"
        >
          {clearIcon}
        </button>
      )}
    </div>
  );
};

export default Input;
