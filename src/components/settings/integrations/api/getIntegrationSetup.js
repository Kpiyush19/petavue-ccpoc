import { useQuery } from "@tanstack/react-query";
import axios from "../../../../lib/axios";

// GET /api/v1/integration/integration-setup/:id
//   Lightweight detail load for the wizard's settings/header.
export const getIntegrationSetup = (id) => {
  return axios.get(`/api/v1/integration/integration-setup/${id}`);
};

export const useGetIntegrationSetup = ({ id, config } = {}) => {
  return useQuery({
    queryKey: ["integration_setup_detail", id],
    queryFn: () => getIntegrationSetup(id),
    enabled: !!id,
    ...config
  });
};
