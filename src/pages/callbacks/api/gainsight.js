import { useMutation } from '@tanstack/react-query';
import axios from '../../../lib/axios';
import { toast } from 'sonner';

export const useGainsightCallback = (config = {}) => {
  return useMutation({
    mutationFn: ({ code, state }) => axios.post('/api/v1/integration/gainsight/oauth/callback', { code, state }),
    onError: () => toast.error('Gainsight Connection Failed'),
    ...config,
  });
};
