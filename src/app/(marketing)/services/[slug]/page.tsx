import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ROUTES } from "@/config/constants";
import { PACKAGE_PAGES, packagePageSlugs } from "@/content/packages";
import { listActivePackages } from "@/lib/packages";
import { formatMoney } from "@/lib/format";
import { buildMetadata } from "@/lib/seo/metadata";
import { serviceSchema } from "@/lib/seo/schema";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ClosingCta } from "@/components/common/closing-cta";
import { ContentSections } from "@/components/common/content-sections";
import { FaqSection } from "@/components/common/faq-section";
import { JsonLd } from "@/components/common/json-ld";
import { PageHeader } from "@/components/common/page-header";
import { SiteDisclaimer } from "@/components/common/site-disclaimer";

type PackagePageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return packagePageSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PackagePageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = PACKAGE_PAGES[slug];
  if (!content) return {};
  return buildMetadata(content.seo);
}

export default async function PackagePage({ params }: PackagePageProps) {
  const { slug } = await params;
  const content = PACKAGE_PAGES[slug];
  if (!content) notFound();

  const pkg = (await listActivePackages().catch(() => [])).find((p) => p.slug === content.slug);

  return (
    <main>
      <Breadcrumbs
        items={[
          { label: "Home", href: ROUTES.home },
          { label: "Services", href: ROUTES.services },
          { label: content.crumbLabel },
        ]}
      />
      <PageHeader title={content.title} description={content.lead} links={content.links} />

      <article className="mx-auto w-full max-w-3xl px-4 pb-12">
        <ContentSections blocks={content.blocks} />
      </article>

      <section className="mx-auto w-full max-w-3xl px-4 pb-12" aria-labelledby="pricing">
        <h2 id="pricing" className="text-2xl font-semibold tracking-tight">
          {content.pricingHeading}
        </h2>
        {pkg ? (
          <div className="mt-6 rounded-xl border bg-card p-6">
            <p className="text-3xl font-semibold tracking-tight">{formatMoney(pkg.price)}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {pkg.revisionLimit} free revisions are included — {content.pricingNote}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Your quote confirms the final amount before you pay anything.
            </p>
          </div>
        ) : (
          <p className="mt-6 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Pricing for this package is being updated — start an order and we will quote you
            directly.
          </p>
        )}
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 pb-12">
        <FaqSection items={content.faq} />
      </section>

      <div className="mx-auto w-full max-w-3xl px-4 pb-12">
        <SiteDisclaimer />
      </div>

      <JsonLd
        data={[
          serviceSchema({
            name: content.crumbLabel,
            description: content.seo.description,
            path: content.seo.path,
            ...(pkg ? { offers: { price: pkg.price } } : {}),
          }),
        ]}
      />

      <ClosingCta
        text={`Start your ${content.crumbLabel.toLowerCase()} order in under five minutes. No payment until you accept your quote.`}
        links={[{ label: "Compare all packages", href: ROUTES.services }]}
      />
    </main>
  );
}
