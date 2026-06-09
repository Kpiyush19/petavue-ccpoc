import { setToken, getToken, removeToken } from './cookie';

const AUTH_URL = '/api/v1/auth/login';
const REGISTER_URL = '/api/v1/auth/register';

export async function signup(name, email, password) {
  const response = await fetch(REGISTER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'Registration failed');
  }

  const data = await response.json();
  const token = data.access_token;

  if (!token) throw new Error('No access token in response');

  setToken(token);
  return parseUser(token);
}

export async function loginWithGoogle(credential) {
  const response = await fetch('/api/v1/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'Google sign-in failed');
  }

  const data = await response.json();
  const token = data.access_token;

  if (!token) throw new Error('No access token in response');

  setToken(token);
  return parseUser(token);
}

export async function login(username, password) {
  const response = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'Login failed');
  }

  const data = await response.json();
  const token = data.access_token;

  if (!token) throw new Error('No access token in response');

  setToken(token);
  return parseUser(token);
}

export function logout() {
  removeToken();
}

export function getLoggedInUser() {
  const token = getToken();
  if (!token) return null;
  try {
    return parseUser(token);
  } catch {
    removeToken();
    return null;
  }
}

function parseUser(token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return {
    name: payload.name || '',
    initials: (payload.name || '').split(' ').map(w => w[0]).join('').toUpperCase(),
    email: payload.email || '',
    role: payload.role || '',
    tenantId: payload.tenantId || '',
    userId: payload.userId || '',
  };
}
