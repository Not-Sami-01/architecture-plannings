import type { Metadata } from "next";
import { ClockIcon, MessageCircleIcon, MessagesSquareIcon } from "lucide-react";

import { APP, ROUTES } from "@/config/constants";
import { publicConfig } from "@/config/public-config";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${APP.name} for custom house designs.`,
};

export default function ContactPage() {
  return (
    <main>
      <PageHeader
        title="Contact us"
        description="Questions about a plot, a package, or the process? Reach the studio directly — we usually reply within a few hours."
      />
      <div className="mx-auto w-full max-w-6xl px-4 pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-6">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageCircleIcon className="size-5" aria-hidden />
            </span>
            <p className="font-medium">WhatsApp (fastest)</p>
            {publicConfig.whatsappNumber ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Chat directly with the studio — best for quick questions about plot sizes and
                  packages.
                </p>
                <Button
                  className="w-fit"
                  render={
                    <a
                      href={`https://wa.me/${publicConfig.whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  Start a chat
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                WhatsApp chat is being configured. Please use an order message thread in the
                meantime.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-card p-6">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessagesSquareIcon className="size-5" aria-hidden />
            </span>
            <p className="font-medium">Order message thread</p>
            <p className="text-sm text-muted-foreground">
              Every order has a private conversation with the studio — the best place for file
              specifics, revision notes, and payment questions. Submit an order and the thread opens
              automatically.
            </p>
            <Button variant="outline" className="w-fit" render={<a href={ROUTES.newOrder} />}>
              Start an order
            </Button>
          </div>
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
          <ClockIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            Studio hours: Saturday–Thursday, 10:00–19:00 (PKT). Quotes are usually sent within 24
            hours of an order.
          </p>
        </div>
      </div>
    </main>
  );
}
