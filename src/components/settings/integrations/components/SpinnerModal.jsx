import { useEffect, useState } from 'react';
import Modal from './Modal';
import { useNotificationStore } from '../stores/notifications';

export const SpinnerModal = ({ isModalOpen, onClose, onNavigate }) => {
  const { addNotification } = useNotificationStore();

  const [count, setCount] = useState(0);
  const [text, setText] = useState('');
  const status = [
    'Building a dictionary',
    'Sinking the table schema',
    'Verifying the columns',
    'Creating descriptions',
    'Moving to definitions',
    'Creating definitions',
    'Connecting the sources',
    'Verifying definitions',
    'Connected with Gainsight',
  ];

  useEffect(() => {
    const interval = setTimeout(() => {
      if (status[count]) {
        setText(status[count]);
      } else {
        addNotification({
          type: 'success',
          title: `Gainsight Connected Successfully`,
        });
        if (onNavigate) {
          onNavigate('/data-hub/dictionary');
        }
        onClose();
      }
      setCount(count + 1);
    }, 1500);

    return () => clearTimeout(interval);
  }, [count]);

  return (
    <Modal isOpen={isModalOpen} onClose={onClose} showCloseBtn={false}>
      <div className="mx-auto flex flex-col gap-3 items-center justify-center py-8">
        <h1 className="text-lg font-semibold text-[var(--pv-text-primary-text)]">
          Connecting to Gainsight
        </h1>
        <svg
          className="animate-spin h-8 w-8 text-[var(--pv-primary-500)]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <div className="text-[var(--pv-neutral-grey-600)]">{text}</div>
      </div>
    </Modal>
  );
};

export default SpinnerModal;
