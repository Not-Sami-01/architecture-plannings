import type { Metadata } from "next";
import Link from "next/link";

import { ROUTES } from "@/config/constants";
import {
  homeBanner,
  homeCta,
  homePackages,
  homePlotSize,
  homeProcess,
  homeQuickAnswers,
  homeSeo,
  homeTrust,
} from "@/content/home";
import { listActivePackages } from "@/lib/packages";
import { listRecentPublishedPosts } from "@/lib/posts";
import { getSiteSettings } from "@/lib/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import { organizationSchema } from "@/lib/seo/schema";
import { ClosingCta } from "@/components/common/closing-cta";
import { FaqSection } from "@/components/common/faq-section";
import { JsonLd } from "@/components/common/json-ld";
import { Button } from "@/components/ui/button";
import { HomeHero } from "@/components/marketing/home-hero";
import { ImageBanner } from "@/components/marketing/image-banner";
import { NumberedCards } from "@/components/marketing/numbered-cards";
import { PackageCard } from "@/components/marketing/package-card";
import { PlotSizeChips } from "@/components/marketing/plot-size-chips";
import { BlogCard } from "@/components/marketing/blog-card";

export const metadata: Metadata = buildMetadata(homeSeo);

export default async function HomePage() {
  const [packages, { currency }, posts] = await Promise.all([
    listActivePackages().catch(() => []),
    getSiteSettings(),
    listRecentPublishedPosts(3).catch(() => []),
  ]);

  return (
    <main>
      <HomeHero />

      <section className="py-16 md:py-24" aria-labelledby="packages-heading">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="grid gap-6 md:grid-cols-12">
            <div className="md:col-span-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground">
                {homePackages.eyebrow}
              </p>
              <h2
                id="packages-heading"
                className="mt-4 font-display font-medium text-3xl leading-[1.08] tracking-tight md:text-4xl"
              >
                {homePackages.heading}
              </h2>
            </div>
            <p className="max-w-2xl self-end leading-relaxed text-muted-foreground md:col-span-5">
              {homePackages.text}
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {packages.length > 0 ? (
              packages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  package={pkg}
                  currency={currency}
                  featured={pkg.slug === homePackages.featuredSlug}
                  featuredLabel="Most popular"
                />
              ))
            ) : (
              <p className="rounded-lg border border-dashed p-10 text-center text-muted-foreground md:col-span-3">
                Packages are being updated. Start an order and we will quote you directly.
              </p>
            )}
          </div>
        </div>
      </section>

      <ImageBanner
        imageSrc="/images/second-banner.webp"
        eyebrow={homeBanner.eyebrow}
        heading={homeBanner.heading}
        text={homeBanner.text}
        cta={homeBanner.cta}
      />

      <section className="border-y bg-muted py-16 md:py-24" aria-labelledby="plot-size-heading">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="grid gap-6 md:grid-cols-12">
            <h2
              id="plot-size-heading"
              className="font-display font-medium text-3xl leading-[1.08] tracking-tight md:col-span-7 md:text-4xl"
            >
              {homePlotSize.heading}
            </h2>
            <p className="max-w-2xl self-end leading-relaxed text-muted-foreground md:col-span-5">
              {homePlotSize.text}
            </p>
          </div>
          <PlotSizeChips />
        </div>
      </section>

      <section className="bg-hero py-16 text-hero-ink md:py-24" aria-labelledby="process-heading">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="grid gap-6 md:grid-cols-12">
            <div className="md:col-span-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-hero-accent">
                {homeProcess.eyebrow}
              </p>
              <h2
                id="process-heading"
                className="mt-4 font-display font-medium text-3xl leading-[1.08] tracking-tight md:text-4xl"
              >
                {homeProcess.heading}
              </h2>
            </div>
            <p className="max-w-2xl self-end leading-relaxed text-hero-ink/70 md:col-span-5">
              {homeProcess.text}
            </p>
          </div>

          <NumberedCards items={homeProcess.cards} tone="dark" className="mt-12" />

          <div className="mt-10">
            <Button
              variant="outline"
              className="border-hero-ink/30 bg-transparent text-hero-ink hover:bg-hero-ink/10 hover:text-hero-ink"
              render={<Link href={homeProcess.cta.href} />}
            >
              {homeProcess.cta.label}
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24" aria-labelledby="trust-heading">
        <div className="mx-auto w-full max-w-6xl px-4">
          <h2
            id="trust-heading"
            className="max-w-3xl font-display font-medium text-3xl leading-[1.08] tracking-tight md:text-4xl"
          >
            {homeTrust.heading}
          </h2>
          <div className="mt-10 grid gap-x-8 gap-y-8 md:grid-cols-3">
            {homeTrust.cards.map((card) => (
              <div key={card.title} className="border-t pt-4">
                <p className="font-display font-medium text-xl leading-snug">{card.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y bg-muted py-16 md:py-24">
        <div className="mx-auto w-full max-w-3xl px-4">
          <FaqSection items={homeQuickAnswers} heading="Quick answers" id="quick-answers" />
        </div>
      </section>

      {posts.length > 0 ? (
        <section className="py-16 md:py-24" aria-labelledby="blog-heading">
          <div className="mx-auto w-full max-w-6xl px-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground">
                  From the blog
                </p>
                <h2
                  id="blog-heading"
                  className="mt-2 font-display text-3xl font-medium tracking-tight"
                >
                  Recent articles
                </h2>
              </div>
              <Link
                href={ROUTES.blog}
                className="font-medium text-primary underline underline-offset-4"
              >
                All articles
              </Link>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

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
