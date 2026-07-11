import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, Toaster } from "sonner";
import { useGoogleLogin } from "@react-oauth/google";
import { googleLogin, loginWithEmailAndPassword } from "../../components/google-auth/api";
import { fetchAndStoreCurrentUser, clearAuthToken, setAuthToken } from "../../api";
import { Input } from "@/ui";
import { Button } from "@/ui";
import TNCModal from "./TNCModal";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [tncModalOpen, setTncModalOpen] = useState(false);
  const [authDeets, setAuthDeets] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";
  const isLoading = loading || googleLoading;

  const completeLogin = async (response) => {
    setAuthToken(response.access_token);
    const user = await fetchAndStoreCurrentUser();
    if (!user) {
      clearAuthToken();
      return false;
    }
    navigate(from, { replace: true });
    return true;
  };

  const handleTncAccept = async () => {
    setTncModalOpen(false);
    try {
      await completeLogin(authDeets);
    } catch {
      clearAuthToken();
    }
  };

  const handleTncDecline = () => {
    setTncModalOpen(false);
    setAuthDeets(null);
    toast.error("You must accept the Terms of Service to continue");
  };

  const handleLoginResponse = async (response) => {
    if (response?.isSelfServeUser && !response?.isSelfServeTCAccepted) {
      setAuthDeets(response);
      setTncModalOpen(true);
      return;
    }
    await completeLogin(response);
  };

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      setGoogleLoading(true);
      try {
        const authResponse = await googleLogin({
          access_token: response.access_token
        });
        await handleLoginResponse(authResponse);
      } catch {
        clearAuthToken();
        setGoogleLoading(false);
      }
    },
    onError: (err) => {
      toast.error(err?.error_description || "Google login failed");
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const authResponse = await loginWithEmailAndPassword({
        username,
        password
      });
      await handleLoginResponse(authResponse);
    } catch {
      clearAuthToken();
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-grey-50 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-grey-100 rounded-2xl p-10 w-full max-w-[440px] flex flex-col gap-6 shadow-xl mx-4"
      >
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="w-14 h-14 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center mb-2">
            <img src="/petavue-logo.svg" alt="" className="w-7 h-8" />
          </div>
          <h1 className="text-2xl font-semibold text-grey-900">Petavue</h1>
          <p className="text-sm text-[var(--text-secondary)]">Sign in to continue</p>
        </div>

        <div className="flex flex-col gap-4">
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            autoFocus
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-col gap-3">
          <Button
            type="submit"
            size="lg"
            disabled={isLoading || !username || !password}
            className="w-full rounded-xl"
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-grey-200" />
            <span className="text-sm text-[var(--text-secondary)] italic">or</span>
            <div className="flex-1 h-px bg-grey-200" />
          </div>

          <Button
            type="button"
            variant="secondaryGhost"
            size="lg"
            onClick={triggerGoogleLogin}
            disabled={isLoading}
            className="w-full rounded-xl"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </Button>
        </div>
      </form>

      <TNCModal isOpen={tncModalOpen} onClose={handleTncDecline} authDeets={authDeets} onAccept={handleTncAccept} />

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "white",
            border: "1px solid var(--color-grey-200)",
            color: "var(--grey-900)"
          }
        }}
      />
    </div>
  );
}
