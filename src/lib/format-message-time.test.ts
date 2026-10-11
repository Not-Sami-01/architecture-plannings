import { describe, expect, it } from "vitest";

import { formatMessageTime } from "./format-message-time";

// Local-time fixtures keep the assertions deterministic on any machine TZ.
const now = new Date(2026, 9, 11, 14, 32); // 11 Oct 2026, 14:32 local

describe("formatMessageTime", () => {
  it("says 'just now' inside the first minute (and for clock skew)", () => {
    expect(formatMessageTime(new Date(2026, 9, 11, 14, 31, 40), now).short).toBe("just now");
    // A message stamped in the future by a skewed clock is still "now".
    expect(formatMessageTime(new Date(2026, 9, 11, 14, 33), now).short).toBe("just now");
  });

  it("counts minutes up to an hour", () => {
    expect(formatMessageTime(new Date(2026, 9, 11, 14, 27), now).short).toBe("5 min ago");
    expect(formatMessageTime(new Date(2026, 9, 11, 13, 33), now).short).toBe("59 min ago");
  });

  it("counts hours up to a day", () => {
    expect(formatMessageTime(new Date(2026, 9, 11, 11, 32), now).short).toBe("3 h ago");
    expect(formatMessageTime(new Date(2026, 9, 10, 15, 0), now).short).toBe("23 h ago");
  });

  it("shows the date once the gap is measured in days", () => {
    expect(formatMessageTime(new Date(2026, 9, 8, 9, 0), now).short).toBe("8 Oct");
    expect(formatMessageTime(new Date(2025, 11, 31, 9, 0), now).short).toBe("31 Dec");
  });

  it("always formats the full tooltip date with time", () => {
    expect(formatMessageTime(new Date(2026, 9, 8, 9, 5), now).full).toBe("8 Oct 2026, 09:05");
    expect(formatMessageTime(new Date(2026, 9, 11, 14, 27), now).full).toBe("11 Oct 2026, 14:27");
  });
});
