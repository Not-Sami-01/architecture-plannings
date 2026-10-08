import type { Metadata } from "next";

import { ROUTES } from "@/config/constants";
import { PLOT_STUBS } from "@/content/plot-pages";
import { buildMetadata } from "@/lib/seo/metadata";
import { SiteDisclaimer } from "@/components/common/site-disclaimer";
import { PlotLandingStub } from "@/components/marketing/plot-landing-stub";

export const metadata: Metadata = buildMetadata(PLOT_STUBS.marla5.seo);

export default function Marla5Page() {
  const content = PLOT_STUBS.marla5;

  return (
    <main>
      <PlotLandingStub
        title={content.title}
        lead={content.lead}
        portfolioHref={`${ROUTES.portfolio}?plot=5-marla`}
        crumbLabel="5 Marla House Design"
      />
      <div className="mx-auto w-full max-w-6xl px-4 pb-12">
        <SiteDisclaimer />
      </div>
    </main>
  );
}
