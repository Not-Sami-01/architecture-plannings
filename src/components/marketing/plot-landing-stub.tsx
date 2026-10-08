import Link from "next/link";

import { CTA, ROUTES } from "@/config/constants";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ClosingCta } from "@/components/common/closing-cta";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { ImageOffIcon } from "lucide-react";

type PlotLandingStubProps = {
  title: string;
  lead: string;
  portfolioHref: string;
  /** Short label for the last breadcrumb. */
  crumbLabel: string;
};

/**
 * Short version of a plot-size landing page while the full 800+ word article
 * is being written (CONTENT.md §4). Keeps the route live and linkable.
 */
export function PlotLandingStub({ title, lead, portfolioHref, crumbLabel }: PlotLandingStubProps) {
  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", href: ROUTES.home },
          { label: crumbLabel },
        ]}
      />
      <PageHeader title={title} description={lead} />
      <div className="mx-auto w-full max-w-6xl px-4 pb-16">
        <EmptyState
          icon={ImageOffIcon}
          title="Full guide in progress"
          description="We are writing the detailed version of this page. Browse matching projects in the portfolio, or start an order and tell us your plot size."
          action={
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <Button render={<Link href={portfolioHref} />}>See matching designs</Button>
              <Button variant="outline" render={<Link href={ROUTES.newOrder} />}>
                {CTA.primary}
              </Button>
            </div>
          }
        />
      </div>
      <ClosingCta />
    </>
  );
}
