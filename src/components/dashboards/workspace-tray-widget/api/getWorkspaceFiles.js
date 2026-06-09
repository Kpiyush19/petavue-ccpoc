import { useQuery } from '@tanstack/react-query';

export function useGetWorkspaceFiles(
  queryKey,
  fetchFn,
  {
    enabled = true,
    onSuccess,
    onError,
    staleTime = Infinity,
    notifyError,
  } = {}
) {
  return useQuery({
    queryKey,
    queryFn: fetchFn,
    enabled: enabled && !!fetchFn,
    staleTime,
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (error) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        'Failed to load workspace files';

      if (notifyError) {
        notifyError(message);
      }

      onError?.(error);
    },
  });
}
