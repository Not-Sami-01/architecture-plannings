import type { MetadataRoute } from "next";

import { ROUTES } from "@/config/constants";
import { GUIDES } from "@/content/guides";
import { absoluteUrl } from "@/lib/seo/metadata";

/** Auto-generated sitemap of every indexable marketing page (CONTENT.md §6). */
export default function sitemap(): MetadataRoute.Sitemap {
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

  const paths = [...staticPaths, ...GUIDES.map((guide) => ROUTES.guide(guide.slug))];

  return paths.map((path) => ({
    url: absoluteUrl(path),
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: path === ROUTES.home ? 1 : 0.7,
  }));
}
