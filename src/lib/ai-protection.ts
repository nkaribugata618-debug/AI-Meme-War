interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface RateLimitInfo {
  count: number;
  resetAt: number;
}

// Global maps for in-memory protection
const cache = new Map<string, CacheEntry<any>>();
const inFlight = new Map<string, Promise<any>>();
const rateLimits = new Map<string, RateLimitInfo>();

export async function protectAiEndpoint<T>({
  userId,
  endpoint,
  prompt,
  rateLimitMax,
  rateLimitWindowMs,
  cacheTtlMs,
  fn,
}: {
  userId: string;
  endpoint: string;
  prompt: string;
  rateLimitMax: number;
  rateLimitWindowMs: number;
  cacheTtlMs: number;
  fn: () => Promise<T>;
}): Promise<T> {
  const now = Date.now();
  
  // 1. Rate Limiting
  const rateLimitKey = `${userId}:${endpoint}`;
  let rlInfo = rateLimits.get(rateLimitKey);
  if (!rlInfo || now > rlInfo.resetAt) {
    rlInfo = { count: 0, resetAt: now + rateLimitWindowMs };
  }
  rlInfo.count++;
  rateLimits.set(rateLimitKey, rlInfo);
  
  if (rlInfo.count > rateLimitMax) {
    throw new Error("RATE_LIMIT_EXCEEDED");
  }

  // 2. Cache
  // Normalize prompt for cache key (lowercase, trim)
  const normalizedPrompt = prompt.trim().toLowerCase();
  const cacheKey = `${userId}:${endpoint}:${normalizedPrompt}`;
  
  const cached = cache.get(cacheKey);
  if (cached && now < cached.expiresAt) {
    // Return cached response instantly (saves cost)
    return cached.value as T;
  }
  
  // Periodic Cleanup (amortized)
  if (Math.random() < 0.05) {
    for (const [key, entry] of cache.entries()) {
      if (now > entry.expiresAt) cache.delete(key);
    }
    for (const [key, info] of rateLimits.entries()) {
      if (now > info.resetAt) rateLimits.delete(key);
    }
  }

  // 3. In-flight Deduplication
  if (inFlight.has(cacheKey)) {
    // Return the existing promise if a request is already running
    return inFlight.get(cacheKey) as Promise<T>;
  }

  // Execute and Cache
  const promise = fn().then((result) => {
    cache.set(cacheKey, {
      value: result,
      expiresAt: now + cacheTtlMs
    });
    inFlight.delete(cacheKey);
    return result;
  }).catch((err) => {
    inFlight.delete(cacheKey);
    // Refund the rate limit token if the provider fails
    if (rlInfo) {
       rlInfo.count = Math.max(0, rlInfo.count - 1);
    }
    throw err;
  });

  inFlight.set(cacheKey, promise);
  return promise;
}
