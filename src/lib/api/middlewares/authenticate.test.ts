import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/lib/auth";
import { ERROR_CODES } from "@/config/constants";

import { authenticate } from "./authenticate";
import { makeApiRequest, makeApiResponse } from "../test-helpers";

// Auth.js v5 types `auth` as an overloaded callable; tests only need the
// "load a session" shape.
const authMock = auth as unknown as Mock<() => Promise<unknown>>;

beforeEach(() => {
  authMock.mockReset();
});

describe("authenticate", () => {
  it("sets req.ctx.user when a session exists", async () => {
    authMock.mockResolvedValue({
      user: { id: "usr_9", name: "Ali", email: "ali@test.dev", role: "CLIENT" },
      expires: "2026-01-01T00:00:00.000Z",
    });

    const req = makeApiRequest();
    const result = await authenticate(req, makeApiResponse());

    expect(result.success).toBe(true);
    expect(req.ctx.user).toMatchObject({ id: "usr_9", role: "CLIENT" });
  });

  it("rejects with 401 UNAUTHENTICATED when there is no session", async () => {
    authMock.mockResolvedValue(null);

    const req = makeApiRequest();
    const result = await authenticate(req, makeApiResponse());

    expect(result.success).toBe(false);
    expect(result.status).toBe(401);
    expect(result.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    expect(req.ctx.user).toBeNull();
  });
});
