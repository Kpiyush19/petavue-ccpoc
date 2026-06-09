import { useEffect, useRef } from "react";
import Pusher from "pusher-js";
import { PUSHER_KEY, PUSHER_CLUSTER, APP_ENVIRONMENT } from "../../../../config";
import { getApiBase, getAuthToken } from "../../../../api";
import { decodeJwtPayload } from "../../../../utils/jwt";

// Map VITE_APP_ENVIRONMENT (development/staging/production) to the same short
// token integration-srv uses (dev/stg/prod). MUST stay in sync with
// PusherService.envToken on the backend, or the channel names won't match.
function envToken(env) {
  const e = (env || "").toLowerCase();
  if (e.startsWith("prod")) return "prod";
  if (e.startsWith("stag") || e === "stg") return "stg";
  if (e.startsWith("dev")) return "dev";
  return e || "dev";
}

/**
 * Subscribe to per-tenant Fivetran connect notifications.
 *
 * integration-srv publishes `fivetran-connected` to
 * `integrations-{env}-{tenantId}` the instant a connection finalizes (driven
 * by Fivetran's setup-completed webhook — see FivetranWebhookService). This
 * lets the UI react immediately instead of depending on the flaky Connect Card
 * redirect or polling.
 *
 * The Pusher app has "authorized connections" enabled, so the connection MUST
 * sign in (userAuthentication + pusher.signin()) shortly after connecting or
 * Pusher drops the socket with code 4009 ("not authorized within timeout").
 * Mirrors the auth setup in the shared usePusher hook.
 */
export function useFivetranConnectPusher(onConnected) {
  const cbRef = useRef(onConnected);
  useEffect(() => {
    cbRef.current = onConnected;
  });

  // Compute tenantId during render so the subscribe effect re-runs once the
  // auth token is available (rather than bailing forever on first mount).
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null;
  const tenantId = token ? decodeJwtPayload(token)?.tenantId : null;

  useEffect(() => {
    if (!PUSHER_KEY || !tenantId) return;

    const apiBase = getApiBase();
    const authToken = getAuthToken();
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    const channelName = `integrations-${envToken(APP_ENVIRONMENT)}-${tenantId}`;

    const pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      userAuthentication: {
        endpoint: `${apiBase}/api/pusher/user-auth`,
        transport: "ajax",
        headers,
      },
      channelAuthorization: {
        endpoint: `${apiBase}/api/pusher/channel-auth`,
        transport: "ajax",
        headers,
      },
    });

    // Required: app enforces authorized connections (else Pusher closes with 4009).
    pusher.connection.bind("connected", () => {
      pusher.signin();
    });

    const channel = pusher.subscribe(channelName);
    channel.bind("fivetran-connected", (data) => {
      cbRef.current?.(data);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [tenantId]);
}
