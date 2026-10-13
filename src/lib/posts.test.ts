import { describe, expect, it, vi } from "vitest";

// posts.ts reaches the Prisma client and next/cache (server-only); these
// tests only exercise the pure helpers.
vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("next/cache", () => ({
  unstable_cache: <T,>(fn: T) => fn,
  revalidateTag: vi.fn(),
}));

import { slugifyPost } from "./posts/slug";
import { slugifyPost as slugifyPostReexport } from "./posts";

describe("slugifyPost", () => {
  it("kebab-cases a title", () => {
    expect(slugifyPost("How to plan a 5 marla house")).toBe("how-to-plan-a-5-marla-house");
    expect(slugifyPost("  Cost Breakdown!! ")).toBe("cost-breakdown");
  });

  it("strips leading/trailing hyphens and caps length", () => {
    expect(slugifyPost("--Tips--")).toBe("tips");
    const long = slugifyPost("a".repeat(200));
    expect(long.length).toBeLessThanOrEqual(80);
  });

  it("returns empty string for titles with no alphanumerics", () => {
    expect(slugifyPost("!!!")).toBe("");
  });

  it("is re-exported from the service module", () => {
    expect(slugifyPostReexport).toBe(slugifyPost);
  });
});
