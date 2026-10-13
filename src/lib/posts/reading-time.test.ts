import { describe, expect, it } from "vitest";

import { readingMinutesFromHtml } from "./reading-time";

describe("readingMinutesFromHtml", () => {
  it("returns at least 1 minute for empty or tiny content", () => {
    expect(readingMinutesFromHtml("")).toBe(1);
    expect(readingMinutesFromHtml("<p>Hi</p>")).toBe(1);
  });

  it("ceil-divides words by the configured rate", () => {
    const words = Array.from({ length: 450 }, (_, i) => `w${i}`).join(" ");
    // 450 words / 200 wpm = 2.25 → 3 minutes.
    expect(readingMinutesFromHtml(`<p>${words}</p>`)).toBe(3);
  });

  it("ignores markup when counting", () => {
    const plain = Array.from({ length: 200 }, (_, i) => `w${i}`).join(" ");
    const wrapped = `<h2>Head</h2><p><strong>${plain}</strong></p>`;
    expect(readingMinutesFromHtml(wrapped)).toBe(1);
  });
});
