import Link from "next/link";
import Image from "next/image";
import {
  ArrowRightIcon,
  DownloadIcon,
  FileSearchIcon,
  ReceiptTextIcon,
  RulerIcon,
} from "lucide-react";

import { CTA, ROUTES } from "@/config/constants";
import { homeHero } from "@/content/home";
import { Button } from "@/components/ui/button";

const STEP_ICONS = [RulerIcon, ReceiptTextIcon, FileSearchIcon, DownloadIcon];

/**
 * Full-bleed cinematic hero: the render fills the section behind a themed
 * scrim, with an editorial serif headline, pill CTA and four glass step
 * cards along the bottom.
 */
export function HomeHero() {
  return (
    <section aria-labelledby="hero-heading" className="relative isolate overflow-hidden bg-hero text-hero-ink">
      <Image
        src="/images/hero-main.webp"
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        priority
        decoding="async"
        className="absolute inset-0 -z-20 object-cover object-center"
      />
      {/* Scrim: vertical on mobile (text sits over the image), horizontal on md+. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-hero via-hero/85 to-hero/40 md:bg-gradient-to-r md:from-hero md:via-hero/80 md:to-hero/10"
      />
      {/* Warm hairline where the hero meets the next section. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-hero-accent/60 to-transparent"
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-14 pt-16 md:gap-16 md:pt-24 lg:pb-20">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2.5 rounded-full border border-hero-ink/20 bg-hero-ink/5 px-3.5 py-1.5 text-xs font-medium tracking-wide backdrop-blur">
            <span className="relative flex size-1.5" aria-hidden>
              <span className="absolute size-full animate-ping rounded-full bg-hero-accent opacity-75" />
              <span className="relative size-1.5 rounded-full bg-hero-accent" />
            </span>
            {homeHero.eyebrow}
          </p>

          <h1
            id="hero-heading"
            className="mt-6 font-display text-4xl leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl"
          >
            {homeHero.titleLead}
            <span className="block italic text-hero-accent">{homeHero.titleAccent}</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-hero-ink/75 sm:text-lg">
            {homeHero.lead}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
            <Button
              size="lg"
              className="rounded-full bg-hero-ink px-6 text-hero hover:bg-hero-ink/90"
              render={<Link href={ROUTES.newOrder} />}
            >
              {CTA.primary}
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            <p className="text-sm text-hero-ink/60">{homeHero.note}</p>
          </div>

          <p className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {homeHero.links.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                className="font-medium text-hero-ink/85 underline-offset-4 transition-colors hover:text-hero-accent hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </p>
        </div>

        <ol className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {homeHero.steps.map((step, index) => {
            const Icon = STEP_ICONS[index];
            return (
              <li
                key={step.title}
                className="rounded-2xl border border-hero-ink/15 bg-hero-ink/10 p-4 backdrop-blur-md transition-colors hover:border-hero-accent/50 hover:bg-hero-ink/15"
              >
                <div className="flex items-start justify-between">
                  <Icon className="size-5 text-hero-accent" aria-hidden />
                  <span className="font-mono text-xs text-hero-ink/50" aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="mt-8 text-sm font-medium leading-snug md:text-base">{step.title}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
