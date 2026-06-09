import { useMutation } from '@tanstack/react-query';
import axios from '../../../lib/axios';
import { toast } from 'sonner';

export const useSlackCallback = (config = {}) => {
  return useMutation({
    mutationFn: ({ code, state }) => axios.post('/api/v1/integration/slack/oauth/callback', { code, state }),
    onError: () => toast.error('Slack Connection Failed'),
    ...config,
  });
};
