import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { useFeatureFlagEnabled } from "../providers/posthog";
import PetavueSplash from "./PetavueSplash";
import { MOCK_ENABLED, LANDING_SESSION_ID } from "../mocks";

const ExplorePage = lazy(() => import("../pages/ExplorePage"));

export default function IndexRedirect() {
  // Frontend-only mode: jump straight into the dashboard session with the
  // dashboard already open in the artifact panel, ready for Verify & Publish.
  if (MOCK_ENABLED) {
    return (
      <Navigate
        to={`/session/${LANDING_SESSION_ID}`}
        replace
        state={{
          openArtifact: { path: "output/dashboard/revenue_dashboard.html", title: "Q2 Revenue Dashboard", contentType: "html" },
          openVerifyPublish: true,
        }}
      />
    );
  }

  const homeEnabled = useFeatureFlagEnabled("ccpoc-home");

  if (homeEnabled === undefined) {
    return <PetavueSplash />;
  }

  if (homeEnabled === true) {
    return <Navigate to="/home" replace />;
  }

  return (
    <Suspense fallback={<PetavueSplash />}>
      <ExplorePage />
    </Suspense>
  );
}
