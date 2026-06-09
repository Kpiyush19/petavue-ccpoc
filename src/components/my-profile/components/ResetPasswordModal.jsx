import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import InputField from './InputField';
import { useResetUserPassword } from '../api/resetUserPassword';
import { useNotificationStore } from '../stores/notifications';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[#$%[\]()*&@!~]).*$/;

export const ResetPasswordModal = ({ isOpen, onClose, onLogout }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [errors, setErrors] = useState({});

  const resetPassword = useResetUserPassword();
  const { addNotification } = useNotificationStore();

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    onClose();
  };

  const validate = () => {
    const newErrors = {};

    if (!currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Minimum 8 characters required';
    } else if (!passwordRegex.test(newPassword)) {
      newErrors.newPassword =
        'Password must contain at least one uppercase letter, one lowercase letter, and one special character from #$%[]()*&@!~';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (newPassword === currentPassword && newPassword.trim()) {
      newErrors.newPassword = 'New password cannot be same as the old password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setResetting(true);
    try {
      await resetPassword.mutateAsync({
        currentPassword,
        password: newPassword,
        confirmPassword,
      });
      handleClose();
      if (onLogout) {
        onLogout();
      }
    } catch {
      // Error handled by mutation
    } finally {
      setResetting(false);
    }
  };

  const passwordsMatch =
    newPassword &&
    confirmPassword &&
    newPassword === confirmPassword &&
    newPassword !== currentPassword;

  const passwordsMismatch =
    newPassword && confirmPassword && newPassword !== confirmPassword;

  const sameAsOld =
    newPassword &&
    currentPassword &&
    newPassword === currentPassword;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="">
      <div className="flex flex-col gap-4 justify-between px-6 pb-6">
        <div className="flex flex-col gap-4 justify-center items-center">
          <div className="flex flex-col gap-2 justify-center items-center">
            <span className="text-xl font-semibold pt-3">Reset password</span>
            <span className="text-base text-[var(--pv-neutral-grey-600)]">
              Please choose your new password.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="w-full mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--pv-neutral-grey-700)] mb-1">
                Current Password
              </label>
              <InputField
                type="password"
                placeholder="●●●●●●●●●●●●●●"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              {errors.currentPassword && (
                <p className="text-[var(--pv-error-text)] text-xs mt-1">{errors.currentPassword}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--pv-neutral-grey-700)] mb-1">
                New Password
              </label>
              <InputField
                type="password"
                placeholder="●●●●●●●●●●●●●●"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {errors.newPassword && (
                <p className="text-[var(--pv-error-text)] text-xs mt-1">{errors.newPassword}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--pv-neutral-grey-700)] mb-1">
                Re-enter Password
              </label>
              <InputField
                type="password"
                placeholder="●●●●●●●●●●●●●●"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {errors.confirmPassword && (
                <p className="text-[var(--pv-error-text)] text-xs mt-1">{errors.confirmPassword}</p>
              )}

              {passwordsMatch && (
                <div className="flex items-center gap-1.5 mt-2">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M13.5672 7.68281C13.6253 7.74086 13.6714 7.80979 13.7029 7.88566C13.7343 7.96154 13.7505 8.04287 13.7505 8.125C13.7505 8.20713 13.7343 8.28846 13.7029 8.36434C13.6714 8.44021 13.6253 8.50914 13.5672 8.56719L9.19219 12.9422C9.13415 13.0003 9.06522 13.0464 8.98934 13.0779C8.91347 13.1093 8.83214 13.1255 8.75 13.1255C8.66787 13.1255 8.58654 13.1093 8.51067 13.0779C8.43479 13.0464 8.36586 13.0003 8.30782 12.9422L6.43282 11.0672C6.31554 10.9499 6.24966 10.7909 6.24966 10.625C6.24966 10.4591 6.31554 10.3001 6.43282 10.1828C6.55009 10.0655 6.70915 9.99965 6.875 9.99965C7.04086 9.99965 7.19992 10.0655 7.31719 10.1828L8.75 11.6164L12.6828 7.68281C12.7409 7.6247 12.8098 7.5786 12.8857 7.54715C12.9615 7.5157 13.0429 7.49951 13.125 7.49951C13.2071 7.49951 13.2885 7.5157 13.3643 7.54715C13.4402 7.5786 13.5091 7.6247 13.5672 7.68281ZM18.125 10C18.125 14.4183 14.4183 18.125 10 18.125C5.58172 18.125 1.875 14.4183 1.875 10C1.875 5.58172 5.58172 1.875 10 1.875C14.4183 1.875 18.125 5.58172 18.125 10Z"
                      fill="var(--pv-success-text)"
                    />
                  </svg>
                  <span className="text-xs font-normal text-[var(--pv-success-text)]">
                    Passwords match
                  </span>
                </div>
              )}

              {passwordsMismatch && (
                <div className="flex items-center gap-1.5 mt-2">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M12.9422 7.94219L10.8836 10L12.9422 12.0578C13.0976 12.2131 13.0976 12.4619 12.9422 12.6172C12.7869 12.7725 12.5381 12.7725 12.3828 12.6172L10.325 10.5586L8.26719 12.6172C8.11186 12.7725 7.86314 12.7725 7.70781 12.6172C7.55248 12.4619 7.55248 12.2131 7.70781 12.0578L9.76641 10L7.70781 7.94219C7.55248 7.78686 7.55248 7.53814 7.70781 7.38281C7.86314 7.22748 8.11186 7.22748 8.26719 7.38281L10.325 9.44141L12.3828 7.38281C12.5381 7.22748 12.7869 7.22748 12.9422 7.38281C13.0976 7.53814 13.0976 7.78686 12.9422 7.94219ZM18.125 10C18.125 14.4183 14.4183 18.125 10 18.125C5.58172 18.125 1.875 14.4183 1.875 10C1.875 5.58172 5.58172 1.875 10 1.875C14.4183 1.875 18.125 5.58172 18.125 10Z"
                      fill="var(--pv-error-text)"
                    />
                  </svg>
                  <span className="text-xs font-normal text-[var(--pv-error-text)]">
                    Passwords do not match
                  </span>
                </div>
              )}

              {sameAsOld && (
                <div className="flex items-center gap-1.5 mt-2">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M12.9422 7.94219L10.8836 10L12.9422 12.0578C13.0976 12.2131 13.0976 12.4619 12.9422 12.6172C12.7869 12.7725 12.5381 12.7725 12.3828 12.6172L10.325 10.5586L8.26719 12.6172C8.11186 12.7725 7.86314 12.7725 7.70781 12.6172C7.55248 12.4619 7.55248 12.2131 7.70781 12.0578L9.76641 10L7.70781 7.94219C7.55248 7.78686 7.55248 7.53814 7.70781 7.38281C7.86314 7.22748 8.11186 7.22748 8.26719 7.38281L10.325 9.44141L12.3828 7.38281C12.5381 7.22748 12.7869 7.22748 12.9422 7.38281C13.0976 7.53814 13.0976 7.78686 12.9422 7.94219ZM18.125 10C18.125 14.4183 14.4183 18.125 10 18.125C5.58172 18.125 1.875 14.4183 1.875 10C1.875 5.58172 5.58172 1.875 10 1.875C14.4183 1.875 18.125 5.58172 18.125 10Z"
                      fill="var(--pv-error-text)"
                    />
                  </svg>
                  <span className="text-xs font-normal text-[var(--pv-error-text)]">
                    New password cannot be same as the old password
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={resetting || !passwordsMatch}
                className="w-full"
              >
                {resetting ? (
                  <span className="flex items-center justify-center gap-2">
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
                    Resetting
                  </span>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default ResetPasswordModal;
