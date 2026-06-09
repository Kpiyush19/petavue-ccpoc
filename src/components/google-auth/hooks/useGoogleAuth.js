import { useRef, useState, useCallback } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { googleLogin } from "../api/googleLogin";

export function useGoogleAuth({ onSuccess, onError, onPopupClosed }) {
  const popupRef = useRef(null);
  const loginSuccessRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);

  const googleOAuthLogin = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      loginSuccessRef.current = true;
      try {
        const data = await googleLogin({
          access_token: credentialResponse.access_token
        });

        if (data && data?.access_token) {
          onSuccess?.(data);
        } else {
          onError?.(new Error("Invalid response from server"));
        }
      } catch (e) {
        const message = e?.response?.data?.message || e?.message || "Something went wrong while logging in with Google";
        onError?.({ ...e, message });
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      onError?.(error || new Error("Google login failed"));
      setIsLoading(false);
    }
  });

  const login = useCallback(() => {
    setIsLoading(true);
    loginSuccessRef.current = false;

    const originalOpenFunc = window.open;
    window.open = (...args) => {
      const popup = originalOpenFunc(...args);
      popupRef.current = popup;
      return popup;
    };

    googleOAuthLogin();

    window.open = originalOpenFunc;

    const interval = setInterval(() => {
      if (popupRef.current?.closed) {
        clearInterval(interval);
        if (!loginSuccessRef.current) {
          onPopupClosed?.();
          setIsLoading(false);
        }
        popupRef.current = null;
      }
    }, 200);
  }, [googleOAuthLogin, onPopupClosed]);

  return { login, isLoading };
}
