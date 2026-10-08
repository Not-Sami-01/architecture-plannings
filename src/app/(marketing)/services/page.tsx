import type { Metadata } from "next";
import Link from "next/link";

import { CTA, ROUTES } from "@/config/constants";
import { SITE_FACTS } from "@/content/site-facts";
import {
  serviceChoice,
  serviceComparisonRows,
  servicePriceFactors,
  servicesBlocks,
  servicesFaq,
  servicesLead,
  servicesSeo,
} from "@/content/services";
import { listActivePackages } from "@/lib/packages";
import { formatMoney } from "@/lib/format";
import { buildMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ClosingCta } from "@/components/common/closing-cta";
import { ContentSections } from "@/components/common/content-sections";
import { FaqSection } from "@/components/common/faq-section";
import { PageHeader } from "@/components/common/page-header";

export const metadata: Metadata = buildMetadata(servicesSeo);

const PACKAGE_LINKS: Record<string, string> = {
  "floor-plan": ROUTES.packagePages.floorPlan,
  "plan-elevation": ROUTES.packagePages.planElevation,
  "full-package": ROUTES.packagePages.fullPackage,
};

const CHECK = "✔";
const CROSS = "✘";

export default async function ServicesPage() {
  const packages = await listActivePackages().catch(() => []);

  return (
    <main>
      <Breadcrumbs
        items={[
          { label: "Home", href: ROUTES.home },
          { label: "Services" },
        ]}
      />
      <PageHeader
        title={servicesSeo.title}
        description={servicesLead}
        links={[{ label: CTA.primary, href: ROUTES.newOrder }]}
      />

      <section className="mx-auto w-full max-w-6xl px-4 pb-12" aria-labelledby="compare">
        <h2 id="compare" className="text-2xl font-semibold tracking-tight">
          Compare our house plan design packages
        </h2>
        <div className="mt-6 overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-medium">
                  Package
                </th>
                {packages.map((pkg) => (
                  <th key={pkg.slug} scope="col" className="px-4 py-3 text-left font-medium">
                    <Link href={PACKAGE_LINKS[pkg.slug] ?? ROUTES.services} className="text-primary underline underline-offset-4">
                      {pkg.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {serviceComparisonRows.map((row) => (
                <tr key={row.label} className="border-t">
                  <th scope="row" className="px-4 py-3 text-left font-normal text-muted-foreground">
                    {row.label}
                  </th>
                  {packages.map((pkg) => (
                    <td key={pkg.slug} className="px-4 py-3">
                      <span aria-label={row.slugs.includes(pkg.slug) ? "Included" : "Not included"}>
                        {row.slugs.includes(pkg.slug) ? CHECK : CROSS}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t">
                <th scope="row" className="px-4 py-3 text-left font-normal text-muted-foreground">
                  Free revisions
                </th>
                {packages.map((pkg) => (
                  <td key={pkg.slug} className="px-4 py-3">
                    {pkg.revisionLimit}
                  </td>
                ))}
              </tr>
              <tr className="border-t">
                <th scope="row" className="px-4 py-3 text-left font-normal text-muted-foreground">
                  Price
                </th>
                {packages.map((pkg) => (
                  <td key={pkg.slug} className="px-4 py-3 font-medium text-foreground">
                    {formatMoney(pkg.price)}
                  </td>
                ))}
              </tr>
              {SITE_FACTS.firstDraftDays ? (
                <tr className="border-t">
                  <th scope="row" className="px-4 py-3 text-left font-normal text-muted-foreground">
                    Typical first draft
                  </th>
                  {packages.map((pkg) => (
                    <td key={pkg.slug} className="px-4 py-3">
                      {SITE_FACTS.firstDraftDays} days
                    </td>
                  ))}
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Prices and revision limits are managed in the admin panel and shown here live from the
          database. Your quote confirms the final amount before you pay.
        </p>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-12" aria-labelledby="which-package">
        <h2 id="which-package" className="text-2xl font-semibold tracking-tight">
          Which package should I choose?
        </h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {serviceChoice.map((choice) => (
            <div key={choice.heading} className="rounded-xl border bg-card p-5">
              <p className="font-medium">{choice.heading}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{choice.text}</p>
              <Link
                href={choice.href}
                className="mt-3 inline-block text-sm font-medium text-primary underline underline-offset-4"
              >
                Explore this package
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Still unsure? Read our drawing guides or{" "}
          <Link href={ROUTES.contact} className="text-primary underline underline-offset-4">
            ask us a question
          </Link>
          .
        </p>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-12" aria-labelledby="price-factors">
        <h2 id="price-factors" className="text-2xl font-semibold tracking-tight">
          What affects the price of a house plan?
        </h2>
        <ContentSections
          className="mt-6 flex flex-col gap-3"
          blocks={[{ kind: "ul", items: servicePriceFactors }]}
        />
        <p className="mt-4 text-sm text-muted-foreground">
          Our guide on{" "}
          <Link href={ROUTES.guide("how-much-does-a-house-plan-cost")} className="text-primary underline underline-offset-4">
            how much a house plan costs
          </Link>{" "}
          explains each factor in detail.
        </p>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-12">
        <ContentSections blocks={servicesBlocks} />
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <FaqSection items={servicesFaq} />
      </section>

      <ClosingCta
        heading="Ready to choose?"
        text="Pick your package in step one of the order form. You can view the portfolio first, or log in to continue an order you already began."
        links={[
          { label: "View our portfolio", href: ROUTES.portfolio },
          { label: "Log in", href: ROUTES.login },
        ]}
      />
    </main>
  );
}
