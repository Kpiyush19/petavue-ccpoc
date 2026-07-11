import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { Plus, X } from '@phosphor-icons/react';
import { useCreateUser } from '../api/createUser';

const roleOptions = ['Admin', 'User', 'Viewer'];

const reEmail =
  /^(?!.*\.\.)([A-Za-z0-9._%+-]+)@(?:(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,}$/;

const RoleDropdown = ({ role, setRole, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState(null);
  const triggerRef = useRef(null);

  const handleOpen = () => {
    if (disabled) return;
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 50,
      });
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setDropdownStyle(null);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setDropdownStyle(null);
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={handleOpen}
        className={`flex items-center w-60 shrink-0 px-3 py-2 border rounded-lg text-sm text-left ${
          role ? 'text-[var(--color-grey-900)]' : 'text-[var(--color-grey-400)]'
        } ${
          disabled
            ? 'border-[var(--color-grey-200)] bg-[var(--color-grey-50)] cursor-not-allowed'
            : 'border-[var(--color-grey-300)] hover:border-[var(--color-primary-400)]'
        }`}
        disabled={disabled}
      >
        {role || 'Select role'}
      </button>
      {isOpen && dropdownStyle && createPortal(
        <>
          <div className="fixed inset-0 z-50" onClick={handleClose} />
          <div
            style={dropdownStyle}
            className="bg-white border border-[var(--color-grey-200)] rounded-lg shadow-lg overflow-hidden"
          >
            {roleOptions.map((roleOp, ind) => (
              <button
                key={ind}
                onClick={() => {
                  setRole(roleOp);
                  handleClose();
                }}
                className="w-full text-left px-4 py-3 hover:bg-[var(--color-primary-50)] first:rounded-t-lg last:rounded-b-lg"
              >
                {roleOp}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

const AddUserModal = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState([{ email: '', role: '' }]);
  const [inviting, setInviting] = useState(false);
  const [addingUser, setAddingUser] = useState(false);

  const scrollWrapper = useRef(null);
  const createUser = useCreateUser();

  const handleCloseModal = () => {
    if (!inviting) {
      onClose();
    }
  };

  const createNewUser = async () => {
    setInviting(true);
    try {
      await createUser.mutateAsync(
        users.map((e) => ({
          email: e.email,
          role: e.role.toLowerCase(),
        }))
      );
      handleCloseModal();
      setInviting(false);
    } catch {
      toast.error('Failed to invite user');
      setInviting(false);
    }
  };

  const isInvBtnDisabled = () => {
    return users.some(
      (user) =>
        user.email.trim() === '' ||
        !reEmail.test(user.email) ||
        user.role === ''
    );
  };

  useEffect(() => {
    if (addingUser && scrollWrapper.current) {
      scrollWrapper.current.scrollTop = scrollWrapper.current.scrollHeight;
      setAddingUser(false);
    }
  }, [addingUser, users.length]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setUsers([{ email: '', role: '' }]);
      }, 300);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={handleCloseModal} title="Add User">
      <div className="flex flex-col gap-2">
        <div
          className="flex flex-col w-full h-fit max-h-[350px] overflow-y-auto gap-3 py-4"
          ref={scrollWrapper}
        >
          {users.map((user, ind) => (
            <div className="flex items-center w-full gap-2 px-4" key={ind}>
              <div className="flex flex-col gap-2 w-full">
                <span className="text-sm text-[var(--color-grey-700)]">Email*</span>
                <Input
                  placeholder="Enter Email"
                  value={user.email}
                  onChange={(e) => {
                    setUsers((prev) => {
                      const temp = [...prev];
                      temp[ind] = { ...temp[ind], email: e.target.value };
                      return temp;
                    });
                  }}
                  disabled={inviting}
                />
              </div>
              <div className="flex flex-col gap-2 w-fit">
                <span className="text-sm text-[var(--color-grey-700)]">Role*</span>
                <RoleDropdown
                  role={user.role}
                  setRole={(role) => {
                    setUsers((prev) => {
                      const temp = [...prev];
                      temp[ind] = { ...temp[ind], role };
                      return temp;
                    });
                  }}
                  disabled={inviting}
                />
              </div>
              <div className="flex w-8 shrink-0 h-[46px] self-end items-center justify-center">
                {ind > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setUsers((prev) => prev.filter((_, i) => i !== ind));
                    }}
                    disabled={inviting}
                    className="p-1.5 rounded text-[var(--color-grey-400)] hover:text-[var(--color-grey-600)] hover:bg-[var(--color-grey-100)] disabled:opacity-50"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center px-6 py-3 border-t border-[var(--color-grey-200)]">
          <Button variant="ghost" onClick={handleCloseModal} disabled={inviting}>
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              disabled={inviting}
              onClick={() => {
                setUsers((prev) => [...prev, { email: '', role: '' }]);
                setAddingUser(true);
              }}
            >
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Plus size={16} />
                <span>Add New User</span>
              </span>
            </Button>
            <Button disabled={isInvBtnDisabled() || inviting} onClick={createNewUser}>
              {inviting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span>Inviting</span>
                </span>
              ) : (
                <span>Invite</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AddUserModal;
