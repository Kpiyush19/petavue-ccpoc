const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
}) => {
  const baseStyles =
    'px-4 py-2 rounded-lg font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-[var(--pv-primary-500)] text-white hover:bg-[var(--pv-primary-700)] focus:ring-[var(--pv-primary-500)]',
    secondary:
      'bg-white text-[var(--pv-neutral-grey-700)] border border-[var(--pv-neutral-grey-300)] hover:bg-[var(--pv-neutral-grey-50)] focus:ring-[var(--pv-neutral-grey-500)]',
    ghost:
      'bg-transparent text-[var(--pv-neutral-grey-600)] hover:bg-[var(--pv-neutral-grey-100)] hover:text-[var(--pv-neutral-grey-900)]',
    danger:
      'bg-[var(--pv-error-text)] text-white hover:bg-[var(--pv-error-text)] focus:ring-[var(--pv-error-text)]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
