import { NavLink, Outlet, Navigate, useLocation } from "react-router-dom";

const TABS = [
  { id: "dictionary", label: "Data Dictionary", path: "/data-hub/dictionary" },
  { id: "sync-activity", label: "Sync Activity", path: "/data-hub/sync-activity" }
];

export default function DataHubPage() {
  const location = useLocation();

  if (location.pathname === "/data-hub") {
    return <Navigate to="/data-hub/dictionary" replace />;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <div className="px-6 h-[64px] border-b border-[var(--pv-neutral-grey-200)] shrink-0 flex items-center">
        <h1 className="text-lg font-semibold text-[var(--pv-neutral-grey-900)] tracking-tight">Data Hub</h1>
      </div>

      <div className="border-b border-[var(--pv-neutral-grey-200)] px-6">
        <nav className="flex gap-6" aria-label="Data Hub tabs">
          {TABS.map((tab) => (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={({ isActive }) =>
                `py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-[var(--pv-primary-500)] text-[var(--pv-primary-500)]"
                    : "border-transparent text-[var(--pv-neutral-grey-600)] hover:text-[var(--pv-neutral-grey-900)] hover:border-[var(--pv-neutral-grey-300)]"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
