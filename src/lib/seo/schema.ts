import { APP, ROUTES } from "@/config/constants";
import { SITE_FACTS } from "@/content/site-facts";
import type { Crumb, FaqItem } from "@/content/types";
import { absoluteUrl } from "./metadata";

/**
 * JSON-LD builders (CONTENT.md §6 structured data). Rendered by the
 * `JsonLd` component. Only emits fields we can honestly claim — unconfirmed
 * facts in `SITE_FACTS` are skipped entirely.
 */

export type JsonLdNode = Record<string, unknown>;

export function organizationSchema(): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: APP.name,
    description: APP.description,
    url: absoluteUrl(ROUTES.home),
    ...(SITE_FACTS.city ? { areaServed: SITE_FACTS.serviceAreas ?? SITE_FACTS.city } : {}),
    ...(SITE_FACTS.supportEmail
      ? { contactPoint: { contactType: "customer support", email: SITE_FACTS.supportEmail } }
      : {}),
  };
}

export function localBusinessSchema(): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: APP.name,
    description: APP.description,
    url: absoluteUrl(ROUTES.home),
    priceRange: "$$", // Packages are fixed-price and shown publicly on /services.
    ...(SITE_FACTS.city ? { address: { addressLocality: SITE_FACTS.city } } : {}),
    ...(SITE_FACTS.supportEmail ? { email: SITE_FACTS.supportEmail } : {}),
  };
}

export function breadcrumbSchema(items: readonly Crumb[]): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  };
}

export function faqSchema(items: readonly FaqItem[]): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function serviceSchema(input: {
  name: string;
  description: string;
  path: string;
  /** Live site currency (plan 3); defaults to the constants fallback. */
  currency?: string;
  offers?: { price: number };
}): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: input.name,
    name: input.name,
    description: input.description,
    provider: { "@type": "Organization", name: APP.name, url: absoluteUrl(ROUTES.home) },
    areaServed: SITE_FACTS.serviceAreas ?? SITE_FACTS.city ?? undefined,
    ...(input.offers
      ? {
          offers: {
            "@type": "Offer",
            price: input.offers.price,
            priceCurrency: input.currency ?? APP.currency,
            url: absoluteUrl(input.path),
          },
        }
      : {}),
  };
}

export function howToSchema(input: {
  name: string;
  description: string;
  path: string;
  steps: readonly { name: string; text?: string }[];
}): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    step: input.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      ...(step.text ? { text: step.text } : {}),
    })),
  };
}

export function collectionPageSchema(input: {
  name: string;
  description: string;
  path: string;
}): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    isPartOf: { "@type": "WebSite", name: APP.name, url: absoluteUrl(ROUTES.home) },
  };
}

/** BlogPosting JSON-LD for a published post (plan 6, index/search rich results). */
export function blogPostingSchema(input: {
  title: string;
  description: string;
  path: string;
  publishedAt: Date | string | null;
  updatedAt?: Date | string;
  authorName?: string | null;
  coverImageId?: string | null;
}): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(input.path) },
    publisher: { "@type": "Organization", name: APP.name, url: absoluteUrl(ROUTES.home) },
    ...(input.authorName ? { author: { "@type": "Person", name: input.authorName } } : {}),
    ...(input.publishedAt
      ? { datePublished: new Date(input.publishedAt).toISOString() }
      : {}),
    ...(input.updatedAt ? { dateModified: new Date(input.updatedAt).toISOString() } : {}),
    ...(input.coverImageId
      ? { image: absoluteUrl(`/api/posts/images/${input.coverImageId}`) }
      : {}),
  };
}
