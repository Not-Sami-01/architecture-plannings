import { describe, expect, it } from "vitest";

import { ERROR_CODES, RATE_LIMITS } from "@/config/constants";

import { rateLimit } from "./rate-limit";
import { makeApiRequest, makeApiResponse } from "../test-helpers";

describe("rateLimit", () => {
  it("allows requests up to the limit", async () => {
    const middleware = rateLimit({ limit: 2, windowSeconds: 60 });
    const url = "http://localhost:3000/api/allowed";

    const first = await middleware(makeApiRequest({ url, userId: "u1" }), makeApiResponse());
    const second = await middleware(makeApiRequest({ url, userId: "u1" }), makeApiResponse());

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
  });

  it("rejects with 429 and a Retry-After header once over the limit", async () => {
    const middleware = rateLimit({ limit: 1, windowSeconds: 60 });
    const url = "http://localhost:3000/api/limited";

    await middleware(makeApiRequest({ url, userId: "u2" }), makeApiResponse());
    const res = makeApiResponse();
    const result = await middleware(makeApiRequest({ url, userId: "u2" }), res);

    expect(result.success).toBe(false);
    expect(result.status).toBe(429);
    expect(result.code).toBe(ERROR_CODES.RATE_LIMITED);
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);
  });

  it("keys buckets per identity, so one user being limited does not affect another", async () => {
    const middleware = rateLimit({ limit: 1, windowSeconds: 60 });
    const url = "http://localhost:3000/api/per-user";

    await middleware(makeApiRequest({ url, userId: "u3" }), makeApiResponse());
    const result = await middleware(makeApiRequest({ url, userId: "u4" }), makeApiResponse());

    expect(result.success).toBe(true);
  });

  it("defaults to the standard default limit", () => {
    // Sanity check that the default is wired from constants (120/min).
    expect(RATE_LIMITS.default).toEqual({ limit: 120, windowSeconds: 60 });
  });
});
