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

/** Full-bleed image band with a themed scrim and left-aligned copy. */
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
        className="absolute inset-0 -z-10 bg-gradient-to-b from-hero/70 via-hero/85 to-hero md:bg-gradient-to-r md:from-hero md:via-hero/80 md:to-hero/10"
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-20 md:py-28">
        <div className="max-w-xl">
          <p className="font-mono text-xs uppercase tracking-widest text-hero-accent">{eyebrow}</p>
          <h2 className="mt-4 font-display text-3xl leading-tight tracking-tight md:text-4xl">
            {heading}
          </h2>
          <p className="mt-4 leading-relaxed text-hero-ink/75">{text}</p>
          {cta ? (
            <Button
              className="mt-7 rounded-full border border-hero-ink/25 bg-hero-ink/10 px-5 text-hero-ink backdrop-blur hover:bg-hero-ink/20"
              variant="ghost"
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
