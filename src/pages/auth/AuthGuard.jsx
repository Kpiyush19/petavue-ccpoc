import { useEffect, useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { getAuthToken, clearAuthToken, fetchAndStoreCurrentUser } from "../../api";
import PetavueSplash from "../../components/PetavueSplash";
import { MOCK_ENABLED } from "../../mocks";

export default function AuthGuard() {
  const location = useLocation();
  // Frontend-only mode has no real auth — always render the app, never redirect to login.
  const [authState, setAuthState] = useState(() =>
    MOCK_ENABLED ? "authenticated" : getAuthToken() ? "checking" : "unauthenticated"
  );

  useEffect(() => {
    if (MOCK_ENABLED) return;
    if (!getAuthToken()) {
      setAuthState("unauthenticated");
      return;
    }
    fetchAndStoreCurrentUser()
      .then((user) => {
        if (user) {
          setAuthState("authenticated");
        } else {
          clearAuthToken();
          setAuthState("unauthenticated");
        }
      })
      .catch(() => {
        clearAuthToken();
        setAuthState("unauthenticated");
      });
  }, []);

  if (authState === "checking") {
    return <PetavueSplash />;
  }

  if (authState === "unauthenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
