import { useMutation } from '@tanstack/react-query';
import axios from '../../../../lib/axios';
import { queryClient } from '../../../../lib/queryClient';
import { useNotificationStore } from '../stores/notifications';

export const deleteUser = async ({ id }) => {
  await axios.delete(`/api/v1/tenant/users/${id}`);
};

export const useDeleteUser = (config = {}) => {
  const { addNotification } = useNotificationStore();

  return useMutation({
    mutationFn: deleteUser,
    onError: () => {
      addNotification({
        type: 'error',
        title: 'Failed to Delete User',
      });
    },
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'User Deleted Successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['allUser'] });
    },
    ...config,
  });
};
