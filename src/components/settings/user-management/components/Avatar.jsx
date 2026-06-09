const Avatar = ({ name, fullName, size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-6 h-6 text-xs',
    lg: 'w-8 h-8 text-sm',
  };

  const colors = [
    'bg-[var(--pv-primary-100)] text-[var(--pv-primary-700)]',
    'bg-[var(--pv-success-bg)] text-[var(--pv-success-text)]',
    'bg-[var(--pv-tags-purple)] text-[var(--pv-accent-text)]',
    'bg-[var(--pv-tags-yellow)] text-[var(--pv-warning-text)]',
    'bg-[var(--pv-tags-pink)] text-[var(--pv-error-text)]',
  ];

  const colorIndex = (name?.charCodeAt(0) || 0) % colors.length;

  return (
    <div
      className={`flex items-center justify-center rounded-full font-medium ${sizes[size]} ${colors[colorIndex]} ${className}`}
      title={fullName}
    >
      {name || '?'}
    </div>
  );
};

export default Avatar;
