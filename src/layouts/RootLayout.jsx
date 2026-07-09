import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import Sidebar from "../components/Sidebar";
import MenuBarNav from "../components/MenuBarNav";
import { MOCK_ENABLED } from "../mocks";
import ImpersonationBanner from "../components/ImpersonationBanner";
import RunsDock from "../components/runs/RunsDock";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function RootLayout() {
  useDocumentTitle();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen flex bg-[var(--bg-primary)]">
        {MOCK_ENABLED ? <MenuBarNav /> : <Sidebar />}
        <main className="flex-1 min-w-0 flex flex-col">
          <ImpersonationBanner />
          <Outlet />
        </main>
        <RunsDock />
        <Toaster
          position="bottom-left"
          toastOptions={{
            style: {
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-primary)",
              color: "var(--text-primary)"
            }
          }}
        />
      </div>
    </QueryClientProvider>
  );
}
