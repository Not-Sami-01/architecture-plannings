import type { Metadata } from "next";
import Link from "next/link";

import { CTA, ROUTES } from "@/config/constants";
import {
  portfolioFaq,
  portfolioHowToUse,
  portfolioLead,
  portfolioPlotFilters,
  portfolioProjectFields,
  portfolioSeo,
  portfolioStyleFilters,
} from "@/content/portfolio";
import { buildMetadata } from "@/lib/seo/metadata";
import { collectionPageSchema } from "@/lib/seo/schema";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ClosingCta } from "@/components/common/closing-cta";
import { ContentSections } from "@/components/common/content-sections";
import { FaqSection } from "@/components/common/faq-section";
import { InlineText } from "@/components/common/inline-text";
import { JsonLd } from "@/components/common/json-ld";
import { PageHeader } from "@/components/common/page-header";

export const metadata: Metadata = buildMetadata(portfolioSeo);

export default function PortfolioPage() {
  return (
    <main>
      <Breadcrumbs
        items={[
          { label: "Home", href: ROUTES.home },
          { label: "Portfolio" },
        ]}
      />
      <PageHeader
        title={portfolioSeo.title}
        description={portfolioLead}
        links={[{ label: CTA.primary, href: ROUTES.newOrder }]}
      />

      <section className="mx-auto w-full max-w-6xl px-4 pb-12" aria-labelledby="filter-plot">
        <h2 id="filter-plot" className="text-2xl font-semibold tracking-tight">
          Filter by plot size
        </h2>
        <p className="mt-2 text-muted-foreground">
          Different plots need different solutions. Start with the size closest to yours:
        </p>
        <ul className="mt-4 flex flex-col gap-3">
          {portfolioPlotFilters.map((filter) => (
            <li key={filter.label} className="text-muted-foreground">
              <Link href={filter.href} className="font-medium text-primary underline underline-offset-4">
                {filter.label}
              </Link>{" "}
              — <InlineText text={filter.text} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-12" aria-labelledby="filter-style">
        <h2 id="filter-style" className="text-2xl font-semibold tracking-tight">
          Filter by style
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {portfolioStyleFilters.map((filter) => (
            <li key={filter.label} className="text-muted-foreground">
              <Link href={filter.href} className="font-medium text-primary underline underline-offset-4">
                {filter.label}
              </Link>{" "}
              — {filter.text}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          Compare them in{" "}
          <Link href={ROUTES.guide("modern-vs-classic-elevation")} className="text-primary underline underline-offset-4">
            modern vs classic elevation: how to choose a style
          </Link>
          .
        </p>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-12">
        <div className="rounded-xl border border-dashed bg-muted/30 p-8">
          <h2 className="text-xl font-semibold tracking-tight">Gallery in progress</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            The full project gallery is being prepared. Until then, ask us for samples on WhatsApp
            — or start an order and we will share designs that match your plot.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={ROUTES.contact}
              className="rounded-lg border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Ask for samples
            </Link>
            <Link
              href={ROUTES.newOrder}
              className="rounded-lg border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {CTA.primary}
            </Link>
          </div>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Filter links work with the gallery as soon as it lands — the CMS for portfolio projects
          arrives in Phase 5.
        </p>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-12" aria-labelledby="each-project">
        <h2 id="each-project" className="text-2xl font-semibold tracking-tight">
          What you will see in each project
        </h2>
        <ContentSections className="mt-4" blocks={[{ kind: "ul", items: portfolioProjectFields }]} />
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-12" aria-labelledby="how-to-use">
        <h2 id="how-to-use" className="text-2xl font-semibold tracking-tight">
          How to use the portfolio
        </h2>
        <ContentSections className="mt-4" blocks={[{ kind: "ol", items: portfolioHowToUse }]} />
        <p className="mt-4 text-sm text-muted-foreground">
          This makes the first draft closer to what you imagine and can reduce revisions.
        </p>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <FaqSection items={portfolioFaq} />
      </section>

      <JsonLd
        data={collectionPageSchema({
          name: portfolioSeo.title,
          description: portfolioSeo.description,
          path: portfolioSeo.path,
        })}
      />

      <ClosingCta
        heading="Find your design"
        text="Start an order with your plot details, or see packages and pricing first."
        links={[{ label: "See packages and pricing", href: ROUTES.services }]}
      />
    </main>
  );
}
