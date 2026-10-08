import type { Metadata } from "next";

import { APP } from "@/config/constants";
import { publicConfig } from "@/config/public-config";
import type { SeoMeta } from "@/content/types";

/** Absolute URL for a path, from `NEXT_PUBLIC_APP_URL`. */
export function absoluteUrl(path: string): string {
  return new URL(path, publicConfig.appUrl).toString();
}

/**
 * Page metadata from a content module's front matter (CONTENT.md §6):
 * title, meta description, keywords, canonical, Open Graph and Twitter card.
 * The root layout already appends "| ArchiPlan Studio" to the title.
 */
export function buildMetadata(seo: SeoMeta, options?: { noindex?: boolean }): Metadata {
  const url = absoluteUrl(seo.path);
  const title = `${seo.title} | ${APP.name}`;

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords ? [...seo.keywords] : undefined,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: seo.description,
      url,
      siteName: APP.name,
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary",
      title,
      description: seo.description,
    },
    ...(options?.noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
