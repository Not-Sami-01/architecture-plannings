import { ROUTES } from "@/config/constants";
import { SITE_FACTS } from "./site-facts";
import type { FaqItem, SeoMeta } from "./types";

/** PAGE 9 — About (`/about`). Primary keyword: "online architectural design studio". */

export const aboutSeo: SeoMeta = {
  title: "About Our Online Architectural Design Studio",
  description:
    "Meet the online architectural design studio behind ArchiPlan Studio. Learn our story, design approach, process and how we work with clients.",
  path: ROUTES.about,
  keywords: [
    "online architectural design studio",
    "house designer",
    "architectural design service",
    "our design process",
  ],
};

export const aboutLead =
  "We design houses for people who want a clear process, honest pricing and a home that works for their family. Building a home is one of the biggest decisions in a person's life, yet getting a good design is often chaotic: requirements get lost in chats, pricing is vague and files arrive late or incomplete. We built a better way.";

export const aboutBeliefs: readonly { title: string; text: string }[] = [
  { title: "Homes should be designed around people", text: "Your family routine comes first, not a generic template." },
  { title: "Clarity beats confusion", text: "You should always know what is included, what it costs and what happens next." },
  { title: "Honest limits build trust", text: "We tell you what our drawings can and cannot be used for." },
  { title: "Good design is practical", text: "We think about light, airflow, privacy, budget and buildability." },
];

export const aboutProcess: readonly { title: string; text: string }[] = [
  { title: "You share your plot details and requirements", text: `on the [order form](${ROUTES.newOrder}).` },
  { title: "We send a clear quote", text: "with price, advance share and delivery time." },
  { title: "We design your layout and elevation", text: "and upload a watermarked draft to your dashboard." },
  { title: "You review drafts and request revisions", text: "within your free revision limit." },
  { title: "You receive final files", text: "after the final payment is verified." },
];

export const aboutServices: readonly { label: string; href: string }[] = [
  { label: "Floor plans", href: ROUTES.packagePages.floorPlan },
  { label: "House plan and elevation designs", href: ROUTES.packagePages.planElevation },
  { label: "Full architectural drawing sets", href: ROUTES.packagePages.fullPackage },
];

export const aboutFaq: readonly FaqItem[] = [
  {
    question: "Are you a registered architect?",
    answer: SITE_FACTS.registrationAnswer
      ? SITE_FACTS.registrationAnswer
      : "Ask us about our qualifications before ordering — we answer honestly, including whether drawings need to be stamped or approved by a licensed architect or engineer for authority submission.",
  },
  {
    question: "Where are you based?",
    answer: SITE_FACTS.city
      ? `We are based in ${SITE_FACTS.city}${
          SITE_FACTS.serviceAreas ? ` and work online with clients in ${SITE_FACTS.serviceAreas}` : ""
        }.`
      : "We work online with clients wherever they are — ask us for details before ordering.",
  },
  {
    question: "Do you handle approvals?",
    answer:
      "Our drawings are design drawings, and local approval requirements may apply. Please confirm them with your authority or society before construction.",
  },
];
