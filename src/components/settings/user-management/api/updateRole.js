import { useMutation } from '@tanstack/react-query';
import axios from '../../../../lib/axios';
import { queryClient } from '../../../../lib/queryClient';
import { useNotificationStore } from '../stores/notifications';

export const updateRole = async ({ data }) => {
  return axios.post(`/api/v1/tenant/users/assign-role`, data);
};

export const useUpdateRole = (config = {}) => {
  const { addNotification } = useNotificationStore();

  return useMutation({
    mutationFn: updateRole,
    onError: () => {
      addNotification({
        type: 'error',
        title: 'Failed to Update Role',
      });
    },
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Role Updated Successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['allUser'] });
    },
    ...config,
  });
};
