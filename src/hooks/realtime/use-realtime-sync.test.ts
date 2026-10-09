import { describe, expect, it } from "vitest";

import type { TokenRequest } from "ably";

import { deriveRealtimeConnection } from "./use-realtime-sync";

const token = { keyName: "app.key" } as TokenRequest;

const base = {
  sessionLoading: false,
  userId: "user_1",
  tokenReady: true,
  tokenEnabled: true,
  tokenError: false,
  currentToken: token,
  socket: null as { token: TokenRequest; state: string } | null,
};

describe("deriveRealtimeConnection", () => {
  it("is connecting while the session loads", () => {
    expect(deriveRealtimeConnection({ ...base, sessionLoading: true })).toBe("connecting");
  });

  it("is disabled when signed out", () => {
    expect(deriveRealtimeConnection({ ...base, userId: null })).toBe("disabled");
  });

  it("is disabled when realtime is not configured", () => {
    expect(deriveRealtimeConnection({ ...base, tokenEnabled: false, currentToken: null })).toBe(
      "disabled",
    );
  });

  it("is disabled when the token request failed", () => {
    expect(
      deriveRealtimeConnection({ ...base, tokenReady: false, tokenError: true, currentToken: null }),
    ).toBe("disabled");
  });

  it("waits for the first socket event before reporting a state", () => {
    expect(deriveRealtimeConnection({ ...base })).toBe("connecting");
  });

  it("maps Ably connection states", () => {
    const on = (state: string) =>
      deriveRealtimeConnection({ ...base, socket: { token, state } });
    expect(on("connected")).toBe("connected");
    expect(on("connecting")).toBe("connecting");
    expect(on("initialized")).toBe("connecting");
    expect(on("disconnected")).toBe("offline");
    expect(on("suspended")).toBe("offline");
    expect(on("failed")).toBe("offline");
  });

  it("ignores a socket that belongs to a previous token", () => {
    const other = { keyName: "app.other" } as TokenRequest;
    expect(
      deriveRealtimeConnection({ ...base, socket: { token: other, state: "connected" } }),
    ).toBe("connecting");
  });
});
