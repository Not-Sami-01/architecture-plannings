import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/users", () => ({ resolveApiUser: vi.fn() }));

import { auth } from "@clerk/nextjs/server";
import { resolveApiUser } from "@/lib/users";
import { ERROR_CODES } from "@/config/constants";

import { authenticate } from "./authenticate";
import { makeApiRequest, makeApiResponse } from "../test-helpers";

const authMock = auth as unknown as Mock<() => Promise<{ userId: string | null }>>;
const resolveMock = resolveApiUser as Mock;

beforeEach(() => {
  authMock.mockReset();
  resolveMock.mockReset();
});

describe("authenticate", () => {
  it("sets req.ctx.user from the Clerk session + DB user", async () => {
    authMock.mockResolvedValue({ userId: "user_clerk1" });
    resolveMock.mockResolvedValue({
      id: "usr_9",
      name: "Ali",
      email: "ali@test.dev",
      role: "CLIENT",
    });

    const req = makeApiRequest();
    const result = await authenticate(req, makeApiResponse());

    expect(result.success).toBe(true);
    expect(resolveMock).toHaveBeenCalledWith("user_clerk1");
    expect(req.ctx.user).toMatchObject({ id: "usr_9", role: "CLIENT" });
  });

  it("rejects with 401 UNAUTHENTICATED when there is no Clerk session", async () => {
    authMock.mockResolvedValue({ userId: null });

    const req = makeApiRequest();
    const result = await authenticate(req, makeApiResponse());

    expect(result.success).toBe(false);
    expect(result.status).toBe(401);
    expect(result.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    expect(req.ctx.user).toBeNull();
    expect(resolveMock).not.toHaveBeenCalled();
  });
});
