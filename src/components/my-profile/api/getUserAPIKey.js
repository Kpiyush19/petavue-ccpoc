import { useMutation } from '@tanstack/react-query';
import axios from '../../../lib/axios';
import { useNotificationStore } from '../stores/notifications';
import { queryClient } from '../../../lib/queryClient';

export const useGetUserAPIKey = ({ from } = {}) => {
  const { addNotification } = useNotificationStore();

  return useMutation({
    mutationFn: () => axios.get('/api/v1/auth/api-key'),
    onError: (error) => {
      addNotification({
        type: 'error',
        title:
          error?.response?.data?.error?.message ||
          error?.message ||
          'Failed to generate API key',
      });
    },
    onSuccess: async (success) => {
      await queryClient.refetchQueries({ queryKey: ['userDetails'] });
      if (from === 'profile') {
        addNotification({
          type: 'success',
          title: success?.message || 'Successfully generated API key',
        });
      }
    },
  });
};
