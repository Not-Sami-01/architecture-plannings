import type { Metadata } from "next";
import Link from "next/link";

import { CTA, ROUTES } from "@/config/constants";
import { GUIDES, GUIDE_CATEGORIES, guidesIndexSeo } from "@/content/guides";
import { buildMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ClosingCta } from "@/components/common/closing-cta";
import { PageHeader } from "@/components/common/page-header";

export const metadata: Metadata = buildMetadata(guidesIndexSeo);

export default function GuidesPage() {
  return (
    <main>
      <Breadcrumbs
        items={[
          { label: "Home", href: ROUTES.home },
          { label: "Guides" },
        ]}
      />
      <PageHeader
        title="House Design Guides"
        description={
          "Plain-language guides on house plans, drawings, plot sizes, layouts and costs — written to help you plan your home before you order."
        }
        links={[{ label: CTA.primary, href: ROUTES.newOrder }]}
      />

      <div className="mx-auto w-full max-w-6xl px-4 pb-16">
        {GUIDE_CATEGORIES.map((category) => {
          const guides = GUIDES.filter((guide) => guide.category === category);
          if (guides.length === 0) return null;

          return (
            <section key={category} className="mb-12" aria-labelledby={`category-${category}`}>
              <h2 id={`category-${category}`} className="text-2xl font-semibold tracking-tight">
                {category}
              </h2>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {guides.map((guide) => (
                  <article key={guide.slug} className="flex flex-col rounded-xl border bg-card p-5">
                    <h3 className="font-medium">
                      <Link
                        href={ROUTES.guide(guide.slug)}
                        className="text-foreground hover:text-primary"
                      >
                        {guide.seo.title}
                      </Link>
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {guide.summary}
                    </p>
                    <p className="mt-3 text-sm">
                      <Link
                        href={ROUTES.guide(guide.slug)}
                        className="font-medium text-primary underline underline-offset-4"
                      >
                        {guide.published ? "Read the guide" : "Preview the guide"}
                      </Link>
                    </p>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <ClosingCta
        heading="Prefer a direct answer?"
        text="Ask us about your plot and requirements — we will tell you honestly what you need."
        links={[{ label: "Contact us", href: ROUTES.contact }]}
      />
    </main>
  );
}
