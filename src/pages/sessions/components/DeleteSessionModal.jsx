import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button, Modal } from "@/common-components";

export const DeleteSessionModal = ({ session, onClose, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!session) {
      setIsDeleting(false);
    }
  }, [session]);

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(session);
      setIsDeleting(false);
    } catch {
      toast.error("Failed to delete session");
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={Boolean(session)}
      onClose={handleClose}
      title="Delete Session"
      topStripClassName="hidden"
      topBorderClassname="border-t-5 border-[var(--pv-error-text)]"
      headerClassName="py-3 px-4"
      titleClassName="text-[14px] font-medium"
      closeClassName=""
      className="w-[500px]"
    >
      <div className="flex flex-col">
        <div className="px-4 pb-4 flex flex-col gap-2">
          <p className="text-sm text-[var(--pv-neutral-grey-600)]">
            Are you sure you want to delete <span className="font-medium">{session?.name || "this session"}</span>?
          </p>
          <p className="text-xs text-[var(--pv-neutral-grey-500)]">
            This action cannot be undone.
          </p>
        </div>
        <div className="border-t border-[var(--pv-neutral-grey-150)]">
          <div className="flex justify-between items-center py-3 px-4">
            <Button btnColor="ghost" btnSize="lg" onClick={handleClose} disabled={isDeleting}>
              Cancel
            </Button>
            <Button btnColor="primary red" btnSize="lg" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
