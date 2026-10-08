import type { Metadata } from "next";

import { ROUTES } from "@/config/constants";
import {
  howItWorksBlocks,
  howItWorksFaq,
  howItWorksLead,
  howItWorksSeo,
  howItWorksSteps,
} from "@/content/how-it-works";
import { buildMetadata } from "@/lib/seo/metadata";
import { howToSchema } from "@/lib/seo/schema";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ClosingCta } from "@/components/common/closing-cta";
import { ContentSections } from "@/components/common/content-sections";
import { FaqSection } from "@/components/common/faq-section";
import { JsonLd } from "@/components/common/json-ld";
import { PageHeader } from "@/components/common/page-header";
import { ProcessSteps } from "@/components/marketing/process-steps";

export const metadata: Metadata = buildMetadata(howItWorksSeo);

export default function HowItWorksPage() {
  return (
    <main>
      <Breadcrumbs
        items={[
          { label: "Home", href: ROUTES.home },
          { label: "How It Works" },
        ]}
      />
      <PageHeader
        title="How to Get a House Plan Online: Our Step-by-Step Process"
        description={howItWorksLead}
        links={[{ label: "Start your order", href: ROUTES.newOrder }]}
      />

      <section className="pb-16" aria-labelledby="steps-heading">
        <div className="mx-auto mb-8 w-full max-w-6xl px-4">
          <h2 id="steps-heading" className="text-2xl font-semibold tracking-tight">
            The five steps
          </h2>
        </div>
        <ProcessSteps steps={howItWorksSteps} />
      </section>

      <section className="border-t bg-muted py-16">
        <div className="mx-auto w-full max-w-3xl px-4">
          <ContentSections blocks={howItWorksBlocks} />
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto w-full max-w-3xl px-4">
          <FaqSection items={howItWorksFaq} />
        </div>
      </section>

      <JsonLd
        data={{
          ...howToSchema({
            name: howItWorksSeo.title,
            description: howItWorksSeo.description,
            path: howItWorksSeo.path,
            steps: howItWorksSteps.map((step) => ({ name: step.title })),
          }),
        }}
      />

      <ClosingCta
        heading="Ready to begin?"
        text="Start an order now, or log in to track an order you have already placed."
        links={[{ label: "Log in", href: ROUTES.login }]}
      />
    </main>
  );
}
