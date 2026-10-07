import { ERROR_CODES, RATE_LIMITS } from "@/config/constants";

import { pass, reject } from "./helpers";
import type { Middleware } from "../types";

type RateLimitOptions = { limit: number; windowSeconds: number };

/**
 * In-memory sliding-window limiter, keyed per route + user (or IP).
 * Sufficient for a single-instance deployment; swap the store behind this
 * middleware for Redis when running multiple instances.
 */
const buckets = new Map<string, number[]>();

function sweep(now: number, windowMs: number) {
  if (buckets.size < 10_000) return;
  for (const [key, timestamps] of buckets) {
    const live = timestamps.filter((t) => now - t < windowMs);
    if (live.length === 0) buckets.delete(key);
    else buckets.set(key, live);
  }
}

export function rateLimit(options: RateLimitOptions = RATE_LIMITS.default): Middleware {
  return async (req, res) => {
    const now = Date.now();
    const windowMs = options.windowSeconds * 1000;
    const identity = req.ctx.user?.id ?? req.ctx.ip ?? "anonymous";
    const key = `${new URL(req.url).pathname}:${identity}`;

    sweep(now, windowMs);

    const timestamps = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

    if (timestamps.length >= options.limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - timestamps[0])) / 1000));
      res.headers.set("Retry-After", String(retryAfterSeconds));
      return reject(req, res, 429, "Too many requests. Please try again shortly.", {
        code: ERROR_CODES.RATE_LIMITED,
      });
    }

    timestamps.push(now);
    buckets.set(key, timestamps);
    return pass(req, res);
  };
}
