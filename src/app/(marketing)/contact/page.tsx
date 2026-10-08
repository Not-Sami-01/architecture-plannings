import type { Metadata } from "next";
import Link from "next/link";
import { ClockIcon, MessageCircleIcon, MessagesSquareIcon } from "lucide-react";

import { CTA, ROUTES, WHATSAPP } from "@/config/constants";
import { publicConfig } from "@/config/public-config";
import {
  contactDescription,
  contactFaq,
  contactLead,
  contactNotSure,
  contactPrepare,
  contactSeo,
} from "@/content/contact";
import { SITE_FACTS } from "@/content/site-facts";
import { buildMetadata } from "@/lib/seo/metadata";
import { localBusinessSchema } from "@/lib/seo/schema";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ClosingCta } from "@/components/common/closing-cta";
import { FaqSection } from "@/components/common/faq-section";
import { JsonLd } from "@/components/common/json-ld";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = buildMetadata({
  ...contactSeo,
  description: contactDescription(),
});

const whatsappHref = publicConfig.whatsappNumber
  ? `https://wa.me/${publicConfig.whatsappNumber}?text=${encodeURIComponent(WHATSAPP.prefilledMessage)}`
  : null;

export default function ContactPage() {
  return (
    <main>
      <Breadcrumbs
        items={[
          { label: "Home", href: ROUTES.home },
          { label: "Contact" },
        ]}
      />
      <PageHeader
        title={contactSeo.title}
        description={contactLead}
        links={[{ label: CTA.primary, href: ROUTES.newOrder }]}
      />

      <div className="mx-auto w-full max-w-6xl px-4 pb-12">
        <section aria-labelledby="ways" className="grid gap-6 md:grid-cols-3">
          <h2 id="ways" className="sr-only">
            Ways to reach us
          </h2>

          <div className="flex flex-col gap-3 rounded-xl border bg-card p-6">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageCircleIcon className="size-5" aria-hidden />
            </span>
            <p className="font-medium">WhatsApp (fastest)</p>
            {whatsappHref ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Quick questions and sharing plot photos — the fastest way to reach the studio.
                </p>
                <Button
                  className="w-fit"
                  render={
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer" />
                  }
                >
                  Start a chat
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                WhatsApp chat is being configured. Please use your order message thread in the
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
            <Button variant="outline" className="w-fit" render={<Link href={ROUTES.newOrder} />}>
              {CTA.primary}
            </Button>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-card p-6">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClockIcon className="size-5" aria-hidden />
            </span>
            <p className="font-medium">Response time</p>
            <p className="text-sm text-muted-foreground">
              {SITE_FACTS.responseTime
                ? `We usually reply within ${SITE_FACTS.responseTime} on working days.`
                : "We usually reply the same working day."}
              {SITE_FACTS.workingHours ? ` Working hours: ${SITE_FACTS.workingHours}.` : ""}
            </p>
            {SITE_FACTS.supportEmail ? (
              <a
                href={`mailto:${SITE_FACTS.supportEmail}`}
                className="text-sm font-medium text-primary underline underline-offset-4"
              >
                {SITE_FACTS.supportEmail}
              </a>
            ) : null}
          </div>
        </section>

        <section className="mt-12" aria-labelledby="prepare">
          <h2 id="prepare" className="text-2xl font-semibold tracking-tight">
            Before you contact us
          </h2>
          <p className="mt-2 text-muted-foreground">
            You will get a faster, more useful answer if you include:
          </p>
          <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-muted-foreground">
            {contactPrepare.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mt-12" aria-labelledby="not-sure">
          <h2 id="not-sure" className="text-2xl font-semibold tracking-tight">
            Not sure where to start?
          </h2>
          <ul className="mt-4 flex flex-col gap-2 text-muted-foreground">
            {contactNotSure.map((item) => (
              <li key={item.href}>
                {item.text}{" "}
                <Link href={item.href} className="font-medium text-primary underline underline-offset-4">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {SITE_FACTS.serviceAreas ? (
          <section className="mt-12" aria-labelledby="service-area">
            <h2 id="service-area" className="text-2xl font-semibold tracking-tight">
              Service area
            </h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              We work online with clients in {SITE_FACTS.serviceAreas}. Because the process is
              digital, you do not need to visit us. Overseas clients are welcome.
            </p>
          </section>
        ) : null}

        <section className="mt-12">
          <FaqSection items={contactFaq} />
        </section>
      </div>

      <JsonLd data={localBusinessSchema()} />

      <ClosingCta
        heading="Ready to talk about your plot?"
        text="Start your order in under five minutes, or ask us anything on WhatsApp first."
        links={[{ label: "See packages and pricing", href: ROUTES.services }]}
      />
    </main>
  );
}
