import { useQuery } from "@tanstack/react-query";
import axios from "../../../../lib/axios";

// GET /api/v1/integration/{platform}
//   platform = "salesforce" | "hubspot"
//   Response: { _id, admin_name, service_account_user | service_account_name, org_url }
//
// `_id` is the tenant_integration_settings row id — the FE uses it to call
// every /integration-setup/:id/* endpoint. Without this id the FE can't talk
// to the canonical wizard API surface, so this query is foundational.
//
// Returns null if the integration isn't connected yet (BE returns null body).
export const getPlatformDetail = ({ platform }) => {
  return axios.get(`/api/v1/integration/${platform}`);
};

export const useGetPlatformDetail = ({ platform, config } = {}) => {
  return useQuery({
    queryKey: ["platformDetail", platform],
    queryFn: () => getPlatformDetail({ platform }),
    enabled: !!platform,
    staleTime: 30_000,
    ...config
  });
};
