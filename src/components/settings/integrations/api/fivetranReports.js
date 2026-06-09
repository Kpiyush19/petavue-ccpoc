import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "../../../../lib/axios";
import { useNotificationStore } from "../stores/notifications";

// Fivetran Custom Reports — only meaningful for GA4 / Google Ads / Facebook
// Ads (the services Fivetran exposes `config.reports[]` on). Other services
// 404 from the list endpoint; the FE uses that to hide the tab.
//
// Reports themselves are owned by Fivetran — ops provisions them via
// Fivetran's console. Our surface is read-only over `config.reports[]` plus
// a per-report toggle that adds/removes the report's destination table
// from tablesToSync (the allow-list fivetran-sync reads on each run).

const base = (id) => `/api/v1/integration/fivetran/integrations/${id}/reports`;

// ── List ──────────────────────────────────────────────────────────────
export const useGetFivetranReports = ({ id, config } = {}) => {
  return useQuery({
    queryKey: ["fivetran_reports", id],
    queryFn: async () => {
      try {
        return await axios.get(base(id));
      } catch (err) {
        // 404 = source doesn't support custom reports. Return a sentinel
        // so the tab knows to hide itself rather than render an error.
        if (err?.response?.status === 404) {
          return { supportsCustomReports: false, reports: [], service: null };
        }
        throw err;
      }
    },
    enabled: !!id,
    staleTime: 30_000,
    ...config
  });
};

// ── Mint Connect Card URI (for adding/editing reports in Fivetran's UI) ──
//   Returns { uri }. FE opens the URI in a new tab so the user can edit
//   the connection inside Fivetran's native flow. When they finish,
//   Fivetran 302s back to our integration detail page with
//   `?reports_refreshed=true` and we re-fetch the reports list.
export const usePostFivetranReportsConnectCard = ({ config } = {}) => {
  const { addNotification } = useNotificationStore();
  return useMutation({
    mutationFn: ({ id }) => axios.post(`${base(id)}/connect-card`),
    onError: (error) => {
      addNotification({
        type: "error",
        title: "Couldn't open setup",
        message:
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Please try again."
      });
    },
    ...config
  });
};

// ── Catalog (dimensions + metrics for the builder modal) ──────────────
//
// staleTime matches the BE's 1-hour cache TTL (`LIVE_GA4_CACHE_TTL_MS`)
// — refetching faster than that just round-trips the same payload. The
// GA4 live catalog is ~40 KB; serving it once an hour per browser is
// effectively free, vs. once-every-5-min which adds up under load.
export const useGetFivetranReportCatalog = ({ id, enabled = true, config } = {}) => {
  return useQuery({
    queryKey: ["fivetran_report_catalog", id],
    queryFn: () => axios.get(`${base(id)}/catalog`),
    enabled: !!id && enabled,
    staleTime: 60 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    ...config
  });
};

// ── Add report (build in our UI → PATCH Fivetran config.reports[]) ────
export const usePostFivetranReport = ({ config } = {}) => {
  const qc = useQueryClient();
  const { addNotification } = useNotificationStore();
  return useMutation({
    mutationFn: ({ id, body }) => axios.post(base(id), body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["fivetran_reports", vars.id] });
      qc.invalidateQueries({ queryKey: ["fivetran_schema", vars.id] });
      addNotification({
        type: "success",
        title: "Report created",
        message: "Toggle it on to start syncing."
      });
    },
    onError: (error) => {
      addNotification({
        type: "error",
        title: "Couldn't create report",
        message:
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Please check the fields and try again."
      });
    },
    ...config
  });
};

// ── Edit report (rebuild in our UI → PUT replaces Fivetran config entry) ─
//   `key` is the report's current key (table for GA4/GAds, name for FB).
//   Renaming is allowed — the BE carries the tablesToSync selection across.
export const usePutFivetranReport = ({ config } = {}) => {
  const qc = useQueryClient();
  const { addNotification } = useNotificationStore();
  return useMutation({
    mutationFn: ({ id, key, body }) =>
      axios.put(`${base(id)}/${encodeURIComponent(key)}`, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["fivetran_reports", vars.id] });
      qc.invalidateQueries({ queryKey: ["fivetran_schema", vars.id] });
      addNotification({
        type: "success",
        title: "Report updated",
        message: "Your changes will apply on the next sync."
      });
    },
    onError: (error) => {
      addNotification({
        type: "error",
        title: "Couldn't update report",
        message:
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Please check the fields and try again."
      });
    },
    ...config
  });
};

// ── Delete report ────────────────────────────────────────────────────
export const useDeleteFivetranReport = ({ config } = {}) => {
  const qc = useQueryClient();
  const { addNotification } = useNotificationStore();
  return useMutation({
    mutationFn: ({ id, key }) => axios.delete(`${base(id)}/${encodeURIComponent(key)}`),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["fivetran_reports", vars.id] });
      qc.invalidateQueries({ queryKey: ["fivetran_schema", vars.id] });
      addNotification({
        type: "success",
        title: "Report deleted",
        message: "It won't sync on future runs."
      });
    },
    onError: (error) => {
      addNotification({
        type: "error",
        title: "Couldn't delete report",
        message:
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Please try again."
      });
    },
    ...config
  });
};

// ── Toggle selection ─────────────────────────────────────────────────
export const usePutFivetranReportSelection = ({ config } = {}) => {
  const qc = useQueryClient();
  const { addNotification } = useNotificationStore();
  return useMutation({
    mutationFn: ({ id, key, selected }) =>
      axios.put(`${base(id)}/${encodeURIComponent(key)}/selection`, { selected }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["fivetran_reports", vars.id] });
      // The Schema tab also reads tablesToSync — keep it in sync without
      // forcing the user to reload.
      qc.invalidateQueries({ queryKey: ["fivetran_schema", vars.id] });
    },
    onError: (error) => {
      addNotification({
        type: "error",
        title: "Couldn't update report",
        message:
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Please try again."
      });
    },
    ...config
  });
};
