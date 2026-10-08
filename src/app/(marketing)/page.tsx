import type { Metadata } from "next";
import Link from "next/link";

import { ROUTES } from "@/config/constants";
import {
  homeCta,
  homePackages,
  homePlotSize,
  homeProcess,
  homeQuickAnswers,
  homeSeo,
  homeTrust,
} from "@/content/home";
import { listActivePackages } from "@/lib/packages";
import { buildMetadata } from "@/lib/seo/metadata";
import { organizationSchema } from "@/lib/seo/schema";
import { ClosingCta } from "@/components/common/closing-cta";
import { FaqSection } from "@/components/common/faq-section";
import { JsonLd } from "@/components/common/json-ld";
import { Button } from "@/components/ui/button";
import { HomeHero } from "@/components/marketing/home-hero";
import { NumberedCards } from "@/components/marketing/numbered-cards";
import { PackageCard } from "@/components/marketing/package-card";
import { PlotSizeChips } from "@/components/marketing/plot-size-chips";

export const metadata: Metadata = buildMetadata(homeSeo);

export default async function HomePage() {
  const packages = await listActivePackages().catch(() => []);
  const featured = packages.find((pkg) => pkg.slug === homePackages.featuredSlug);

  return (
    <main>
      <HomeHero revisions={featured?.revisionLimit} />

      <section className="border-y bg-muted/30 py-16" aria-labelledby="process-heading">
        <div className="mx-auto w-full max-w-6xl px-4">
          <p className="text-xs font-medium uppercase tracking-widest text-accent-foreground">
            {homeProcess.eyebrow}
          </p>
          <h2
            id="process-heading"
            className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl"
          >
            {homeProcess.heading}
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{homeProcess.text}</p>
          <NumberedCards items={homeProcess.cards} className="mt-8" />
          <div className="mt-8">
            <Button variant="outline" render={<Link href={homeProcess.cta.href} />}>
              {homeProcess.cta.label}
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16" aria-labelledby="packages-heading">
        <div className="mx-auto w-full max-w-6xl px-4">
          <p className="text-xs font-medium uppercase tracking-widest text-accent-foreground">
            {homePackages.eyebrow}
          </p>
          <h2
            id="packages-heading"
            className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl"
          >
            {homePackages.heading}
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{homePackages.text}</p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {packages.length > 0 ? (
              packages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  package={pkg}
                  featured={pkg.slug === homePackages.featuredSlug}
                  featuredLabel="Most popular"
                />
              ))
            ) : (
              <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground md:col-span-3">
                Packages are being updated. Start an order and we will quote you directly.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/30 py-16" aria-labelledby="plot-size-heading">
        <div className="mx-auto w-full max-w-6xl px-4">
          <h2 id="plot-size-heading" className="text-2xl font-semibold tracking-tight md:text-3xl">
            {homePlotSize.heading}
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{homePlotSize.text}</p>
          <PlotSizeChips />
        </div>
      </section>

      <section className="py-16" aria-labelledby="trust-heading">
        <div className="mx-auto w-full max-w-6xl px-4">
          <h2 id="trust-heading" className="text-2xl font-semibold tracking-tight md:text-3xl">
            {homeTrust.heading}
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {homeTrust.cards.map((card) => (
              <div key={card.title} className="rounded-xl border bg-card p-5">
                <p className="font-medium">{card.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/30 py-16">
        <div className="mx-auto w-full max-w-3xl px-4">
          <FaqSection items={homeQuickAnswers} heading="Quick answers" id="quick-answers" />
        </div>
      </section>

      <JsonLd data={organizationSchema()} />

      <ClosingCta
        heading={homeCta.heading}
        text={homeCta.text}
        links={[
          { label: "See packages and pricing", href: ROUTES.services },
          { label: "Log in", href: ROUTES.login },
        ]}
      />
    </main>
  );
}
