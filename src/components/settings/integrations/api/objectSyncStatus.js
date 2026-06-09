import { useQuery } from "@tanstack/react-query";
import axios from "../../../../lib/axios";

// GET /sync-status/objects?integrationId= — per-object LIVE sync status for the
// Schema tab pill. Returns:
//   { asOf, timezone, activeRun, platform, objects }
// where objects[name] = { state: "IN_PROGRESS" | "COMPLETED" }.
// Objects that are failed / never-synced / completed before today are OMITTED
// (the BE applies the tenant-timezone day boundary), so a missing key = no pill.
//
// Polling:
//   • every 10s while a run is active (activeRun=true) — watch progress live.
//   • a slow 5-min poll while idle, so a tab left open across tenant midnight
//     clears day-old "Completed" pills without the user reloading.
//   • also refetches on window focus.
export const useGetObjectSyncStatus = ({ id, config } = {}) =>
  useQuery({
    queryKey: ["object_sync_status", id],
    queryFn: () =>
      axios.get(`/api/v1/integration/sync-status/objects?integrationId=${id}`),
    enabled: !!id,
    staleTime: 5_000,
    refetchOnWindowFocus: true,
    refetchInterval: (query) =>
      query.state.data?.activeRun ? 10_000 : 5 * 60_000,
    ...config
  });
