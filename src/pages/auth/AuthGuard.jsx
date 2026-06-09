import { useEffect, useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { getAuthToken, clearAuthToken, fetchAndStoreCurrentUser } from "../../api";
import PetavueSplash from "../../components/PetavueSplash";

export default function AuthGuard() {
  const location = useLocation();
  const [authState, setAuthState] = useState(() => (getAuthToken() ? "checking" : "unauthenticated"));

  useEffect(() => {
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
