// Single entry point for the frontend-only mock backend.
//
// Toggle: set VITE_MOCK=true (default in .env.development for this repo). When
// on, both axios instances use the mock adapter and `pusher-js` is aliased to a
// no-op client (see vite.config.js), so the app runs with zero backend.

import mockAdapter from "./adapter";
import { makeFakeJwt } from "./jwt";
import { currentUser, TENANT_ID, USER_ID, DASH_SESSION_ID } from "./db";
import { installFetchPatch } from "./fetchPatch";

export const MOCK_ENABLED = import.meta.env.VITE_MOCK === "true";

// The session the app lands on directly (login is skipped in mock mode).
export const LANDING_SESSION_ID = DASH_SESSION_ID;

// Seed a valid auth token + current user so AuthGuard passes immediately and
// the app boots straight into the dashboard session — no login page.
function seedAuth() {
  if (localStorage.getItem("auth_token")) return;
  localStorage.setItem(
    "auth_token",
    makeFakeJwt({ userId: USER_ID, tenantId: TENANT_ID, userRole: "admin", email: currentUser.email })
  );
  localStorage.setItem("auth_email", currentUser.email);
  localStorage.setItem("current_user", JSON.stringify(currentUser));
}

// Mock feature flags consumed via providers/posthog.jsx. `ccpoc-home` drives
// the landing page + Home routes; resolving it to a definite boolean avoids the
// infinite splash that an `undefined` flag would cause.
const MOCK_FLAGS = {
  "ccpoc-home": true,
};

export function mockFeatureFlag(name) {
  return MOCK_FLAGS[name] ?? false;
}

export function installMockAdapter(axiosInstance) {
  if (!MOCK_ENABLED) return axiosInstance;
  axiosInstance.defaults.adapter = mockAdapter;
  return axiosInstance;
}

if (MOCK_ENABLED) {
  seedAuth();
  installFetchPatch();
  // eslint-disable-next-line no-console
  console.info(
    "%c[mock] Frontend-only mode is ON — all backend calls are mocked.",
    "color:#7c3aed;font-weight:bold"
  );
}
