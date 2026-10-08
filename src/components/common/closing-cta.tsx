import Link from "next/link";

import { CTA, ROUTES } from "@/config/constants";
import { Button } from "@/components/ui/button";

type ClosingCtaProps = {
  heading?: string;
  text?: string;
  /** Extra text links shown under the primary button. */
  links?: readonly { label: string; href: string }[];
};

/** Standard end-of-page CTA: primary action is always "Start your order" (CONTENT.md §8). */
export function ClosingCta({
  heading = "Ready to start your house plan?",
  text = "Create your order in under five minutes. No payment until you accept your quote.",
  links,
}: ClosingCtaProps) {
  return (
    <section className="border-t bg-primary py-16" aria-labelledby="closing-cta">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 text-center">
        <h2 id="closing-cta" className="text-3xl font-semibold tracking-tight text-primary-foreground">
          {heading}
        </h2>
        <p className="max-w-xl text-primary-foreground/80">{text}</p>
        <Button size="lg" variant="secondary" render={<Link href={ROUTES.newOrder} />}>
          {CTA.primary}
        </Button>
        {links && links.length > 0 ? (
          <p className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-primary-foreground/80">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="underline underline-offset-4 hover:text-primary-foreground"
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
