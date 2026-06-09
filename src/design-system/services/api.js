import { getToken, removeToken } from './cookie';

const BASE_URL = '/api/v1';

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeToken();
    window.location.reload();
    return;
  }

  return response;
}
