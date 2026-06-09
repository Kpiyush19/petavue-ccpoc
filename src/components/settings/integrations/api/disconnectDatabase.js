import { useMutation } from '@tanstack/react-query';
import axios from '../../../../lib/axios';
import { useNotificationStore } from '../stores/notifications';

export const disconnectDatabase = ({ database, connectionId }) => {
  if (connectionId === undefined) {
    if (database === 'Google Sheets') database = 'google-sheets';
    if (database === 'Freshdesk') database = 'freshdesk';
    return axios.delete(`/api/v1/integration/${database}`);
  }
  return axios.delete(`/api/v1/integration/${database}/${connectionId}`);
};

export const useDisconnectDatabase = ({ config } = {}) => {
  const { addNotification } = useNotificationStore();

  return useMutation({
    mutationFn: disconnectDatabase,
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Disconnected successfully',
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Failed to disconnect',
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
