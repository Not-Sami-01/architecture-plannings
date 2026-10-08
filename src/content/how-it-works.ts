import { APP, ROUTES } from "@/config/constants";
import { SITE_FACTS } from "./site-facts";
import type { ContentBlock, FaqItem, SeoMeta } from "./types";

/** PAGE 6 — How It Works (`/how-it-works`). Primary keyword: "how to get a house plan online". */

export const howItWorksSeo: SeoMeta = {
  title: "How to Get a House Plan Online",
  description:
    "See how to get a house plan online in five clear steps: order, quote, advance, draft and revisions, final files. Know what to provide and receive.",
  path: ROUTES.howItWorks,
  keywords: [
    "how to get a house plan online",
    "house plan design process",
    "online architect process",
    "order house design",
    "revisions",
    "final payment",
  ],
};

export const howItWorksLead =
  "Getting a house plan online should feel clear, not confusing. Here is exactly what happens from your first message to the day you download your final drawings, and what we need from you at each stage.";

export const howItWorksSteps: readonly {
  id: string;
  title: string;
  provides: readonly string[];
  receives: readonly string[];
}[] = [
  {
    id: "submit-your-order",
    title: "Submit your order",
    provides: [
      `Your preferred package ([Floor Plan](${ROUTES.packagePages.floorPlan}), [Plan + Elevation](${ROUTES.packagePages.planElevation}) or [Full Package](${ROUTES.packagePages.fullPackage}))`,
      "Plot details: width, length, unit (ft, m, marla or kanal), facing direction, road sides and city",
      "Requirements: floors, bedrooms, bathrooms, kitchen type, garage, lounge and extras",
      "Style and budget",
      "Up to 10 files (JPG, PNG or PDF, up to 10 MB each), such as a plot map, site photos or reference images",
    ],
    receives: [`An order number like **${APP.orderNumberPrefix}-2026-0042** and a confirmation email`],
  },
  {
    id: "receive-your-quote",
    title: "Receive your quote",
    provides: [],
    receives: [
      "A quote with the total price, the advance amount and the expected delivery time",
      "Nothing is charged until you accept it; you can also decline",
    ],
  },
  {
    id: "pay-the-advance",
    title: "Pay the advance",
    provides: ["Your advance payment, uploaded as proof in your dashboard"],
    receives: ["Verification by our studio and a status update to **In Design**"],
  },
  {
    id: "review-your-draft",
    title: "Review your draft",
    provides: [
      "Approval of the draft, or",
      "A revision request with a written message and up to 5 annotated images",
    ],
    receives: [
      "A **watermarked, low-resolution draft preview** in your dashboard and an email",
      "A visible count of how many free revisions remain",
    ],
  },
  {
    id: "pay-the-balance",
    title: "Pay the balance and download your files",
    provides: ["The remaining balance after you approve the draft"],
    receives: [
      "Your order marked **Completed**",
      "Final files unlocked for download in your dashboard, with secure short-lived links",
    ],
  },
];

export const howItWorksTips: readonly string[] = [
  "Measure your plot and double-check the dimensions against your documents",
  "Share a few reference images of houses you like (and ones you dislike)",
  "List must-have rooms separately from nice-to-have rooms",
  "Review drafts on a large screen when possible",
  "Collect all your feedback into one revision request, which keeps revisions efficient",
];

export const howItWorksBlocks: readonly ContentBlock[] = [
  { kind: "h2", id: "your-order-status-at-a-glance", text: "Your order status at a glance" },
  {
    kind: "table",
    head: ["Status", "What it means"],
    rows: [
      ["Submitted", "We received your order"],
      ["Quoted", "Your quote is ready to review"],
      ["Awaiting advance", "We are waiting for your advance payment"],
      ["In design", "We are designing your plan"],
      ["Draft delivered", "Your draft is ready for review"],
      ["Revision requested", "We are working on your changes"],
      ["Awaiting final payment", "Draft approved; balance due"],
      ["Completed", "Final files are ready to download"],
    ],
  },
  { kind: "h2", id: "why-we-protect-files", text: "Why we protect drafts and final files" },
  {
    kind: "p",
    text: "Drafts are watermarked low-resolution previews, and final files are released only after final payment is verified. This keeps the process fair for both sides: you can judge the design fully, and we are protected from unpaid work being used.",
  },
  { kind: "h2", id: "tips", text: "Tips for a smooth experience" },
  { kind: "ul", items: howItWorksTips },
];

export const howItWorksFaq: readonly FaqItem[] = [
  {
    question: "Do I need an account?",
    answer: `You can begin as a guest, but you will [register or log in](${ROUTES.register}) to submit and to track your order.`,
  },
  {
    question: "How long does the process take?",
    answer: SITE_FACTS.firstDraftDays
      ? `A first draft is typically ready ${SITE_FACTS.firstDraftDays} days after your advance is verified. The total time depends on how quickly you review drafts.`
      : "The quote states the expected delivery time. The total time depends on how quickly you review drafts.",
  },
  {
    question: "Can I cancel?",
    answer: `You can cancel before design begins. Once design starts, please [contact us](${ROUTES.contact}) about your situation.`,
  },
  {
    question: "Where do I message you?",
    answer: `Every order has a message thread in your dashboard, and you get an email when we reply. You can also [chat on WhatsApp](${ROUTES.contact}).`,
  },
  {
    question: "What if I run out of free revisions?",
    answer: "We tell you the cost of an extra revision first, so you can decide.",
  },
];
