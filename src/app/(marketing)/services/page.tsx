import type { Metadata } from "next";

import { APP } from "@/config/constants";
import { listActivePackages } from "@/lib/packages";
import { PageHeader } from "@/components/common/page-header";
import { PackageCard } from "@/components/marketing/package-card";
import { HowItWorksSteps } from "@/components/marketing/how-it-works-steps";

export const metadata: Metadata = {
  title: "Services & Pricing",
  description: `Packages and prices for custom house designs at ${APP.name}.`,
};

export default async function ServicesPage() {
  const packages = await listActivePackages().catch(() => []);

  return (
    <main>
      <PageHeader
        title="Services & pricing"
        description="Fixed-price packages covering floor plans, elevations, and complete drawing sets. Revisions are included — see each package for its limit."
      />
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-10 md:grid-cols-3">
        {packages.length > 0 ? (
          packages.map((pkg) => <PackageCard key={pkg.id} package={pkg} />)
        ) : (
          <p className="md:col-span-3 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            Packages are being updated — please check back soon, or start an order for a direct quote.
          </p>
        )}
      </div>
      <section className="border-t bg-muted/30 py-16" aria-labelledby="services-process">
        <div className="mx-auto mb-8 w-full max-w-6xl px-4">
          <h2 id="services-process" className="text-2xl font-semibold tracking-tight">
            What ordering looks like
          </h2>
        </div>
        <HowItWorksSteps />
      </section>
    </main>
  );
}
