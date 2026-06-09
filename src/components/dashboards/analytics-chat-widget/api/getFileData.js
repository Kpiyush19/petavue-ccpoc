import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../../../api';

export async function getFileData(sessionId, path, page = 1, pageSize = 50) {
  return apiGet(
    `/api/sessions/${sessionId}/files/${path}/data?page=${page}&page_size=${pageSize}`
  );
}

export function useGetFileData(
  sessionId,
  path,
  page = 1,
  pageSize = 50,
  { enabled = true, onSuccess, onError, onNotification } = {}
) {
  return useQuery({
    queryKey: ['file-data', sessionId, path, page, pageSize],
    queryFn: () => getFileData(sessionId, path, page, pageSize),
    enabled: enabled && !!sessionId && !!path,
    staleTime: 5 * 60 * 1000, // 5 minutes - file data doesn't change often
    keepPreviousData: true, // Keep previous page data while loading next
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
