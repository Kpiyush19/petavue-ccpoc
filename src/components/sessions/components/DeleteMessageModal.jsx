import { useState } from "react";
import { Button, Modal } from "@/ui";

export const DeleteMessageModal = ({ isOpen, onClose, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch {
      // Error handling done by parent
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Delete Message"
      topStripClassName="hidden"
      headerClassName="py-3 px-4"
      titleClassName="text-[14px] font-medium"
      className="w-[500px]"
      variant="warning"
    >
      <div className="flex flex-col">
        <div className="px-4 pb-4 flex flex-col gap-2">
          <p className="text-sm text-[var(--color-grey-600)]">
            Are you sure you want to delete your last message and its response?
          </p>
        </div>
        <div className="border-t border-[var(--color-grey-100)]">
          <div className="flex justify-between items-center py-3 px-4">
            <Button variant="ghost" size="lg" onClick={handleClose} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="primary" size="lg" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteMessageModal;
