import { describe, expect, it } from "vitest";

import { REALTIME_CHANNELS, ROLES } from "@/config/constants";

import {
  buildRealtimeCapability,
  createRealtimeTokenRequest,
  publishAdminsEvent,
  publishUserEvent,
} from "./realtime";

describe("buildRealtimeCapability", () => {
  it("clients subscribe only to their own channel", () => {
    const capability = buildRealtimeCapability({ id: "user_1", role: ROLES.CLIENT });
    expect(capability).toEqual({ [REALTIME_CHANNELS.user("user_1")]: ["subscribe"] });
  });

  it("admins also subscribe to the admin role channel", () => {
    const capability = buildRealtimeCapability({ id: "admin_1", role: ROLES.ADMIN });
    expect(capability).toEqual({
      [REALTIME_CHANNELS.user("admin_1")]: ["subscribe"],
      [REALTIME_CHANNELS.admins]: ["subscribe"],
    });
  });

  it("never grants publish or presence rights to browser clients", () => {
    const capability = buildRealtimeCapability({ id: "user_1", role: ROLES.ADMIN });
    for (const actions of Object.values(capability)) {
      expect(actions).toEqual(["subscribe"]);
    }
  });
});

describe("realtime without ABLY_API_KEY (tests and local dev)", () => {
  it("token request resolves to null (realtime disabled)", async () => {
    await expect(createRealtimeTokenRequest({ id: "user_1", role: ROLES.CLIENT })).resolves.toBeNull();
  });

  it("publish helpers resolve without throwing (no-op)", async () => {
    await expect(publishUserEvent("user_1", { type: "quote.sent", refId: "ord_1" })).resolves.toBeUndefined();
    await expect(publishAdminsEvent({ type: "order.created", refId: "ord_1" })).resolves.toBeUndefined();
  });
});
