import { useMutation } from '@tanstack/react-query';
import { apiDelete } from '../../../../api';

export async function deleteLastMessage(sessionId) {
  return apiDelete(`/api/sessions/${sessionId}/messages/last`);
}

export function useDeleteLastMessage({ onSuccess, onError, onNotification } = {}) {
  return useMutation({
    mutationFn: (sessionId) => deleteLastMessage(sessionId),
    onSuccess: (data, variables) => {
      onSuccess?.(data, variables);
    },
    onError: (error) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        'Failed to delete message';
      onNotification?.({
        type: 'error',
        title: message,
      });
      onError?.(error);
    },
  });
}
