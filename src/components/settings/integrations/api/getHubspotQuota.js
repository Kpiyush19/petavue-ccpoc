import { useQuery } from "@tanstack/react-query";
import axios from "../../../../lib/axios";

// GET /api/v1/integration/integration-setup/:id/hubspot-quota
//   Daily bulk-export quota approximation. HubSpot caps daily bulk exports
//   at 30; we warn the user when they're close so a manual sync doesn't
//   silently fail to allocate a slot.
export const getHubspotQuota = (id) => {
  return axios.get(`/api/v1/integration/integration-setup/${id}/hubspot-quota`);
};

export const useGetHubspotQuota = ({ id, enabled = true, config } = {}) => {
  return useQuery({
    queryKey: ["hubspot_quota", id],
    queryFn: () => getHubspotQuota(id),
    enabled: !!id && enabled,
    staleTime: 30_000,
    ...config
  });
};
