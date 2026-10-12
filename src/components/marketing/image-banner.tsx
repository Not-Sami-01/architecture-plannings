import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type ImageBannerProps = {
  /** Public path of the banner image (served through next/image). */
  imageSrc: string;
  eyebrow: string;
  heading: string;
  text: string;
  cta?: { label: string; href: string };
};

/** Full-bleed photo band on the near-black surface, with left-aligned editorial copy. */
export function ImageBanner({ imageSrc, eyebrow, heading, text, cta }: ImageBannerProps) {
  return (
    <section className="relative isolate overflow-hidden bg-hero text-hero-ink">
      <Image
        src={imageSrc}
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        decoding="async"
        className="absolute inset-0 -z-20 object-cover object-center"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-hero/90 via-hero/85 to-hero/95 md:bg-gradient-to-r md:from-hero md:via-hero/85 md:to-hero/40"
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-20 md:py-28">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-hero-accent">
            {eyebrow}
          </p>
          <h2 className="mt-4 font-display text-3xl leading-[1.08] tracking-tight md:text-5xl">
            {heading}
          </h2>
          <p className="mt-5 leading-relaxed text-hero-ink/75">{text}</p>
          {cta ? (
            <Button
              className="mt-8 border-hero-ink/30 bg-hero-ink/10 text-hero-ink hover:bg-hero-ink/20 hover:text-hero-ink"
              variant="outline"
              render={<Link href={cta.href} />}
            >
              {cta.label}
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
