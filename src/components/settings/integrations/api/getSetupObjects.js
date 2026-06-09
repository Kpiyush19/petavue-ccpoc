import { useQuery } from "@tanstack/react-query";
import axios from "../../../../lib/axios";

// GET /api/v1/integration/integration-setup/:id/objects?search=&page=&pageSize=
//   Response shape:
//     {
//       supportedObjects: string[],          // default catalog (always present)
//       selectedObjects: string[],           // current user picks
//       initialSyncDoneObjects: string[],    // sync-status per object
//       matches?: [{ name, label, custom, queryable, score }],
//       totalMatches?: number, page?: number, pageSize?: number, totalPages?: number,
//                                            // pagination metadata, present when search runs
//     }
//   BE requires `search` to be >= 2 chars or it 400s — we suppress the
//   query param for shorter strings so the FE just gets the catalog.
//   page/pageSize only sent alongside an active search.
export const getSetupObjects = ({ id, search, page, pageSize }) => {
  const useSearch = typeof search === "string" && search.trim().length >= 2;
  const params = useSearch
    ? {
        search: search.trim(),
        ...(page ? { page } : {}),
        ...(pageSize ? { pageSize } : {})
      }
    : undefined;
  return axios.get(`/api/v1/integration/integration-setup/${id}/objects`, {
    params
  });
};

export const useGetSetupObjects = ({ id, search, page, pageSize, config } = {}) => {
  return useQuery({
    // Include page in the key so each page is cached separately and we don't
    // serve a stale page when the user pages forward/backward.
    queryKey: ["integration_setup_objects", id, search || "", page || 1, pageSize || 20],
    queryFn: () => getSetupObjects({ id, search, page, pageSize }),
    enabled: !!id,
    ...config
  });
};
