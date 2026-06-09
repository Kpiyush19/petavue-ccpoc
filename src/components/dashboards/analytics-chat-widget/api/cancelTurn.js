import { useMutation } from '@tanstack/react-query';
import { apiPost } from '../../../../api';

// Raw function for direct usage
export async function cancelTurn(sessionId) {
  return apiPost(`/api/sessions/${sessionId}/cancel`, {});
}

// React Query mutation hook
// Silent - no notifications on success/error (cancel is best-effort)
export function useCancelTurn({ onSuccess, onError } = {}) {
  return useMutation({
    mutationFn: (sessionId) => cancelTurn(sessionId),
    onSuccess: (data, variables) => {
      onSuccess?.(data, variables);
    },
    onError: (error) => {
      // Silent fail - cancel is best-effort
      console.warn('Cancel request failed:', error?.message);
      onError?.(error);
    },
  });
}
