import { useMutation } from '@tanstack/react-query';
import axios from '../../../../lib/axios';
import { queryClient } from '../../../../lib/queryClient';
import { useNotificationStore } from '../stores/notifications';

export const createUser = (data) => {
  return axios.post(`/api/v1/tenant/users/invite`, data);
};

export const useCreateUser = ({ config } = {}) => {
  const { addNotification } = useNotificationStore();

  return useMutation({
    mutationFn: createUser,
    onError: (error) => {
      addNotification({
        type: 'error',
        title:
          error?.response?.data?.error?.message ||
          'There was some issue while inviting the user',
      });
    },
    onSuccess: async (_, data) => {
      addNotification({
        type: 'success',
        title:
          data.length > 1
            ? 'Users Created Successfully'
            : 'User Created Successfully',
      });
      await queryClient.invalidateQueries({ queryKey: ['allUser'] });
    },
    ...config,
  });
};
