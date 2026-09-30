import type { Context, Next } from 'hono';
import { getConnInfo } from '@hono/node-server/conninfo';

/**
 * Fixed-window rate limiting, held in this process's memory.
 *
 * Deliberately not backed by Redis: the app runs as a single Railway process,
 * so a Map is sufficient and adds no infrastructure. The tradeoff is that
 * counters reset on deploy and would not be shared if the service is ever
 * scaled to more than one instance — revisit this before adding a second
 * replica, not before.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Bound the Map so an attacker cycling keys can't grow it without limit. */
const MAX_TRACKED_KEYS = 10_000;

function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Railway terminates TLS and sets X-Forwarded-For, so the left-most entry is
 * the real client. This is only trustworthy because every request reaches us
 * through that proxy — if the service is ever exposed directly, a client can
 * forge this header and evade the limit.
 */
function clientIp(c: Context): string {
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return c.req.header('x-real-ip')?.trim() || getConnInfo(c).remote.address || 'unknown';
}

export type RateLimitOptions = {
  /** Window length in milliseconds. */
  windowMs: number;
  /** Requests allowed per key per window. */
  max: number;
  /** Namespace, so two limiters never collide on the same key. */
  name: string;
  /**
   * What to count against. Defaults to the client IP. Returning null skips
   * the check entirely — used when the relevant value isn't in the request.
   */
  keyBy?: (c: Context) => Promise<string | null> | string | null;
  /** Shown to the client when the limit trips. */
  message?: string;
};

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, name, keyBy, message } = options;

  return async (c: Context, next: Next) => {
    const raw = keyBy ? await keyBy(c) : clientIp(c);
    if (raw === null) return next();

    const now = Date.now();
    if (buckets.size > MAX_TRACKED_KEYS) sweep(now);

    const key = `${name}:${raw}`;
    const existing = buckets.get(key);

    const bucket =
      !existing || existing.resetAt <= now ? { count: 0, resetAt: now + windowMs } : existing;

    bucket.count += 1;
    buckets.set(key, bucket);

    const remaining = Math.max(0, max - bucket.count);
    c.header('RateLimit-Limit', String(max));
    c.header('RateLimit-Remaining', String(remaining));
    c.header('RateLimit-Reset', String(Math.ceil((bucket.resetAt - now) / 1000)));

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json(
        {
          success: false,
          error: message || `Too many requests. Try again in ${retryAfter} seconds.`,
        },
        429
      );
    }

    await next();
  };
}

/** Exposed for tests — there is no other way to reset process-global state. */
export function __resetRateLimits() {
  buckets.clear();
}
