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
      'bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-700)] focus:ring-[var(--color-primary-500)] disabled:hover:bg-[var(--color-primary-500)]',
    secondary:
      'bg-white text-[var(--color-grey-700)] border border-[var(--color-grey-300)] hover:bg-[var(--color-grey-50)] focus:ring-[var(--color-primary-500)]',
    ghost:
      'bg-transparent text-[var(--color-grey-600)] hover:bg-[var(--color-grey-100)] focus:ring-[var(--color-grey-500)]',
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
