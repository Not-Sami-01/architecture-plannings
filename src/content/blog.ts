import { ROUTES } from "@/config/constants";
import type { SeoMeta } from "./types";

/**
 * Blog SEO copy (plan 6). The index/tag/post pages build metadata from these
 * constants plus the live DB row — titles and descriptions live here so they
 * stay reviewable and consistent with CONTENT.md §2 (primary keyword first).
 */

export const blogIndexSeo: SeoMeta = {
  title: "Blog",
  description:
    "Practical articles on house plans, architectural drawings, plot sizes, building costs and the design process — written by the ArchiPlan Studio team.",
  path: ROUTES.blog,
  keywords: [
    "house plan blog",
    "architectural design articles",
    "building cost guides",
    "home design tips",
  ],
};

export function blogTagSeo(tag: string): SeoMeta {
  const label = tag.replace(/-/g, " ");
  return {
    title: `Blog: ${label}`,
    description: `All articles filed under “${label}” — house plans, drawings, costs and design guidance from ArchiPlan Studio.`,
    path: ROUTES.blogTag(tag),
    keywords: [label, `${label} house plan`, "architectural guides"],
  };
}

/** Default OG/Twitter fields for a published post (overridable via SEO fields). */
export function blogPostSocial(post: {
  title: string;
  excerpt: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  slug: string;
}) {
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  return { title, description, path: ROUTES.blogPost(post.slug) };
}
