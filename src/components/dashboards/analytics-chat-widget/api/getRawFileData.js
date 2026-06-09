import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../../../api';

export async function getRawFileData(sessionId, path) {
  return apiGet(`/api/sessions/${sessionId}/files/${path}`);
}

export function useGetRawFileData(
  sessionId,
  path,
  { enabled = true, onSuccess, onError, onNotification } = {}
) {
  return useQuery({
    queryKey: ['raw-file-data', sessionId, path],
    queryFn: () => getRawFileData(sessionId, path),
    enabled: enabled && !!sessionId && !!path,
    staleTime: 5 * 60 * 1000,
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (error) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        'Failed to load file data';
      onNotification?.({
        type: 'error',
        title: message,
      });
      onError?.(error);
    },
  });
}
