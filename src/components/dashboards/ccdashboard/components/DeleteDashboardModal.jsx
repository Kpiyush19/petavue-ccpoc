import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button, Modal } from "@/ui";

export const DeleteDashboardModal = ({ dashboard, onClose, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!dashboard) {
      setIsDeleting(false);
    }
  }, [dashboard]);

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(dashboard);
      setIsDeleting(false);
    } catch {
      toast.error("Failed to delete dashboard");
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={Boolean(dashboard)}
      onClose={handleClose}
      title="Delete Dashboard"
      topStripClassName="hidden"
      topBorderClassname="border-t-5 border-[var(--color-red)]"
      headerClassName="py-3 px-4"
      titleClassName="text-[14px] font-medium"
      closeClassName=""
      className="w-[500px]"
    >
      <div className="flex flex-col">
        <div className="px-4 pb-4 flex flex-col gap-2">
          <p className="text-sm text-[var(--color-grey-600)]">
            Are you sure you want to delete <span className="font-medium">{dashboard?.name}</span>?
          </p>
          <p className="text-xs text-[var(--color-grey-500)]">
            This action cannot be undone.
          </p>
        </div>
        <div className="border-t border-[var(--color-grey-100)]">
          <div className="flex justify-between items-center py-3 px-4">
            <Button variant="ghost" size="lg" onClick={handleClose} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="red" size="lg" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
