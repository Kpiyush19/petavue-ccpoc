import { useMutation } from '@tanstack/react-query';
import { useAxios, useNotifications } from '../context';

export const dictBulkAction = (axios, { integrationId, tableId, data }) => {
  return axios.put(
    `/api/v1/integration/data-dictionaries/${integrationId}/${tableId}/columns/bulk-action`,
    data
  );
};

export const useDictBulkAction = ({ config } = {}) => {
  const axios = useAxios();
  const { addNotification } = useNotifications();

  return useMutation({
    mutationFn: (params) => dictBulkAction(axios, params),
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Bulk action completed successfully',
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Bulk action failed',
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
