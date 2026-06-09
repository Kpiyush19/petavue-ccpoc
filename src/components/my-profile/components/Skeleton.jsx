const Skeleton = ({ width, height, className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-[var(--pv-neutral-grey-200)] rounded ${className}`}
      style={{
        width: width || '100%',
        height: height || '20px',
      }}
    />
  );
};

export default Skeleton;
