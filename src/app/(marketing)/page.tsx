import Link from "next/link";
import {
  ArrowRightIcon,
  CompassIcon,
  DraftingCompassIcon,
  LayersIcon,
  MapIcon,
  MessageSquareIcon,
  RulerIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { APP, ROUTES } from "@/config/constants";
import { listActivePackages } from "@/lib/packages";
import { Button } from "@/components/ui/button";
import { HowItWorksSteps } from "@/components/marketing/how-it-works-steps";
import { PackageCard } from "@/components/marketing/package-card";

const SERVICES = [
  {
    icon: MapIcon,
    title: "2D floor plans",
    description: "Scaled, dimensioned plans ready for approvals and contractor discussions.",
  },
  {
    icon: DraftingCompassIcon,
    title: "Front & side elevations",
    description: "Exterior views that show materials, proportions, and finishing style.",
  },
  {
    icon: LayersIcon,
    title: "Complete drawing sets",
    description: "Plans, elevations, sections, and door/window schedules in one package.",
  },
  {
    icon: RulerIcon,
    title: "Any plot size",
    description: "Feet, meters, marla, or kanal — we work in the units you think in.",
  },
] as const;

const TRUST = [
  {
    icon: MessageSquareIcon,
    title: "Clear communication",
    description: "Every order has a private message thread with the studio. Ask anything, anytime.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Protected drawings",
    description: "Drafts arrive as watermarked previews. Full-quality files unlock after final payment.",
  },
  {
    icon: CompassIcon,
    title: "Structured revisions",
    description: "Each package includes free revisions, so refining the design never feels risky.",
  },
] as const;

export default async function HomePage() {
  const packages = await listActivePackages().catch(() => []);

  return (
    <main>
      <section className="border-b bg-muted/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 py-20 md:py-28">
          <p className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            Custom residential architecture — delivered online
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
            {APP.tagline}
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">{APP.description}</p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" render={<Link href={ROUTES.newOrder} />}>
              Start your order
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            <Button size="lg" variant="outline" render={<Link href={ROUTES.portfolio} />}>
              See our work
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Free quote within 24 hours · No payment until you approve the price
          </p>
        </div>
      </section>

      <section className="py-16" aria-labelledby="services-heading">
        <div className="mx-auto mb-10 w-full max-w-6xl px-4">
          <h2 id="services-heading" className="text-2xl font-semibold tracking-tight">
            What we design
          </h2>
          <p className="mt-2 text-muted-foreground">
            From single floor plans to complete construction-ready sets.
          </p>
        </div>
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service) => (
            <div key={service.title} className="rounded-xl border bg-card p-5">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <service.icon className="size-5" aria-hidden />
              </span>
              <p className="mt-3 font-medium">{service.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/30 py-16" aria-labelledby="packages-heading">
        <div className="mx-auto w-full max-w-6xl px-4">
          <h2 id="packages-heading" className="text-2xl font-semibold tracking-tight">
            Simple packages, fixed prices
          </h2>
          <p className="mt-2 text-muted-foreground">
            Every package includes free revisions. Extra revisions are quoted transparently.
          </p>
        </div>
        <div className="mx-auto mt-8 grid w-full max-w-6xl gap-6 px-4 md:grid-cols-3">
          {packages.length > 0 ? (
            packages.map((pkg) => <PackageCard key={pkg.id} package={pkg} />)
          ) : (
            <div className="md:col-span-3">
              <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
                Packages are being updated. Start an order and we will quote you directly.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="py-16" aria-labelledby="trust-heading">
        <div className="mx-auto mb-10 w-full max-w-6xl px-4">
          <h2 id="trust-heading" className="text-2xl font-semibold tracking-tight">
            Why clients trust the studio
          </h2>
        </div>
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 md:grid-cols-3">
          {TRUST.map((item) => (
            <div key={item.title} className="flex gap-4 rounded-xl border bg-card p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <item.icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/30 py-16" aria-labelledby="process-heading">
        <div className="mx-auto mb-8 w-full max-w-6xl px-4">
          <h2 id="process-heading" className="text-2xl font-semibold tracking-tight">
            How it works
          </h2>
        </div>
        <HowItWorksSteps />
      </section>

      <section className="py-20" aria-labelledby="cta-heading">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 text-center">
          <h2 id="cta-heading" className="text-3xl font-semibold tracking-tight">
            Ready to see your house on paper?
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Start with a free quote. You only pay once you approve the price and scope.
          </p>
          <Button size="lg" render={<Link href={ROUTES.newOrder} />}>
            Start your order
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </section>
    </main>
  );
}
