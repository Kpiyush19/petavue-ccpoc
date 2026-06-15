// Fallbacks let mock mode (no real Pusher env) still satisfy consumers that
// gate on a key being present — the mock Pusher client ignores these values.
export const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY || (import.meta.env.VITE_MOCK === 'true' ? 'mock-key' : undefined);
export const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || (import.meta.env.VITE_MOCK === 'true' ? 'mock' : undefined);
export const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
export const SENTRY_ORG = import.meta.env.VITE_SENTRY_ORG;
export const APP_ENVIRONMENT = import.meta.env.VITE_APP_ENVIRONMENT;
export const FULLSTORY_ORG_ID = import.meta.env.VITE_FULLSTORY_ORG_ID;
export const PETAVUE_API_URL = import.meta.env.VITE_PETAVUE_API_URL;
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const POSTHOG_KEY = import.meta.env.VITE_REACT_APP_PUBLIC_POSTHOG_KEY;
export const POSTHOG_HOST = import.meta.env.VITE_REACT_APP_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
