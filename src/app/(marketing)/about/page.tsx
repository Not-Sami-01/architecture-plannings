import type { Metadata } from "next";
import { CompassIcon, PenToolIcon, ShieldCheckIcon } from "lucide-react";

import { APP } from "@/config/constants";
import { PageHeader } from "@/components/common/page-header";

export const metadata: Metadata = {
  title: "About",
  description: `The story behind ${APP.name}.`,
};

const VALUES = [
  {
    icon: PenToolIcon,
    title: "Design-first",
    description:
      "Trained architectural drafting, delivered as clean, construction-ready drawings. We design houses we would want to live in.",
  },
  {
    icon: CompassIcon,
    title: "Clear process",
    description:
      "Quoted scope, defined revision limits, and status updates you can follow yourself. You always know where your project stands.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Protected work",
    description:
      "Drafts are watermarked previews. Full-quality, print-ready files unlock only after final payment — protecting both sides.",
  },
] as const;

export default function AboutPage() {
  return (
    <main>
      <PageHeader
        title="About the studio"
        description={`${APP.name} is a solo design practice. Every drawing is produced in-house in Adobe Illustrator — floor plans, elevations, and complete sets — with a structured process that keeps your project on track.`}
      />
      <div className="mx-auto w-full max-w-6xl px-4 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          {VALUES.map((value) => (
            <div key={value.title} className="rounded-xl border bg-card p-6">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <value.icon className="size-5" aria-hidden />
              </span>
              <p className="mt-3 font-medium">{value.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{value.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl border bg-muted/30 p-8">
          <h2 className="text-xl font-semibold tracking-tight">Our promise</h2>
          <ul className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">A fixed quote before any payment.</strong> You
              approve the price and scope before paying the advance.
            </li>
            <li>
              <strong className="text-foreground">Watermarked drafts, real feedback.</strong> You
              review a low-resolution preview and request changes within your free revision limit.
            </li>
            <li>
              <strong className="text-foreground">Yours after final payment.</strong> The complete,
              high-resolution drawing set is unlocked for download and stays in your dashboard.
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
