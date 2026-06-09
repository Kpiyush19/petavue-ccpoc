import { useMutation } from '@tanstack/react-query';
import axios from '../../../../lib/axios';
import { useNotificationStore } from '../stores/notifications';

export const getIntegrationDetails = ({ item }) => {
  if (item === 'google sheets') item = 'google-sheets';
  if (item === 'google analytics') item = 'google-analytics';
  return axios.get(`/api/v1/integration/${item}`);
};

export const useGetIntegrationDetails = ({ config } = {}) => {
  const { addNotification } = useNotificationStore();
  return useMutation({
    mutationFn: getIntegrationDetails,
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Failed to fetch Integration Details',
        message:
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          'An unknown error occurred',
      });
    },
    ...config,
  });
};
