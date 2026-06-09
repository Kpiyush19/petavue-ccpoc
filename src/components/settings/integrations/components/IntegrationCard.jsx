import { Button } from "../../../../common-components/Button";
import { pollFivetranCompletion } from "../api/fivetranPollCompletion";

const authIntegrations = ["salesforce", "slack", "google-sheets", "google-analytics", "hubspot", "linkedin"];

// Stop watching the Connect Card popup after this long (its URI is valid ~24h,
// but in practice a setup either finishes or is abandoned well under 5 min).
const CONNECT_POPUP_MAX_WAIT_MS = 5 * 60 * 1000;

const isFivetranCard = (data) =>
  data?.type === "fivetran-card" || (typeof data?.slug === "string" && data.slug.startsWith("fivetran_"));

const IntegrationCard = ({
  cardData,
  refetchSourceIntegrations,
  setSelectIntegration,
  setIntegrationModalOpen,
  openConnectPopup,
  onConnected,
  onNavigate
}) => {
  const isAuthIntegration = authIntegrations.includes(cardData.slug) || isFivetranCard(cardData);

  const handleConnect = (e) => {
    setSelectIntegration(cardData);

    if (!isAuthIntegration) {
      setIntegrationModalOpen(true);
      return;
    }

    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (isFivetranCard(cardData)) {
      // Fivetran: open the Connect Card in a POPUP (not a new tab) so this grid
      // stays mounted and its Pusher subscription (see <Integrations>) stays
      // connected. When integration-srv's setup-completed webhook finalizes the
      // row it pushes `fivetran-connected`, and the parent closes the popup and
      // navigates — no aggressive polling, and it works even if the Connect Card
      // redirect 503'd or never returned.
      const opener = openConnectPopup || ((url) => window.open(url, "_blank"));
      const popup = opener(cardData.authentication_url);
      if (!popup) return;

      // Backstop only (no periodic network polling): if the popup closes and we
      // somehow missed the Pusher event (dropped socket, closed pre-delivery),
      // do ONE server-side completion probe. The interval just reads the local
      // `.closed` flag — it makes no network calls.
      const closeWatch = setInterval(() => {
        if (popup.closed) {
          clearInterval(closeWatch);
          pollFivetranCompletion()
            .then((res) => {
              // Only toast / flip the card if Fivetran confirms THIS connector
              // actually finalized. Closing the Connect Card tab without
              // finishing setup returns an empty `finalized` list — treat that
              // as abandoned, not connected (no false "connected" success
              // toast). The toast is deduped (shared `id`) so a genuine connect
              // can't double up with the Pusher event.
              const connected = (res?.finalized || []).some(
                (f) => `fivetran_${f.connectorId}` === cardData.slug
              );
              if (connected && onConnected) {
                onConnected({ slug: cardData.slug, name: cardData.name });
              } else {
                refetchSourceIntegrations?.();
              }
            })
            .catch(() => {
              // Probe failed — stay silent; let the Pusher event or a manual
              // refresh flip the card. Never assert success on an error.
            });
        }
      }, 1000);
      // Stop watching after the Connect Card's max lifetime so a never-closed
      // popup doesn't leave the interval running forever.
      setTimeout(() => clearInterval(closeWatch), CONNECT_POPUP_MAX_WAIT_MS);
      return;
    }

    // Non-Fivetran OAuth (Salesforce, HubSpot, Slack, …): unchanged — their own
    // OAuth callback pages finalize the connection.
    window.open(cardData.authentication_url, "_blank");
  };

  const handleViewDetails = () => {
    const path = `/settings/integrations/${cardData.slug}`;

    if (onNavigate) {
      onNavigate(path, { name: cardData.name });
    } else if (typeof window !== "undefined") {
      window.location.href = path;
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-white items-start justify-between border border-[var(--pv-neutral-grey-200)] h-full w-full rounded-lg px-6 py-4">
      <div className="flex flex-col gap-4 w-full">
        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            <img src={cardData.logo} alt="" width={24} />
            <p className="text-[var(--pv-text-primary-text)]">{cardData.name}</p>
          </div>
          {cardData.connected && (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM13.7071 8.70711C14.0976 8.31658 14.0976 7.68342 13.7071 7.29289C13.3166 6.90237 12.6834 6.90237 12.2929 7.29289L9 10.5858L7.70711 9.29289C7.31658 8.90237 6.68342 8.90237 6.29289 9.29289C5.90237 9.68342 5.90237 10.3166 6.29289 10.7071L8.29289 12.7071C8.68342 13.0976 9.31658 13.0976 9.70711 12.7071L13.7071 8.70711Z"
                fill="var(--pv-success-text)"
              />
            </svg>
          )}
        </div>
        <p className="font-normal text-xs leading-5 text-[var(--pv-neutral-grey-500)]">{cardData.description}</p>
      </div>
      <div className="flex w-full items-center justify-between gap-5">
        {cardData.coming_soon && !cardData.connected ? (
          <div className="text-xs text-[var(--pv-primary-500)] px-3 py-1.5 font-normal leading-5 rounded-lg bg-[var(--pv-primary-50)]">
            Coming Soon
          </div>
        ) : !cardData.connected ? (
          isAuthIntegration ? (
            <a href={cardData.authentication_url} target="_blank" rel="noopener noreferrer" onClick={handleConnect}>
              <Button btnColor="primary" btnSize="lg">
                Connect
              </Button>
            </a>
          ) : (
            <Button btnColor="primary" btnSize="lg" onClick={handleConnect}>
              Connect
            </Button>
          )
        ) : (
          <Button btnColor="secondary" btnSize="lg" onClick={handleViewDetails}>
            View Details
          </Button>
        )}
        {/* {syncStatus?.hasActiveSync && syncStatus?.currentSession?.status !== "COMPLETED" && (
          <span className="flex items-center gap-1.5 px-2 py-1 bg-[var(--pv-primary-50)] rounded-lg">
            <CloudArrowUp size={10} className="shrink-0 text-[var(--pv-primary-500)]" />
            <span className="whitespace-nowrap text-xs text-[var(--pv-primary-500)]">
              {syncStatus.currentSession?.displayStatus || "Syncing"}: {syncStatus.currentSession?.progress || 0}%
            </span>
          </span>
        )}
        {(syncStatus?.currentSession?.status === "COMPLETED" ||
          (!syncStatus?.hasActiveSync && syncStatus?.lastCompletedAt)) && (
          <span className="flex items-center gap-1.5 px-2 py-1 bg-[var(--pv-success-bg)] rounded-lg">
            <CloudArrowUp size={10} className="shrink-0 text-[var(--pv-success-text)]" />
            <span className="whitespace-nowrap text-xs text-[var(--pv-success-text)]">
              {syncStatus?.currentSession?.displayStatus || "Synced"}: 100%
            </span>
          </span>
        )}
        {cardData.connected && !syncStatus?.hasActiveSync && !syncStatus?.lastCompletedAt && (
          <span className="flex items-center gap-1.5 px-2 py-1 bg-[var(--pv-neutral-grey-50)] rounded-lg">
            <CloudArrowUp size={10} className="shrink-0 text-[var(--pv-neutral-grey-400)]" />
            <span className="whitespace-nowrap text-xs text-[var(--pv-neutral-grey-500)]">Never synced</span>
          </span>
        )}
        {!syncStatus?.hasActiveSync && userDetail?.isSelfServeUser && cardData?.isInitialSyncInProgress && (
          <span className="flex items-center gap-1.5 px-2 py-1 bg-[var(--pv-neutral-grey-50)] rounded-lg">
            <CloudArrowUp size={10} className="shrink-0" />
            <span className="whitespace-normal text-xs">Data sync in progress</span>
          </span>
        )} */}
      </div>
    </div>
  );
};

export default IntegrationCard;
