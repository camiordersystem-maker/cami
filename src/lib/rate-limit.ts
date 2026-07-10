type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const PRUNE_THRESHOLD = 10_000;

function pruneExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > PRUNE_THRESHOLD) pruneExpired(now);
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export function rateLimitKey(prefix: string, value: string | null | undefined): string {
  return `${prefix}:${(value ?? "unknown").toLowerCase()}`;
}
