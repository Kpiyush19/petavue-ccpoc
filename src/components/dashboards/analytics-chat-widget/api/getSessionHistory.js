import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../../../api';

export async function getSessionHistory(sessionId) {
  return apiGet(`/api/sessions/${sessionId}/history`);
}

export function useGetSessionHistory(
  sessionId,
  { enabled = true, onSuccess, onError, onNotification } = {}
) {
  return useQuery({
    queryKey: ['session-history', sessionId],
    queryFn: () => getSessionHistory(sessionId),
    enabled: enabled && !!sessionId,
    staleTime: 0, // Always refetch - session history can change
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (error) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        'Failed to fetch session history';
      onNotification?.({
        type: 'error',
        title: message,
      });
      onError?.(error);
    },
  });
}
