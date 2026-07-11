import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button, Modal, Input } from "@/ui";

export const RenameDashboardModal = ({ dashboard, onClose, onRename }) => {
  const [value, setValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    if (dashboard) {
      setValue(dashboard.name || "");
      setIsRenaming(false);
    } else {
      setIsRenaming(false);
    }
  }, [dashboard]);

  const handleClose = () => {
    if (!isRenaming) {
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!value.trim() || value.trim() === dashboard?.name) return;
    setIsRenaming(true);
    try {
      await onRename(dashboard, value.trim());
      setIsRenaming(false);
    } catch {
      toast.error("Failed to rename dashboard");
      setIsRenaming(false);
    }
  };

  return (
    <Modal
      isOpen={Boolean(dashboard)}
      onClose={handleClose}
      title="Rename Dashboard"
      topStripClassName="hidden"
      topBorderClassname="border-t-5 border-[var(--color-primary-500)]"
      headerClassName="py-3 px-4"
      titleClassName="text-[14px] font-medium"
      closeClassName=""
      className="w-[400px]"
    >
      <div className="flex flex-col">
        <div className="px-4 pb-4">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            placeholder="Dashboard name"
            className={{
              input: {
                wrapper: "w-full py-2 px-3",
                root: "text-sm"
              }
            }}
            autoFocus
            disabled={isRenaming}
          />
        </div>
        <div className="border-t border-[var(--color-grey-100)]">
          <div className="flex justify-between items-center py-3 px-4">
            <Button variant="ghost" size="lg" onClick={handleClose} disabled={isRenaming}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleSubmit}
              disabled={isRenaming || !value.trim() || value.trim() === dashboard?.name}
            >
              {isRenaming ? "Renaming..." : "Rename"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
