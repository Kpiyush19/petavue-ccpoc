import { useMutation } from '@tanstack/react-query';
import axios from '../../../lib/axios';
import { toast } from 'sonner';

export const useLinkedinCallback = (config = {}) => {
  return useMutation({
    mutationFn: ({ code, state }) => axios.post('/api/v1/integration/linkedin/oauth/callback', { code, state }),
    onError: () => toast.error('LinkedIn Connection Failed'),
    ...config,
  });
};
