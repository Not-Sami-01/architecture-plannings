import Link from "next/link";

import { APP, ROUTES } from "@/config/constants";
import { listActivePackages } from "@/lib/packages";
import { Button } from "@/components/ui/button";
import { HowItWorksSteps } from "@/components/marketing/how-it-works-steps";
import { PackageCard } from "@/components/marketing/package-card";

export default async function HomePage() {
  const packages = await listActivePackages().catch(() => []);

  return (
    <main>
      <section className="border-b bg-muted/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 py-20 md:py-28">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
            {APP.tagline}
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">{APP.description}</p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" render={<Link href={ROUTES.newOrder} />}>
              Start your order
            </Button>
            <Button size="lg" variant="outline" render={<Link href={ROUTES.portfolio} />}>
              See our work
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16" aria-labelledby="packages-heading">
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

      <section className="border-t bg-muted/30 py-16" aria-labelledby="process-heading">
        <div className="mx-auto mb-8 w-full max-w-6xl px-4">
          <h2 id="process-heading" className="text-2xl font-semibold tracking-tight">
            How it works
          </h2>
        </div>
        <HowItWorksSteps />
      </section>
    </main>
  );
}
