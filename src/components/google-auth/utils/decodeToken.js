export function decodeToken(token) {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch (e) {
    console.error("Failed to decode token:", e);
    return null;
  }
}

export function isTokenExpired(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  return decoded.exp * 1000 < Date.now();
}
