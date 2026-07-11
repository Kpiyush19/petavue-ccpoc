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
      'bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-700)] focus:ring-[var(--color-primary-500)]',
    secondary:
      'bg-white text-[var(--color-grey-700)] border border-[var(--color-grey-300)] hover:bg-[var(--color-grey-50)] focus:ring-[var(--color-grey-500)]',
    ghost:
      'bg-transparent text-[var(--color-grey-600)] hover:bg-[var(--color-grey-100)] hover:text-[var(--color-grey-900)]',
    danger:
      'bg-[var(--color-red)] text-white hover:bg-[var(--color-red)] focus:ring-[var(--color-red)]',
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
