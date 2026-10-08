import { ROUTES } from "@/config/constants";
import { SITE_FACTS } from "./site-facts";
import type { FaqItem, SeoMeta } from "./types";

/** PAGE 10 — Contact (`/contact`). Primary keyword: "contact house design studio". */

export const contactSeo: SeoMeta = {
  title: "Contact Our House Design Studio",
  description:
    "Contact ArchiPlan Studio about house plans, floor plans and elevations. Message us on WhatsApp or use the contact options on this page.",
  path: ROUTES.contact,
  keywords: [
    "contact house design studio",
    "house plan consultation",
    "WhatsApp architect",
    "ask about house design",
    "house design enquiry",
  ],
};

export const contactLead =
  "Have a question about your house plan? We are happy to help. Whether you are comparing packages, unsure about your plot, or ready to order, reach us in whichever way suits you.";

export const contactPrepare: readonly string[] = [
  "Your plot size and city",
  "Which package you are considering",
  "Your main question or concern",
  "A photo or plot map if you have one",
];

export const contactNotSure: readonly { label: string; href: string; text: string }[] = [
  { label: "packages and pricing", href: ROUTES.services, text: "Comparing options? See our" },
  { label: "How It Works", href: ROUTES.howItWorks, text: "Wondering about the process? Read" },
  { label: "house design portfolio", href: ROUTES.portfolio, text: "Want inspiration? Browse our" },
  { label: "10 marla house plans", href: ROUTES.plotPages.marla10, text: "Planning a specific plot? Try" },
  { label: "Start your order", href: ROUTES.newOrder, text: "Ready to go?" },
];

export const contactFaq: readonly FaqItem[] = [
  {
    question: "Can I get a free consultation?",
    answer: SITE_FACTS.freeConsultation
      ? SITE_FACTS.freeConsultation
      : "You can always ask a quick question on WhatsApp before ordering.",
  },
  {
    question: "Do you offer in-person meetings?",
    answer:
      SITE_FACTS.inPersonMeetings ??
      "Our process is online by design — everything from brief to final files happens in the dashboard and on WhatsApp.",
  },
  {
    question: "Which languages do you support?",
    answer: SITE_FACTS.languages ? `We work in ${SITE_FACTS.languages}.` : "Ask us which languages we currently work in.",
  },
  {
    question: "I already placed an order. Where do I get updates?",
    answer: `[Log in to your dashboard](${ROUTES.dashboard}) to see your status, drafts and messages.`,
  },
  {
    question: "Is my information private?",
    answer:
      "Yes. Plot documents and files are stored privately and are visible only to you and our studio.",
  },
];

/** Optional sentence for the page meta description once the owner fills `responseTime`. */
export function contactDescription(): string {
  return SITE_FACTS.responseTime
    ? `${contactSeo.description.slice(0, -1)} — we reply within ${SITE_FACTS.responseTime}.`
    : contactSeo.description;
}
