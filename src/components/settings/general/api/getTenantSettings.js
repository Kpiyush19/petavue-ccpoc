import { useQuery } from "@tanstack/react-query";
import axios from "../../../../lib/axios";

// GET /api/v1/integration/tenants/settings
//   Tenant-wide settings (currently just timezone). Lives outside the
//   per-integration surface because the same TZ applies to every sync
//   schedule across the tenant.
//   Response: { timezone: "PST" | "EST" | "IST" | null }
export const getTenantSettings = () => {
  return axios.get(`/api/v1/integration/tenants/settings`);
};

export const useGetTenantSettings = ({ config } = {}) => {
  return useQuery({
    queryKey: ["tenant_settings"],
    queryFn: () => getTenantSettings(),
    staleTime: 30_000,
    ...config
  });
};
