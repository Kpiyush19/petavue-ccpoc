const TOKEN_KEY = 'pv_access_token';

export function setToken(token) {
  const maxAge = 30 * 24 * 60 * 60; // 30 days
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function getToken() {
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_KEY}=([^;]*)`));
  return match ? match[1] : null;
}

export function removeToken() {
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
}
