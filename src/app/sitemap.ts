import type { MetadataRoute } from "next";

import { ROUTES } from "@/config/constants";
import { GUIDES } from "@/content/guides";
import { listPublishedPosts, listPublishedTags } from "@/lib/posts";
import { listVisibleProjectSlugs } from "@/lib/portfolio";
import { absoluteUrl } from "@/lib/seo/metadata";

/** Auto-generated sitemap of every indexable marketing page (CONTENT.md §6). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    ROUTES.home,
    ROUTES.services,
    ROUTES.packagePages.floorPlan,
    ROUTES.packagePages.planElevation,
    ROUTES.packagePages.fullPackage,
    ROUTES.howItWorks,
    ROUTES.portfolio,
    ROUTES.guides,
    ROUTES.about,
    ROUTES.contact,
    ROUTES.plotPages.marla5,
    ROUTES.plotPages.marla10,
    ROUTES.plotPages.kanal1,
  ];

  const [posts, tags, projects] = await Promise.all([
    listPublishedPosts({ limit: 500 }).catch(() => []),
    listPublishedTags().catch(() => []),
    listVisibleProjectSlugs().catch(() => []),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [...staticPaths, ...GUIDES.map((g) => ROUTES.guide(g.slug))].map(
    (path) => ({
      url: absoluteUrl(path),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: path === ROUTES.home ? 1 : 0.7,
    })
  );

  const blogEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl(ROUTES.blog),
      lastModified: posts[0]?.updatedAt ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    ...tags.map((tag) => ({
      url: absoluteUrl(ROUTES.blogTag(tag)),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...posts.map((post) => ({
      url: absoluteUrl(ROUTES.blogPost(post.slug)),
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  const portfolioEntries: MetadataRoute.Sitemap = projects.map((project) => ({
    url: absoluteUrl(ROUTES.portfolioProject(project.slug)),
    lastModified: project.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...blogEntries, ...portfolioEntries];
}
