import { useMutation } from "@tanstack/react-query";
import axios from "../../../../lib/axios";

// PATCH /api/v1/integration/tenants/settings
//   Update tenant-wide settings. Today only timezone (PST | EST | IST).
//   Body: { timezone: "PST" | "EST" | "IST" }
//   Response: { timezone: "PST" | "EST" | "IST" | null }
export const patchTenantSettings = ({ body }) => {
  return axios.patch(`/api/v1/integration/tenants/settings`, body);
};

export const usePatchTenantSettings = ({ config } = {}) => {
  return useMutation({
    mutationFn: patchTenantSettings,
    ...config
  });
};
