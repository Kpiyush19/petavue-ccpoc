import { useMutation } from '@tanstack/react-query';
import axios from '../../../lib/axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const useResetPassword = (config = {}) => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ token, password, confirmPassword }) =>
      axios.post('/api/v1/auth/resetpassword', { token, password, confirmPassword }),
    onError: (e) => {
      if (e?.response?.data?.type === 'reset-password-token-already-used') {
        navigate('/login');
      }
      if (e?.response?.status !== 401) {
        toast.error('Failed to reset password');
      }
    },
    onSuccess: () => toast.success('Password Reset Successfully'),
    ...config,
  });
};
