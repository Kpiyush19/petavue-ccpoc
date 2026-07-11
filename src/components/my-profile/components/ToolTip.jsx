const ToolTip = ({ children, content, show }) => {
  return (
    <div className="relative inline-block">
      {children}
      {show && (
        <div className="absolute z-50 bottom-full left-0 mb-2 px-3 py-2 text-xs text-white bg-[var(--color-text-primary)] rounded-lg shadow-lg max-w-xs">
          {content}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[var(--color-text-primary)]" />
        </div>
      )}
    </div>
  );
};

export default ToolTip;
