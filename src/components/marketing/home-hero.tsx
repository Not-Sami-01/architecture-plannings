import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon } from "lucide-react";

import { CTA, ROUTES } from "@/config/constants";
import { homeHero } from "@/content/home";
import { Button } from "@/components/ui/button";

/**
 * Image-forward hero: the dusk render fills the band, graphite scrims keep the
 * copy readable at every width, and the four-step strip sits on the photo's
 * bottom edge. One clear Patina CTA, secondary links below it.
 */
export function HomeHero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden bg-hero text-hero-ink"
    >
      <Image
        src="/images/hero-main.webp"
        alt={homeHero.imageAlt}
        fill
        sizes="100vw"
        priority
        decoding="async"
        className="object-cover object-center"
      />
      {/* Scrims: horizontal for the copy column, vertical for the steps strip. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-hero via-hero/90 to-hero/30"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-hero via-transparent to-hero/40"
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col justify-end px-4 pb-10 pt-24 sm:pt-28 md:pb-14 md:pt-36 lg:min-h-[82svh] lg:pt-44">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-hero-accent">
            {homeHero.eyebrow}
          </p>
          <h1
            id="hero-heading"
            className="mt-5 font-display font-medium text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl"
          >
            {homeHero.titleLead}
            <span className="block text-hero-ink/75">{homeHero.titleAccent}</span>
          </h1>
          <p className="mt-6 max-w-xl leading-relaxed text-hero-ink/75">{homeHero.lead}</p>

          <div className="mt-8 flex flex-col items-start gap-3">
            <Button
              size="lg"
              className="rounded-full bg-cta px-7 text-cta-foreground shadow-[0_3px_0_0_var(--cta-shadow)] transition-all hover:bg-cta/90 active:translate-y-[3px] active:shadow-none"
              render={<Link href={ROUTES.newOrder} />}
            >
              {CTA.primary}
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            <p className="text-sm text-hero-ink/60">{homeHero.note}</p>
          </div>

          <p className="mt-6 flex flex-wrap gap-x-5 gap-y-1">
            {homeHero.links.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                className="inline-flex min-h-11 items-center text-sm font-medium text-hero-ink/80 underline underline-offset-4 transition-colors hover:text-hero-ink"
              >
                {link.label}
              </Link>
            ))}
          </p>
        </div>

        <ol className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-white/15 pt-6 md:grid-cols-4">
          {homeHero.steps.map((step, index) => (
            <li key={step.title}>
              <span className="font-mono text-xs text-hero-accent" aria-hidden>
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-2 font-display font-medium text-lg leading-snug">{step.title}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
