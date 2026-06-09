import Modal from './Modal';
import Button from './Button';
import Avatar from './Avatar';

const AssignRoleModal = ({
  isModalOpen,
  isModalClose,
  selectedUserName,
  selectedRole,
  onUpdate,
}) => {
  function getInitials(fullName) {
    const names = fullName?.split(' ');
    const initials = names?.map((name) => name[0]);
    return initials?.join('').toUpperCase();
  }

  return (
    <Modal isOpen={isModalOpen} onClose={isModalClose}>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-[var(--pv-neutral-grey-900)] mb-4">
          Assign Role: {selectedRole}
        </h2>
        <p className="text-[var(--pv-neutral-grey-600)] mb-4">
          The following users will be assigned the {selectedRole} role:
        </p>
        <div className="flex flex-wrap gap-2 mb-6 max-h-32 overflow-y-auto">
          {selectedUserName?.map((user, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--pv-neutral-grey-100)] rounded-full"
            >
              <Avatar
                name={getInitials(user?.name)}
                fullName={user?.name}
                size="sm"
              />
              <span className="text-sm text-[var(--pv-neutral-grey-700)]">{user?.name}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={isModalClose}>
            Cancel
          </Button>
          <Button onClick={onUpdate}>Confirm</Button>
        </div>
      </div>
    </Modal>
  );
};

export default AssignRoleModal;
