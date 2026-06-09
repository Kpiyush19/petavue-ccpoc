/**
 * Decode a JWT payload without verification (client-side only).
 * Used to extract tenantId/userId for logout headers.
 */
export function decodeJwtPayload(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    // Base64url → base64 → decode
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(b64)
    return JSON.parse(json)
  } catch {
    return null
  }
}
