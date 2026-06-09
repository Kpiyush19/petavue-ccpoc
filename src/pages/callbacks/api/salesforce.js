import { useMutation } from '@tanstack/react-query';
import axios from '../../../lib/axios';
import { toast } from 'sonner';

export const useSalesforceCallback = (config = {}) => {
  return useMutation({
    mutationFn: ({ code, state }) => axios.post('/api/v1/integration/salesforce/oauth/callback', { code, state }),
    onError: () => toast.error('Salesforce Connection Failed'),
    ...config,
  });
};
