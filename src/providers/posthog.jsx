import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider, useFeatureFlagEnabled as usePHFeatureFlagEnabled, usePostHog } from "posthog-js/react";
import { POSTHOG_KEY, POSTHOG_HOST } from "../config";
import PetavueSplash from "../components/PetavueSplash";
import { MOCK_ENABLED, mockFeatureFlag } from "../mocks";

const FLAGS_TIMEOUT_MS = 5000;

function PostHogLoadingGate({ children }) {
  const [flagsLoaded, setFlagsLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const client = usePostHog();

  useEffect(() => {
    if (!POSTHOG_KEY) {
      setFlagsLoaded(true);
      return;
    }

    const handleFlagsLoaded = () => {
      setFlagsLoaded(true);
    };

    client.onFeatureFlags(handleFlagsLoaded);

    const timeoutId = setTimeout(() => {
      if (!flagsLoaded) {
        console.warn("PostHog feature flags timed out, proceeding with defaults");
        setTimedOut(true);
      }
    }, FLAGS_TIMEOUT_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [client, flagsLoaded]);

  if (!flagsLoaded && !timedOut) {
    return <PetavueSplash />;
  }

  return children;
}

export function PostHogProvider({ children }) {
  // Frontend-only mode: skip real PostHog entirely (no network, no flag gate).
  if (MOCK_ENABLED) {
    return children;
  }

  if (!POSTHOG_KEY) {
    return children;
  }

  return (
    <PHProvider
      apiKey={POSTHOG_KEY}
      options={{
        api_host: POSTHOG_HOST,
        persistence: "memory",
        autocapture: false,
        capture_pageview: false
      }}
    >
      <PostHogLoadingGate>{children}</PostHogLoadingGate>
    </PHProvider>
  );
}

// In mock mode, resolve feature flags from a static map so gated routes
// (IndexRedirect / HomeGuard read `ccpoc-home`) get a definite boolean instead
// of `undefined`, which would otherwise hang the app on the splash screen.
export function useFeatureFlagEnabled(name) {
  if (MOCK_ENABLED) return mockFeatureFlag(name);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return usePHFeatureFlagEnabled(name);
}

export { usePostHog };
