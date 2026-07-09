import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { useFeatureFlagEnabled } from "../providers/posthog";
import PetavueSplash from "./PetavueSplash";
import { MOCK_ENABLED } from "../mocks";

const ExplorePage = lazy(() => import("../pages/ExplorePage"));

export default function IndexRedirect() {
  // Frontend-only mode: land on the Create-New page.
  if (MOCK_ENABLED) {
    return <Navigate to="/new" replace />;
  }

  const homeEnabled = useFeatureFlagEnabled("ccpoc-home");

  if (homeEnabled === undefined) {
    return <PetavueSplash />;
  }

  if (homeEnabled === true) {
    return <Navigate to="/new" replace />;
  }

  return (
    <Suspense fallback={<PetavueSplash />}>
      <ExplorePage />
    </Suspense>
  );
}
