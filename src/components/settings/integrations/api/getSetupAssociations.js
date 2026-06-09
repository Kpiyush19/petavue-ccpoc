import { useQuery } from "@tanstack/react-query";
import axios from "../../../../lib/axios";

// GET /api/v1/integration/integration-setup/:id/associations?refresh=true
//   HubSpot only. Lists possible association pairs for the user's selected objects.
//   Cached on the integration row; pass ?refresh=true to force re-probe HubSpot.
export const getSetupAssociations = ({ id, refresh }) => {
  return axios.get(`/api/v1/integration/integration-setup/${id}/associations`, {
    params: refresh ? { refresh: "true" } : undefined
  });
};

export const useGetSetupAssociations = ({ id, refresh, config } = {}) => {
  return useQuery({
    queryKey: ["integration_setup_associations", id, refresh ? "fresh" : "cached"],
    queryFn: () => getSetupAssociations({ id, refresh }),
    enabled: !!id,
    ...config
  });
};
