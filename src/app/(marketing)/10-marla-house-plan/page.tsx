import type { Metadata } from "next";

import { ROUTES } from "@/config/constants";
import { marla10Blocks, marla10Faq, marla10Lead, marla10Links, marla10Seo } from "@/content/plot-pages";
import { buildMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ClosingCta } from "@/components/common/closing-cta";
import { ContentSections } from "@/components/common/content-sections";
import { FaqSection } from "@/components/common/faq-section";
import { PageHeader } from "@/components/common/page-header";
import { SiteDisclaimer } from "@/components/common/site-disclaimer";

export const metadata: Metadata = buildMetadata(marla10Seo);

export default function Marla10Page() {
  return (
    <main>
      <Breadcrumbs
        items={[
          { label: "Home", href: ROUTES.home },
          { label: "Portfolio", href: ROUTES.portfolio },
          { label: "10 Marla House Plan" },
        ]}
      />
      <PageHeader title={marla10Seo.title} description={marla10Lead} links={marla10Links} />

      <article className="mx-auto w-full max-w-3xl px-4 pb-12">
        <ContentSections blocks={marla10Blocks} />
      </article>

      <section className="mx-auto w-full max-w-3xl px-4 pb-12">
        <FaqSection items={marla10Faq} />
      </section>

      <div className="mx-auto w-full max-w-3xl px-4 pb-12">
        <SiteDisclaimer />
      </div>

      <ClosingCta
        heading="Get your 10 marla house plan"
        text="Start an order with your plot details, or browse 10 marla projects in the portfolio first."
        links={[{ label: "See 10 marla projects", href: `${ROUTES.portfolio}?plot=10-marla` }]}
      />
    </main>
  );
}
