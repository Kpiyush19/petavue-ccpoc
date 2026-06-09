import { useState, useMemo, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Lightning,
  MagnifyingGlass,
  Plug,
  CheckCircle,
  XCircle,
  Buildings,
  User,
  X,
  DotsThreeVertical,
  Clock
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { Button } from "../../../common-components/Button";
import Skeleton from "../../../common-components/Skeleton";
import { useNotificationStore } from "./stores/notifications";
import { TabButton } from "./components/shared/TabButton";
import { SyncMenu } from "./components/shared/SyncMenu";
import { humanizeTableName } from "./utils/strings";
import { OPTIMISTIC_SYNC_TIMEOUT_MS } from "./constants";
import {
  useGetFivetranDetail,
  useGetFivetranByPlatform,
  useGetFivetranSchema,
  usePutFivetranTablesToSync,
  usePostFivetranSync,
  usePostFivetranFullResync,
  usePostFivetranTest,
  usePostFivetranRequestDisconnect
} from "./api/fivetran";
import { useGetObjectSyncStatus } from "./api/objectSyncStatus";
import { SyncStatusPill } from "./components/SyncStatusPill";
import { useClearInitialReview } from "./api/clearInitialReview";
import { getCurrentUser } from "../../../api";
import { getObjectsInProgress } from "./api/getObjectsInProgress";
import { FivetranCustomReportsTab } from "./components/FivetranCustomReportsTab";
import { SaveObjectsConfirmModal } from "./components/SaveObjectsConfirmModal";
import { UnsavedChangesBanner } from "./components/UnsavedChangesBanner";
import { RequestDisconnectConfirm } from "./components/RequestDisconnectConfirm";

// Shown after initial sync completes while support enables Lake Formation tags.
const REVIEW_MESSAGE =
  "Sync is completed, our support team is reviewing the sync once.";

// Services that expose `config.reports[]` in Fivetran's connector API. Keep
// in sync with FIVETRAN_SERVICES[].supportsCustomReports on the BE side —
// when those diverge the tab can still show (BE returns supportsCustomReports
// on its list call), but pre-gating here avoids a wasted round-trip.
const REPORTS_SUPPORTED_SERVICES = new Set([
  "google_analytics_4",
  "google_ads",
  "facebook_ads"
]);

const FIVETRAN_TAB_TOOLTIPS = {
  schema: "Choose which objects Petavue should sync from this source.",
  reports: "Define custom reports — useful for granular metrics that aren't in the default schema.",
  settings: "View connection details, test the connection, or disconnect."
};

export const FivetranIntegrationDetail = ({
  integrationId: integrationIdProp,
  platform,
  onBack
}) => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();
  const [activeTab, setActiveTab] = useState("schema");
  const [confirmSync, setConfirmSync] = useState(null); // { mode: "incremental"|"full" }
  // Optimistic in-progress flag — Fivetran's detail row doesn't expose a
  // "sync running" boolean to the FE, so we set this when the user queues
  // a sync and auto-clear after 90s. Prevents the user from spamming Sync Now
  // before the connector has actually started pulling rows.
  const [optimisticSyncing, setOptimisticSyncing] = useState(false);
  useEffect(() => {
    if (!optimisticSyncing) return undefined;
    const t = setTimeout(() => setOptimisticSyncing(false), OPTIMISTIC_SYNC_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [optimisticSyncing]);

  // Post-connect landing screen. The BE callback redirects here with
  // `?connected=true` on success and `?setup=failed&reason=...` on failure.
  // We show a fullscreen overlay so the user gets a clear "yes, we did the
  // thing" moment before being dropped into the detail page. Strip the query
  // params after we read them — otherwise a refresh would show the modal
  // forever.
  const [postConnect, setPostConnect] = useState(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "true") return { kind: "success" };
    if (params.get("setup") === "failed") {
      return { kind: "failure", reason: params.get("reason") || "unknown" };
    }
    return null;
  });
  useEffect(() => {
    if (postConnect && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("connected");
      url.searchParams.delete("setup");
      url.searchParams.delete("reason");
      url.searchParams.delete("already_connected");
      window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
    }
  }, [postConnect]);

  // The page accepts EITHER an ObjectId (post-OAuth callback redirect) or a
  // platform slug like "fivetran_lemlist" (clicked from the integrations
  // registry). For platform slug we resolve the ObjectId via /by-platform.
  const byPlatformQuery = useGetFivetranByPlatform({
    platform: !integrationIdProp && platform ? platform : null
  });
  const integrationId = integrationIdProp || byPlatformQuery.data?._id || null;

  const detailQuery = useGetFivetranDetail({ id: integrationId });
  const schemaQuery = useGetFivetranSchema({ id: integrationId });

  const triggerSync = usePostFivetranSync({
    config: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Sync started",
          message: "We've queued your sync."
        });
        setOptimisticSyncing(true);
        setConfirmSync(null);
        queryClient.invalidateQueries({ queryKey: ["fivetran_detail", integrationId] });
      }
    }
  });
  const fullResync = usePostFivetranFullResync({
    config: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Sync started",
          message: "We've queued your sync."
        });
        setOptimisticSyncing(true);
        setConfirmSync(null);
        queryClient.invalidateQueries({ queryKey: ["fivetran_detail", integrationId] });
      }
    }
  });

  const isSyncBusy = triggerSync.isPending || fullResync.isPending;
  const detail = detailQuery.data || {};
  const integrationName = detail.datasource || "integration";

  // Initial sync done but held for Petavue support review (LF-tag enablement).
  const reviewPending = !!detail.initialSyncReviewPending;
  const isPetavueUser = (getCurrentUser()?.email || "").includes("@petavue.com");
  const clearReview = useClearInitialReview({
    config: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Enabled for analysis",
          message: "Connector resumed and the data catalog is rebuilding."
        });
        queryClient.invalidateQueries({ queryKey: ["fivetran_detail", integrationId] });
      }
    }
  });

  // Has at least one table currently flagged for sync? Mirrors the same
  // serverPicks logic in FivetranSchemaTab below — tablesToSync explicitly
  // chosen by the user wins; otherwise fall back to Fivetran's
  // enabledInPetavue defaults. Sync Now stays disabled until at least one
  // table is selected, so we don't fire an empty bulk-export run.
  const fivetranTables = schemaQuery.data?.tables || [];
  const fivetranSelectedCount = (() => {
    const tts = schemaQuery.data?.tablesToSync;
    if (Array.isArray(tts) && tts.length > 0) return tts.length;
    return fivetranTables.filter((t) => t?.enabledInPetavue).length;
  })();

  const handleSync = () => {
    setConfirmSync({ mode: "incremental" });
  };

  const handleConfirmSync = () => {
    if (!confirmSync || !integrationId) return;
    if (confirmSync.mode === "full") {
      fullResync.mutate({ id: integrationId });
    } else {
      triggerSync.mutate({ id: integrationId });
    }
  };

  const statusBadge = detailQuery.isLoading
    ? null
    : optimisticSyncing
    ? { label: "Sync in progress", color: "var(--pv-primary-500)" }
    : detail.connectionStatus === "connected"
    ? { label: "Active", color: "var(--pv-success-text)" }
    : { label: detail.connectionStatus || "Setup pending", color: "var(--pv-neutral-grey-500)" };

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--pv-neutral-grey-50)]">
      <div className="px-6 py-4 bg-white border-b border-[var(--pv-neutral-grey-200)] flex items-center gap-3 sticky top-0 z-10">
        <button
          type="button"
          onClick={onBack}
          className="text-[var(--pv-neutral-grey-500)] hover:text-[var(--pv-text-primary-text)]"
          aria-label="Back to integrations"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-medium text-[var(--pv-text-primary-text)]">
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
              btnColor="primary"
              btnSize="md"
              onClick={handleSync}
              disabled={
                isSyncBusy ||
                optimisticSyncing ||
                detail.isInitialSyncInProgress ||
                fivetranSelectedCount === 0 ||
                reviewPending
              }
              title={
                reviewPending
                  ? REVIEW_MESSAGE
                  : detail.isInitialSyncInProgress && fivetranSelectedCount > 0
                  ? "We're getting things ready for you."
                  : fivetranSelectedCount === 0
                  ? "Select at least one object before syncing."
                  : optimisticSyncing
                  ? "A sync is already running."
                  : undefined
              }
            >
              <Lightning size={14} className="mr-1.5" weight="fill" />
              {isSyncBusy
                ? "Queueing…"
                : detail.isInitialSyncInProgress && fivetranSelectedCount > 0
                ? "Initial sync in progress"
                : optimisticSyncing
                ? "Sync in progress"
                : "Sync now"}
            </Button>
          )}
        </div>
      </div>

      {/* Initial-sync review hold (LF-tag enablement) */}
      {reviewPending && (
        <div className="px-6 py-3 bg-[var(--pv-warning-bg,#FFF7ED)] border-b border-[var(--pv-neutral-grey-200)] flex items-center gap-3">
          <Info size={16} className="text-[var(--pv-warning-text,#B45309)] shrink-0" />
          <span className="text-sm text-[var(--pv-text-primary-text)]">{REVIEW_MESSAGE}</span>
          {isPetavueUser && (
            <Button
              btnColor="secondary"
              btnSize="sm"
              className="ml-auto"
              onClick={() => clearReview.mutate({ id: integrationId })}
              disabled={clearReview.isPending || !integrationId}
            >
              {clearReview.isPending ? "Enabling…" : "Approve & Enable for Analysis"}
            </Button>
          )}
        </div>
      )}

      {/*
        Banner shown only while the first historical is running AND the
        user has at least one object selected. Without a selection,
        nothing's actually heading into our destination yet — surfacing
        "Initial sync in progress" then is misleading because the user
        thinks something's flowing when really they need to pick tables
        first. Copy avoids naming the data source vendor — users see
        Petavue as the system doing the work.
      */}
      {detail.isInitialSyncInProgress && fivetranSelectedCount > 0 && (
        <div className="px-6 py-3 bg-[var(--pv-primary-50,#EEF2FF)] border-b border-[var(--pv-primary-200,#C7D2FE)] flex items-center gap-2 text-sm text-[var(--pv-primary-700,#3730A3)]">
          <Lightning size={16} weight="fill" />
          <span>
            <strong>We're getting things ready for you.</strong> Pulling your data
            for the first time — we'll start the daily sync automatically when it
            completes.
          </span>
        </div>
      )}

      <div className="px-6 bg-white border-b border-[var(--pv-neutral-grey-200)] flex items-center gap-2 sticky top-[57px] z-10">
        <TabButton
          active={activeTab === "schema"}
          onClick={() => setActiveTab("schema")}
          tooltip={FIVETRAN_TAB_TOOLTIPS.schema}
        >
          Schema
        </TabButton>
        {/*
          Custom Reports tab — only shown for connectors that expose
          config.reports[] (GA4 / Google Ads / Facebook Ads). Other
          connectors don't have a reports concept, so we don't surface
          the tab for them.
        */}
        {REPORTS_SUPPORTED_SERVICES.has(detail?.fivetranService) && (
          <TabButton
            active={activeTab === "reports"}
            onClick={() => setActiveTab("reports")}
            tooltip={FIVETRAN_TAB_TOOLTIPS.reports}
          >
            Custom Reports
          </TabButton>
        )}
        <TabButton
          active={activeTab === "settings"}
          onClick={() => setActiveTab("settings")}
          tooltip={FIVETRAN_TAB_TOOLTIPS.settings}
        >
          Settings
        </TabButton>
      </div>

      {byPlatformQuery.isLoading || detailQuery.isLoading ? (
        <div className="px-6 py-5 flex flex-col gap-3">
          <Skeleton width="40%" height={18} />
          <Skeleton width="100%" height={120} />
        </div>
      ) : byPlatformQuery.isError ? (
        <div className="px-6 py-5">
          <div className="border border-[var(--pv-neutral-grey-200)] rounded-lg p-6 text-center">
            <p className="text-sm text-[var(--pv-neutral-grey-500)]">
              We couldn't find this integration. It may not be connected yet —
              try connecting from the integrations page.
            </p>
          </div>
        </div>
      ) : activeTab === "schema" ? (
        <FivetranSchemaTab
          integrationId={integrationId}
          schemaQuery={schemaQuery}
          nextSyncAtDisplay={detail?.nextSyncAtDisplay}
          isSyncing={detail?.isInitialSyncInProgress || optimisticSyncing}
        />
      ) : activeTab === "reports" ? (
        <FivetranCustomReportsTab integrationId={integrationId} />
      ) : (
        <FivetranSettingsTab
          integrationId={integrationId}
          integrationName={integrationName}
          detail={detail}
          onDisconnected={onBack}
        />
      )}

      {confirmSync && (
        <FivetranSyncConfirmModal
          mode={confirmSync.mode}
          onModeChange={(mode) => setConfirmSync((s) => ({ ...s, mode }))}
          integrationName={integrationName}
          isPending={isSyncBusy}
          onConfirm={handleConfirmSync}
          onCancel={() => setConfirmSync(null)}
        />
      )}

      {postConnect && (
        <PostConnectScreen
          kind={postConnect.kind}
          reason={postConnect.reason}
          integrationName={integrationName}
          onLater={() => {
            setPostConnect(null);
            if (onBack) onBack();
            else if (typeof window !== "undefined") {
              window.location.href = "/settings/integrations";
            }
          }}
          onStartSync={() => {
            setPostConnect(null);
            setActiveTab("schema");
          }}
          onClose={() => setPostConnect(null)}
        />
      )}
    </div>
  );
};

// Fullscreen overlay shown right after a Fivetran Connect Card flow
// finalizes. Lands the user with an unambiguous success/failure signal
// before they hit the detail page, plus a one-click path to either
// configure the sync (Schema tab) or come back later.
//
// Entrance animation: backdrop fades in, content fades + slides up, and the
// success icon does a one-shot scale "pop". Tailwind doesn't ship these by
// default so we declare keyframes in a scoped <style> below.
const PostConnectScreen = ({
  kind,
  reason,
  integrationName,
  onLater,
  onStartSync,
  onClose,
}) => {
  const isSuccess = kind === "success";
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Defer one tick so the initial paint uses the "from" classes,
    // then the transition kicks in on the next frame.
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={[
        "fixed inset-0 bg-white z-[60] flex items-center justify-center px-4",
        "transition-opacity duration-300 ease-out",
        mounted ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      <style>{`
        @keyframes pv-pop {
          0%   { transform: scale(0.4); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pv-rise {
          0% { transform: translateY(12px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .pv-pop { animation: pv-pop 600ms cubic-bezier(.22,.61,.36,1) both; }
        .pv-rise-1 { animation: pv-rise 420ms ease-out 180ms both; }
        .pv-rise-2 { animation: pv-rise 420ms ease-out 320ms both; }
        .pv-rise-3 { animation: pv-rise 420ms ease-out 460ms both; }
      `}</style>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="absolute top-4 right-4 text-[var(--pv-neutral-grey-400)] hover:text-[var(--pv-text-primary-text)]"
      >
        <X size={20} />
      </button>
      <div className="flex flex-col items-center text-center max-w-md w-full gap-6">
        <img src="/petavue-logo.svg" alt="Petavue" className="h-10 mb-2 pv-rise-1" />

        <div className="pv-pop">
          {isSuccess ? (
            <CheckCircle size={56} weight="fill" color="var(--pv-success-text)" />
          ) : (
            <XCircle size={56} weight="fill" color="var(--pv-error-text, #b42318)" />
          )}
        </div>

        <div className="flex flex-col gap-2 pv-rise-2">
          <h1 className="text-xl font-medium text-[var(--pv-text-primary-text)]">
            {isSuccess
              ? `${integrationName} connected successfully`
              : `${integrationName} connection failed`}
          </h1>
          <p className="text-sm text-[var(--pv-neutral-grey-500)]">
            {isSuccess
              ? "Your account is linked. Want to pick the objects you'd like to sync now, or set it up later?"
              : reason && reason !== "unknown"
              ? `Reason: ${reason.replace(/_/g, " ")}. You can retry from the integrations page.`
              : "Something went wrong on the way back from the connector. You can retry from the integrations page."}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 w-full mt-2 pv-rise-3">
          <Button btnColor="secondary" btnSize="lg" onClick={onLater}>
            {isSuccess ? "Later" : "Back to integrations"}
          </Button>
          {isSuccess && (
            <Button btnColor="primary" btnSize="lg" onClick={onStartSync}>
              <Lightning size={14} className="mr-1.5" weight="fill" />
              Configure sync
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const FIVETRAN_SYNC_MENU_ITEMS = {
  full: {
    label: "Re-sync this object",
    blurb: "Pulls every record again from scratch. Other objects keep their normal cadence.",
  },
};

const FivetranSchemaTab = ({ integrationId, schemaQuery, nextSyncAtDisplay, isSyncing }) => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState(null); // Set<string> | null
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingTableSync, setPendingTableSync] = useState(null); // { name } | null
  const [checkingTableSync, setCheckingTableSync] = useState(false);
  const [openMenuFor, setOpenMenuFor] = useState(null);

  // Block a per-table resync if that table is already mid-sync (real
  // fivetran_sync_jobs check). Fires the resync only when the table is free.
  const confirmTableSync = async () => {
    if (!pendingTableSync || !integrationId) return;
    const name = pendingTableSync.name;
    let busy = false;
    try {
      setCheckingTableSync(true);
      const res = await getObjectsInProgress({ id: integrationId, objects: [name] });
      busy = (res?.inProgress || []).length > 0;
    } catch {
      // Check failed — proceed; Fivetran dedupes a duplicate run anyway.
    } finally {
      setCheckingTableSync(false);
    }
    if (busy) {
      addNotification({
        type: "error",
        title: "Sync already in progress",
        message: `${name} is currently syncing. Please wait for it to finish before re-syncing.`
      });
      setPendingTableSync(null);
      return;
    }
    tableResync.mutate({ id: integrationId, body: { tables: [name] } });
  };
  const closeMenu = useCallback(() => setOpenMenuFor(null), []);

  // Live per-table sync status for the row pills. Keyed by raw table name.
  const objectStatusQuery = useGetObjectSyncStatus({ id: integrationId });
  const syncStateByTable = objectStatusQuery.data?.objects || {};

  // A sync is actively running if the parent says so (initial/optimistic) or any
  // table is live IN_PROGRESS. Used to hide the scheduled "Next sync ~" hint,
  // which is misleading while a sync is already underway.
  const syncInProgress =
    !!isSyncing ||
    Object.values(syncStateByTable).some((o) => o?.state === "IN_PROGRESS");

  // Per-row resync (full re-pull for a single table). Reuses the existing
  // /full-resync endpoint with { tables: [name] } — Fivetran's per-table
  // resync API (POST /connections/:id/schemas/tables/resync) is wrapped by
  // FivetranApiClient.triggerTableResync().
  const tableResync = usePostFivetranFullResync({
    config: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Sync started",
          message: "We've queued your sync."
        });
        setPendingTableSync(null);
        queryClient.invalidateQueries({ queryKey: ["fivetran_detail", integrationId] });
      }
    }
  });

  const data = schemaQuery.data;
  const allTables = useMemo(() => data?.tables ?? [], [data]);
  // rawTableName -> data-catalog dictionary _id for tables with an active entry.
  // Drives the per-row "View Catalog" link; absent => "No catalog" label (table not cataloged yet).
  const catalogIds = data?.tableCatalogIds || {};
  const serverPicks = useMemo(() => {
    if (Array.isArray(data?.tablesToSync) && data.tablesToSync.length > 0) {
      return data.tablesToSync;
    }
    return allTables.filter((t) => t?.enabledInPetavue).map((t) => t.name);
  }, [data, allTables]);
  const serverPicksSet = useMemo(() => new Set(serverPicks), [serverPicks]);

  const picks = draft ?? new Set(serverPicks);
  const draftDirty = draft !== null;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? allTables.filter((t) => String(t.name || "").toLowerCase().includes(q))
      : allTables;
    // Enabled rows first, then alphabetical by object name.
    return [...filtered].sort((a, b) => {
      const aEnabled = serverPicksSet.has(a.name) ? 0 : 1;
      const bEnabled = serverPicksSet.has(b.name) ? 0 : 1;
      if (aEnabled !== bEnabled) return aEnabled - bEnabled;
      return humanizeTableName(a.name).localeCompare(humanizeTableName(b.name));
    });
  }, [allTables, search, serverPicksSet]);

  const added = draftDirty
    ? Array.from(picks).filter((n) => !serverPicksSet.has(n))
    : [];
  const removed = draftDirty
    ? serverPicks.filter((n) => !picks.has(n))
    : [];

  const putTables = usePutFivetranTablesToSync({
    config: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Changes saved",
          message: ""
        });
        queryClient.invalidateQueries({ queryKey: ["fivetran_schema", integrationId] });
        setDraft(null);
        setShowConfirm(false);
      }
    }
  });

  const toggle = (name) => {
    setDraft((prev) => {
      const base = prev ?? new Set(serverPicks);
      const next = new Set(base);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // Select / deselect all visible rows (respects search filter).
  const visibleNames = rows.map((r) => r.name);
  const allVisibleSelected =
    visibleNames.length > 0 && visibleNames.every((n) => picks.has(n));
  const toggleAllVisible = () => {
    setDraft((prev) => {
      const base = prev ?? new Set(serverPicks);
      const next = new Set(base);
      if (allVisibleSelected) {
        visibleNames.forEach((n) => next.delete(n));
      } else {
        visibleNames.forEach((n) => next.add(n));
      }
      return next;
    });
  };

  return (
    <div className="px-6 py-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--pv-neutral-grey-500)]">
            {picks.size} of {allTables.length} object{allTables.length === 1 ? "" : "s"} enabled
          </span>
        </div>
      </div>

      {draftDirty && (
        <UnsavedChangesBanner
          onDiscard={() => setDraft(null)}
          onSave={() => setShowConfirm(true)}
          saveLabel="Review changes"
          isSaving={putTables.isPending}
        />
      )}

      <div className="relative w-full max-w-md">
        <MagnifyingGlass
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pv-neutral-grey-400)] z-10 pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search objects…"
          className="w-full h-9 pl-9 pr-3 text-sm rounded-md border border-[var(--pv-neutral-grey-200)] bg-white text-[var(--pv-text-primary-text)] placeholder:text-[var(--pv-neutral-grey-400)] focus:outline-none focus:ring-2 focus:ring-[var(--pv-primary-100)] focus:border-[var(--pv-primary-500)] transition-colors"
        />
      </div>

      {/*
        Next-sync line — mirrors the SF/HS SchemaTab pattern. BE computes
        the value by reading Fivetran's live daily_sync_time and converting
        it into the tenant's local TZ (always a clean hour, never the
        per-customer minute jitter Fivetran's scheduler adds at run time).
        Hidden when BE returns null — e.g. tenant has no TZ set or the
        connector is still pending finalize.
      */}
      {nextSyncAtDisplay && !syncInProgress && (
        <span className="inline-flex items-center gap-1 text-xs text-[var(--pv-neutral-grey-500)]">
          <Clock size={12} />
          Next sync ~ {nextSyncAtDisplay}
        </span>
      )}

      <div className="border border-[var(--pv-neutral-grey-200)] rounded-lg bg-white overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_140px_40px] items-center px-3 py-2 bg-[var(--pv-neutral-grey-50)] border-b border-[var(--pv-neutral-grey-100)] text-[11px] font-medium text-[var(--pv-neutral-grey-500)] uppercase tracking-wide">
          <label
            className="cursor-pointer flex items-center justify-center"
            title={allVisibleSelected ? "Deselect all" : "Select all"}
          >
            <input
              type="checkbox"
              className="w-4 h-4 accent-[var(--pv-primary-500)] cursor-pointer"
              checked={allVisibleSelected}
              onChange={toggleAllVisible}
              disabled={putTables.isPending || rows.length === 0}
              aria-label="Select all"
            />
          </label>
          <div>Object</div>
          <div>Status</div>
          <div />
        </div>

        {schemaQuery.isLoading ? (
          <div className="flex flex-col gap-2 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} width="100%" height={32} />
            ))}
          </div>
        ) : schemaQuery.isError ? (
          <div className="p-6 text-center text-xs text-[var(--pv-status-error,#EF4444)]">
            Couldn't load the object list. The connector may still be
            initializing — try again in a minute.
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--pv-neutral-grey-500)]">
            {search
              ? "No objects match this search."
              : data?.schemaPending
              ? "We're still preparing the object list. Refreshing automatically…"
              : "No objects available yet."}
          </div>
        ) : (
          rows.map((t) => {
            const isEnabled = picks.has(t.name);
            const isSavedEnabled = serverPicksSet.has(t.name);
            const syncingThis =
              tableResync.isPending && tableResync.variables?.body?.tables?.[0] === t.name;
            const menuOpen = openMenuFor === t.name;
            return (
              <div
                key={t.name}
                className="grid grid-cols-[40px_1fr_140px_40px] items-center px-3 py-2.5 border-b border-[var(--pv-neutral-grey-100)] last:border-b-0 bg-white hover:bg-[var(--pv-neutral-grey-50)]"
              >
                <label className="cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-[var(--pv-primary-500)] cursor-pointer"
                    checked={isEnabled}
                    onChange={() => toggle(t.name)}
                    disabled={putTables.isPending}
                  />
                </label>
                <div className="text-sm font-medium text-[var(--pv-text-primary-text)] flex items-center gap-1.5">
                  <span>{humanizeTableName(t.name)}</span>
                  <span className="text-[11px] text-[var(--pv-neutral-grey-500)] font-normal">
                    ({t.name})
                  </span>
                  {t.isCustomReport && (
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[var(--pv-primary-100,#EEF2FF)] text-[var(--pv-primary-700,#3730A3)]"
                      title="Custom report — auto-created on connect"
                    >
                      Custom report
                    </span>
                  )}
                  {catalogIds[t.name] ? (
                    <Link
                      to={`/data-hub/dictionary/${integrationId}?table=${catalogIds[t.name]}`}
                      className="inline-flex items-center gap-0.5 text-[11px] font-normal text-[var(--pv-primary-500)] hover:underline"
                      title="View this table in the data catalog"
                    >
                      View Catalog
                    </Link>
                  ) : (
                    <span className="text-[11px] font-normal text-[var(--pv-neutral-grey-400)]">
                      No catalog
                    </span>
                  )}
                </div>
                <div className="text-xs">
                  {/* One pill language: live sync status when present, else the
                      muted Enabled/Disabled config state. */}
                  <SyncStatusPill
                    state={
                      syncStateByTable[t.name]?.state ||
                      (isEnabled ? "ENABLED" : "DISABLED")
                    }
                  />
                </div>
                <div className="relative">
                  {/* Per-row sync — only meaningful for objects currently
                      saved as enabled. Same kebab-menu pattern as SF/HS so
                      users get a consistent UI across all platforms. */}
                  {isSavedEnabled && (
                    <button
                      type="button"
                      onClick={() => setOpenMenuFor(menuOpen ? null : t.name)}
                      className="p-1 rounded hover:bg-[var(--pv-neutral-grey-100)] text-[var(--pv-neutral-grey-500)] hover:text-[var(--pv-text-primary-text)]"
                      aria-label="Sync options"
                      disabled={tableResync.isPending}
                    >
                      {syncingThis ? (
                        <Lightning size={14} className="animate-pulse" />
                      ) : (
                        <DotsThreeVertical size={16} weight="bold" />
                      )}
                    </button>
                  )}
                  <SyncMenu
                    open={menuOpen}
                    onClose={closeMenu}
                    modes={["full"]}
                    items={FIVETRAN_SYNC_MENU_ITEMS}
                    onPick={() => {
                      setOpenMenuFor(null);
                      setPendingTableSync({ name: t.name });
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {showConfirm && (
        <SaveObjectsConfirmModal
          added={added}
          removed={removed}
          totalBefore={serverPicks.length}
          totalAfter={picks.size}
          isSaving={putTables.isPending}
          onConfirm={() =>
            putTables.mutate({
              id: integrationId,
              body: { tablesToSync: Array.from(picks) }
            })
          }
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {pendingTableSync && (
        <FivetranTableSyncConfirmModal
          tableName={pendingTableSync.name}
          isPending={tableResync.isPending || checkingTableSync}
          onConfirm={confirmTableSync}
          onCancel={() => setPendingTableSync(null)}
        />
      )}
    </div>
  );
};

// Per-table sync confirmation. Fires a full re-pull for the named table only —
// the rest of the connector's tables keep their incremental cadence.
const FivetranTableSyncConfirmModal = ({ tableName, isPending, onConfirm, onCancel }) => (
  <div
    className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
    onClick={onCancel}
  >
    <div
      className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-5 py-4 border-b border-[var(--pv-neutral-grey-200)]">
        <h2 className="text-base font-medium text-[var(--pv-text-primary-text)]">
          Sync this object
        </h2>
        <p className="text-xs text-[var(--pv-neutral-grey-500)] mt-1">
          Object: <span className="font-medium text-[var(--pv-text-primary-text)]">{humanizeTableName(tableName)}</span>
        </p>
      </div>
      <div className="px-5 py-4 text-sm text-[var(--pv-text-primary-text)]">
        We'll re-pull every record for this object from the source. Other objects in this connector keep their normal sync cadence.
      </div>
      <div className="px-5 py-4 border-t border-[var(--pv-neutral-grey-200)] flex items-center justify-end gap-2">
        <Button btnColor="secondary" btnSize="md" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button btnColor="primary" btnSize="md" onClick={onConfirm} disabled={isPending}>
          <Lightning size={14} className="mr-1.5" weight="fill" />
          {isPending ? "Queueing…" : "Yes, sync now"}
        </Button>
      </div>
    </div>
  </div>
);

// ─── Settings tab ────────────────────────────────────────────────────────────

const FivetranSettingsTab = ({ integrationId, integrationName, detail, onDisconnected }) => {
  const { addNotification } = useNotificationStore();
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const testConnection = usePostFivetranTest({
    config: {
      onSuccess: (data) => {
        const ok = data?.success === true || data?.connectionStatus === "connected";
        setTestResult({
          ok,
          message: data?.message || (ok ? "Connection looks healthy." : "The connector reports it's unhealthy.")
        });
      },
      onError: () => setTestResult({ ok: false, message: "Couldn't reach the connector." })
    }
  });

  const disconnect = usePostFivetranRequestDisconnect({
    config: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Disconnect requested",
          message: "Our team will follow up to complete the disconnect."
        });
        setShowDisconnectConfirm(false);
        if (onDisconnected) onDisconnected();
      }
    }
  });

  const lastConnected = detail.lastConnectedAt
    ? new Date(detail.lastConnectedAt).toLocaleString()
    : null;

  return (
    <div className="px-6 py-5 flex flex-col gap-6">
      <section className="border border-[var(--pv-neutral-grey-200)] rounded-lg bg-white p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-medium text-[var(--pv-text-primary-text)]">
            Connection
          </h2>
          <p className="text-xs text-[var(--pv-neutral-grey-500)] mt-1">
            Data lands in your Petavue warehouse on the schedule below.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="border border-[var(--pv-neutral-grey-200)] rounded-md p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--pv-neutral-grey-500)] mb-1">
              <Buildings size={12} />
              Source
            </div>
            <div className="text-xs text-[var(--pv-text-primary-text)]">
              {detail.datasource || "—"}
            </div>
          </div>
          <div className="border border-[var(--pv-neutral-grey-200)] rounded-md p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--pv-neutral-grey-500)] mb-1">
              <User size={12} />
              Connected by
            </div>
            <div className="text-xs text-[var(--pv-text-primary-text)] break-all">
              {detail.createdByEmail || "—"}
            </div>
          </div>
        </div>

        {lastConnected && (
          <div className="text-[11px] text-[var(--pv-neutral-grey-500)]">
            Last connected: {lastConnected}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            btnColor="secondary"
            btnSize="md"
            onClick={() => {
              if (!integrationId) return;
              setTestResult(null);
              testConnection.mutate({ id: integrationId });
            }}
            disabled={!integrationId || testConnection.isPending}
          >
            {testConnection.isPending ? "Testing…" : "Test connection"}
          </Button>
          {testResult && (
            <span
              className={`inline-flex items-center gap-1 text-xs ${
                testResult.ok
                  ? "text-[var(--pv-success-text)]"
                  : "text-[var(--pv-status-error,#EF4444)]"
              }`}
            >
              {testResult.ok ? <CheckCircle size={14} weight="fill" /> : <XCircle size={14} weight="fill" />}
              {testResult.message}
            </span>
          )}
        </div>

        {!showDisconnectConfirm ? (
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--pv-neutral-grey-100)]">
            <Button
              btnColor="red ghost"
              btnSize="md"
              onClick={() => setShowDisconnectConfirm(true)}
              disabled={!integrationId}
              mainBtnClassName="border border-[var(--pv-status-error,#EF4444)]"
            >
              <Plug size={14} className="mr-1.5" />
              Request disconnect
            </Button>
          </div>
        ) : (
          <RequestDisconnectConfirm
            integrationName={integrationName}
            isLoading={disconnect.isPending}
            onCancel={() => setShowDisconnectConfirm(false)}
            onSubmit={() => disconnect.mutate({ id: integrationId })}
          />
        )}
      </section>
    </div>
  );
};

// ─── Modals ──────────────────────────────────────────────────────────────────

const FivetranSyncConfirmModal = ({
  mode,
  onModeChange,
  integrationName,
  isPending,
  onConfirm,
  onCancel
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    onClick={onCancel}
  >
    <div
      className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-5 py-4 border-b border-[var(--pv-neutral-grey-100)] flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-medium text-[var(--pv-text-primary-text)]">
            Sync now
          </h3>
          <p className="text-xs text-[var(--pv-neutral-grey-500)] mt-1">
            We'll queue a sync for {integrationName}.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-[var(--pv-neutral-grey-500)] hover:text-[var(--pv-text-primary-text)] -mt-1"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-5 py-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input
              type="radio"
              name="fv-sync-mode"
              className="accent-[var(--pv-primary-500)]"
              checked={mode === "incremental"}
              onChange={() => onModeChange("incremental")}
            />
            <span>Incremental (latest changes)</span>
          </label>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input
              type="radio"
              name="fv-sync-mode"
              className="accent-[var(--pv-primary-500)]"
              checked={mode === "full"}
              onChange={() => onModeChange("full")}
            />
            <span>Full re-sync</span>
          </label>
        </div>
        <p className="text-[11px] text-[var(--pv-neutral-grey-500)]">
          {mode === "full"
            ? "We'll re-pull all historical data on the next run."
            : "We'll pick up changes since the last successful sync."}
        </p>
      </div>

      <div className="px-5 py-3 border-t border-[var(--pv-neutral-grey-100)] flex items-center justify-end gap-2">
        <Button btnColor="secondary" btnSize="md" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button
          btnColor="primary"
          btnSize="md"
          onClick={onConfirm}
          disabled={isPending}
        >
          <Lightning size={14} className="mr-1.5" weight="fill" />
          {isPending ? "Queueing…" : mode === "full" ? "Full re-sync" : "Sync now"}
        </Button>
      </div>
    </div>
  </div>
);

export default FivetranIntegrationDetail;
