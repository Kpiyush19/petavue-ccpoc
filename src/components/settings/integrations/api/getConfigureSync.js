import { useQuery } from "@tanstack/react-query";
import axios from "../../../../lib/axios";

// GET /api/v1/integration/{platform}/configureSync
//   Returns the tenant's saved historic-sync period, sync frequency, and
//   schedule-details string (encodes the timezone token at the end, e.g.
//   "1:00AM IST").
//
// Platform-keyed because frequency lives on `tenant_integration_settings`
// directly (tenant-level), not inside the /integration-setup/:id surface.
export const getConfigureSync = ({ platform }) => {
  return axios.get(`/api/v1/integration/${platform}/configureSync`);
};

export const useGetConfigureSync = ({ platform, config } = {}) => {
  return useQuery({
    queryKey: ["configureSync", platform],
    queryFn: () => getConfigureSync({ platform }),
    enabled: !!platform,
    staleTime: 30_000,
    ...config
  });
};
