import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Lightning, X } from "@phosphor-icons/react";
import { SchemaTab } from "./components/SchemaTab";
import { AssociationsTab } from "./components/AssociationsTab";
import { SettingsTab } from "./components/SettingsTab";
import { TabButton } from "./components/shared/TabButton";
import { Button } from "@/ui";
import { Skeleton } from "@/ui";
import { useGetPlatformDetail } from "./api/getPlatformDetail";
import { useGetIntegrationSetup } from "./api/getIntegrationSetup";
import { useGetSetupObjects } from "./api/getSetupObjects";
import { useStartSetupSync } from "./api/startSetupSync";
import { useTriggerSetupSync } from "./api/triggerSetupSync";
import { useClearInitialReview } from "./api/clearInitialReview";
import { getObjectsInProgress } from "./api/getObjectsInProgress";
import { useNotificationStore } from "./stores/notifications";
import { OPTIMISTIC_SYNC_TIMEOUT_MS } from "./constants";
import { getCurrentUser } from "../../../api";

// Shown after initial sync completes while support enables Lake Formation tags.
const REVIEW_MESSAGE =
  "Sync is completed, our support team is reviewing the sync once.";

const TAB_TOOLTIPS = {
  schema: "Choose which objects Petavue should sync from this source.",
  associations: "Pick which related-object pairs (e.g. Contact ↔ Deal) flow into Petavue.",
  settings: "View connection details, test the connection, or disconnect."
};

export const IntegrationDetailWithTabs = ({
  integrationName,
  platform,
  onBack
}) => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();
  const [activeTab, setActiveTab] = useState("schema");
  const [confirmSync, setConfirmSync] = useState(null); // { kind: "start" | "trigger" | "partial", mode?, busy?, free? }
  // True while the pre-sync in-progress check is running (button click → modal).
  const [checkingInProgress, setCheckingInProgress] = useState(false);
  // Optimistic in-progress flag — the server's isInitialSyncInProgress only
  // covers the FIRST sync, so subsequent re-syncs would otherwise re-enable
  // the button immediately after the mutation returns. We keep this flag on
  // for 90s to give the BE time to start the job and flip its own state.
  const [optimisticSyncing, setOptimisticSyncing] = useState(false);
  useEffect(() => {
    if (!optimisticSyncing) return undefined;
    const t = setTimeout(() => setOptimisticSyncing(false), OPTIMISTIC_SYNC_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [optimisticSyncing]);

  // Resolve _id from GET /{platform} (added in integration-srv PR #507).
  const detailQuery = useGetPlatformDetail({ platform });
  const integrationId = detailQuery.data?._id;

  // /integration-setup/:id detail. `isSyncEngineFlow` is the pv-sync-engine
  // opt-in flag; when false/missing the orchestrator silently no-ops, so we
  // gate the Sync Now button on it. The user never sees the field name —
  // just a generic "connection isn't ready" if they somehow trigger it.
  const setupQuery = useGetIntegrationSetup({ id: integrationId });
  const setupRow = setupQuery.data;
  const isSetupComplete = !!setupRow?.isSetupComplete;
  const isSyncing = !!setupRow?.isInitialSyncInProgress;
  const isSyncEngineFlow = setupRow?.isSyncEngineFlow !== false;

  // Initial sync done but held for Petavue support review (LF-tag enablement).
  // Blocks Sync Now for everyone; only Petavue staff see the "Clear review" button.
  const reviewPending = !!setupRow?.initialSyncReviewPending;
  const isPetavueUser = (getCurrentUser()?.email || "").includes("@petavue.com");
  const clearReview = useClearInitialReview({
    config: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Enabled for analysis",
          message: "Connector resumed and the data catalog is rebuilding."
        });
        queryClient.invalidateQueries({ queryKey: ["integration_setup_detail", integrationId] });
      }
    }
  });

  const objectsQuery = useGetSetupObjects({ id: integrationId });
  const serverPicks = objectsQuery.data?.selectedObjects || [];
  const initialSyncDone = objectsQuery.data?.initialSyncDoneObjects || [];

  // Objects part of the running initial sync (set when sync starts, lazy-cleared
  // as each completes). FE uses this to detect "objects added since sync started"
  // so we can offer a partial Sync Now instead of blocking the whole button.
  const activeSyncObjects = setupRow?.objectsInActiveSyncSession || [];
  const activeSyncSet = new Set(activeSyncObjects);
  const doneSet = new Set(initialSyncDone.map((s) => String(s).toUpperCase()));
  // "New" = selected but neither currently syncing nor already initial-synced.
  // We sort for a stable label + modal listing.
  const newObjectsToSync = [...serverPicks]
    .filter((o) => !activeSyncSet.has(o) && !doneSet.has(String(o).toUpperCase()))
    .sort((a, b) => a.localeCompare(b));
  const hasNewObjects = newObjectsToSync.length > 0;

  // Server returns 422 when readiness fails — both for safety (race against
  // a stale setupRow) and because BE catches state we can't see (Sentry alert
  // fires server-side). We surface a generic message; the actual reason is
  // intentionally not exposed to the user.
  const notifySyncBlocked = () => {
    addNotification({
      type: "error",
      title: "Sync couldn't start",
      message:
        "Your connection isn't ready to sync yet. Our team has been notified and will follow up."
    });
  };

  const startSync = useStartSetupSync({
    config: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Sync started",
          message: "We've queued your sync."
        });
        setOptimisticSyncing(true);
        queryClient.invalidateQueries({ queryKey: ["integration_setup_detail", integrationId] });
      },
      onError: (err) => {
        if (err?.response?.status === 422) notifySyncBlocked();
      }
    }
  });
  const triggerSync = useTriggerSetupSync({
    config: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Sync started",
          message: "We've queued your sync."
        });
        setOptimisticSyncing(true);
        queryClient.invalidateQueries({ queryKey: ["integration_setup_detail", integrationId] });
      },
      onError: (err) => {
        if (err?.response?.status === 422) notifySyncBlocked();
      }
    }
  });

  const isSyncBusy = startSync.isPending || triggerSync.isPending || checkingInProgress;
  const inProgress = isSyncing || optimisticSyncing;

  // Mid-sync partial: an initial sync is already running and the user added
  // new objects — kick those off without touching the in-flight ones.
  const partialSyncMode = inProgress && hasNewObjects;

  const handleSync = async () => {
    if (!integrationId) return;
    const kind = partialSyncMode ? "partial" : isSetupComplete ? "trigger" : "start";
    const candidates = partialSyncMode ? newObjectsToSync : serverPicks;

    // Authoritative pre-check against the real job collection. Splits the
    // selection into objects we can sync now vs ones still running.
    let busy = [];
    try {
      setCheckingInProgress(true);
      const res = await getObjectsInProgress({ id: integrationId, objects: candidates });
      busy = (res?.inProgress || []).map((j) => j.object);
    } catch {
      // If the check itself errors, fall through — the BE 409s on real overlap.
    } finally {
      setCheckingInProgress(false);
    }

    const free = candidates.filter((o) => !busy.includes(o));

    // Everything the user picked is already syncing — block with the names.
    if (busy.length > 0 && free.length === 0) {
      addNotification({
        type: "error",
        title: "Sync already in progress",
        message: `${busy.join(", ")} ${busy.length === 1 ? "is" : "are"} currently syncing. Please wait for ${busy.length === 1 ? "it" : "them"} to finish before starting again.`
      });
      return;
    }

    setConfirmSync({ kind, mode: kind === "partial" ? "initial" : "incremental", busy, free });
  };

  const handleConfirmSync = () => {
    if (!confirmSync || !integrationId) return;
    // Only sync the objects that aren't already running (handleSync filtered
    // these out of `busy`). Empty `free` is impossible here — handleSync blocks
    // before opening the modal when everything is busy.
    const free = confirmSync.free && confirmSync.free.length ? confirmSync.free : serverPicks;
    const someBusy = (confirmSync.busy?.length || 0) > 0;

    if (confirmSync.kind === "start" && !someBusy) {
      // Clean first sync of everything selected.
      startSync.mutate({ id: integrationId }, { onSuccess: () => setConfirmSync(null) });
      return;
    }

    // Trigger path. For "start"/"partial" the free objects sync as `initial`;
    // for a normal re-sync we honour the user's incremental/full choice. The
    // trigger endpoint refuses an empty objects[] on purpose, so we always pass
    // the explicit free list (never defaulting to "everything").
    const syncMode =
      confirmSync.kind === "start" || confirmSync.kind === "partial"
        ? "initial"
        : confirmSync.mode || "incremental";

    triggerSync.mutate(
      { id: integrationId, body: { objects: free, syncMode } },
      { onSuccess: () => setConfirmSync(null) }
    );
  };

  // Status badge — only ever "Active" or "Sync in progress"; otherwise no
  // badge. We deliberately do NOT render a "Not configured yet" state: the
  // "Active" check depends on serverPicks, which comes from a *separate*
  // (objectsQuery) request, so before it resolves every page open would flash
  // "Not configured yet" even for fully-configured integrations — misleading.
  // We treat "user has picked objects" as Active too, so legacy connections
  // (pre-wizard rows where isSetupComplete was never written) don't show
  // "Setup pending" forever. The BE also lazy-backfills isSetupComplete=true
  // once initialSyncDoneObjects covers every selected object.
  const statusBadge =
    setupQuery.isLoading || objectsQuery.isLoading
      ? null
      : inProgress
      ? { label: "Sync in progress", color: "var(--color-primary-500)" }
      : isSetupComplete || serverPicks.length > 0
      ? { label: "Active", color: "var(--color-green)" }
      : null;

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-grey-50)]">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-[var(--color-grey-200)] flex items-center gap-3 sticky top-0 z-10">
        <button
          type="button"
          onClick={onBack}
          className="text-[var(--color-grey-500)] hover:text-[var(--color-text-primary)]"
          aria-label="Back to integrations"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-medium text-[var(--color-text-primary)]">
          {integrationName}
        </h1>
        {statusBadge && (
          <span
            className="inline-flex items-center gap-1.5 text-xs font-medium"
            style={{ color: statusBadge.color }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: statusBadge.color }}
            />
            {statusBadge.label}
          </span>
        )}
        <div className="ml-auto">
          {integrationId && (
            <Button
              variant="primary"
              size="md"
              onClick={handleSync}
              disabled={
                isSyncBusy ||
                (inProgress && !partialSyncMode) ||
                serverPicks.length === 0 ||
                !isSyncEngineFlow ||
                reviewPending
              }
              title={
                reviewPending
                  ? REVIEW_MESSAGE
                  : serverPicks.length === 0
                  ? "Select at least one object before syncing."
                  : !isSyncEngineFlow
                  ? "We're getting your connection ready. Please check back shortly."
                  : partialSyncMode
                  ? `Sync the ${newObjectsToSync.length} newly-added object${newObjectsToSync.length === 1 ? "" : "s"}; the others are still syncing.`
                  : inProgress
                  ? "A sync is already running."
                  : undefined
              }
            >
              <Lightning size={14} className="mr-1.5" weight="fill" />
              {checkingInProgress
                ? "Checking…"
                : isSyncBusy
                ? "Queueing…"
                : partialSyncMode
                ? `Sync new object${newObjectsToSync.length === 1 ? "" : "s"} (${newObjectsToSync.length})`
                : inProgress
                ? "Sync in progress"
                : "Sync now"}
            </Button>
          )}
        </div>
      </div>

      {/* Initial-sync review hold (LF-tag enablement) */}
      {reviewPending && (
        <div className="px-6 py-3 bg-[var(--color-orange-bg,#FFF7ED)] border-b border-[var(--color-grey-200)] flex items-center gap-3">
          <Info size={16} className="text-[var(--color-orange,#B45309)] shrink-0" />
          <span className="text-sm text-[var(--color-text-primary)]">{REVIEW_MESSAGE}</span>
          {isPetavueUser && (
            <Button
              variant="secondary"
              size="sm"
              className="ml-auto"
              onClick={() => clearReview.mutate({ id: integrationId })}
              disabled={clearReview.isPending || !integrationId}
            >
              {clearReview.isPending ? "Enabling…" : "Approve & Enable for Analysis"}
            </Button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 bg-white border-b border-[var(--color-grey-200)] flex items-center gap-2 sticky top-[57px] z-10">
        <TabButton
          active={activeTab === "schema"}
          onClick={() => setActiveTab("schema")}
          tooltip={TAB_TOOLTIPS.schema}
        >
          Schema
        </TabButton>
        {platform === "hubspot" && (
          <TabButton
            active={activeTab === "associations"}
            onClick={() => setActiveTab("associations")}
            tooltip={TAB_TOOLTIPS.associations}
          >
            Associations
          </TabButton>
        )}
        <TabButton
          active={activeTab === "settings"}
          onClick={() => setActiveTab("settings")}
          tooltip={TAB_TOOLTIPS.settings}
        >
          Settings
        </TabButton>
      </div>

      {/* Tab content */}
      {detailQuery.isLoading || (integrationId && setupQuery.isLoading) ? (
        <div className="px-6 py-5 flex flex-col gap-3">
          <Skeleton width="40%" height={18} />
          <Skeleton width="100%" height={120} />
          <Skeleton width="100%" height={120} />
        </div>
      ) : activeTab === "schema" ? (
        <SchemaTab
          platform={platform}
          integrationId={integrationId}
          onManageAssociations={() => setActiveTab("associations")}
        />
      ) : activeTab === "associations" ? (
        <AssociationsTab integrationId={integrationId} />
      ) : (
        <SettingsTab
          platform={platform}
          integrationId={integrationId}
          integrationName={integrationName}
          onDisconnected={onBack}
        />
      )}

      {confirmSync && (
        <SyncConfirmModal
          kind={confirmSync.kind}
          mode={confirmSync.mode}
          onModeChange={(mode) => setConfirmSync((s) => ({ ...s, mode }))}
          objects={
            confirmSync.free && confirmSync.free.length
              ? confirmSync.free
              : confirmSync.kind === "partial"
              ? newObjectsToSync
              : serverPicks
          }
          inProgressObjects={
            confirmSync.busy && confirmSync.busy.length
              ? confirmSync.busy
              : confirmSync.kind === "partial"
              ? activeSyncObjects
              : []
          }
          integrationName={integrationName}
          isPending={isSyncBusy}
          onConfirm={handleConfirmSync}
          onCancel={() => setConfirmSync(null)}
        />
      )}
    </div>
  );
};

// Confirmation modal — shown when the header Start sync / Sync now button is
// clicked. Lists the objects that will be synced and (for re-syncs) lets the
// user choose between incremental and full. When kind="partial", an initial
// sync is already in flight and the user has added new objects since — we
// surface the split between "will be synced now" and "already in progress".
const SyncConfirmModal = ({
  kind,
  mode,
  onModeChange,
  objects,
  inProgressObjects = [],
  integrationName,
  isPending,
  onConfirm,
  onCancel
}) => {
  const isStart = kind === "start";
  const isPartial = kind === "partial";
  const title = isPartial ? "Sync new objects" : "Sync now";
  const subtitle = isStart
    ? `We'll queue an initial sync of the objects you've selected for ${integrationName}. Large accounts may take a few hours.`
    : isPartial
    ? `We'll start initial sync for the objects below. The rest of ${integrationName} keeps syncing in the background.`
    : `We'll queue a sync of the objects below for ${integrationName}.`;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-[var(--color-grey-100)] flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-medium text-[var(--color-text-primary)]">
              {title}
            </h3>
            <p className="text-xs text-[var(--color-grey-500)] mt-1">
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-[var(--color-grey-500)] hover:text-[var(--color-text-primary)] -mt-1"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
          {!isStart && !isPartial && (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="sync-mode"
                  className="accent-[var(--color-primary-500)]"
                  checked={mode === "incremental"}
                  onChange={() => onModeChange("incremental")}
                />
                <span>Incremental (latest changes)</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="sync-mode"
                  className="accent-[var(--color-primary-500)]"
                  checked={mode === "full"}
                  onChange={() => onModeChange("full")}
                />
                <span>Full re-sync</span>
              </label>
            </div>
          )}

          <div>
            <div className="text-[12px] uppercase tracking-wide text-[var(--color-grey-500)] mb-1.5">
              {isPartial ? `We'll sync these now (${objects.length})` : `Objects (${objects.length})`}
            </div>
            {objects.length === 0 ? (
              <div className="text-xs text-[var(--color-grey-500)] border border-[var(--color-grey-200)] rounded-md p-3">
                No objects selected. Pick at least one from the Schema tab first.
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {objects.map((o) => (
                  <span
                    key={o}
                    className="text-[12px] px-2 py-0.5 rounded-full bg-[var(--color-primary-100,#EEF2FF)] text-[var(--color-primary-700,#3730A3)]"
                  >
                    {o}
                  </span>
                ))}
              </div>
            )}
          </div>

          {inProgressObjects.length > 0 && (
            <div>
              <div className="text-[12px] uppercase tracking-wide text-[var(--color-grey-500)] mb-1.5">
                Already syncing, can't start now ({inProgressObjects.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {inProgressObjects.map((o) => (
                  <span
                    key={o}
                    className="text-[12px] px-2 py-0.5 rounded-full bg-[var(--color-grey-100)] text-[var(--color-grey-500)]"
                  >
                    {o}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-[var(--color-grey-100)] flex items-center justify-end gap-2">
          <Button variant="secondary" size="md" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onConfirm}
            disabled={isPending || objects.length === 0}
          >
            <Lightning size={14} className="mr-1.5" weight="fill" />
            {isPending ? "Queueing…" : "Sync now"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationDetailWithTabs;
