import { useLocation, useNavigate } from "react-router-dom";
import { MenuBar } from "./menubar";
import { getCurrentUser } from "../api";
import { MOCK_ENABLED } from "../mocks";

// Navigation items (icon keys map to the MenuBar's Phosphor icon set).
// Canonical nav — identical order/ids in both navbars (see petavue MenuBar) so
// buttons never shift position between pages. Sage + live Dashboard open the
// live app; the rest open the Petavue design-system pages.
export const NAV_ITEMS = [
  { id: "home", label: "Home", icon: "home" },
  { id: "chats", label: "Workbook", icon: "chats" },
  { id: "workflows", label: "Workflows", icon: "workflows" },
  { id: "dashboard-live", label: "Dashboard", icon: "dashboard" },
  { id: "reports", label: "Reports", icon: "reports" },
  { id: "data-hub", label: "Data Hub", icon: "data-hub" },
  { id: "skills", label: "Skills", icon: "skills" },
  { id: "project", label: "Projects", icon: "project" },
];

export const NAV_ROUTES = {
  home: "/home",
  chats: "/petavue/workbooks",
  "dashboard-live": "/dashboards",
  "dashboards-pv": "/petavue/dashboards",
  reports: "/petavue/reports",
  "data-hub": "/petavue/data-hub",
  skills: "/petavue/skills",
  project: "/petavue/projects",
  workflows: "/workflows",
  settings: "/petavue/settings",
};

export default function MenuBarNav() {
  const currentUser = getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const name = currentUser?.name || currentUser?.username || "User";
  const initials =
    name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  const user = { name, initials, email: currentUser?.email || "" };

  // Navigate when a nav item maps to a route; otherwise it's a no-op.
  const handleItemClick = (id) => {
    const route = NAV_ROUTES[id];
    if (route) navigate(route);
  };

  // Highlight the section matching the current path. Chat routes (Sage
  // sessions) are reached from Home, so keep Home active while in a chat.
  const { pathname } = location;
  const isChatRoute = pathname.startsWith("/sage") || pathname.startsWith("/session");
  const activeId = isChatRoute
    ? "home"
    : NAV_ITEMS.find((item) => {
        const route = NAV_ROUTES[item.id];
        return route && pathname.startsWith(route);
      })?.id || null;

  // Only the first (real) chat opens the live session; the rest are display-only.
  const historyGroups = MOCK_ENABLED
    ? [
        {
          label: "Today",
          items: [{ id: "q2-revenue-dashboard", title: "Q2 Revenue Dashboard", time: "now", clickable: true }],
        },
        {
          label: "Yesterday",
          items: [
            { id: "h-pipeline-q3", title: "Pipeline coverage for Q3", time: "1d" },
            { id: "h-roas-drop", title: "Why did ROAS drop last week?", time: "1d" },
          ],
        },
        {
          label: "Previous 7 Days",
          items: [
            { id: "h-at-risk", title: "Top at-risk enterprise accounts", time: "3d" },
            { id: "h-mktg-pipeline", title: "Marketing-sourced pipeline review", time: "5d" },
            { id: "h-sdr-conv", title: "SDR conversion by segment", time: "6d" },
          ],
        },
        {
          label: "Previous 30 Days",
          items: [
            { id: "h-channel-roas", title: "Channel ROAS vs target", time: "12d" },
            { id: "h-nrr-cohort", title: "Net revenue retention by cohort", time: "18d" },
            { id: "h-lead-source", title: "Lead source effectiveness", time: "24d" },
          ],
        },
      ]
    : [];

  const handleHistoryClick = (id) => navigate(`/sage/${id}`);

  return (
    <div className="shrink-0 h-screen">
      <MenuBar
        items={NAV_ITEMS}
        activeId={activeId}
        onItemClick={handleItemClick}
        onHistoryItemClick={handleHistoryClick}
        historyGroups={historyGroups}
        user={user}
        onNewChat={() => navigate("/home")}
        onProfile={() => navigate("/petavue/profile")}
        onSettings={() => navigate("/petavue/settings")}
        defaultOpen={false}
      />
    </div>
  );
}
