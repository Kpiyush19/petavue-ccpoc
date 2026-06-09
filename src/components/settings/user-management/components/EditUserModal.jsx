import { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { useUpdateUser } from '../api/updateUser';

const roleOptions = ['Admin', 'User', 'Viewer'];

const EditUserModal = ({ isOpen, onClose, selectedData }) => {
  const [role, setRole] = useState('');
  const updateUserMutation = useUpdateUser();

  useEffect(() => {
    if (selectedData?.role) {
      setRole(
        selectedData.role.charAt(0).toUpperCase() +
          selectedData.role.slice(1).toLowerCase()
      );
    }
  }, [selectedData]);

  const handleSave = async () => {
    await updateUserMutation.mutateAsync({
      id: selectedData?.userId,
      data: {
        role: role.toLowerCase(),
      },
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User">
      <div className="p-6">
        <div className="mb-4">
          <p className="text-sm text-[var(--pv-neutral-grey-500)] mb-1">User</p>
          <p className="font-medium text-[var(--pv-neutral-grey-900)]">{selectedData?.name}</p>
          <p className="text-sm text-[var(--pv-neutral-grey-500)]">{selectedData?.email}</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-[var(--pv-neutral-grey-700)] mb-2">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--pv-neutral-grey-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--pv-primary-500)]"
          >
            {roleOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-between px-6 py-4 border-t border-[var(--pv-neutral-grey-200)]">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </Modal>
  );
};

export default EditUserModal;
