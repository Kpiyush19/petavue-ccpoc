import { useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "../../lib/axios";
import { setAuthToken, clearAuthToken, fetchAndStoreCurrentUser } from "../../api";
import PetavueSplash from "../../components/PetavueSplash";

export default function LoginAs() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const tt = searchParams.get("tt");
    const emailId = searchParams.get("emailId");

    if (!tt) {
      navigate("/login", { replace: true });
      return;
    }

    (async () => {
      try {
        const data = await axios.post("/api/v1/auth/support-tool-login", {
          token: tt
        });
        if (!data?.access_token) throw new Error("No access token");
        setAuthToken(data.access_token);
        sessionStorage.setItem("support_impersonation", "1");
        if (emailId) {
          sessionStorage.setItem("support_impersonation_email", emailId);
        }
        const user = await fetchAndStoreCurrentUser();
        if (!user) throw new Error("Failed to load user");
        navigate("/", { replace: true });
      } catch {
        clearAuthToken();
        sessionStorage.removeItem("support_impersonation");
        sessionStorage.removeItem("support_impersonation_email");
        navigate("/login", { replace: true });
      }
    })();
  }, [searchParams, navigate]);

  return <PetavueSplash />;
}
