import { useLocation, useNavigate } from "react-router-dom";
import { MenuBar } from "./menubar";
import { getCurrentUser } from "../api";
import { MOCK_ENABLED } from "../mocks";

// Navigation items (icon keys map to the MenuBar's Phosphor icon set).
// Canonical nav — identical order/ids in both navbars (see petavue MenuBar) so
// buttons never shift position between pages. Sage + live Dashboard open the
// live app; the rest open the Petavue design-system pages.
export const NAV_ITEMS = [
  { id: "skills", label: "Skills", icon: "skills" },
  { id: "workflows", label: "Workflows", icon: "workflows" },
  { id: "goals", label: "Goals", icon: "goals" },
  { id: "dashboard-live", label: "Dashboard", icon: "dashboard" },
  { id: "data-hub", label: "Data Hub", icon: "data-hub" },
];

export const NAV_ROUTES = {
  new: "/new",
  "dashboard-live": "/dashboards",
  "dashboards-pv": "/petavue/dashboards",
  "data-hub": "/petavue/data-hub",
  skills: "/skills",
  goals: "/goals",
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
  // Chat sessions and the Create-New page are reached from the "Create New"
  // button, so no nav item is highlighted there.
  const { pathname } = location;
  const isChatRoute = pathname.startsWith("/sage") || pathname.startsWith("/session");
  // Prefer the longest matching route so nested paths (e.g. /skills/:id)
  // highlight the deeper item (Skills). The bare /new page matches nothing → no
  // highlight, which is what we want for the Create-New page.
  const activeId = isChatRoute
    ? null
    : NAV_ITEMS
        .filter((item) => { const r = NAV_ROUTES[item.id]; return r && pathname.startsWith(r); })
        .sort((a, b) => NAV_ROUTES[b.id].length - NAV_ROUTES[a.id].length)[0]?.id || null;

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
        onNewChat={() => navigate("/new")}
        onProfile={() => navigate("/petavue/profile")}
        onSettings={() => navigate("/petavue/settings")}
        defaultOpen={false}
      />
    </div>
  );
}
