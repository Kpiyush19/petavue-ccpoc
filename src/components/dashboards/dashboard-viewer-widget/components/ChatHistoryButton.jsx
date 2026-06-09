import { useState } from "react";
import { ClickAwayListener, Fade, Popper } from "@mui/material";
import { ClockCounterClockwise, Circle, Plus } from "@phosphor-icons/react";
import { Button } from "@/common-components";
import spinner from "@/common-components/assets/spinner.gif";

export default function ChatHistoryButton({
  dashboardId,
  currentSessionId,
  onSessionClick,
  onNewSession,
  isCreatingSession = false,
  useGetDashboardSessions,
  sessions: propSessions,
  isLoading: propIsLoading,
  loadingImageSrc = spinner
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const hookResult = useGetDashboardSessions?.(dashboardId, {
    enabled: !!dashboardId
  });

  const sessionsData = hookResult?.data ?? propSessions;
  const isLoading = hookResult?.isLoading ?? propIsLoading ?? false;

  const allSessions = sessionsData?.sessions || sessionsData || [];
  const sessions = allSessions.filter((s) => s.session_type !== "pre_publish_verify");

  const handleClick = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleClose = (event) => {
    if (isCreatingSession) return;
    if (event?.target?.closest(".analytics-chat__artifact-overlay")) {
      return;
    }
    setAnchorEl(null);
  };

  const handleSessionClick = (session, index) => {
    onSessionClick?.(session, index === 0);
    setAnchorEl(null);
  };

  const handleNewSession = async () => {
    const newSessionId = await onNewSession?.();
    if (newSessionId) {
      await hookResult?.refetch?.();
      setAnchorEl(null);
    }
  };

  const formatSessionLabel = (session) => {
    const timestamp = session.created_at;
    const sessionType = session.session_type;

    let prefix = "Session";
    // if (sessionType === 'scheduled') {
    //   prefix = 'Dashboard Q&A';
    // } else if (sessionType === 'workflow_chat') {
    //   prefix = 'Workflow';
    // }

    if (!timestamp) return prefix;

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      if (diffDays === 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours === 0) {
          const diffMins = Math.floor(diffMs / (1000 * 60));
          return `${prefix} ${diffMins}m ago`;
        }
        return `${prefix} ${diffHours}h ago`;
      }
      return `${prefix} ${diffDays}d ago`;
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${prefix} ${day}/${month}/${year}`;
  };

  return (
    <>
      <Button onClick={handleClick} btnColor="ghost" btnSize="sm">
        <ClockCounterClockwise size={14} weight={open ? "fill" : "regular"} />
        Sessions
      </Button>

      <Popper open={open} anchorEl={anchorEl} transition placement="top-end" disablePortal style={{ zIndex: 5 }}>
        {({ TransitionProps }) => (
          <ClickAwayListener onClickAway={handleClose}>
            <Fade {...TransitionProps} timeout={200}>
              <div
                className="bg-white rounded-lg shadow-lg border border-pv-neutral-grey-200 overflow-hidden"
                style={{ width: 300, maxHeight: 400 }}
                data-theme="light"
              >
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border-primary)]">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.12em]">
                      Sessions
                    </span>
                    {sessions.length > 0 && (
                      <span className="text-[9px] text-[var(--text-muted)] bg-[var(--bg-hover)] rounded-full px-1.5 py-px font-mono">
                        {sessions.length}
                      </span>
                    )}
                  </div>
                  {onNewSession && (
                    <Button
                      btnColor="ghost"
                      btnSize="sm"
                      onClick={handleNewSession}
                      disabled={isCreatingSession}
                      mainBtnClassName="!px-2 !py-1"
                    >
                      <Plus size={12} weight="bold" />
                      <span className="text-[11px]">{isCreatingSession ? "Creating..." : "New"}</span>
                    </Button>
                  )}
                </div>

                <div className="overflow-y-auto" style={{ maxHeight: 340 }}>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <img src={loadingImageSrc} alt="loading" className="w-5 h-5" />
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-pv-text-secondary-text">No past sessions</div>
                  ) : (
                    <div className="py-1 px-1.5">
                      {sessions.map((session, index) => {
                        const isCurrent = session.session_id === currentSessionId;
                        const hasMessages = session.turn_count > 0;
                        return (
                          <button
                            key={session.session_id}
                            onClick={() => handleSessionClick(session, index)}
                            className={`group w-full px-3 py-2 text-left rounded-lg border-none cursor-pointer hover:bg-pv-neutral-grey-50 active:bg-white ${isCurrent ? "bg-pv-neutral-grey-50" : "bg-transparent"}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[13px] font-medium truncate text-black group-active:text-pv-neutral-grey-600">
                                {formatSessionLabel(session)}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {session.agent_running && (
                                  <Circle size={8} weight="fill" className="text-green-500 animate-pulse" />
                                )}
                                {isCurrent && (
                                  <span className="text-[10px] font-medium bg-pv-tags-blue border border-pv-neutral-grey-300 px-1.5 py-0.5 rounded-md">
                                    Current
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-[11px] text-black group-active:text-pv-neutral-grey-600 mt-0.5">
                              {hasMessages
                                ? `${session.turn_count} ${session.turn_count === 1 ? "message" : "messages"}`
                                : "No messages yet"}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </Fade>
          </ClickAwayListener>
        )}
      </Popper>
    </>
  );
}
