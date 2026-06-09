import { MenuBar } from "./menubar";
import { getCurrentUser } from "../api";
import { MOCK_ENABLED } from "../mocks";

// Navigation items (icon keys map to the MenuBar's Phosphor icon set).
const NAV_ITEMS = [
  { id: "chats", label: "Workbook", icon: "chats" },
  { id: "dashboards", label: "Dashboards", icon: "dashboard" },
  { id: "workflows", label: "Workflows", icon: "project" },
  { id: "reports", label: "Reports", icon: "reports" },
  { id: "data-hub", label: "Data Hub", icon: "data-hub" },
  { id: "skills", label: "Skills", icon: "skills" },
  { id: "settings", label: "Settings", icon: "settings" },
];

export default function MenuBarNav() {
  const currentUser = getCurrentUser();
  const name = currentUser?.name || currentUser?.username || "User";
  const initials =
    name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  const user = { name, initials, email: currentUser?.email || "" };

  // Frontend-only mode: nav items are visual only (no navigation), keeping the
  // focus on the Verify & Publish screen. Handlers are left as no-ops.
  const noop = () => {};

  const historyGroups = MOCK_ENABLED
    ? [{ label: "Today", items: [{ id: "sess-dash-1", title: "Q2 Revenue Dashboard", time: "now" }] }]
    : [];

  return (
    <div className="shrink-0 h-screen">
      <MenuBar
        items={NAV_ITEMS}
        activeId={null}
        onItemClick={noop}
        historyGroups={historyGroups}
        user={user}
        onNewChat={noop}
        defaultOpen
      />
    </div>
  );
}
