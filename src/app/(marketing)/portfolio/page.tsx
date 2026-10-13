import type { Metadata } from "next";
import Link from "next/link";

import { CTA, PORTFOLIO_PLOT_SIZES, PORTFOLIO_STYLE_OPTIONS, ROUTES } from "@/config/constants";
import {
  portfolioFaq,
  portfolioHowToUse,
  portfolioLead,
  portfolioProjectFields,
  portfolioSeo,
} from "@/content/portfolio";
import { listVisibleProjects } from "@/lib/portfolio";
import { buildMetadata } from "@/lib/seo/metadata";
import { collectionPageSchema } from "@/lib/seo/schema";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ClosingCta } from "@/components/common/closing-cta";
import { ContentSections } from "@/components/common/content-sections";
import { FaqSection } from "@/components/common/faq-section";
import { JsonLd } from "@/components/common/json-ld";
import { PageHeader } from "@/components/common/page-header";
import { PortfolioCard } from "@/components/marketing/portfolio-card";

export const metadata: Metadata = buildMetadata(portfolioSeo);

export const dynamic = "force-dynamic";

type PortfolioIndexProps = {
  searchParams: Promise<{ plot?: string; style?: string }>;
};

function plotToken(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "-");
}

export default async function PortfolioPage({ searchParams }: PortfolioIndexProps) {
  const { plot, style } = await searchParams;
  const projects = await listVisibleProjects({
    ...(plot ? { plot } : {}),
    ...(style ? { style } : {}),
  });

  const hasFilters = Boolean(plot || style);

  const pill = (href: string, label: string, active: boolean) => (
    <Link
      key={href}
      href={href}
      aria-current={active ? "true" : undefined}
      className={
        active
          ? "rounded-full border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          : "rounded-full border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
      }
    >
      {label}
    </Link>
  );

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

      <section className="mx-auto w-full max-w-6xl px-4 pb-12" aria-label="Projects">
        <nav aria-label="Filter projects" className="mb-6 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Plot size
            </span>
            {pill(ROUTES.portfolio, "All", !hasFilters)}
            {PORTFOLIO_PLOT_SIZES.map((value) => (
              pill(
                `${ROUTES.portfolio}?plot=${plotToken(value)}${style ? `&style=${style}` : ""}`,
                value,
                plot === plotToken(value),
              )
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Style
            </span>
            {PORTFOLIO_STYLE_OPTIONS.map((option) => (
              pill(
                `${ROUTES.portfolio}?style=${option.token}${plot ? `&plot=${plot}` : ""}`,
                option.label,
                style === option.token,
              )
            ))}
          </div>
        </nav>

        {projects.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <PortfolioCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/30 p-8">
            <h2 className="text-xl font-semibold tracking-tight">
              {hasFilters ? "No projects match these filters" : "Gallery in progress"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {hasFilters
                ? "Try a different plot size or style — or ask us for samples on WhatsApp."
                : "The full project gallery is being prepared. Until then, ask us for samples on WhatsApp — or start an order and we will share designs that match your plot."}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {hasFilters ? (
                <Link
                  href={ROUTES.portfolio}
                  className="rounded-lg border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  Clear filters
                </Link>
              ) : null}
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
        )}
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-12" aria-labelledby="each-project">
        <h2 id="each-project" className="font-display font-medium text-3xl leading-snug tracking-tight">
          What you will see in each project
        </h2>
        <ContentSections className="mt-4" blocks={[{ kind: "ul", items: portfolioProjectFields }]} />
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-12" aria-labelledby="how-to-use">
        <h2 id="how-to-use" className="font-display font-medium text-3xl leading-snug tracking-tight">
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
