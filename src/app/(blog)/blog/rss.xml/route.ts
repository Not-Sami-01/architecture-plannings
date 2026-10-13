import { APP, ROUTES } from "@/config/constants";
import { absoluteUrl } from "@/lib/seo/metadata";
import { listPublishedPosts } from "@/lib/posts";

/** Escapes XML text/attribute content (post titles and excerpts are user input). */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * RSS 2.0 feed at /blog/rss.xml (plan 6). Latest 20 published posts; every
 * entry links to its canonical URL. Regenerated on demand — reads are cached
 * under POSTS_CACHE_TAG, so feed content tracks publish/unpublish instantly.
 */
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const posts = await listPublishedPosts({ limit: 20 });
  const channelLink = absoluteUrl(ROUTES.blog);

  const items = posts
    .map((post) => {
      const link = absoluteUrl(ROUTES.blogPost(post.slug));
      const pubDate = post.publishedAt
        ? new Date(post.publishedAt).toUTCString()
        : new Date(post.updatedAt).toUTCString();
      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <description>${escapeXml(post.excerpt)}</description>`,
        `      <pubDate>${pubDate}</pubDate>`,
        ...post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`),
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(`${APP.name} Blog`)}</title>`,
    `    <link>${escapeXml(channelLink)}</link>`,
    `    <description>${escapeXml(APP.description)}</description>`,
    '    <language>en</language>',
    `    <atom:link href="${escapeXml(absoluteUrl(ROUTES.blogRss))}" rel="self" type="application/rss+xml"/>`,
    items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
