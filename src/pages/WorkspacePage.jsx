import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { useSessionContext } from "../contexts/SessionContext";
import { apiGet, apiPost } from "../api";
import Header from "../components/Header";
import { ChatArea, InputArea, ArtifactPanel, WorkspaceTray } from "../components/sessions";
import ChatSkeleton from "../components/sessions/components/ChatSkeleton";
import "../components/sessions/styles.css";
import WorkflowCreateModal from "../components/WorkflowCreateModal";
import ScheduleFormModal from "../components/ScheduleFormModal";
import useSessionPanelStore from "../stores/useSessionPanelStore";

const FILES_MIN = 200;
const FILES_MAX = 320;
const RESIZE_WIDTH = 8;
const PANEL_MAX_PERCENT_TRAY_CLOSED = 0.8;
const PANEL_MAX_PERCENT_TRAY_OPEN = 0.85;

export default function WorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);
  const { session, connectionStatus, isThinking, artifact, tray, handleFileClick, renameSession } = useSessionContext();

  const [workflowTarget, setWorkflowTarget] = useState(null);
  const [workflowAiMode, setWorkflowAiMode] = useState(false);
  const [scheduleFormPrompt, setScheduleFormPrompt] = useState(null);
  const [scheduleTargets, setScheduleTargets] = useState([]);
  const resumeAttemptedFor = useRef(null);

  const { filesWidth, artifactWidth, setFilesWidth, setArtifactWidth } = useSessionPanelStore(
    useShallow((state) => ({
      filesWidth: state.filesWidth,
      artifactWidth: state.artifactWidth,
      setFilesWidth: state.setFilesWidth,
      setArtifactWidth: state.setArtifactWidth
    }))
  );
  const [dragging, setDragging] = useState(null);
  const prevTrayOpen = useRef(tray.isOpen);

  useEffect(() => {
    if (!id) return;
    if (session.sessionId === id) return;
    if (resumeAttemptedFor.current === id) return;
    resumeAttemptedFor.current = id;
    session.resumeSession(id).catch(() => {
      navigate("/", { replace: true });
    });
  }, [id, session.sessionId]);

  const pendingMessage = useRef(location.state?.initialMessage || null);
  const pendingFiles = useRef(location.state?.initialFiles || null);
  useEffect(() => {
    if (!pendingMessage.current && !pendingFiles.current) return;
    if (session.sessionId !== id) return;
    if (session.status !== "active") return;
    const msg = pendingMessage.current;
    const files = pendingFiles.current;
    pendingMessage.current = null;
    pendingFiles.current = null;
    window.history.replaceState({}, "", location.pathname);
    session.sendMessage(msg || "", files || []);
  }, [session.sessionId, session.status, id]);

  // Skill-run → regular handoff lands here with `openArtifact` in route
  // state: descriptor of the dashboard / memo the skill produced. We
  // open it in the artifact panel as soon as the session reaches
  // `active`, then clear so a refresh doesn't re-open it.
  // If `openVerifyPublish: true` is also set in state (V&P button on the
  // skill-run page), we ALSO request the V&P modal to auto-open once the
  // dashboard tab is active — ArtifactPanel handles the runtime check.
  const pendingArtifact = useRef(location.state?.openArtifact || null);
  const pendingVerifyPublish = useRef(!!location.state?.openVerifyPublish);
  useEffect(() => {
    if (!pendingArtifact.current && !pendingVerifyPublish.current) return;
    if (session.sessionId !== id) return;
    if (session.status !== "active") return;
    const desc = pendingArtifact.current;
    const wantVP = pendingVerifyPublish.current;
    pendingArtifact.current = null;
    pendingVerifyPublish.current = false;
    window.history.replaceState({}, "", location.pathname);
    if (desc) artifact.openArtifact(desc);
    if (wantVP && desc?.path) artifact.requestVerifyPublishOpen(desc.path);
  }, [session.sessionId, session.status, id, artifact]);

  const handleSchedulePrompt = useCallback(
    async (prompt) => {
      if (session.sessionId) {
        try {
          const data = await apiGet(`/api/sessions/${session.sessionId}/recipe/targets`);
          setScheduleTargets(data.targets || []);
        } catch {
          toast.error("Failed to load recipe targets");
          setScheduleTargets([]);
        }
      }
      setScheduleFormPrompt(prompt);
    },
    [session.sessionId]
  );

  const handleScheduleSave = useCallback(
    async (body) => {
      if (session.sessionId) {
        body.source_session_id = session.sessionId;
      }
      await apiPost("/api/schedules", body);
      setScheduleFormPrompt(null);
      setScheduleTargets([]);
    },
    [session.sessionId]
  );

  const handleDeleteLastMessage = useCallback(async () => {
    const result = await session.deleteLastMessage();
    if (result?.isEmpty) {
      navigate("/", { replace: true });
    }
  }, [session.deleteLastMessage, navigate]);

  const onFilesResizeStart = useCallback(
    (e) => {
      e.preventDefault();
      setDragging("files");
      const startX = e.clientX;
      const startWidth = filesWidth;
      let rafId = null;

      const onMove = (ev) => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          const delta = ev.clientX - startX;
          const newWidth = Math.min(FILES_MAX, Math.max(FILES_MIN, startWidth + delta));
          setFilesWidth(newWidth);
        });
      };

      const onUp = () => {
        if (rafId) cancelAnimationFrame(rafId);
        setDragging(null);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [filesWidth, setFilesWidth]
  );

  const onArtifactResizeStart = useCallback(
    (e) => {
      e.preventDefault();
      setDragging("artifact");
      const startX = e.clientX;
      const startWidth = artifactWidth;
      const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
      const currentFilesWidth = tray.isOpen ? filesWidth : 0;
      const availableWidth = containerWidth - currentFilesWidth - RESIZE_WIDTH;
      const minArtifact = availableWidth * 0.15;
      const maxArtifact = availableWidth * 0.85;
      let rafId = null;

      const onMove = (ev) => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          const delta = ev.clientX - startX;
          const newWidth = Math.min(maxArtifact, Math.max(minArtifact, startWidth - delta));
          setArtifactWidth(newWidth);
        });
      };

      const onUp = () => {
        if (rafId) cancelAnimationFrame(rafId);
        setDragging(null);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [artifactWidth, filesWidth, tray.isOpen, setArtifactWidth]
  );

  useEffect(() => {
    if (!artifact.isOpen) {
      prevTrayOpen.current = tray.isOpen;
      return;
    }
    const containerWidth = containerRef.current?.offsetWidth;
    if (!containerWidth) {
      prevTrayOpen.current = tray.isOpen;
      return;
    }
    if (prevTrayOpen.current === tray.isOpen) return;

    const wasOpen = prevTrayOpen.current;
    const isOpen = tray.isOpen;

    const oldAvailable = wasOpen ? containerWidth - filesWidth - RESIZE_WIDTH * 2 : containerWidth - RESIZE_WIDTH;
    const newAvailable = isOpen ? containerWidth - filesWidth - RESIZE_WIDTH * 2 : containerWidth - RESIZE_WIDTH;

    const maxPercent = isOpen ? PANEL_MAX_PERCENT_TRAY_OPEN : PANEL_MAX_PERCENT_TRAY_CLOSED;
    const minPercent = 1 - maxPercent;

    const ratio = artifactWidth / oldAvailable;
    let newWidth = ratio * newAvailable;
    newWidth = Math.min(newAvailable * maxPercent, Math.max(newAvailable * minPercent, newWidth));
    setArtifactWidth(newWidth);

    prevTrayOpen.current = tray.isOpen;
  }, [tray.isOpen, artifact.isOpen, filesWidth, artifactWidth, setArtifactWidth]);

  const isIdle = session.status === "idle";
  const activeFilePath = artifact.activeTab?.path || null;

  if (isIdle && id && session.sessionId !== id) {
    return <ChatSkeleton showHeader />;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        sessionId={session.sessionId}
        sessionName={session.sessionName}
        onRenameSession={renameSession}
        isThinking={isThinking}
        isCompacting={session.isCompacting}
        totalTokens={session.totalTokens}
        contextThreshold={session.contextThreshold}
        contextUsagePercent={session.contextUsagePercent}
        filesOpen={tray.isOpen}
        onToggleFiles={tray.toggleOpen}
        artifactOpen={artifact.isOpen}
        onToggleArtifact={artifact.togglePanel}
      />

      <div className="session-panels" ref={containerRef}>
        {dragging && <div className="session-panels__drag-shield" />}

        {tray.isOpen && (
          <>
            <div className="session-panels__files" style={{ flexBasis: filesWidth }}>
              <WorkspaceTray
                fileTree={tray.fileTree}
                expandedDirs={tray.expandedDirs}
                loading={tray.loading}
                searchQuery={tray.searchQuery}
                activeFilePath={activeFilePath}
                onToggleDir={tray.toggleDir}
                onFileClick={handleFileClick}
                onSearchChange={tray.setSearchQuery}
                onRefresh={() => tray.fetchFiles(session.sessionId)}
                onClose={tray.close}
              />
            </div>

            <div
              className={`session-panels__resize${dragging === "files" ? " session-panels__resize--active" : ""}`}
              onMouseDown={onFilesResizeStart}
            />
          </>
        )}

        <div className="session-panels__chat-wrapper scrollbar-hide">
          <div className="session-panels__chat">
            <ChatArea
              messages={session.messages}
              sessionId={session.sessionId}
              urlSessionId={id}
              isResumed={session.isResumed}
              onOpenArtifact={artifact.openArtifact}
              onDeleteLastMessage={handleDeleteLastMessage}
              isThinking={isThinking}
              isCompacting={session.isCompacting}
              onSend={session.sendMessage}
              disabled={isIdle || isThinking}
              onOpenWidgetChat={artifact.openWidgetLineage}
              suggestedQuestions={session.suggestedQuestions}
            />

            {session.messages.length > 0 && (
              <InputArea
                onSend={session.sendMessage}
                onCancel={session.cancelTurn}
                disabled={isIdle || isThinking}
                isThinking={isThinking}
                connectionStatus={connectionStatus}
                sessionId={id}
              />
            )}
          </div>
        </div>

        {artifact.isOpen && (
          <>
            <div
              className={`session-panels__resize${dragging === "artifact" ? " session-panels__resize--active" : ""}`}
              onMouseDown={onArtifactResizeStart}
            />

            <div className="session-panels__artifact" style={{ flexBasis: artifactWidth }}>
              <div className="session-panels__artifact-wrapper scrollbar-hide">
                <ArtifactPanel
                  tabs={artifact.tabs}
                  activeTabId={artifact.activeTabId}
                  activeTab={artifact.activeTab}
                  sessionId={session.sessionId}
                  onSelectTab={artifact.setActiveTab}
                  onCloseTab={artifact.closeTab}
                  onClose={artifact.closePanel}
                  onCreateWorkflow={
                    session.sessionType === "regular"
                      ? (path, title) => {
                          setWorkflowTarget({ path, title });
                          setWorkflowAiMode(false);
                        }
                      : undefined
                  }
                  onCreateWorkflowAi={
                    session.sessionType === "regular"
                      ? (path, title) => {
                          setWorkflowTarget({ path, title });
                          setWorkflowAiMode(true);
                        }
                      : undefined
                  }
                  onSendFeedback={(text, widgetScope) =>
                    session.sendMessage(text, [], widgetScope ? { widgetScope } : {})
                  }
                  sessionStatus={session.status}
                  openLineageFor={artifact.openLineageFor}
                  consumeOpenLineageFor={artifact.consumeOpenLineageFor}
                  openVerifyPublishFor={artifact.openVerifyPublishFor}
                  consumeOpenVerifyPublishFor={artifact.consumeOpenVerifyPublishFor}
                  liveMessages={session.messages}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {workflowTarget && (
        <WorkflowCreateModal
          targetFile={workflowTarget.path}
          targetTitle={workflowTarget.title}
          sessionId={session.sessionId}
          onClose={() => {
            setWorkflowTarget(null);
            setWorkflowAiMode(false);
          }}
          aiMode={workflowAiMode}
        />
      )}

      {scheduleFormPrompt !== null && (
        <ScheduleFormModal
          schedule={{
            prompt: scheduleFormPrompt,
            dashboard_id: session.dashboardId || "",
            name: "",
            cron_expression: "0 9 * * 1",
            timezone: "UTC",
            recipients: []
          }}
          prefillDashboardId={session.dashboardId}
          targetFiles={scheduleTargets}
          onSave={handleScheduleSave}
          onClose={() => setScheduleFormPrompt(null)}
        />
      )}
    </div>
  );
}
