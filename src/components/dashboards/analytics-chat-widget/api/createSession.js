import { useMutation } from '@tanstack/react-query';
import { apiPost } from '../../../../api';

export async function createSession(dashboardId) {
  return apiPost('/api/sessions', { dashboard_id: dashboardId });
}

export function useCreateSession({ onSuccess, onError, onNotification } = {}) {
  return useMutation({
    mutationFn: (dashboardId) => createSession(dashboardId),
    onSuccess: (data, variables) => {
      onSuccess?.(data, variables);
    },
    onError: (error) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        'Failed to create session';
      onNotification?.({
        type: 'error',
        title: message,
      });
      onError?.(error);
    },
  });
}
