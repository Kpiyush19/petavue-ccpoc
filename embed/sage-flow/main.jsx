import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider, Navigate } from "react-router-dom";
import { PrimeReactProvider } from "primereact/api";
import { QueryClientProvider } from "@tanstack/react-query";

// Embed flags (read at render time by MenuBarNav + the composers):
// lock the sidebar tabs, and strip the composer to essentials — no model
// picker, and an inert attach button.
window.__EMBED_LOCK_NAV__ = true;
window.__EMBED_MINIMAL_COMPOSER__ = true;
// General embed flag — components read this to disable actions that would jump
// to a page/module outside the embedded flow (e.g. Publish / View dashboard).
window.__EMBED__ = true;

import "primereact/resources/primereact.min.css";
import "@/index.css";
import "@/ui/global.css";
import "@/ui/tokens/tokens.css";

// Boot the in-JS mock backend (axios adapter + fetch patch + no-op Pusher) so
// the scripted Paid Media ROI flow plays with zero backend.
import "@/mocks";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/providers/auth";
import { PostHogProvider } from "@/providers/posthog";
import { SessionProvider } from "@/contexts/SessionContext";

// Direct (non-lazy) imports of ONLY the flow's screens, so the single-file
// bundle stays lean instead of inlining the whole app's route tree.
import RootLayout from "@/layouts/RootLayout";
import SessionsLayout from "@/layouts/SessionsLayout";
import HomeLayout from "@/pages/home/TempHome/HomeLayout";
import HomePage from "@/pages/home/TempHome/HomePage";
import WorkspacePage from "@/pages/WorkspacePage";

/**
 * Sage home → dashboard-creation flow, embedded.
 *
 * A trimmed in-memory route tree — Create-New home ("/new") and the session
 * workspace ("/chat/:id") — reusing the real layouts + pages + mock backend.
 * Typing a prompt plays the scripted flow (clarify → Paid Media ROI dashboard).
 * Sidebar tabs are locked (__EMBED_LOCK_NAV__).
 */
const routes = [
  {
    element: (
      <SessionProvider>
        <RootLayout />
      </SessionProvider>
    ),
    children: [
      { index: true, element: <Navigate to="/new" replace /> },
      {
        element: <HomeLayout />,
        children: [{ path: "new", element: <HomePage /> }],
      },
      {
        element: <SessionsLayout />,
        children: [
          { path: "chat/:id", element: <WorkspacePage /> },
          { path: "session/:id", element: <WorkspacePage /> },
        ],
      },
    ],
  },
];

const router = createMemoryRouter(routes, { initialEntries: ["/new"], initialIndex: 0 });

// Navigation guard: block any jump to a page/module outside the embedded flow
// (only /new, /chat/:id, /session/:id exist here). Buttons that would navigate
// away — "View dashboard", nav links, etc. — become inert instead of crashing
// on a route the trimmed router doesn't have. Relative + numeric (back) nav is
// left alone.
const ALLOWED_PATH = /^\/(new|chat|session)(\/|$|\?|#)/;
const _navigate = router.navigate.bind(router);
router.navigate = (to, opts) => {
  const path = typeof to === "string" ? to : to && typeof to === "object" ? to.pathname || "" : "";
  if (typeof path === "string" && path.startsWith("/") && !ALLOWED_PATH.test(path)) {
    return Promise.resolve();
  }
  return _navigate(to, opts);
};

createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <PostHogProvider>
      <AuthProvider>
        <PrimeReactProvider value={{ unstyled: false, pt: {} }}>
          <RouterProvider router={router} />
        </PrimeReactProvider>
      </AuthProvider>
    </PostHogProvider>
  </QueryClientProvider>
);
