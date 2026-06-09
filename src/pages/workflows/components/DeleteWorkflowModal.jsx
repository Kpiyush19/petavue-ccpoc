import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button, Modal } from "@/common-components";

export const DeleteWorkflowModal = ({ workflow, onClose, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!workflow) {
      setIsDeleting(false);
    }
  }, [workflow]);

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(workflow);
      setIsDeleting(false);
    } catch {
      toast.error("Failed to delete workflow");
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={Boolean(workflow)}
      onClose={handleClose}
      title="Delete Workflow"
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
            Are you sure you want to delete <span className="font-medium">{workflow?.name}</span>?
          </p>
          <p className="text-xs text-[var(--pv-neutral-grey-500)]">
            This will stop all scheduled runs for this workflow.
          </p>
          {workflow?.dashboard_id && (
            <p className="text-xs text-[var(--pv-error-text)]">The linked published dashboard will also be deleted.</p>
          )}
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
