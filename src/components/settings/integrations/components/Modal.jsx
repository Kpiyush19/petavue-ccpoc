import { useEffect } from 'react';
import { X } from '@phosphor-icons/react';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseBtn = true,
  className = '',
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      <div
        className={`relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden ${className}`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-grey-200)]">
            <h2 className="text-base font-semibold text-[var(--color-grey-900)]">{title}</h2>
            {showCloseBtn && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-[var(--color-grey-100)] rounded-full transition-colors"
              >
                <X size={20} className="text-[var(--color-grey-500)]" />
              </button>
            )}
          </div>
        )}
        {!title && showCloseBtn && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-[var(--color-grey-100)] rounded-full transition-colors"
          >
            <X size={20} className="text-[var(--color-grey-500)]" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
};

export default Modal;
