import type { MetadataRoute } from "next";

import { ROUTES } from "@/config/constants";
import { absoluteUrl } from "@/lib/seo/metadata";

/** Public pages are crawlable; dashboards, admin and APIs are not (CONTENT.md §6). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [ROUTES.dashboard, ROUTES.admin.root, "/api/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
