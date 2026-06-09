import { setUser } from "@sentry/react";
import posthog from "posthog-js";
import apiAxios from "./lib/api-axios";
import axios from "./lib/axios";
import { FullStory } from "@fullstory/browser";
import { POSTHOG_KEY } from "./config";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export function getApiBase() {
  return API_BASE;
}

// ── Auth token helpers ──────────────────────────────────────────────
const TOKEN_KEY = "auth_token";
const USER_KEY = "current_user";

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.clear();
  setUser(null);
  if (POSTHOG_KEY) {
    try {
      posthog.reset();
    } catch {}
  }
}

// ── Current user helpers ────────────────────────────────────────────

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  if (user) {
    const userId = user._id || user.userId;

    setUser({
      id: userId,
      email: user.email,
      username: user.name
    });

    try {
      FullStory("setIdentity", {
        uid: userId,
        properties: {
          displayName: user.name,
          email: user.email
        }
      });
    } catch {}

    if (POSTHOG_KEY) {
      try {
        const { _id, userId: uid, ...userProperties } = user;
        posthog.identify(userId, userProperties);
      } catch {}
    }
  }
}

/**
 * Fetch current user from Petavue /api/v1/tenant/users/me.
 * Call after login or on app refresh once token is verified.
 */
export async function fetchAndStoreCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const user = await axios.get("/api/v1/tenant/users/me");
    setCurrentUser(user);
    return user;
  } catch {
    return null;
  }
}

// ── Login (calls Petavue auth API directly) ────────────────────────
export async function login(username, password) {
  const data = await axios.post("/api/v1/auth/login", { username, password });
  setAuthToken(data.access_token);
  return data;
}

export async function logout() {
  const token = getAuthToken();
  try {
    await axios.post("/api/v1/auth/logout", null, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  } catch {
    // Ignore logout errors
  }
  clearAuthToken();
}

// ── API helpers with auth (default API routing) ─────────────────────

export async function apiPost(path, body, { signal } = {}) {
  return apiAxios.post(path, body, { signal });
}

export async function apiGet(path, { signal } = {}) {
  return apiAxios.get(path, { signal });
}

export async function apiUpload(path, files, { signal } = {}) {
  const formData = new FormData();
  for (const file of files) formData.append("files", file);
  return apiAxios.post(path, formData, { signal });
}

export async function apiPut(path, body, { signal } = {}) {
  return apiAxios.put(path, body, { signal });
}

export async function apiPatch(path, body, { signal } = {}) {
  return apiAxios.patch(path, body, { signal });
}

export async function apiDelete(path, { signal } = {}) {
  return apiAxios.delete(path, { signal });
}
