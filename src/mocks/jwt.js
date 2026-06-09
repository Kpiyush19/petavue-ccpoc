// Builds a fake-but-decodable JWT for the mock auth flow.
// The app's token decoder (src/components/google-auth/utils/decodeToken.js)
// just does `JSON.parse(atob(token.split('.')[1]))` with no signature check,
// so a standard-base64 payload round-trips cleanly.

function b64(obj) {
  return btoa(JSON.stringify(obj));
}

export function makeFakeJwt(payload = {}) {
  const header = b64({ alg: "HS256", typ: "JWT" });
  const now = Math.floor(Date.now() / 1000);
  const body = b64({
    iat: now,
    exp: now + 60 * 60 * 24 * 30, // 30 days
    ...payload,
  });
  return `${header}.${body}.mock-signature`;
}
