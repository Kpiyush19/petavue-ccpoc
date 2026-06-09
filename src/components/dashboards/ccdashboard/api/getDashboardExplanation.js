import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../../../api';

export const getDashboardExplanation = (dashboardId) =>
  apiGet(`/api/workflows/dashboards/${dashboardId}/explanation`);

export const useGetDashboardExplanation = (dashboardId, { enabled = true } = {}) => {
  return useQuery({
    queryKey: ['cc-dashboard-explanation', dashboardId],
    queryFn: () => getDashboardExplanation(dashboardId),
    enabled: enabled && !!dashboardId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
