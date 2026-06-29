import type { NextRequest } from "next/server";

interface Window {
  count: number;
  reset: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __CIVICPULSE_RATELIMIT__: Map<string, Window> | undefined;
}

function store(): Map<string, Window> {
  if (!global.__CIVICPULSE_RATELIMIT__) global.__CIVICPULSE_RATELIMIT__ = new Map();
  return global.__CIVICPULSE_RATELIMIT__;
}

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "anonymous";
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  reset: number; // epoch ms
}

/**
 * Fixed-window in-memory rate limiter. Best-effort (per-instance) protection for
 * expensive endpoints; pair with an edge/CDN limiter for hard guarantees.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const s = store();
  const entry = s.get(key);

  if (!entry || entry.reset <= now) {
    s.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, limit, remaining: limit - 1, reset: now + windowMs };
  }

  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  return { ok: entry.count <= limit, limit, remaining, reset: entry.reset };
}

export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(r.limit),
    "X-RateLimit-Remaining": String(r.remaining),
    "X-RateLimit-Reset": String(Math.ceil(r.reset / 1000)),
    "Retry-After": String(Math.max(0, Math.ceil((r.reset - Date.now()) / 1000))),
  };
}
