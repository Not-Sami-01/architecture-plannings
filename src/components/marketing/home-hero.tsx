import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon } from "lucide-react";

import { CTA, ROUTES } from "@/config/constants";
import { formatMoney } from "@/lib/format";
import { homeHero, homePackages } from "@/content/home";
import { Button } from "@/components/ui/button";

type HeroFeaturedPackage = {
  name: string;
  slug: string;
  price: number;
};

type HomeHeroProps = {
  /** Featured package shown on the floating card over the hero photo (null while loading). */
  featuredPackage?: HeroFeaturedPackage | null;
  /** Live site currency (plan 3). */
  currency?: string;
};

/**
 * Editorial hero: tracked eyebrow, oversized serif headline and lead copy on a
 * bone page, a four-step hairline strip, then a full-bleed photo band with the
 * featured package floating over it.
 */
export function HomeHero({ featuredPackage, currency }: HomeHeroProps) {
  return (
    <section aria-labelledby="hero-heading">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-10 md:pb-16 md:pt-16">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground">
              {homeHero.eyebrow}
            </p>
            <h1
              id="hero-heading"
              className="mt-5 font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
            >
              {homeHero.titleLead}
              <span className="block italic">{homeHero.titleAccent}</span>
            </h1>
          </div>

          <div className="flex flex-col justify-end gap-6 md:col-span-5">
            <p className="max-w-md leading-relaxed text-muted-foreground md:text-base">
              {homeHero.lead}
            </p>
            <div className="flex flex-col items-start gap-3">
              <Button
                size="lg"
                className="rounded-full bg-cta px-7 text-cta-foreground shadow-[0_3px_0_0_var(--cta-shadow)] transition-all hover:bg-cta/90 active:translate-y-[3px] active:shadow-none"
                render={<Link href={ROUTES.newOrder} />}
              >
                {CTA.primary}
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
              <p className="text-sm text-muted-foreground">{homeHero.note}</p>
            </div>
            <p className="flex flex-wrap gap-x-5 gap-y-1">
              {homeHero.links.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                >
                  {link.label}
                </Link>
              ))}
            </p>
          </div>
        </div>

        <ol className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 border-t pt-6 md:grid-cols-4">
          {homeHero.steps.map((step, index) => (
            <li key={step.title}>
              <span className="font-mono text-xs text-accent-foreground" aria-hidden>
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-2 font-display text-lg leading-snug">{step.title}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="relative">
        <div className="relative h-[46vh] min-h-[300px] w-full md:h-[62vh]">
          <Image
            src="/images/hero-main.webp"
            alt={homeHero.imageAlt}
            fill
            sizes="100vw"
            priority
            decoding="async"
            className="object-cover object-center"
          />
        </div>

        {featuredPackage ? (
          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto w-full max-w-6xl px-4 pb-5 md:pb-8">
              <div className="w-full rounded-[20px] border border-glass-edge bg-glass/85 p-5 shadow-glass backdrop-blur-[18px] sm:max-w-sm md:ml-auto md:mr-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground">
                  {homePackages.eyebrow}
                </p>
                <p className="mt-2 font-display text-2xl leading-snug tracking-tight">
                  {featuredPackage.name}
                </p>
                <p className="mt-1 text-lg font-semibold tracking-tight">
                  {formatMoney(featuredPackage.price, currency)}
                </p>
                <Button
                  className="mt-4 w-full"
                  render={<Link href={`${ROUTES.newOrder}?package=${featuredPackage.slug}`} />}
                >
                  {CTA.primary}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
