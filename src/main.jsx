import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { PrimeReactProvider } from "primereact/api";

import { FullStory, init as initFullStory } from "@fullstory/browser";
import { fullStoryIntegration } from "@sentry/fullstory";
import "primereact/resources/primereact.min.css";
import "./index.css";
// Design system globals — tokens, Poppins, reset (loaded last so it's authoritative).
import "./ui/global.css";
// Canonical color tokens — the single source of truth.
import "./ui/tokens/tokens.css";
import { router } from "./router";
import { AuthProvider } from "./providers/auth";
import { PostHogProvider } from "./providers/posthog";
import { ErrorFallback } from "./components/ErrorFallback";
import { SENTRY_DSN, SENTRY_ORG, APP_ENVIRONMENT, FULLSTORY_ORG_ID } from "./config";
import { MOCK_ENABLED } from "./mocks";
import { ErrorBoundary, init } from "@sentry/react";

if (FULLSTORY_ORG_ID && !MOCK_ENABLED) {
  initFullStory({ orgId: FULLSTORY_ORG_ID });
}

if (SENTRY_DSN && !MOCK_ENABLED && window.location.hostname !== "localhost") {
  init({
    dsn: SENTRY_DSN,
    environment: APP_ENVIRONMENT,
    release: "1.0.0",
    integrations: FULLSTORY_ORG_ID ? [fullStoryIntegration(SENTRY_ORG, { client: FullStory })] : [],
    beforeSend(event, hint) {
      if (hint.originalException?.name === "AxiosError") return null;
      return event;
    }
  });
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary fallback={({ error, resetError }) => <ErrorFallback error={error} resetError={resetError} />}>
    <PostHogProvider>
      <AuthProvider>
        <PrimeReactProvider value={{ unstyled: false, pt: {} }}>
          <RouterProvider router={router} />
        </PrimeReactProvider>
      </AuthProvider>
    </PostHogProvider>
  </ErrorBoundary>
);
