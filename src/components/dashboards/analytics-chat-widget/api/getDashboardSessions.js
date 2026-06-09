import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../../../api';

export async function getDashboardSessions(dashboardId) {
  const params = new URLSearchParams({
    dashboard_id: dashboardId,
    session_type: 'dashboard_chat,workflow_chat',
    sort_by: 'created_at',
  });
  return apiGet(`/api/sessions?${params.toString()}`);
}

export function useGetDashboardSessions(
  dashboardId,
  { enabled = true, onSuccess, onError, onNotification } = {}
) {
  return useQuery({
    queryKey: ['dashboard-sessions', dashboardId],
    queryFn: () => getDashboardSessions(dashboardId),
    enabled: enabled && !!dashboardId,
    staleTime: Infinity, // Only refetch when explicitly invalidated (e.g., on Pusher done event)
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (error) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        'Failed to fetch dashboard sessions';
      onNotification?.({
        type: 'error',
        title: message,
      });
      onError?.(error);
    },
  });
}
