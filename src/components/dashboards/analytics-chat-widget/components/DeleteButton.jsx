import { useState } from 'react';
import { Trash } from '@phosphor-icons/react';
import { Button } from '@/ui';

export default function DeleteButton({ onDelete }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Button
      variant="secondaryGhost"
      onClick={handleDelete}
      disabled={deleting}
      className="h-fit ml-auto"
    >
      {deleting ? (
        <>
          <img
            src="/assets/spin-loader.gif"
            alt="loading"
            className="w-[13px] h-[13px] shrink-0"
          />
          <span>Deleting</span>
        </>
      ) : (
        <>
          <Trash size={13} className="shrink-0" />
          <span>Delete</span>
        </>
      )}
    </Button>
  );
}
