import Modal from './Modal';
import Button from './Button';

const RemoveUserModal = ({
  isModalOpen,
  isModalClose,
  onDelete,
}) => {
  return (
    <Modal isOpen={isModalOpen} onClose={isModalClose}>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-[var(--pv-neutral-grey-900)] mb-2">
          Delete User
        </h2>
        <p className="text-[var(--pv-neutral-grey-600)] mb-6">
          Are you sure you want to delete this user? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={isModalClose}>
            Cancel
          </Button>
          <Button
            onClick={onDelete}
            className="bg-[var(--pv-error-text)] hover:bg-[var(--pv-error-text)] focus:ring-[var(--pv-error-text)]"
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RemoveUserModal;
