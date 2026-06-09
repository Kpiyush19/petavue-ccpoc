import { useMutation } from '@tanstack/react-query';
import axios from '../../../lib/axios';
import { useNotificationStore } from '../stores/notifications';

export const resetUserPassword = async (data) => {
  return await axios.post('/api/v1/auth/me/resetpassword', data);
};

export const useResetUserPassword = ({ config } = {}) => {
  const { addNotification } = useNotificationStore();

  return useMutation({
    mutationFn: resetUserPassword,
    onError: (error) => {
      addNotification({
        type: 'error',
        title:
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          'Failed to reset password',
      });
    },
    onSuccess: (data) => {
      addNotification({
        type: 'success',
        title: data?.message || 'Password reset successfully',
      });
    },
    ...config,
  });
};
