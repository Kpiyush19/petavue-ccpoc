import { useMutation } from '@tanstack/react-query';
import axios from '../../../lib/axios';
import { toast } from 'sonner';

export const useGoogleSheetsCallback = (config = {}) => {
  return useMutation({
    mutationFn: ({ code, state }) => axios.post('/api/v1/integration/google-sheets/oauth/callback', { code, state }),
    onError: () => toast.error('Google Sheets Connection Failed'),
    ...config,
  });
};
