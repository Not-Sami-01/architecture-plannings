import { describe, expect, it } from "vitest";

import { ERROR_CODES, ROLES } from "@/config/constants";

import { requireRole } from "./require-role";
import { makeApiRequest, makeApiResponse } from "../test-helpers";

describe("requireRole", () => {
  it("passes for a user with an allowed role", async () => {
    const req = makeApiRequest({ userId: "usr_1" });
    const result = await requireRole(ROLES.ADMIN, ROLES.CLIENT)(req, makeApiResponse());

    expect(result.success).toBe(true);
  });

  it("rejects with 403 for a user with a disallowed role", async () => {
    const req = makeApiRequest({ userId: "usr_1" }); // CLIENT by default in the helper
    const result = await requireRole(ROLES.ADMIN)(req, makeApiResponse());

    expect(result.success).toBe(false);
    expect(result.status).toBe(403);
    expect(result.code).toBe(ERROR_CODES.FORBIDDEN);
  });

  it("rejects with 401 when there is no user at all", async () => {
    const req = makeApiRequest();
    const result = await requireRole(ROLES.CLIENT)(req, makeApiResponse());

    expect(result.success).toBe(false);
    expect(result.status).toBe(401);
    expect(result.code).toBe(ERROR_CODES.UNAUTHENTICATED);
  });
});
