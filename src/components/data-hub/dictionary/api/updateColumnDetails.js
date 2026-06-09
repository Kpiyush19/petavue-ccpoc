import { useMutation } from '@tanstack/react-query';
import { useAxios, useNotifications, useQueryClient } from '../context';

export const updateColumnDetails = (axios, { integrationId, tableId, columnName, data }) => {
  return axios.put(
    `/api/v1/integration/data-dictionaries/${integrationId}/${tableId}/${columnName}`,
    data
  );
};

export const useUpdateColumnDetails = ({ config } = {}) => {
  const axios = useAxios();
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation({
    mutationFn: (params) => updateColumnDetails(axios, params),
    onSuccess: (_, { tableId }) => {
      queryClient.resetQueries({ queryKey: ['tableColumns', tableId] });
      queryClient.refetchQueries({ queryKey: ['getConnectedDefinitionsList'] });
      addNotification({
        type: 'success',
        title: 'Column updated successfully',
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Failed to update column',
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
