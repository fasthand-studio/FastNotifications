/**
 * Constant-time comparison between two strings to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Validates the Server API Key from the Authorization header.
 * Supports a single API key or comma-separated keys for zero-downtime rotation.
 */
export function validateApiKey(authHeader: string | null, validApiKeys: string): boolean {
  if (!authHeader) return false;

  const prefix = "Bearer ";
  if (!authHeader.startsWith(prefix)) return false;

  const providedKey = authHeader.substring(prefix.length).trim();
  if (!providedKey) return false;

  // Split configured keys in case of rotation (e.g. "key_new,key_old")
  const keys = validApiKeys.split(",").map((k) => k.trim()).filter(Boolean);

  for (const key of keys) {
    if (timingSafeEqual(providedKey, key)) {
      return true;
    }
  }

  return false;
}
