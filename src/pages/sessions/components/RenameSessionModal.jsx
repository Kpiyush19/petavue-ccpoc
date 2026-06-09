import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button, Modal, Input } from "@/common-components";

export const RenameSessionModal = ({ session, onClose, onRename }) => {
  const [value, setValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    if (session) {
      setValue(session.name || "");
      setIsRenaming(false);
    } else {
      setIsRenaming(false);
    }
  }, [session]);

  const handleClose = () => {
    if (!isRenaming) {
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!value.trim() || value.trim() === session?.name) return;
    setIsRenaming(true);
    try {
      await onRename(session, value.trim());
      setIsRenaming(false);
    } catch {
      toast.error("Failed to rename session");
      setIsRenaming(false);
    }
  };

  return (
    <Modal
      isOpen={Boolean(session)}
      onClose={handleClose}
      title="Rename Session"
      topStripClassName="hidden"
      topBorderClassname="border-t-5 border-[var(--pv-primary-500)]"
      headerClassName="py-3 px-4"
      titleClassName="text-[14px] font-medium"
      closeClassName=""
      className="w-[500px]"
    >
      <div className="flex flex-col">
        <div className="px-4 pb-4">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            placeholder="Session name"
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
        <div className="border-t border-[var(--pv-neutral-grey-150)]">
          <div className="flex justify-between items-center py-3 px-4">
            <Button btnColor="ghost" btnSize="lg" onClick={handleClose} disabled={isRenaming}>
              Cancel
            </Button>
            <Button
              btnColor="primary"
              btnSize="lg"
              onClick={handleSubmit}
              disabled={isRenaming || !value.trim() || value.trim() === session?.name}
            >
              {isRenaming ? "Renaming..." : "Rename"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
