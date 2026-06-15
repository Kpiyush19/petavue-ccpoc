import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { useFeatureFlagEnabled } from "../providers/posthog";
import PetavueSplash from "./PetavueSplash";
import { MOCK_ENABLED } from "../mocks";

const ExplorePage = lazy(() => import("../pages/ExplorePage"));

export default function IndexRedirect() {
  // Frontend-only mode: land directly on the demo dashboard.
  if (MOCK_ENABLED) {
    return <Navigate to="/dashboards/dash-demo-1" replace />;
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
