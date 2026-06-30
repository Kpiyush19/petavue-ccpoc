// Router-driven wrapper for the Petavue design-system pages. Mirrors the
// state switcher in src/petavue/App.jsx but drives the page from the URL
// (/petavue/<page>) so each screen is linkable. Self-contained — each Petavue
// page renders its own MenuBar, so this mounts OUTSIDE the app's layout.
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { WorkbookHome } from "./petavue/pages/workbook_home";
import { WorkbookList } from "./petavue/pages/workbook_list";
import { WorkbookChat } from "./petavue/pages/workbook_chat";
import { DashboardList } from "./petavue/pages/dashboard_list";
import { DashboardView } from "./petavue/pages/dashboard_view";
import { ProfilePage } from "./petavue/pages/profile";
import { DataHub } from "./petavue/pages/data_hub";
import { ProjectList } from "./petavue/pages/projects";
import { SettingsPage } from "./petavue/pages/settings";
import { ReportList } from "./petavue/pages/reports";
import { SkillsPage } from "./petavue/pages/skills";

const PREFIX = "/petavue";
const DEFAULT_USER = { name: "Ammie Diego", initials: "AD", email: "ammie.diego@work.com" };

// MenuBar nav id -> URL segment (within /petavue).
const NAV_TO_SEGMENT = {
  chats: "workbooks",
  "dashboards-pv": "dashboards",
  dashboard: "dashboards",
  "data-hub": "data-hub",
  project: "projects",
  reports: "reports",
  skills: "skills",
  "new-chat": "home",
  profile: "profile",
  settings: "settings",
};

export default function PetavueRoutes() {
  const navigate = useNavigate();
  const params = useParams();
  const page = (params["*"] || "home").split("/")[0] || "home";

  const [user] = useState(DEFAULT_USER);
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState("");
  const [activeDashboardId, setActiveDashboardId] = useState(null);

  const go = (segment) => navigate(`${PREFIX}/${segment}`);
  const handleNavigate = (id) => {
    // App-level entries jump out of the Petavue section.
    if (id === "home") return navigate("/home");
    if (id === "dashboard-live") return navigate("/dashboards");
    if (id === "workflows") return navigate("/workflows");
    if (id === "goals") return navigate("/goals");
    go(NAV_TO_SEGMENT[id] || "home");
  };

  const menuProps = { user, onNavigate: handleNavigate, menuOpen, onMenuToggle: setMenuOpen };

  const renderPage = () => {
    switch (page) {
      case "workbooks":
        return (
          <WorkbookList
            {...menuProps}
            page={page}
            onNewWorkbook={() => go("home")}
            onSelectWorkbook={() => { setChatQuery(""); go("chat"); }}
          />
        );
      case "chat":
        return <WorkbookChat {...menuProps} query={chatQuery} onStop={() => go("home")} />;
      case "dashboards":
        return (
          <DashboardList
            {...menuProps}
            onNewDashboard={() => go("dashboards")}
            onOpenDashboard={(id) => { setActiveDashboardId(id); go("dashboard-view"); }}
          />
        );
      case "dashboard-view":
        return <DashboardView {...menuProps} dashboardId={activeDashboardId} onBack={() => go("dashboards")} />;
      case "data-hub":
        return <DataHub {...menuProps} />;
      case "projects":
        return <ProjectList {...menuProps} />;
      case "reports":
        return <ReportList {...menuProps} />;
      case "skills":
        return <SkillsPage {...menuProps} />;
      case "settings":
        return <SettingsPage {...menuProps} />;
      case "profile":
        return <ProfilePage {...menuProps} />;
      case "home":
      default:
        return <WorkbookHome {...menuProps} page={page} onSubmit={(q) => { setChatQuery(q); go("chat"); }} />;
    }
  };

  // .petavue-root scopes Petavue's margin/padding reset to these pages only.
  return <div className="petavue-root">{renderPage()}</div>;
}
