import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { HowItWorksSteps } from "@/components/marketing/how-it-works-steps";

export const metadata: Metadata = {
  title: "How It Works",
  description: "The process from requirements to final drawing delivery.",
};

export default function HowItWorksPage() {
  return (
    <main>
      <PageHeader
        title="How it works"
        description="Five clear steps from your requirements to a complete drawing set — with email updates at every status change."
      />
      <HowItWorksSteps />
      <div className="h-16" />
    </main>
  );
}
