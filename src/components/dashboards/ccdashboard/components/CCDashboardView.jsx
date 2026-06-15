import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { CaretRight, CaretDown, Sparkle, Lightbulb, X, Database, Code, File, FloppyDisk, TextAlignLeft, ListDashes } from "@phosphor-icons/react";
import { ClickAwayListener } from "@mui/material";
import { Button, Tooltip } from "@/common-components";
import spinner from "@/common-components/assets/spinner.gif";
import CCDashboardDropdown from "./CCDashboardDropdown";
import { formatDateTime } from "@/common-utils/formatDateTime";
import {
  useGetPublishedDashboards,
  useStartChatSession,
  useGetDashboardExplanation,
  getDashboardId,
  getDashboardFileUrl
} from "../api";
import useCCDashboardStore from "../store/useCCDashboardStore";
import { useNavigate, useBasePath, useConfig, useWidgets } from "../context";
import { getAuthToken } from "../../../../api";
import { MOCK_ENABLED } from "../../../../mocks";
import { Button as PvButton } from "../../../../petavue";
import apolloLogo from "@/assets/integrations/apollo.svg";
import hubspotLogo from "@/assets/integrations/hubspot.svg";
import salesforceLogo from "@/assets/integrations/salesforce.svg";
import snowflakeLogo from "@/assets/integrations/snowflake.svg";
import lemlistLogo from "@/assets/integrations/lemlist.svg";
import { queryClient } from "../../../../lib/queryClient";
import { CardView, hasCardContent, stripPills } from "../../../shared/CardRenderer";

const MIN_PERCENT = 40;
const MAX_PERCENT = 80;
const MIN_WIDTH_PX = 460;
const DEFAULT_PERCENT = 50;
const PANEL_STORAGE_KEY = "dashboard-explanation-panel-percent";

function getInitialPercent() {
  if (typeof window === "undefined") return DEFAULT_PERCENT;
  const saved = localStorage.getItem(PANEL_STORAGE_KEY);
  if (!saved) return DEFAULT_PERCENT;
  const parsed = parseFloat(saved);
  if (isNaN(parsed) || parsed < MIN_PERCENT || parsed > MAX_PERCENT) {
    return DEFAULT_PERCENT;
  }
  return parsed;
}

function rafThrottle(fn) {
  let rafId = null;
  let lastArgs = null;

  const throttled = (...args) => {
    lastArgs = args;
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        fn(...lastArgs);
        rafId = null;
      });
    }
  };

  throttled.cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  return throttled;
}

const BLOCK_TYPE_ICONS = {
  athena_query: Database,
  python_code: Code,
  write_file: File,
  save_output: FloppyDisk
};

const BLOCK_TYPE_LABELS = {
  athena_query: "Data Query",
  python_code: "Python Code",
  write_file: "Write File",
  save_output: "Save Output"
};

// Connected data sources surfaced in the "Sync Details" popup.
// To use real brand logos: drop a file in src/assets/integrations/ (e.g.
// apollo.svg), import it at the top of this file, and set it as `logo` below —
// e.g. `import apollo from "@/assets/integrations/apollo.svg"` then `logo: apollo`.
// Until then, the colored monogram badge stands in for the logo.
// `live: true` means the source is queried in real time (no scheduled sync) —
// it shows a "Live" badge instead of a last-sync time.
const DEFAULT_INTEGRATIONS = [
  { name: "Apollo", synced: "Jun 8, 6:00 PM IST", color: "#5C5CFF", logo: apolloLogo },
  { name: "HubSpot", synced: "Jun 7, 9:30 AM IST", color: "#FF7A59", logo: hubspotLogo },
  { name: "Salesforce", live: true, color: "#00A1E0", logo: salesforceLogo },
  { name: "Snowflake", synced: "Jun 5, 7:30 AM IST", color: "#29B5E8", logo: snowflakeLogo },
  { name: "Lemlist", synced: "Jun 6, 11:02 AM IST", color: "#0A0A23", logo: lemlistLogo },
];

// Phosphor "ClockCounterClockwise" (Last updated) + "Stack" (Data freshness) glyphs.
const CLOCK_ICON_PATH = "M232,136.66A104.12,104.12,0,1,1,119.34,24,8,8,0,0,1,120.66,40,88.12,88.12,0,1,0,216,135.34,8,8,0,0,1,232,136.66ZM120,72v56a8,8,0,0,0,8,8h56a8,8,0,0,0,0-16H136V72a8,8,0,0,0-16,0Zm40-24a12,12,0,1,0-12-12A12,12,0,0,0,160,48Zm36,24a12,12,0,1,0-12-12A12,12,0,0,0,196,72Zm24,36a12,12,0,1,0-12-12A12,12,0,0,0,220,108Z";
const STACK_ICON_PATH = "M128,24C74.17,24,32,48.6,32,80v96c0,31.4,42.17,56,96,56s96-24.6,96-56V80C224,48.6,181.83,24,128,24Zm80,104c0,9.62-7.88,19.43-21.61,26.92C170.93,163.35,150.19,168,128,168s-42.93-4.65-58.39-13.08C55.88,147.43,48,137.62,48,128V111.36c17.06,15,46.23,24.64,80,24.64s62.94-9.68,80-24.64ZM69.61,53.08C85.07,44.65,105.81,40,128,40s42.93,4.65,58.39,13.08C200.12,60.57,208,70.38,208,80s-7.88,19.43-21.61,26.92C170.93,115.35,150.19,120,128,120s-42.93-4.65-58.39-13.08C55.88,99.43,48,89.62,48,80S55.88,60.57,69.61,53.08ZM186.39,202.92C170.93,211.35,150.19,216,128,216s-42.93-4.65-58.39-13.08C55.88,195.43,48,185.62,48,176V159.36c17.06,15,46.23,24.64,80,24.64s62.94-9.68,80-24.64V176C208,185.62,200.12,195.43,186.39,202.92Z";

function StepCard({ stepId, step, meta, isExpanded, isCodeVisible, onToggleStep, onToggleCode, viewMode = "summary" }) {
  const TypeIcon = BLOCK_TYPE_ICONS[meta?.type] || Code;
  const typeLabel = BLOCK_TYPE_LABELS[meta?.type] || meta?.type || "Step";
  const hasCode = meta?.code && (meta.type === "athena_query" || meta.type === "python_code");
  const explanationText = step.explanation || "";
  const hasBullets = explanationText.includes("\n- ");
  const effectiveViewMode = (viewMode === "card" && hasCardContent(step.card)) ? "card" : "summary";

  return (
    <div className="mb-2 border border-[var(--pv-neutral-grey-150)] rounded-lg overflow-hidden bg-[var(--pv-neutral-grey-50)]">
      <button
        onClick={() => onToggleStep(stepId)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left bg-transparent border-none cursor-pointer hover:bg-[var(--pv-neutral-grey-100)] transition-colors"
      >
        {isExpanded ? (
          <CaretDown size={12} className="text-[var(--pv-neutral-grey-500)] shrink-0" />
        ) : (
          <CaretRight size={12} className="text-[var(--pv-neutral-grey-500)] shrink-0" />
        )}
        <div className="w-6 h-6 rounded-md bg-[var(--pv-primary-500)]/10 flex items-center justify-center shrink-0">
          <TypeIcon size={12} className="text-[var(--pv-primary-500)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-[var(--pv-neutral-grey-900)] truncate">
            {stripPills(step.title) || meta?.label || stepId}
          </div>
          <div className="text-[10px] text-[var(--pv-neutral-grey-500)]">{typeLabel}</div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 pt-0 ml-[42px]">
          {effectiveViewMode === "card" ? (
            <div className="mb-2">
              <CardView card={step.card} />
            </div>
          ) : (
            explanationText &&
            (hasBullets ? (
              <ul className="text-[12px] text-[var(--pv-neutral-grey-600)] space-y-1 list-disc list-inside mb-2">
                {explanationText
                  .split("\n")
                  .filter((l) => l.trim())
                  .map((line, i) => (
                    <li key={i}>{stripPills(line.replace(/^-\s*/, ""))}</li>
                  ))}
              </ul>
            ) : (
              <p className="text-[12px] text-[var(--pv-neutral-grey-600)] leading-relaxed mb-2">{stripPills(explanationText)}</p>
            ))
          )}

          {hasCode && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCode(stepId);
                }}
                className="flex items-center gap-1 text-[11px] text-[var(--pv-primary-500)] hover:underline bg-transparent border-none cursor-pointer mb-1"
              >
                <Code size={10} />
                {isCodeVisible ? "Hide code" : `View ${meta.code_language === "sql" ? "SQL" : "Python"}`}
              </button>
              {isCodeVisible && (
                <pre className="text-[11px] leading-relaxed bg-white border border-[var(--pv-neutral-grey-150)] rounded-md p-2.5 overflow-x-auto max-h-[300px] overflow-y-auto font-mono text-[var(--pv-neutral-grey-700)] whitespace-pre-wrap break-words">
                  {meta.code}
                </pre>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ExplanationSteps({ explanation, blockMeta, expandedSteps, showCode, toggleStep, toggleCode, viewMode }) {
  const steps = explanation?.steps || {};
  const groups = explanation?.groups || [];

  if (groups.length > 0) {
    return groups.map((group, gi) => {
      const title = group.group_title || group.group_name || `Group ${gi + 1}`;
      const desc = group.summary || group.group_explanation || group.group_description || "";
      return (
        <div key={gi} className="mb-5">
          <div className="flex items-center gap-2 mb-1.5 px-1">
            <div className="w-5 h-5 rounded-full bg-[var(--pv-primary-500)]/10 flex items-center justify-center text-[10px] font-bold text-[var(--pv-primary-500)]">
              {gi + 1}
            </div>
            <div className="text-[13px] font-semibold text-[var(--pv-neutral-grey-900)]">{title}</div>
          </div>
          {desc && (
            <p className="text-[12px] text-[var(--pv-neutral-grey-600)] mb-2.5 px-1 ml-7 leading-relaxed">{stripPills(desc)}</p>
          )}
          <div className="ml-3 border-l-2 border-[var(--pv-primary-500)]/15 pl-4">
            {(group.step_ids || []).map((stepId) => {
              const step = steps[stepId];
              if (!step) return null;
              return (
                <StepCard
                  key={stepId}
                  stepId={stepId}
                  step={step}
                  meta={blockMeta[stepId]}
                  isExpanded={expandedSteps.has(stepId)}
                  isCodeVisible={showCode.has(stepId)}
                  onToggleStep={toggleStep}
                  onToggleCode={toggleCode}
                  viewMode={viewMode}
                />
              );
            })}
          </div>
        </div>
      );
    });
  }

  return Object.entries(steps).map(([stepId, step]) => (
    <StepCard
      key={stepId}
      stepId={stepId}
      step={step}
      meta={blockMeta[stepId]}
      isExpanded={expandedSteps.has(stepId)}
      isCodeVisible={showCode.has(stepId)}
      onToggleStep={toggleStep}
      onToggleCode={toggleCode}
      viewMode={viewMode}
    />
  ));
}

export const CCDashboardView = ({ dashboardId, Skeleton, Input }) => {
  const navigate = useNavigate();
  const basePath = useBasePath();
  const config = useConfig();
  const widgets = useWidgets();

  const {
    AnalyticsChat,
    ChatOverlay,
    FilesTrayButton,
    ChatHistoryButton,
    WorkspaceTray,
    useGetWorkspaceFiles,
    useGetDashboardSessions,
    cleanupAnalyticsChatQueries,
    getDashboardSessions,
    setApiConfig
  } = widgets;

  const [chatOpen, setChatOpen] = useState(false);
  const [chatSessionId, setChatSessionId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isLatestSession, setIsLatestSession] = useState(true);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [isCreatingNewSession, setIsCreatingNewSession] = useState(false);

  const [showExplanation, setShowExplanation] = useState(false);
  const [showFreshness, setShowFreshness] = useState(false);
  const integrations = DEFAULT_INTEGRATIONS;
  const [expandedSteps, setExpandedSteps] = useState(new Set());
  const [showCode, setShowCode] = useState(new Set());
  const [viewMode, setViewMode] = useState("card");
  const [panelPercent, setPanelPercent] = useState(getInitialPercent);
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);

  const dashboardIframeRef = useRef(null);
  const dragState = useRef({ startX: 0, startPercent: 0 });

  const { getChatInput, setChatInput } = useCCDashboardStore();
  const chatInputValue = getChatInput(dashboardId, chatSessionId);
  const handleInputChange = useCallback(
    (value) => setChatInput(dashboardId, chatSessionId, value),
    [dashboardId, chatSessionId, setChatInput]
  );

  const artifactApiRef = useRef(null);

  const handleArtifactApiReady = useCallback((api) => {
    artifactApiRef.current = api;
  }, []);

  const handleFileClick = useCallback((file) => {
    if (artifactApiRef.current?.openArtifact) {
      artifactApiRef.current.openArtifact({
        path: file.path,
        title: file.name,
        contentType: file.content_type || "unknown",
        source: "files"
      });
    }
  }, []);

  const handleCloseChat = useCallback(() => {
    setChatOpen(false);
    setChatSessionId(null);
    setConnectionStatus(null);
    cleanupAnalyticsChatQueries?.();
  }, [cleanupAnalyticsChatQueries]);

  const handleSessionClick = useCallback((session, isLatest) => {
    const sessionId = session.id || session.session_id;
    if (sessionId) {
      setChatSessionId(sessionId);
      // setIsLatestSession(isLatest); // All sessions are now resumable
      setChatOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!chatOpen) return;

    const intervalId = setInterval(() => {
      if (document.activeElement === dashboardIframeRef.current) {
        handleCloseChat();
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, [chatOpen, handleCloseChat]);

  const authToken = getAuthToken();

  const {
    data: allArtifacts = [],
    isLoading: loading,
    isError,
    error
  } = useGetPublishedDashboards({
    config: {
      staleTime: Infinity
    }
  });

  const artifact = useMemo(() => {
    return allArtifacts.find((a) => getDashboardId(a) === dashboardId) || null;
  }, [allArtifacts, dashboardId]);

  const isWorkflow = artifact?.source === "workflow";

  const { data: explanationData, isLoading: explanationLoading } = useGetDashboardExplanation(dashboardId, {
    enabled: showExplanation && isWorkflow
  });

  useEffect(() => {
    localStorage.setItem(PANEL_STORAGE_KEY, String(panelPercent));
  }, [panelPercent]);

  const handleResizeStart = useCallback(
    (e) => {
      e.preventDefault();
      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);

      dragState.current = {
        startX: e.clientX,
        startPercent: panelPercent
      };

      setIsDraggingPanel(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const updateSize = rafThrottle((clientX) => {
        const deltaX = dragState.current.startX - clientX;
        const viewportWidth = window.innerWidth;
        const deltaPercent = (deltaX / viewportWidth) * 100;
        let newPercent = dragState.current.startPercent + deltaPercent;
        const minPercentFromPx = (MIN_WIDTH_PX / viewportWidth) * 100;
        const effectiveMin = Math.max(MIN_PERCENT, minPercentFromPx);
        newPercent = Math.max(effectiveMin, Math.min(MAX_PERCENT, newPercent));
        setPanelPercent(newPercent);
      });

      const handlePointerMove = (e) => {
        updateSize(e.clientX);
      };

      const cleanup = (e) => {
        updateSize.cancel();
        try {
          target.releasePointerCapture(e.pointerId);
        } catch {}
        setIsDraggingPanel(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        target.removeEventListener("pointermove", handlePointerMove);
        target.removeEventListener("pointerup", cleanup);
        target.removeEventListener("pointercancel", cleanup);
      };

      target.addEventListener("pointermove", handlePointerMove);
      target.addEventListener("pointerup", cleanup);
      target.addEventListener("pointercancel", cleanup);
    },
    [panelPercent]
  );

  const handlePanelClickAway = useCallback(() => {
    if (isDraggingPanel) return;
    setShowExplanation(false);
  }, [isDraggingPanel]);

  useEffect(() => {
    if (!showExplanation && isDraggingPanel) {
      setIsDraggingPanel(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  }, [showExplanation, isDraggingPanel]);

  const toggleStep = (stepId) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  const toggleCode = (stepId) => {
    setShowCode((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  const handleFindOutHow = () => {
    setShowExplanation(true);
    setExpandedSteps(new Set());
  };

  useEffect(() => {
    setIframeLoaded(false);
    setIframeError(false);
  }, [dashboardId]);

  const startChatMutation = useStartChatSession();

  const handleStartChat = async () => {
    if (!artifact || isStartingChat) return;

    setIsStartingChat(true);
    const dashId = getDashboardId(artifact);

    try {
      const data = await startChatMutation.mutateAsync({
        dashboardId: dashId,
        source: artifact.source,
        workflowId: artifact.workflow_id
      });

      if (data.session_id) {
        setChatSessionId(data.session_id);

        // All sessions are now resumable - isLatest check disabled
        // try {
        //   setApiConfig?.(config.apiUrl, authToken);
        //   const sessionsResponse = await getDashboardSessions?.(dashId);
        //   const sessions = (sessionsResponse?.sessions || sessionsResponse || []).filter(
        //     (s) => s.session_type !== "pre_publish_verify"
        //   );
        //   const sessionIndex = sessions.findIndex((s) => s.session_id === data.session_id);
        //   const isLatest = sessions.length === 0 || sessionIndex === 0 || sessionIndex === -1;
        //   setIsLatestSession(isLatest);
        // } catch {
        //   setIsLatestSession(true);
        // }
        setApiConfig?.(config.apiUrl, authToken);

        setChatOpen(true);
      }
    } catch (e) {
      console.error("[CCDashboardViewer] Chat error:", e);
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleNewSession = useCallback(async () => {
    if (!artifact || isCreatingNewSession) return null;

    setIsCreatingNewSession(true);
    const dashId = getDashboardId(artifact);

    try {
      const data = await startChatMutation.mutateAsync({
        dashboardId: dashId,
        source: artifact.source,
        workflowId: artifact.workflow_id,
        forceNew: true
      });

      if (data.session_id) {
        setChatSessionId(data.session_id);
        // setIsLatestSession(true); // All sessions are now resumable
        return data.session_id;
      }
      return null;
    } catch (e) {
      console.error("[CCDashboardViewer] New session error:", e);
      return null;
    } finally {
      setIsCreatingNewSession(false);
    }
  }, [artifact, isCreatingNewSession, startChatMutation]);

  const iframeUrl = getDashboardFileUrl(artifact);

  // In mock mode the iframe can't load over the network, so fetch the dashboard
  // HTML (intercepted by the mock fetch patch) and render it via `srcDoc`.
  const [mockDoc, setMockDoc] = useState(null);
  useEffect(() => {
    if (!MOCK_ENABLED || !iframeUrl) { setMockDoc(null); return; }
    let alive = true;
    fetch(iframeUrl)
      .then((r) => r.text())
      .then((t) => { if (alive) setMockDoc(t); })
      .catch(() => { if (alive) setIframeError(true); });
    return () => { alive = false; };
  }, [iframeUrl]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="absolute inset-4 flex items-center justify-center bg-white rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <img src={spinner} alt="loading" className="w-6 h-6" />
            <span className="text-sm text-[var(--pv-neutral-grey-500)]">Loading dashboard...</span>
          </div>
        </div>
      );
    }

    if (isError || !artifact) {
      return (
        <div className="absolute inset-4 flex items-center justify-center bg-white rounded-lg">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-sm text-[var(--pv-error-text)]">
              {error?.response?.data?.error?.message || error?.message || "Dashboard not found"}
            </span>
            <Button btnColor="secondary" btnSize="lg" onClick={() => navigate(basePath)}>Back to List</Button>
          </div>
        </div>
      );
    }

    return (
      <>
        {iframeUrl ? (
          <>
            {!iframeLoaded && (
              <div className="absolute inset-4 flex items-center justify-center bg-white rounded-lg z-10">
                <div className="flex flex-col items-center gap-3">
                  <img src={spinner} alt="loading" className="w-6 h-6" />
                  <span className="text-sm text-[var(--pv-neutral-grey-500)]">Loading dashboard...</span>
                </div>
              </div>
            )}
            <div className="absolute inset-4">
              <iframe
                ref={dashboardIframeRef}
                {...(MOCK_ENABLED ? { srcDoc: mockDoc || "" } : { src: iframeUrl })}
                className="w-full h-full border-none rounded-lg bg-white"
                sandbox="allow-scripts allow-same-origin"
                title={artifact.name}
                onLoad={() => setIframeLoaded(true)}
                onError={() => setIframeError(true)}
              />
            </div>
          </>
        ) : (
          <div className="absolute inset-4 flex items-center justify-center bg-white rounded-lg text-[var(--pv-neutral-grey-500)]">
            No refresh completed yet. Trigger a refresh first.
          </div>
        )}
      </>
    );
  };

  return (
    <div className="h-full w-full flex flex-col bg-[var(--pv-neutral-grey-50)] overflow-hidden">
      <div className="flex items-center justify-between px-6 h-[64px] shrink-0 bg-white border-b border-[var(--pv-neutral-grey-150)]">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigate(basePath)}
            className="text-[16px] leading-[24px] font-medium text-[var(--pv-neutral-grey-500)] hover:text-[var(--pv-neutral-grey-900)] hover:underline transition-colors cursor-pointer"
          >
            Dashboard
          </button>
          <CaretRight size={14} className="text-[var(--pv-neutral-grey-400)] shrink-0" />
          {loading ? (
            <div className="flex items-center gap-2">
              <img src={spinner} alt="loading" className="w-4 h-4" />
              <span className="text-sm text-[var(--pv-neutral-grey-500)]">Loading...</span>
            </div>
          ) : (
            <CCDashboardDropdown
              dashboards={allArtifacts}
              currentDashboard={artifact}
              loading={loading}
              onSelect={handleCloseChat}
            />
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Last updated — icon button with a CSS hover tooltip */}
          {artifact?.latest_run && (
            <span className="relative group flex">
              <Button btnColor="ghost" btnSize="lg" aria-label="Last updated">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d={CLOCK_ICON_PATH} /></svg>
              </Button>
              <span role="tooltip" className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 whitespace-nowrap rounded-md bg-[#2D3044] text-white text-[12px] leading-snug px-2.5 py-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                Last updated: {formatDateTime(artifact.latest_run.refreshed_at, artifact?.tenant_timezone || "UTC")}
              </span>
            </span>
          )}

          {/* Separator */}
          <div className="w-px h-6 bg-[var(--pv-neutral-grey-200)]" />

          {/* Data freshness — opens the Data Freshness popup */}
          <Button btnColor="ghost" btnSize="lg" onClick={() => setShowFreshness(true)} aria-label="Data freshness">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d={STACK_ICON_PATH} /></svg>
            <span>Data freshness</span>
          </Button>

          {isWorkflow && (
            <PvButton variant="secondary" size="lg" label="Find out how" icon={Lightbulb} disabled={loading || !artifact?.latest_run} onClick={handleFindOutHow} />
          )}
          <Tooltip title="Ask Sage AI to analyze this dashboard" placement="bottom">
            <span>
              <PvButton
                variant="primary"
                size="lg"
                label={isStartingChat ? "Starting..." : "Sage (Beta)"}
                icon={Sparkle}
                iconWeight="fill"
                disabled={
                  loading ||
                  isStartingChat ||
                  !artifact?.latest_run ||
                  iframeError ||
                  !iframeLoaded ||
                  !AnalyticsChat
                }
                aria-label="Open Sage AI chat"
                onClick={handleStartChat}
              />
            </span>
          </Tooltip>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative bg-[var(--pv-neutral-grey-50)]">{renderContent()}</div>

      {/* Sync Details modal — last sync time per connected data source */}
      {showFreshness && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFreshness(false)} />
          <div className="relative w-[660px] max-w-[94vw] max-h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border-t-[3px] border-[var(--pv-primary-500)]">
            <div className="shrink-0 flex items-center justify-between px-5 py-4">
              <h3 className="text-[16px] font-semibold text-[var(--pv-neutral-grey-900)] m-0">Data Freshness</h3>
              <button onClick={() => setShowFreshness(false)} aria-label="Close" className="p-1 rounded-md text-[var(--pv-neutral-grey-500)] hover:text-[var(--pv-neutral-grey-900)] hover:bg-[var(--pv-neutral-grey-100)] bg-transparent border-none cursor-pointer transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 pb-5 overflow-y-auto">
              <div className="rounded-xl border border-[var(--pv-neutral-grey-150)] overflow-hidden">
                <div className="grid grid-cols-[56px_1fr_1fr] bg-[var(--pv-primary-500)]/8 text-[12px] font-semibold text-[var(--pv-neutral-grey-700)]">
                  <div className="px-4 py-2.5">#</div>
                  <div className="px-4 py-2.5">Data Source</div>
                  <div className="px-4 py-2.5">Last Sync Time</div>
                </div>
                {integrations.map((it, i) => (
                  <div key={it.name} className="grid grid-cols-[56px_1fr_1fr] items-center border-t border-[var(--pv-neutral-grey-150)]">
                    <div className="px-4 py-3 text-[13px] text-[var(--pv-neutral-grey-400)]">{i + 1}.</div>
                    <div className="px-4 py-3 flex items-center gap-2.5 min-w-0">
                      {it.logo ? (
                        <img src={it.logo} alt="" className="shrink-0 w-6 h-6 rounded-md object-contain" />
                      ) : (
                        <span className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: it.color }}>{it.name[0]}</span>
                      )}
                      <span className="text-[13px] font-medium text-[var(--pv-neutral-grey-900)] truncate">{it.name}</span>
                    </div>
                    <div className="px-4 py-3 text-[13px]">
                      {it.live ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-green-600">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />Live
                        </span>
                      ) : (
                        <span className="text-[var(--pv-neutral-grey-500)]">{it.synced}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showExplanation && (
        <div className="fixed inset-0 z-50">
          <ClickAwayListener onClickAway={handlePanelClickAway}>
            <div
              className="absolute top-0 right-0 h-full bg-white border-l border-[var(--pv-neutral-grey-150)] shadow-2xl flex flex-col"
              style={{ width: `${panelPercent}%`, animation: "slideInRight 0.25s ease-out" }}
            >
              <div
                onPointerDown={handleResizeStart}
                className={`explanation-panel__resize ${isDraggingPanel ? "explanation-panel__resize--active" : ""}`}
              />

              <div className="flex items-center justify-between h-[64px] px-4 border-b border-[var(--pv-neutral-grey-150)] bg-white shrink-0">
                <div className="flex items-center gap-2 w-full overflow-hidden">
                  <Lightbulb weight="fill" size={22} className="text-[var(--pv-primary-500)] shrink-0" />
                  <span className="font-medium text-[var(--pv-text-primary-text)] whitespace-nowrap">Find out how</span>
                  <span className="text-[var(--pv-neutral-grey-600)]">|</span>
                  <span className="text-[var(--pv-text-primary-text)] truncate">
                    {artifact?.name || explanationData?.workflow_name || "Dashboard"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {Object.values(explanationData?.explanation?.steps || {}).some(s => hasCardContent(s?.card)) && (
                    <div className="inline-flex rounded-md border border-[var(--pv-neutral-grey-150)] overflow-hidden shrink-0">
                      <button
                        onClick={() => setViewMode("summary")}
                        title="Explain"
                        className={`px-2 py-1 text-[11px] font-medium border-none cursor-pointer transition-colors flex items-center ${
                          viewMode === "summary"
                            ? "bg-[var(--pv-primary-500)] text-white"
                            : "bg-white text-[var(--pv-neutral-grey-600)] hover:bg-[var(--pv-neutral-grey-100)]"
                        }`}
                      >
                        <TextAlignLeft size={13} />
                      </button>
                      <button
                        onClick={() => setViewMode("card")}
                        title="Inspect"
                        className={`px-2 py-1 text-[11px] font-medium border-none cursor-pointer transition-colors flex items-center ${
                          viewMode === "card"
                            ? "bg-[var(--pv-primary-500)] text-white"
                            : "bg-white text-[var(--pv-neutral-grey-600)] hover:bg-[var(--pv-neutral-grey-100)]"
                        }`}
                      >
                        <ListDashes size={13} />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => setShowExplanation(false)}
                    className="p-1.5 rounded-md hover:bg-[var(--pv-neutral-grey-100)] text-[var(--pv-neutral-grey-500)] bg-transparent border-none cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                {explanationLoading && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <img src={spinner} alt="loading" className="w-5 h-5" />
                    <span className="text-sm text-[var(--pv-neutral-grey-500)]">Loading explanation...</span>
                  </div>
                )}

                {!explanationLoading && !explanationData?.explanation && (
                  <div className="text-center py-12 text-sm text-[var(--pv-neutral-grey-500)]">
                    No explanation available.
                  </div>
                )}

                {!explanationLoading && explanationData?.explanation && (
                  <>
                    <ExplanationSteps
                      explanation={explanationData.explanation}
                      blockMeta={explanationData.block_meta || {}}
                      expandedSteps={expandedSteps}
                      showCode={showCode}
                      toggleStep={toggleStep}
                      toggleCode={toggleCode}
                      viewMode={viewMode}
                    />
                    <div className="mt-6 pt-4 border-t border-[var(--pv-neutral-grey-150)] text-center">
                      <button
                        onClick={() => { setShowExplanation(false); handleStartChat(); }}
                        className="inline-flex items-center gap-1.5 text-[13px] text-[var(--pv-primary-500)] hover:underline bg-transparent border-none cursor-pointer"
                      >
                        <Sparkle size={14} />
                        Want to know more? Ask Sage
                      </button>
                    </div>
                  </>
                )}
              </div>

              {isDraggingPanel && <div className="absolute inset-0 z-50 cursor-col-resize" />}
            </div>
          </ClickAwayListener>
        </div>
      )}

      {artifact && ChatOverlay && (
        <ChatOverlay
          isOpen={chatOpen}
          onClose={handleCloseChat}
          title={`Chat: ${artifact.name}`}
          connectionStatus={connectionStatus}
        >
          {chatSessionId && AnalyticsChat && (
            <AnalyticsChat
              externalQueryClient={queryClient}
              sessionId={chatSessionId}
              apiUrl={config.apiUrl}
              authToken={authToken}
              pusherKey={config.pusherKey}
              pusherCluster={config.pusherCluster}
              timezone={artifact?.tenant_timezone || "UTC"}
              onError={(err) => console.error("[CCDashboardViewer] Chat error:", err)}
              onConnectionStatusChange={setConnectionStatus}
              onArtifactApiReady={handleArtifactApiReady}
              // readOnly={!isLatestSession} // All sessions are now resumable
              initialInputValue={chatInputValue}
              onInputChange={handleInputChange}
              leftSlot={
                ChatHistoryButton && (
                  <ChatHistoryButton
                    dashboardId={getDashboardId(artifact)}
                    currentSessionId={chatSessionId}
                    onSessionClick={handleSessionClick}
                    onNewSession={handleNewSession}
                    isCreatingSession={isCreatingNewSession}
                    useGetDashboardSessions={useGetDashboardSessions}
                  />
                )
              }
              filesTraySlot={
                FilesTrayButton && (
                  <FilesTrayButton
                    sessionId={chatSessionId}
                    onFileClick={handleFileClick}
                    WorkspaceTray={WorkspaceTray}
                    useGetWorkspaceFiles={useGetWorkspaceFiles}
                  />
                )
              }
            />
          )}
        </ChatOverlay>
      )}
    </div>
  );
};
