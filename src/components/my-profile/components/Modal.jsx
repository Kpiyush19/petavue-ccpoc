import { useEffect, useRef } from 'react';
import { X } from '@phosphor-icons/react';

const Modal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef(null);

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
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        ref={modalRef}
        className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--pv-neutral-grey-200)]">
          {title && (
            <h2 className="text-lg font-semibold text-[var(--pv-text-primary-text)]">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--pv-neutral-grey-100)] rounded-full transition-colors ml-auto"
          >
            <X size={20} className="text-[var(--pv-neutral-grey-500)]" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-60px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
