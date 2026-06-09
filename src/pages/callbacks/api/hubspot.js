import { useMutation } from '@tanstack/react-query';
import axios from '../../../lib/axios';
import { toast } from 'sonner';

export const useHubspotCallback = (config = {}) => {
  return useMutation({
    mutationFn: ({ code, state }) => axios.post('/api/v1/integration/hubspot/oauth/callback', { code, state }),
    onError: () => toast.error('Hubspot Connection Failed'),
    ...config,
  });
};
