const Button = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  className = '',
  type = 'button',
}) => {
  const baseStyles =
    'px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-[var(--pv-primary-500)] text-white hover:bg-[var(--pv-primary-700)] focus:ring-[var(--pv-primary-500)] disabled:hover:bg-[var(--pv-primary-500)]',
    secondary:
      'bg-white text-[var(--pv-neutral-grey-700)] border border-[var(--pv-neutral-grey-300)] hover:bg-[var(--pv-neutral-grey-50)] focus:ring-[var(--pv-primary-500)]',
    ghost:
      'bg-transparent text-[var(--pv-neutral-grey-600)] hover:bg-[var(--pv-neutral-grey-100)] focus:ring-[var(--pv-neutral-grey-500)]',
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
