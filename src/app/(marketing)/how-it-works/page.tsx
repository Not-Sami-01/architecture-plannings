import type { Metadata } from "next";
import { BellRingIcon, LockIcon, ReceiptIcon } from "lucide-react";

import { ROUTES } from "@/config/constants";
import { PageHeader } from "@/components/common/page-header";
import { HowItWorksSteps } from "@/components/marketing/how-it-works-steps";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How It Works",
  description: "The process from requirements to final drawing delivery.",
};

const GUARANTEES = [
  {
    icon: ReceiptIcon,
    title: "Fixed quote first",
    description: "You approve the total price and the advance share before paying anything.",
  },
  {
    icon: BellRingIcon,
    title: "Email at every step",
    description: "Quote ready, payment confirmed, draft delivered — you are never left guessing.",
  },
  {
    icon: LockIcon,
    title: "Fair file protection",
    description:
      "You review watermarked drafts; the full-quality set unlocks immediately after final payment.",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <main>
      <PageHeader
        title="How it works"
        description="Five clear steps from your requirements to a complete drawing set — with email updates at every status change."
      />
      <HowItWorksSteps />

      <section className="mx-auto mt-16 w-full max-w-6xl px-4 pb-16" aria-labelledby="guarantees">
        <h2 id="guarantees" className="text-2xl font-semibold tracking-tight">
          What you can count on
        </h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {GUARANTEES.map((item) => (
            <div key={item.title} className="rounded-xl border bg-card p-5">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="size-5" aria-hidden />
              </span>
              <p className="mt-3 font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button size="lg" render={<a href={ROUTES.newOrder} />}>
            Start your order
          </Button>
        </div>
      </section>
    </main>
  );
}
