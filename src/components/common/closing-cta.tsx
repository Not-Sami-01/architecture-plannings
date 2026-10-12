import Link from "next/link";

import { CTA, ROUTES } from "@/config/constants";
import { Button } from "@/components/ui/button";

type ClosingCtaProps = {
  heading?: string;
  text?: string;
  /** Extra text links shown under the primary button. */
  links?: readonly { label: string; href: string }[];
};

/** Standard end-of-page CTA: pale-sage band, primary action is always "Start your order" (CONTENT.md §8). */
export function ClosingCta({
  heading = "Ready to start your house plan?",
  text = "Create your order in under five minutes. No payment until you accept your quote.",
  links,
}: ClosingCtaProps) {
  return (
    <section
      className="border-y bg-cta-band text-cta-band-foreground"
      aria-labelledby="closing-cta"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5 px-4 py-16 text-center md:py-24">
        <h2 id="closing-cta" className="max-w-3xl font-display font-medium text-4xl leading-[1.08] tracking-tight md:text-5xl">
          {heading}
        </h2>
        <p className="max-w-xl leading-relaxed text-cta-band-foreground/75">{text}</p>
        <Button
          size="lg"
          className="mt-1 bg-cta text-cta-foreground shadow-[0_3px_0_0_var(--cta-shadow)] transition-all hover:bg-cta/90 active:translate-y-[3px] active:shadow-none"
          render={<Link href={ROUTES.newOrder} />}
        >
          {CTA.primary}
        </Button>
        {links && links.length > 0 ? (
          <p className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-11 items-center text-cta-band-foreground/75 underline underline-offset-4 hover:text-cta-band-foreground"
              >
                {link.label}
              </Link>
            ))}
          </p>
        ) : null}
      </div>
    </section>
  );
}
