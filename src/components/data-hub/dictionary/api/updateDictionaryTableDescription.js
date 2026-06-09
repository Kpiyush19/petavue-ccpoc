import { useMutation } from '@tanstack/react-query';
import { useAxios, useNotifications, useQueryClient } from '../context';

export const updateDictionaryTableDescription = (axios, { id, tableId, data }) => {
  return axios.put(`/api/v1/integration/data-dictionaries/${id}/${tableId}`, data);
};

export const useUpdateDictionaryTableDescription = ({ config } = {}) => {
  const axios = useAxios();
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation({
    mutationFn: (params) => updateDictionaryTableDescription(axios, params),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['dictionaryTable'] });
      addNotification({
        type: 'success',
        title: 'Table description updated successfully',
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Failed to update table description',
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
