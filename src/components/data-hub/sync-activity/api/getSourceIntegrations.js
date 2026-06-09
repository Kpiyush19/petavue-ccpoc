import { useQuery } from '@tanstack/react-query';
import axios from '../../../../lib/axios';

export const getSourceIntegrations = (level) => {
  return axios.get(`/api/v1/integration/integrations/${level}`);
};

export const useGetSourceIntegrations = ({ config, level } = {}) => {
  return useQuery({
    queryKey: ['source_integrations', level],
    queryFn: () => getSourceIntegrations(level),
    ...config,
  });
};
