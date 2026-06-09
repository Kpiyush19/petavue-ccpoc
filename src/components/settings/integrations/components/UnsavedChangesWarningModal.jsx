import { Modal } from "../../../../common-components/Modal";
import { Button } from "../../../../common-components/Button";

export const UnsavedChangesWarningModal = ({ isModalOpen, onClose, onExit, onSaveChanges }) => {
  return (
    <Modal
      isOpen={isModalOpen}
      onClose={onClose}
      title="Unsaved Changes"
      className="w-[500px]"
      topStripClassName="hidden"
      headerClassName="py-3 px-4"
      titleClassName="text-[14px] font-medium"
      variant="warning"
    >
      <div className="flex flex-col">
        <div className="px-4 pb-4 pt-2 flex flex-col gap-2">
          <p className="text-sm text-[var(--pv-neutral-grey-600)]">
            You have unsaved changes that will be lost if you proceed
          </p>
          <p className="text-sm font-medium text-[var(--pv-text-primary-text)]">
            Are you sure you want to leave this page?
          </p>
        </div>
        <div className="border-t border-[var(--pv-neutral-grey-150)]">
          <div className="flex justify-between items-center py-3 px-4">
            <Button
              btnColor="ghost"
              btnSize="lg"
              onClick={() => {
                onClose();
                onExit();
              }}
            >
              Exit
            </Button>
            <Button
              btnColor="primary"
              btnSize="lg"
              onClick={() => {
                onClose();
                onSaveChanges();
              }}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default UnsavedChangesWarningModal;
