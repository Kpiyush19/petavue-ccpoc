import { useMutation } from '@tanstack/react-query';
import { useAxios, useNotifications, useQueryClient } from '../context';

export const updateDictionaryDetail = (axios, { id, data }) => {
  return axios.put(`/api/v1/integration/data-dictionaries/${id}`, data);
};

export const useUpdateDictionaryDetail = ({ config } = {}) => {
  const axios = useAxios();
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation({
    mutationFn: (params) => updateDictionaryDetail(axios, params),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['dictionaryDetail'] });
      addNotification({
        type: 'success',
        title: 'Description updated successfully',
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Failed to update description',
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
