import { describe, expect, it } from "vitest";

import {
  createPostSchema,
  postImageFileSchema,
  postListQuerySchema,
  postSlugSchema,
  publishPostSchema,
  updatePostSchema,
} from "./admin-posts";

const validPost = {
  title: "How to plan a 5 marla house",
  slug: "how-to-plan-a-5-marla-house",
  excerpt: "A practical walkthrough of plot constraints and layout trade-offs.",
  contentHtml: "<p>Body</p>",
  tags: ["guides", "5-marla"],
};

describe("postSlugSchema", () => {
  it("accepts lowercase kebab slugs and rejects others", () => {
    expect(postSlugSchema.safeParse("a-good-slug").success).toBe(true);
    expect(postSlugSchema.safeParse("Bad Slug").success).toBe(false);
    expect(postSlugSchema.safeParse("UPPER").success).toBe(false);
    expect(postSlugSchema.safeParse("a--b").success).toBe(false);
  });
});

describe("createPostSchema", () => {
  it("accepts a valid post", () => {
    expect(createPostSchema.safeParse(validPost).success).toBe(true);
  });

  it("enforces excerpt 20-160 and title 3-120", () => {
    expect(createPostSchema.safeParse({ ...validPost, excerpt: "too short" }).success).toBe(false);
    expect(
      createPostSchema.safeParse({ ...validPost, excerpt: "x".repeat(161) }).success,
    ).toBe(false);
    expect(createPostSchema.safeParse({ ...validPost, title: "ab" }).success).toBe(false);
  });

  it("limits tags to 5 and rejects non-kebab tags", () => {
    expect(createPostSchema.safeParse({ ...validPost, tags: ["a", "b", "c", "d", "e", "f"] }).success).toBe(false);
    expect(createPostSchema.safeParse({ ...validPost, tags: ["Not A Tag"] }).success).toBe(false);
  });

  it("caps SEO overrides and content size", () => {
    expect(createPostSchema.safeParse({ ...validPost, seoTitle: "x".repeat(61) }).success).toBe(false);
    expect(
      createPostSchema.safeParse({ ...validPost, contentHtml: "x".repeat(500 * 1024 + 1) }).success,
    ).toBe(false);
  });
});

describe("updatePostSchema", () => {
  it("requires at least one field", () => {
    expect(updatePostSchema.safeParse({}).success).toBe(false);
    expect(updatePostSchema.safeParse({ title: "New title" }).success).toBe(true);
  });
});

describe("publishPostSchema", () => {
  it("accepts a boolean only", () => {
    expect(publishPostSchema.safeParse({ publish: true }).success).toBe(true);
    expect(publishPostSchema.safeParse({ publish: "yes" }).success).toBe(false);
  });
});

describe("postListQuerySchema", () => {
  it("coerces pagination and defaults them", () => {
    const parsed = postListQuerySchema.parse({ page: "2", pageSize: "10" });
    expect(parsed).toEqual({ page: 2, pageSize: 10 });
    expect(postListQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
  });

  it("validates status against the enum", () => {
    expect(postListQuerySchema.safeParse({ status: "DRAFT" }).success).toBe(true);
    expect(postListQuerySchema.safeParse({ status: "NOPE" }).success).toBe(false);
  });
});

describe("postImageFileSchema", () => {
  it("accepts an allowed mime within the size cap", () => {
    expect(
      postImageFileSchema.safeParse({ filename: "cover.png", mime: "image/png", size: 1024 })
        .success,
    ).toBe(true);
  });

  it("rejects disallowed mimes and oversized files", () => {
    expect(
      postImageFileSchema.safeParse({ filename: "x.gif", mime: "image/gif", size: 1024 }).success,
    ).toBe(false);
    expect(
      postImageFileSchema.safeParse({
        filename: "big.png",
        mime: "image/png",
        size: 5 * 1024 * 1024 + 1,
      }).success,
    ).toBe(false);
  });
});
