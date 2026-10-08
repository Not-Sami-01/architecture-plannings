import type { Metadata } from "next";

import { ROUTES } from "@/config/constants";
import { PLOT_STUBS } from "@/content/plot-pages";
import { buildMetadata } from "@/lib/seo/metadata";
import { SiteDisclaimer } from "@/components/common/site-disclaimer";
import { PlotLandingStub } from "@/components/marketing/plot-landing-stub";

export const metadata: Metadata = buildMetadata(PLOT_STUBS.kanal1.seo);

export default function Kanal1Page() {
  const content = PLOT_STUBS.kanal1;

  return (
    <main>
      <PlotLandingStub
        title={content.title}
        lead={content.lead}
        portfolioHref={`${ROUTES.portfolio}?plot=1-kanal`}
        crumbLabel="1 Kanal House Design"
      />
      <div className="mx-auto w-full max-w-6xl px-4 pb-12">
        <SiteDisclaimer />
      </div>
    </main>
  );
}
