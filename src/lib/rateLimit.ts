// Client-side rate limiting for guess submissions
// Limit: 6 requests per 15 seconds

interface RateLimitEntry {
  timestamps: number[];
}

const RATE_LIMIT_WINDOW = 15000; // 15 seconds
const RATE_LIMIT_MAX = 6; // 6 requests per window

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Check if a request should be rate-limited
 * @param key - Unique identifier for the rate limit (e.g., 'guess')
 * @returns true if rate limit exceeded, false if allowed
 */
export const isRateLimited = (key: string): boolean => {
  const now = Date.now();
  const entry = rateLimitMap.get(key) || { timestamps: [] };
  
  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
  );
  
  // Check if rate limit exceeded
  if (entry.timestamps.length >= RATE_LIMIT_MAX) {
    return true;
  }
  
  // Add current timestamp
  entry.timestamps.push(now);
  rateLimitMap.set(key, entry);
  
  return false;
};

/**
 * Get remaining requests in current window
 * @param key - Unique identifier for the rate limit
 * @returns number of remaining requests
 */
export const getRemainingRequests = (key: string): number => {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  
  if (!entry) return RATE_LIMIT_MAX;
  
  // Count timestamps within the window
  const validTimestamps = entry.timestamps.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
  );
  
  return Math.max(0, RATE_LIMIT_MAX - validTimestamps.length);
};

/**
 * Reset rate limit for a key
 * @param key - Unique identifier for the rate limit
 */
export const resetRateLimit = (key: string): void => {
  rateLimitMap.delete(key);
};
