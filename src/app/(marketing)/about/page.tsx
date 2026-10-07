import type { Metadata } from "next";

import { APP } from "@/config/constants";
import { PageHeader } from "@/components/common/page-header";

export const metadata: Metadata = {
  title: "About",
  description: `The story behind ${APP.name}.`,
};

export default function AboutPage() {
  return (
    <main>
      <PageHeader
        title="About the studio"
        description={`${APP.name} is a solo design practice. Every drawing is produced in-house in Adobe Illustrator — floor plans, elevations, and complete sets — with a structured process that keeps your project on track.`}
      />
      <div className="mx-auto w-full max-w-6xl px-4 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border p-6">
            <p className="font-medium">Design-first</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Trained architectural drafting, delivered as clean, construction-ready drawings.
            </p>
          </div>
          <div className="rounded-xl border p-6">
            <p className="font-medium">Clear process</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Quoted scope, defined revision limits, and status updates you can follow yourself.
            </p>
          </div>
          <div className="rounded-xl border p-6">
            <p className="font-medium">Protected work</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Drafts are watermarked previews. Full-quality files unlock after final payment.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
