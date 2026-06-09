import { useMutation } from '@tanstack/react-query';
import axios from '../../../../lib/axios';
import { queryClient } from '../../../../lib/queryClient';
import { useNotificationStore } from '../stores/notifications';

export const updateUser = async ({ id, data }) => {
  return axios.patch(`/api/v1/tenant/users/${id}`, data);
};

export const useUpdateUser = (config = {}) => {
  const { addNotification } = useNotificationStore();

  return useMutation({
    mutationFn: updateUser,
    onError: () => {
      addNotification({
        type: 'error',
        title: 'Failed to Update User',
      });
    },
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'User Updated Successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['allUser'] });
    },
    ...config,
  });
};
