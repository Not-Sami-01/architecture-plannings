import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { CTA, ROUTES } from "@/config/constants";
import { homeHero } from "@/content/home";
import { Button } from "@/components/ui/button";
import { OrderCardMock } from "@/components/marketing/order-card-mock";

type HomeHeroProps = {
  /** Free revisions badge on the order-card visual (from the featured package). */
  revisions?: number;
};

/** Split home hero: headline + CTA on the left, order-card visual on the right. */
export function HomeHero({ revisions }: HomeHeroProps) {
  return (
    <section aria-labelledby="hero-heading">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 md:py-24 lg:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-accent-foreground">
            {homeHero.eyebrow}
          </p>
          <h1
            id="hero-heading"
            className="mt-4 max-w-xl text-4xl font-semibold tracking-tight md:text-5xl"
          >
            {homeHero.titleLead} <span className="text-primary">{homeHero.titleAccent}</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {homeHero.lead}
          </p>
          <div className="mt-6">
            <Button size="lg" render={<Link href={ROUTES.newOrder} />}>
              {CTA.primary}
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{homeHero.note}</p>
          <p className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {homeHero.links.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                className="font-medium text-primary hover:text-primary/80"
              >
                {link.label}
              </Link>
            ))}
          </p>
        </div>

        <OrderCardMock revisions={revisions} />
      </div>
    </section>
  );
}
