import { useLocation, useNavigate } from "react-router-dom";
import { MenuBar } from "./menubar";
import { getCurrentUser } from "../api";
import { MOCK_ENABLED } from "../mocks";

// Navigation items (icon keys map to the MenuBar's Phosphor icon set).
// Canonical nav — identical order/ids in both navbars (see petavue MenuBar) so
// buttons never shift position between pages. Sage + live Dashboard open the
// live app; the rest open the Petavue design-system pages.
export const NAV_ITEMS = [
  { id: "sage", label: "Sage", icon: "sage" },
  { id: "chats", label: "Workbook", icon: "chats" },
  { id: "dashboard-live", label: "Dashboard", icon: "dashboard" },
  { id: "dashboards-pv", label: "Dashboard", icon: "grid" },
  { id: "reports", label: "Reports", icon: "reports" },
  { id: "data-hub", label: "Data Hub", icon: "data-hub" },
  { id: "skills", label: "Skills", icon: "skills" },
  { id: "project", label: "Projects", icon: "project" },
];

export const NAV_ROUTES = {
  sage: "/sage/q2-revenue-dashboard",
  chats: "/petavue/workbooks",
  "dashboard-live": "/dashboards",
  "dashboards-pv": "/petavue/dashboards",
  reports: "/petavue/reports",
  "data-hub": "/petavue/data-hub",
  skills: "/petavue/skills",
  project: "/petavue/projects",
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

  // Highlight the section matching the current path.
  const activeId =
    NAV_ITEMS.find((item) => {
      const route = NAV_ROUTES[item.id];
      return route && location.pathname.startsWith(route);
    })?.id || null;

  const historyGroups = MOCK_ENABLED
    ? [{ label: "Today", items: [{ id: "q2-revenue-dashboard", title: "Q2 Revenue Dashboard", time: "now" }] }]
    : [];

  return (
    <div className="shrink-0 h-screen">
      <MenuBar
        items={NAV_ITEMS}
        activeId={activeId}
        onItemClick={handleItemClick}
        historyGroups={historyGroups}
        user={user}
        onNewChat={() => {}}
        onProfile={() => navigate("/petavue/profile")}
        onSettings={() => navigate("/petavue/settings")}
        defaultOpen={false}
      />
    </div>
  );
}
