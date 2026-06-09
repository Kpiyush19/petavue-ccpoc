import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "../../../../lib/axios";
import { useNotificationStore } from "../stores/notifications";
import { SCHEMA_PENDING_POLL_INTERVAL_MS } from "../constants";

// Fivetran-managed integration detail surface. Mirrors the SF/HS
// /integration-setup/:id/* shape but lives at /fivetran/integrations/:id
// because Fivetran sources are table-keyed, not object-keyed.

const base = (id) => `/api/v1/integration/fivetran/integrations/${id}`;

// GET /fivetran/integrations/:id — header data
export const useGetFivetranDetail = ({ id, config } = {}) =>
  useQuery({
    queryKey: ["fivetran_detail", id],
    queryFn: () => axios.get(base(id)),
    enabled: !!id,
    staleTime: 30_000,
    ...config
  });

// GET /fivetran/by-platform/:platform — resolve a fivetran_<service> slug
// to its integration row (incl. _id) for the tenant.
export const useGetFivetranByPlatform = ({ platform, config } = {}) =>
  useQuery({
    queryKey: ["fivetran_by_platform", platform],
    queryFn: () =>
      axios.get(`/api/v1/integration/fivetran/by-platform/${platform}`),
    enabled: !!platform,
    staleTime: 30_000,
    ...config
  });

// GET /fivetran/integrations/:id/schema — table list + tablesToSync
//
// Fivetran takes a few seconds to populate the schema metadata after a
// connector is freshly created. The BE now returns `schemaPending: true`
// in that window (instead of 404'ing). When we see that flag, refetch
// every 3s so the user doesn't have to reload. Capped at ~15 refetches
// by React Query's default retry behavior + we stop once tables arrive.
export const useGetFivetranSchema = ({ id, config } = {}) =>
  useQuery({
    queryKey: ["fivetran_schema", id],
    queryFn: () => axios.get(`${base(id)}/schema`),
    enabled: !!id,
    staleTime: 30_000,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Keep polling while the BE reports the schema is still being
      // populated by Fivetran. Stop once any table appears.
      if (data?.schemaPending && (data?.tables?.length ?? 0) === 0) {
        return SCHEMA_PENDING_POLL_INTERVAL_MS;
      }
      return false;
    },
    ...config
  });

// PUT /fivetran/integrations/:id/schema/tables — bulk replace
export const usePutFivetranTablesToSync = ({ config } = {}) => {
  const { addNotification } = useNotificationStore();
  return useMutation({
    mutationFn: ({ id, body }) => axios.put(`${base(id)}/schema/tables`, body),
    onError: (error) =>
      addNotification({
        type: "error",
        title: "Couldn't save tables",
        message:
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Please try again."
      }),
    ...config
  });
};

// POST /fivetran/integrations/:id/sync — incremental sync
export const usePostFivetranSync = ({ config } = {}) => {
  const { addNotification } = useNotificationStore();
  return useMutation({
    mutationFn: ({ id }) => axios.post(`${base(id)}/sync`),
    onError: (error) =>
      addNotification({
        type: "error",
        title: "Couldn't trigger sync",
        message:
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Please try again."
      }),
    ...config
  });
};

// POST /fivetran/integrations/:id/full-resync — full re-sync (scoped or whole)
export const usePostFivetranFullResync = ({ config } = {}) => {
  const { addNotification } = useNotificationStore();
  return useMutation({
    mutationFn: ({ id, body }) =>
      axios.post(`${base(id)}/full-resync`, body || {}),
    onError: (error) =>
      addNotification({
        type: "error",
        title: "Couldn't trigger full re-sync",
        message:
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Please try again."
      }),
    ...config
  });
};

// POST /fivetran/integrations/:id/test — probe connection
export const usePostFivetranTest = ({ config } = {}) => {
  return useMutation({
    mutationFn: ({ id }) => axios.post(`${base(id)}/test`),
    ...config
  });
};

// POST /fivetran/integrations/:id/request-disconnect
export const usePostFivetranRequestDisconnect = ({ config } = {}) => {
  const { addNotification } = useNotificationStore();
  return useMutation({
    mutationFn: ({ id }) => axios.post(`${base(id)}/request-disconnect`),
    onError: (error) =>
      addNotification({
        type: "error",
        title: "Couldn't request disconnect",
        message:
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Please try again."
      }),
    ...config
  });
};
