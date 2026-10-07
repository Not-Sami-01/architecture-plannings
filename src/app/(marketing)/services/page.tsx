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
      <section className="mx-auto w-full max-w-6xl px-4 py-12" aria-labelledby="included-heading">
        <h2 id="included-heading" className="text-2xl font-semibold tracking-tight">
          What is included in every order
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">A private message thread</p>
            <p className="mt-1">
              Talk to the studio directly on your order — ask questions, share references, and get
              status answers without leaving your dashboard.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Free revisions, clearly limited</p>
            <p className="mt-1">
              Each package includes free revisions (2–3 depending on package). Extra revisions are
              quoted transparently before any charge — never silently.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Watermarked draft previews</p>
            <p className="mt-1">
              Review your design as a watermarked preview, approve it, then receive the full-quality
              drawing set after final payment.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Email updates at every status change</p>
            <p className="mt-1">
              Quote ready, payment confirmed, draft delivered — you get an email each time your
              order moves forward.
            </p>
          </div>
        </div>
      </section>
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
