import type { Metadata } from "next";

import { APP } from "@/config/constants";
import { publicConfig } from "@/config/public-config";
import { PageHeader } from "@/components/common/page-header";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${APP.name} for custom house designs.`,
};

/** Phase 1 placeholder — the rate-limited contact form lands with FR-11 tooling in a later increment. */
export default function ContactPage() {
  return (
    <main>
      <PageHeader
        title="Contact us"
        description="The fastest way to reach the studio is WhatsApp. We usually reply within a few hours."
      />
      <div className="mx-auto w-full max-w-6xl px-4 pb-16">
        <div className="flex flex-col gap-4 rounded-xl border p-6">
          {publicConfig.whatsappNumber ? (
            <p className="text-sm text-muted-foreground">
              WhatsApp:{" "}
              <a
                href={`https://wa.me/${publicConfig.whatsappNumber}`}
                className="font-medium underline underline-offset-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                Start a chat
              </a>
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            Prefer email? Start an order and use the order message thread — every order has its own
            conversation with the studio.
          </p>
        </div>
      </div>
    </main>
  );
}
