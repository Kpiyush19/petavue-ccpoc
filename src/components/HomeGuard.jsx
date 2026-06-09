import { Navigate, Outlet } from "react-router-dom";
import { useFeatureFlagEnabled } from "../providers/posthog";
import PetavueSplash from "./PetavueSplash";

export default function HomeGuard() {
  const homeEnabled = useFeatureFlagEnabled("ccpoc-home");

  if (homeEnabled === undefined) {
    return <PetavueSplash />;
  }

  if (homeEnabled !== true) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
