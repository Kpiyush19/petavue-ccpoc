import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import Axios from 'axios';
import { PETAVUE_API_URL } from '../../../config';

export const useDownloadSharedTableAsCSV = (config = {}) => {
  return useMutation({
    mutationFn: ({ messageId, token }) =>
      Axios.get(`${PETAVUE_API_URL}/api/v1/agent/conversation/output/${messageId}/download${token ? `?token=${token}` : ''}`),
    onError: (error) => toast.error(error.response?.data?.error?.message || 'Error fetching CSV'),
    ...config,
  });
};
