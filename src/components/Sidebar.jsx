import { useState, useEffect, useCallback } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ClickAwayListener } from "@mui/material";
import {
  House,
  ChartBar,
  TreeStructure,
  Lightning,
  Database,
  Gear,
  SignOut,
  Plus,
  ChatCircle,
  SidebarSimple,
  ClockCounterClockwise,
  Flask,
} from "@phosphor-icons/react";
import { Button, Skeleton } from "@/common-components";
import { getCurrentUser } from "../api";
import { MOCK_ENABLED } from "../mocks";
import { useAuth } from "../providers/auth";
import { useFeatureFlagEnabled } from "../providers/posthog";
import { cn } from "../utils/cn";
import { getSessionRowMeta, badgeDotClassname } from "./sessions/sessionRowMeta";
import { useSessionContext } from "../contexts/SessionContext";
import { useSessionsQuery } from "../hooks/useSessionsQuery";
import { timeAgo } from "@/common-utils/relativeTimeDiff";

const STORAGE_KEY = "sidebar_state";

const NAV_ITEMS = [
  { to: "/home", icon: House, label: "Home", petavueOnly: true, requiresFlag: "ccpoc-home" },
  { to: "/dashboards", icon: ChartBar, label: "Dashboards" },
  { to: "/workflows", icon: TreeStructure, label: "Workflows", petavueOnly: true },
  { to: "/skills", icon: Lightning, label: "Skills", petavueOnly: true },
  { to: "/data-hub", icon: Database, label: "Data Hub" },
  { to: "/petavue/settings", icon: Gear, label: "Settings" }
];

function getInitialState() {
  return localStorage.getItem(STORAGE_KEY) || "rail";
}

export default function Sidebar() {
  const [state, setState] = useState(getInitialState);
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const { logout } = useAuth();
  const { session } = useSessionContext();
  const { data: sessionList = [], isLoading: sessionListLoading } = useSessionsQuery();
  const homeEnabled = useFeatureFlagEnabled("ccpoc-home");

  const isPetavueUser = (currentUser?.email || "").includes("@petavue.com");
  const filteredNavItems = NAV_ITEMS.filter((item) => {
    // Frontend-only mode: show every nav icon, but they're non-clickable
    // (see the nav render below) so the screen stays on Verify & Publish.
    if (MOCK_ENABLED) return true;
    if (item.petavueOnly && !isPetavueUser) return false;
    if (item.requiresFlag === "ccpoc-home" && homeEnabled !== true) return false;
    return true;
  });

  const isWorkspace = location.pathname.startsWith("/session/");
  useEffect(() => {
    if (isWorkspace && state === "expanded") {
      setState("rail");
    }
  }, [isWorkspace]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setState("rail");
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, state);
  }, [state]);

  const toggleState = useCallback(() => {
    setState((prev) => (prev === "expanded" ? "rail" : "expanded"));
  }, []);

  const handleClickAway = useCallback(() => {
    if (state === "expanded") {
      setState("rail");
    }
  }, [state]);

  const handleLogout = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    await logout();
  }, [logout]);

  const handleNewChat = useCallback(() => {
    setState("rail");
    session.goHome();
    navigate(homeEnabled === true ? "/home" : "/");
  }, [session, navigate, homeEnabled]);

  const handleSelectSession = useCallback(
    (route) => {
      setState("rail");
      navigate(route);
    },
    [navigate]
  );

  if (state === "hidden") return null;

  const isRail = state === "rail";
  const width = isRail ? 52 : 260;

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <div className="relative h-full w-[52px] shrink-0">
        <aside
          className="absolute inset-0 border-r border-[var(--border-primary)] bg-[var(--bg-surface)] flex flex-col transition-[width] duration-200 z-40"
          style={{ width }}
        >
          <div className={cn("h-14 flex items-center shrink-0", isRail ? "justify-center" : "px-3 justify-between")}>
            {isRail ? (
              <Button btnColor="ghost" btnSize="md" onClick={toggleState} aria-label="Expand sidebar">
                <SidebarSimple size={18} />
              </Button>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <img src="/petavue-logo.svg" alt="Petavue" className="w-6 h-7 shrink-0" />
                  <span
                    className="text-[15px] font-semibold tracking-[-0.02em]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <span className="text-[var(--text-primary)]">Petavue</span>
                  </span>
                </div>
                <Button btnColor="ghost" btnSize="sm" onClick={toggleState} aria-label="Collapse sidebar">
                  <SidebarSimple size={16} weight="fill" />
                </Button>
              </>
            )}
          </div>

          <div className={cn("px-2 mb-1", isRail && "px-1.5")}>
            {isRail ? (
              <div className="group relative">
                <Button btnColor="ghost" btnSize="md" onClick={handleNewChat} aria-label="New chat">
                  <Plus size={16} />
                </Button>
                <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] shadow-float text-xs font-medium text-[var(--text-primary)] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  New chat
                </div>
              </div>
            ) : (
              <Button btnColor="secondary ghost" btnSize="md" onClick={handleNewChat}>
                <Plus size={16} />
                <span className="text-[13px] font-medium">New chat</span>
              </Button>
            )}
          </div>

          <nav className={cn("py-1.5 flex flex-col gap-0.5", isRail ? "px-1.5" : "px-2")}>
            {filteredNavItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={(e) => {
                  // Frontend-only mode: icons are visual only, not clickable.
                  if (MOCK_ENABLED) { e.preventDefault(); return; }
                  setState("rail");
                }}
                aria-disabled={MOCK_ENABLED || undefined}
                tabIndex={MOCK_ENABLED ? -1 : undefined}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 rounded-lg transition-colors duration-150 group relative",
                    isRail ? "w-10 h-10 justify-center mx-auto" : "h-9 px-3",
                    MOCK_ENABLED && "cursor-default opacity-55 hover:bg-transparent",
                    isActive && !MOCK_ENABLED
                      ? "bg-[var(--pv-primary-100)] text-[var(--pv-primary-500)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} weight={isActive ? "fill" : "regular"} className="shrink-0" />
                    {!isRail && <span className="text-[13px] font-medium whitespace-nowrap">{label}</span>}
                    {isRail && (
                      <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] shadow-float text-xs font-medium text-[var(--text-primary)] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                        {label}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {!isRail && (
            <div className="flex-1 flex flex-col min-h-0 my-2">
              <div className="px-4 py-1.5">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Recents
                </span>
              </div>
              <div className="flex-1 overflow-y-auto px-2">
                {sessionListLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2 px-2.5 py-2">
                      <Skeleton width={14} height={14} className="rounded shrink-0" />
                      <Skeleton width={`${65 + (i % 3) * 15}%`} height={12} className="rounded" />
                    </div>
                  ))
                ) : (
                  <>
                    {sessionList.slice(0, 20).map((s) => {
                      const meta = getSessionRowMeta(s);
                      const isActive = location.pathname === meta.route;
                      const IconComp = meta.isSkillRun ? Flask : ChatCircle;
                      const iconColor = meta.iconMuted
                        ? "text-[var(--pv-text-disabled)]"
                        : "text-[var(--text-muted)]";
                      const titleHint = meta.badge?.ariaLabel
                        ? `${s.name || "Session"}, ${meta.badge.ariaLabel}`
                        : (s.name || undefined);
                      return (
                        <a
                          key={s.session_id}
                          href={meta.route}
                          onClick={(e) => {
                            e.preventDefault();
                            handleSelectSession(meta.route);
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left cursor-pointer transition-colors no-underline",
                            isActive
                              ? "bg-[var(--bg-hover)] text-[var(--text-primary)]"
                              : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                          )}
                          title={titleHint}
                        >
                          <span className="relative shrink-0 flex items-center">
                            <IconComp
                              size={14}
                              className={cn(iconColor, "shrink-0")}
                            />
                            {meta.badge && (
                              <span
                                className={cn(
                                  "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-[var(--bg-surface)]",
                                  badgeDotClassname(meta.badge.kind)
                                )}
                                aria-label={meta.badge.ariaLabel}
                              />
                            )}
                          </span>
                          <span className="text-[12px] truncate flex-1">
                            {s.name || `Session ${s.last_active_at ? timeAgo(s.last_active_at) : ""}`}
                          </span>
                        </a>
                      );
                    })}
                    {sessionList.length === 0 && (
                      <div className="px-2.5 py-4 text-[11px] text-[var(--text-muted)]">No recent sessions</div>
                    )}
                  </>
                )}
              </div>
              {sessionList.length > 0 && (
                <div className="shrink-0 px-2 pt-1">
                  <Button
                    btnColor="secondary ghost"
                    btnSize="md"
                    onClick={() => {
                      setState("rail");
                      navigate("/sessions");
                    }}
                  >
                    <ClockCounterClockwise size={14} />
                    <span className="text-[12px]">View all sessions</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {isRail && <button type="button" className="flex-1 cursor-pointer" onClick={toggleState} title="Expand sidebar" aria-label="Expand sidebar" />}

          <div className={cn("shrink-0 border-t border-[var(--border-primary)] py-2", isRail ? "px-1.5" : "px-2")}>
            {currentUser && (
              <div
                className={cn(
                  "flex items-center gap-2.5 rounded-lg",
                  isRail ? "justify-center px-0 py-1.5" : "px-3 py-2"
                )}
              >
                <NavLink
                  to="/my-profile"
                  onClick={() => setState("rail")}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2.5 rounded-lg transition-colors group relative",
                      isRail ? "w-10 h-10 justify-center" : "flex-1 min-w-0 py-1 -my-1",
                      isActive
                        ? "text-[var(--accent)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    )
                  }
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full bg-[var(--accent)]/15 flex items-center justify-center text-xs font-semibold text-[var(--accent)] shrink-0 uppercase"
                    )}
                  >
                    {(currentUser.firstName || currentUser.username || "U")[0]}
                  </div>
                  {!isRail && (
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">
                        {currentUser.firstName || currentUser.username || "User"}
                      </div>
                    </div>
                  )}
                  {isRail && (
                    <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] shadow-float text-xs font-medium text-[var(--text-primary)] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                      My Profile
                    </div>
                  )}
                </NavLink>
                {!isRail && (
                  <Button
                    btnColor="red ghost"
                    btnSize="sm"
                    onClick={handleLogout}
                    aria-label="Logout"
                    mainBtnClassName="p-1"
                  >
                    <SignOut size={14} />
                  </Button>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </ClickAwayListener>
  );
}
