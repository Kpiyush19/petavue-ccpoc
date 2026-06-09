import { useQuery } from '@tanstack/react-query';
import axios from '../../../../lib/axios';

export const getSyncSummary = () => {
  return axios.get('/api/v1/integration/sync-status/summary');
};

export const useGetSyncSummary = ({ config } = {}) => {
  return useQuery({
    queryKey: ['sync_summary'],
    queryFn: () => getSyncSummary(),
    ...config,
  });
};
