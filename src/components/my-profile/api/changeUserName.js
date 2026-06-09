import { useMutation } from '@tanstack/react-query';
import axios from '../../../lib/axios';
import { queryClient } from '../../../lib/queryClient';
import { useNotificationStore } from '../stores/notifications';

export const changeUserName = async (data) => {
  return await axios.patch('/api/v1/tenant/users/me', data);
};

export const useChangeUserName = ({ config } = {}) => {
  const { addNotification } = useNotificationStore();

  return useMutation({
    mutationFn: changeUserName,
    onError: (error) => {
      addNotification({
        type: 'error',
        title:
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          'Failed to update name',
      });
    },
    onSuccess: (data, params) => {
      addNotification({
        type: 'success',
        title: data?.message || 'Name updated successfully',
      });
      queryClient.setQueryData(['userDetails'], (elem) => {
        const newData = { ...structuredClone(elem), name: params.name };
        return newData;
      });
    },
    ...config,
  });
};
