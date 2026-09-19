interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

// In-memory rate limiting map per worker isolate
const memoryStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  key: string,
  capacity: number = 60,       // Max tokens
  refillRatePerSec: number = 10 // Refill tokens per second
): { allowed: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now();
  let entry = memoryStore.get(key);

  if (!entry) {
    entry = { tokens: capacity - 1, lastRefill: now };
    memoryStore.set(key, entry);
    return { allowed: true, remaining: capacity - 1 };
  }

  // Refill tokens
  const elapsedSec = (now - entry.lastRefill) / 1000;
  const addedTokens = elapsedSec * refillRatePerSec;
  entry.tokens = Math.min(capacity, entry.tokens + addedTokens);
  entry.lastRefill = now;

  if (entry.tokens >= 1) {
    entry.tokens -= 1;
    return { allowed: true, remaining: Math.floor(entry.tokens) };
  } else {
    const timeNeededSec = Math.ceil((1 - entry.tokens) / refillRatePerSec);
    return { allowed: false, remaining: 0, retryAfter: timeNeededSec };
  }
}
