import { useQuery } from '@tanstack/react-query';
import axios from '../../../../lib/axios';

export const getSyncSessions = ({
  page = 1,
  pageSize = 10,
  datasource,
  range = 'today',
  startDate,
  endDate,
} = {}) => {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('pageSize', pageSize);

  if (startDate && endDate) {
    params.append('startDate', startDate);
    params.append('endDate', endDate);
  } else {
    params.append('range', range);
  }

  if (datasource) params.append('datasource', datasource);

  return axios.get(
    `/api/v1/integration/sync-status/sessions?${params.toString()}`
  );
};

export const useGetSyncSessions = ({
  page = 1,
  pageSize = 10,
  datasource,
  range = 'today',
  startDate,
  endDate,
  config,
} = {}) => {
  return useQuery({
    queryKey: ['sync_sessions', page, pageSize, datasource, range, startDate, endDate],
    queryFn: () =>
      getSyncSessions({
        page,
        pageSize,
        datasource,
        range,
        startDate,
        endDate,
      }),
    ...config,
  });
};

export const useGetSyncSession = ({ sessionId, config } = {}) => {
  return useQuery({
    queryKey: ['sync_session', sessionId],
    queryFn: () => axios.get(`/api/v1/integration/sync-status/sessions/${sessionId}`),
    enabled: !!sessionId,
    ...config,
  });
};
