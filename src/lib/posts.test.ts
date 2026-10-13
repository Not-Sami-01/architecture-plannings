import { beforeEach, describe, expect, it, vi } from "vitest";

const publishedAt = new Date("2026-01-15T00:00:00.000Z");
const updatedAt = new Date("2026-01-16T12:00:00.000Z");

const postRow = {
  id: "p1",
  slug: "hello-world",
  title: "Hello World",
  excerpt: "A sufficiently long excerpt for the schema.",
  tags: ["guides"],
  status: "PUBLISHED",
  readingMinutes: 3,
  publishedAt,
  updatedAt,
  coverImageId: null,
  author: { name: "Admin" },
  contentHtml: "<p>Body</p>",
  seoTitle: null,
  seoDescription: null,
  createdAt: new Date("2026-01-10T00:00:00.000Z"),
};

const findMany = vi.fn().mockResolvedValue([postRow]);
const findFirst = vi.fn().mockResolvedValue(postRow);

// posts.ts reaches the Prisma client and next/cache (server-only).
vi.mock("@/lib/db", () => ({
  prisma: { post: { findMany: (...args: unknown[]) => findMany(...args), findFirst: (...args: unknown[]) => findFirst(...args) } },
}));

// Simulate the real unstable_cache: every cached read round-trips through
// JSON, which is exactly how Prisma Dates turn into strings in production.
vi.mock("next/cache", () => ({
  unstable_cache:
    <T extends (...args: never[]) => unknown>(fn: T) =>
    ((...args: Parameters<T>) =>
      Promise.resolve(fn(...args)).then((result) => JSON.parse(JSON.stringify(result)))) as T,
  revalidateTag: vi.fn(),
}));

import { getPublishedPostBySlug, listPublishedPosts } from "./posts";
import { slugifyPost } from "./posts/slug";

beforeEach(() => {
  findMany.mockClear();
  findFirst.mockClear();
});

describe("slugifyPost", () => {
  it("kebab-cases a title", () => {
    expect(slugifyPost("How to plan a 5 marla house")).toBe("how-to-plan-a-5-marla-house");
    expect(slugifyPost("  Cost Breakdown!! ")).toBe("cost-breakdown");
  });

  it("strips leading/trailing hyphens and caps length", () => {
    expect(slugifyPost("--Tips--")).toBe("tips");
    expect(slugifyPost("a".repeat(200)).length).toBeLessThanOrEqual(80);
  });

  it("returns empty string for titles with no alphanumerics", () => {
    expect(slugifyPost("!!!")).toBe("");
  });
});

describe("cached public reads rehydrate Dates", () => {
  it("getPublishedPostBySlug returns real Date instances after a JSON cache round-trip", async () => {
    const post = await getPublishedPostBySlug("hello-world");
    expect(post).not.toBeNull();
    // unstable_cache serializes: without rehydration these are strings and
    // .toISOString() crashes the blog pages (the 2026-01 production bug).
    expect(post!.publishedAt).toBeInstanceOf(Date);
    expect(post!.updatedAt).toBeInstanceOf(Date);
    expect(post!.publishedAt!.toISOString()).toBe("2026-01-15T00:00:00.000Z");
    expect(post!.updatedAt.toISOString()).toBe("2026-01-16T12:00:00.000Z");
  });

  it("listPublishedPosts rehydrates every row", async () => {
    const posts = await listPublishedPosts({ limit: 3 });
    expect(posts).toHaveLength(1);
    expect(posts[0]!.publishedAt).toBeInstanceOf(Date);
    expect(posts[0]!.updatedAt).toBeInstanceOf(Date);
    expect(dateFormatterIsValid(posts[0]!.publishedAt)).toBe(true);
  });

  it("tolerates a null publishedAt (never published)", async () => {
    findFirst.mockResolvedValueOnce({ ...postRow, publishedAt: null });
    const post = await getPublishedPostBySlug("hello-world");
    expect(post!.publishedAt).toBeNull();
  });
});

function dateFormatterIsValid(value: Date | null): boolean {
  if (!value) return false;
  return !Number.isNaN(new Intl.DateTimeFormat("en-GB").format(value).length);
}
