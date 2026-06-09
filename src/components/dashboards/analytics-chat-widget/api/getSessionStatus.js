import { useMutation } from '@tanstack/react-query';
import { apiGet } from '../../../../api';

export async function getSessionStatus(sessionId) {
  return apiGet(`/api/sessions/${sessionId}`);
}

export function useGetSessionStatus({ onSuccess, onError, onNotification } = {}) {
  return useMutation({
    mutationFn: (sessionId) => getSessionStatus(sessionId),
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (error) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        'Failed to fetch session status';
      onNotification?.({
        type: 'error',
        title: message,
      });
      onError?.(error);
    },
  });
}
