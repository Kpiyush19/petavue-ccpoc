const Avatar = ({ name, fullName, size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-6 h-6 text-xs',
    lg: 'w-8 h-8 text-sm',
  };

  const colors = [
    'bg-[var(--color-primary-100)] text-[var(--color-primary-700)]',
    'bg-[var(--color-green-bg)] text-[var(--color-green)]',
    'bg-[var(--color-tag-purple)] text-[var(--color-purple-400)]',
    'bg-[var(--color-tag-orange)] text-[var(--color-orange)]',
    'bg-[var(--color-tag-pink)] text-[var(--color-red)]',
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
