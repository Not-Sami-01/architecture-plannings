import type { Metadata } from "next";
import Link from "next/link";

import { ROUTES } from "@/config/constants";
import {
  aboutBeliefs,
  aboutFaq,
  aboutLead,
  aboutProcess,
  aboutSeo,
  aboutServices,
} from "@/content/about";
import { SITE_FACTS } from "@/content/site-facts";
import { buildMetadata } from "@/lib/seo/metadata";
import { organizationSchema } from "@/lib/seo/schema";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ClosingCta } from "@/components/common/closing-cta";
import { FaqSection } from "@/components/common/faq-section";
import { InlineText } from "@/components/common/inline-text";
import { JsonLd } from "@/components/common/json-ld";
import { PageHeader } from "@/components/common/page-header";

export const metadata: Metadata = buildMetadata(aboutSeo);

const credentials = [
  SITE_FACTS.yearsExperience ? `${SITE_FACTS.yearsExperience} years of design experience` : null,
  SITE_FACTS.qualification,
  SITE_FACTS.city ? `Based in ${SITE_FACTS.city}` : null,
].filter((item): item is string => Boolean(item));

export default function AboutPage() {
  return (
    <main>
      <Breadcrumbs
        items={[
          { label: "Home", href: ROUTES.home },
          { label: "About" },
        ]}
      />
      <PageHeader
        title="About ArchiPlan Studio: An Online Architectural Design Studio"
        description={aboutLead}
        links={[{ label: "Start your order", href: ROUTES.newOrder }]}
      />

      <div className="mx-auto w-full max-w-3xl px-4 pb-12">
        {/* TODO(owner): fill `story` in src/content/site-facts.ts — the main trust signal on this page. */}
        {SITE_FACTS.story.length > 0 ? (
          <section aria-labelledby="our-story" className="mb-12">
            <h2 id="our-story" className="text-2xl font-semibold tracking-tight">
              Our story
            </h2>
            <div className="mt-4 flex flex-col gap-4 leading-relaxed text-muted-foreground">
              {SITE_FACTS.story.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="beliefs" className="mb-12">
          <h2 id="beliefs" className="text-2xl font-semibold tracking-tight">
            What we believe
          </h2>
          <ul className="mt-4 flex flex-col gap-4">
            {aboutBeliefs.map((belief) => (
              <li key={belief.title} className="rounded-xl border bg-card p-5">
                <p className="font-medium">{belief.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{belief.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="how-we-work" className="mb-12">
          <h2 id="how-we-work" className="text-2xl font-semibold tracking-tight">
            How we work
          </h2>
          <ol className="mt-4 flex flex-col gap-3">
            {aboutProcess.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm text-primary">
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">{step.title}</span>{" "}
                  <InlineText text={step.text} />
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">
            Read the details on our{" "}
            <Link href={ROUTES.howItWorks} className="text-primary underline underline-offset-4">
              How It Works page
            </Link>
            .
          </p>
        </section>

        <section aria-labelledby="what-we-design" className="mb-12">
          <h2 id="what-we-design" className="text-2xl font-semibold tracking-tight">
            What we design
          </h2>
          <ul className="mt-4 flex flex-col gap-2 text-muted-foreground">
            {aboutServices.map((service) => (
              <li key={service.href}>
                <Link href={service.href} className="text-primary underline underline-offset-4">
                  {service.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={ROUTES.portfolio} className="text-primary underline underline-offset-4">
                Examples in our house design portfolio
              </Link>
            </li>
          </ul>
        </section>

        {credentials.length > 0 ? (
          <section aria-labelledby="experience" className="mb-12">
            <h2 id="experience" className="text-2xl font-semibold tracking-tight">
              Experience and credentials
            </h2>
            <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-muted-foreground">
              {credentials.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="who-we-work-with" className="mb-12">
          <h2 id="who-we-work-with" className="text-2xl font-semibold tracking-tight">
            Who we work with
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            We work with homeowners, families building their first house, overseas clients planning
            a home from abroad, and small builders who need clean drawings
            {SITE_FACTS.serviceAreas ? ` — ${SITE_FACTS.serviceAreas}` : ""}, with WhatsApp support
            for quick questions.
          </p>
        </section>

        <FaqSection items={aboutFaq} />
      </div>

      <JsonLd data={organizationSchema()} />

      <ClosingCta
        heading="Work with us"
        text="Start an order, view our portfolio, or contact the studio with any question."
        links={[
          { label: "View our portfolio", href: ROUTES.portfolio },
          { label: "Contact us", href: ROUTES.contact },
        ]}
      />
    </main>
  );
}
