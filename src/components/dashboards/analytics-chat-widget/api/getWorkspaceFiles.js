import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../../../api';

export async function getWorkspaceFiles(sessionId) {
  return apiGet(`/api/sessions/${sessionId}/files`);
}

export function useGetWorkspaceFiles(
  sessionId,
  { enabled = true, onSuccess, onError, onNotification } = {}
) {
  return useQuery({
    queryKey: ['workspace-files', sessionId],
    queryFn: () => getWorkspaceFiles(sessionId),
    enabled: enabled && !!sessionId,
    staleTime: Infinity, // Files list doesn't change often - invalidate manually if needed
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (error) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        'Failed to load workspace files';
      onNotification?.({
        type: 'error',
        title: message,
      });
      onError?.(error);
    },
  });
}
