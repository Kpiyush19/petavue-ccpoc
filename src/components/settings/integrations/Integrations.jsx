import { useRef, useState } from "react";
import { ArrowsClockwise, CheckCircle } from "@phosphor-icons/react";
import { useGetSourceIntegrations } from "./api/getSourceIntegrations";
import { Skeleton } from "@/ui";
import { Button } from "@/ui";
import IntegrationCard from "./components/IntegrationCard";
import { IntegrationModal } from "./components/IntegrationModal";
import { SpinnerModal } from "./components/SpinnerModal";
import { useFivetranConnectPusher } from "./hooks/useFivetranConnectPusher";
import { toast } from "sonner";

const CardSkeleton = ({ ind }) => {
  return (
    <div
      className="flex flex-col gap-4 bg-white items-start justify-between border border-[var(--color-grey-200)] h-full w-full rounded-lg px-6 py-4"
      key={ind}
    >
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center gap-3">
          <Skeleton width={24} height={24} />
          <Skeleton width="35%" height={20} />
        </div>
        <div className="flex flex-col gap-1">
          <Skeleton width="100%" height={16} />
          <Skeleton width="85%" height={16} />
        </div>
      </div>
      <Skeleton width={94} height={32} className="rounded-lg" />
    </div>
  );
};

export const Integrations = ({ onNavigate }) => {
  const [isIntegrationModalOpen, setIntegrationModalOpen] = useState(false);
  const [selectIntegration, setSelectIntegration] = useState(null);
  const [isSpinnerModalOpen, setIsSpinnerModalOpen] = useState(false);

  const {
    data: sourceIntegrations,
    refetch: refetchSourceIntegrations,
    isLoading: integLoad,
    isFetching: integFetch
  } = useGetSourceIntegrations({
    config: { staleTime: Infinity },
    level: "tenant-level"
  });

  const integrations = sourceIntegrations?.integrations || [];
  const totalCount = integrations.filter((i) => !i?.coming_soon).length;
  const connectedCount = integrations.filter((i) => i.connected).length;

  // Uniform "connected" toast for every integration (Fivetran + OAuth). No
  // auto-redirect — a toast with a Configure action keeps the user in place
  // (so multiple admins on this page aren't all yanked to the detail screen)
  // while still being one click from setting up sync. The `id` dedupes repeat
  // signals for the same connector (e.g. Pusher event + popup-close backstop).
  const notifyConnected = ({ slug, name }) => {
    refetchSourceIntegrations();
    const icon = <CheckCircle size={18} weight="fill" color="var(--color-green)" />;
    if (!slug) {
      toast.success(`${name || "Your integration"} connected`, {
        icon,
        duration: 9000,
        closeButton: true
      });
      return;
    }
    toast.success(`${name || "Integration"} connected`, {
      id: `connected-${slug}`,
      icon,
      duration: 9000,
      closeButton: true,
      action: {
        label: "Configure",
        onClick: () => {
          // No `?connected=true` — the toast already confirmed success, so we
          // skip the detail page's fullscreen "connected" splash and drop the
          // user straight into the configure/sync view.
          const path = `/settings/integrations/${slug}`;
          if (onNavigate) onNavigate(path, { name: name || "Integration" });
          else if (typeof window !== "undefined") window.location.href = path;
        }
      }
    });
  };

  // Handle to the Connect Card popup so we can close it the instant the
  // connection finalizes (via the Pusher event below) instead of leaving the
  // user staring at Fivetran's success screen.
  const connectPopupRef = useRef(null);
  const openConnectPopup = (url) => {
    // Roomy by default, but never larger than ~90% of the user's screen so it
    // stays fully visible and centered on smaller displays/laptops.
    const w = Math.min(1024, Math.floor(window.outerWidth * 0.9));
    const h = Math.min(900, Math.floor(window.outerHeight * 0.9));
    const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2);
    // Named window → re-clicking Connect reuses the same popup instead of
    // stacking new ones.
    connectPopupRef.current = window.open(
      url,
      "pv_fivetran_connect",
      `width=${w},height=${h},left=${left},top=${top}`
    );
    return connectPopupRef.current;
  };

  // Live "connection finalized" signal from integration-srv (Fivetran
  // setup-completed webhook → Pusher). Replaces polling and works even if the
  // Connect Card redirect 503'd or never came back: close the popup, then land
  // the user on the integration detail page with the "Connection successful —
  // Configure sync" screen (FivetranIntegrationDetail shows it on
  // ?connected=true). The Fivetran slug is `fivetran_<service>`, and the event
  // carries connectorId = the service (e.g. google_analytics_4).
  useFivetranConnectPusher((data) => {
    try {
      connectPopupRef.current?.close();
    } catch {
      /* popup already closed / cross-origin — ignore */
    }
    connectPopupRef.current = null;

    notifyConnected({
      slug: data?.connectorId ? `fivetran_${data.connectorId}` : null,
      name: data?.datasource || "Integration"
    });
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-grey-50)] min-h-full">
      <div className="my-4 px-4 w-full">
        <div className="min-w-[900px]">
          <div className="flex justify-between items-center mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[var(--color-grey-200)] text-sm">
              <span className="text-[var(--color-text-primary)]">
                <span className="font-semibold">{totalCount}</span> Available
              </span>
              <span className="w-px h-4 bg-[var(--color-grey-200)]" />
              <span className="text-[var(--color-green)]">
                <span className="font-semibold">{connectedCount}</span> Connected
              </span>
            </div>
            <Button
              variant="secondaryGhost"
              size="md"
              onClick={() => refetchSourceIntegrations()}
              disabled={integFetch}
            >
              <ArrowsClockwise size={14} className={integFetch ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-5">
            {integLoad && !sourceIntegrations
              ? Array.from({ length: 12 }).map((_, ind) => <CardSkeleton key={ind} ind={ind} />)
              : sourceIntegrations?.integrations?.map((data) => (
                  <IntegrationCard
                    key={data.name}
                    cardData={data}
                    refetchSourceIntegrations={refetchSourceIntegrations}
                    setSelectIntegration={setSelectIntegration}
                    setIntegrationModalOpen={setIntegrationModalOpen}
                    openConnectPopup={openConnectPopup}
                    onConnected={notifyConnected}
                    onNavigate={onNavigate}
                  />
                ))}
          </div>
        </div>
      </div>
      <IntegrationModal
        selectedCard={selectIntegration}
        isModalOpen={isIntegrationModalOpen}
        onClose={() => setIntegrationModalOpen(false)}
        refetchSourceIntegrations={refetchSourceIntegrations}
        setIsSpinnerModalOpen={setIsSpinnerModalOpen}
      />
      {isSpinnerModalOpen && (
        <SpinnerModal
          isModalOpen={isSpinnerModalOpen}
          onClose={() => setIsSpinnerModalOpen(false)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};

export default Integrations;
