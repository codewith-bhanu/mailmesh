import type { Context, Next } from "hono";
import { AppError } from "../lib/errors";

// Simple in-memory sliding window rate limiter
// In production, use Redis-based rate limiting
const windowMs = 60 * 1000; // 1 minute
const maxRequests = 100;

const requestCounts = new Map<string, { count: number; resetAt: number }>();

// Cleanup stale entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, value] of requestCounts) {
      if (value.resetAt < now) {
        requestCounts.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

export function rateLimit(limit = maxRequests, window = windowMs) {
  return async (c: Context, next: Next) => {
    const identifier =
      c.get("workspaceId") ||
      c.req.header("x-forwarded-for") ||
      c.req.header("x-real-ip") ||
      "anonymous";

    const key = `${identifier}:${c.req.path}`;
    const now = Date.now();

    const entry = requestCounts.get(key);

    if (!entry || entry.resetAt < now) {
      requestCounts.set(key, { count: 1, resetAt: now + window });
      c.header("X-RateLimit-Limit", limit.toString());
      c.header("X-RateLimit-Remaining", (limit - 1).toString());
      await next();
      return;
    }

    entry.count++;

    if (entry.count > limit) {
      c.header("X-RateLimit-Limit", limit.toString());
      c.header("X-RateLimit-Remaining", "0");
      c.header(
        "Retry-After",
        Math.ceil((entry.resetAt - now) / 1000).toString(),
      );
      throw AppError.tooManyRequests();
    }

    c.header("X-RateLimit-Limit", limit.toString());
    c.header("X-RateLimit-Remaining", (limit - entry.count).toString());
    await next();
  };
}
