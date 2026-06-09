import { useMutation } from '@tanstack/react-query';
import axios from '../../../../lib/axios';
import { useNotificationStore } from '../stores/notifications';

export const connectDatabase = ({ database, connections }) => {
  return axios.post(`/api/v1/integration/${database}`, connections);
};

export const useConnectDatabase = ({ config } = {}) => {
  const { addNotification } = useNotificationStore();

  return useMutation({
    mutationFn: connectDatabase,
    onError: (error, { database }) => {
      const dbConns = ['snowflake', 'singlestore', 'postgres'];
      if (dbConns.includes(database)) {
        if (
          error.response?.data?.error?.message === 'Database already connected'
        ) {
          addNotification({
            type: 'error',
            title: 'Database Already Connected',
          });
        } else {
          addNotification({
            type: 'error',
            title: 'Database Connection Failed',
          });
        }
      } else {
        addNotification({
          type: 'error',
          title:
            error?.response?.data?.error?.message ||
            error?.message ||
            'Connection Failed',
        });
      }
    },
    onSuccess: (success, { database }) => {
      if (!success.success) {
        addNotification({
          type: 'error',
          title: `${
            database.charAt(0).toUpperCase() + database.substr(1).toLowerCase()
          } Connection Failed`,
        });
      }
    },
    ...config,
  });
};
