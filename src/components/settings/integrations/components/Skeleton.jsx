const Skeleton = ({ width, height, className = '' }) => {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      style={style}
      className={`animate-pulse bg-[var(--color-grey-200)] rounded ${className}`}
    />
  );
};

export default Skeleton;
