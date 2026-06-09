import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../../../api';
import { useNotifications } from '../context';

export const getPublishedDashboards = () =>
  apiGet('/api/workflows/dashboards/all');

export const useGetPublishedDashboards = ({ config = {} } = {}) => {
  const notifications = useNotifications();

  return useQuery({
    queryKey: ['cc-published-dashboards'],
    queryFn: () => getPublishedDashboards(),
    select: (data) => data?.dashboards || data?.artifacts || data || [],
    onError: (error) => {
      notifications?.addNotification?.({
        type: 'error',
        title:
          error?.response?.data?.error?.message ||
          error?.message ||
          'Failed to fetch dashboards',
      });
    },
    ...config,
  });
};
