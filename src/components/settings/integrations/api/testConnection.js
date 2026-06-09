import { useMutation } from '@tanstack/react-query';
import axios from '../../../../lib/axios';
import { useNotificationStore } from '../stores/notifications';

export const testConnection = ({ database, connectionId }) => {
  if (connectionId === undefined) {
    if (database === 'Google Sheets') database = 'google-sheets';
    return axios.post(`/api/v1/integration/${database}/test`);
  }
  return axios.post(`/api/v1/integration/${database}/${connectionId}/test`);
};

export const useTestConnection = ({ config } = {}) => {
  const { addNotification } = useNotificationStore();

  return useMutation({
    mutationFn: testConnection,
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Test Connection Failed',
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
