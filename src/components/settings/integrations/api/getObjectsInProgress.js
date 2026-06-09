import axios from "../../../../lib/axios";

// POST /api/v1/integration/integration-setup/:id/objects/in-progress
//   Body: { objects: string[] }
//   Returns: { inProgress: [{ object, status }], canSync: string[] }
//
// Authoritative check against the real job collection (salesforce_jobs /
// hubspot_jobs / fivetran_sync_jobs) — used before a Sync Now so we can block
// objects that are mid-sync and tell the user exactly which ones. The BE also
// 409s on any residual overlap (the global axios interceptor toasts that), so
// this is the proactive layer, not the only guard.
export const getObjectsInProgress = ({ id, objects }) =>
  axios.post(`/api/v1/integration/integration-setup/${id}/objects/in-progress`, {
    objects
  });
