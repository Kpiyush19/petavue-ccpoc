import { useMutation } from '@tanstack/react-query';
import axios from '../../../lib/axios';

export const useRegister = (config = {}) => {
  return useMutation({
    mutationFn: (data) => axios.post('/api/v1/auth/register', data),
    ...config,
  });
};
