import { APP, ROUTES } from "@/config/constants";
import { SITE_FACTS } from "./site-facts";
import type { ContentLink, FaqItem, SeoMeta } from "./types";

/** PAGE 1 — Home (`/`). Primary keyword: "house plan design online". */

export const homeSeo: SeoMeta = {
  title: "House Plan Design Online", // + city if you target one: "House Plan Design Online in Lahore"
  description:
    "Order custom house plan design online: floor plans, front elevations and full architectural drawings, with clear pricing and revisions. Start today.",
  path: ROUTES.home,
  keywords: [
    "house plan design online",
    "house architecture design online",
    "custom floor plan design",
    "home design service",
    "front elevation design",
    "architectural drawings",
  ],
};

export const homeLead =
  "Planning to build a home? Get a house plan designed around your plot, your family and your budget, without visiting an office. You tell us about your plot and your needs, we design your layout and elevation, you review a draft, request revisions, and receive your final drawing files once everything is paid.";

export const homeAudience: readonly { title: string; text: string }[] = [
  {
    title: "First-time builders",
    text: `who have a plot but no idea where to begin. Our [step-by-step process](${ROUTES.howItWorks}) explains everything in plain language.`,
  },
  {
    title: "Families planning a double story home",
    text: "who need the right number of bedrooms, a good kitchen layout and space for a garage.",
  },
  {
    title: "Overseas clients",
    text: "building in their home city who need a designer they can work with entirely online and by WhatsApp.",
  },
  {
    title: "Owners renovating or extending",
    text: "who need clear drawings before speaking to a contractor.",
  },
];

export const homeProcessSteps: readonly { title: string; text: string }[] = [
  {
    title: "Submit your order",
    text: `Tell us your plot size, facing direction, rooms needed, style and budget in a short [step-by-step form](${ROUTES.newOrder}). It takes under five minutes.`,
  },
  {
    title: "Receive your quote",
    text: "We review your brief and send a clear quote. You accept it when you are happy.",
  },
  {
    title: "Pay the advance",
    text: `A deposit confirms your order and starts the design. Details are on [How It Works](${ROUTES.howItWorks}).`,
  },
  {
    title: "Review your draft",
    text: "You receive a watermarked draft preview, and you can approve it or request revisions with notes and reference images.",
  },
  {
    title: "Pay the balance and download",
    text: `Once the final payment is verified, your final files unlock in your [dashboard](${ROUTES.dashboard}).`,
  },
];

export const homeWhyOnline: readonly string[] = [
  `**Everything in one place.** Your brief, drafts, messages and files stay together under one order number, such as ${APP.orderNumberPrefix}-2026-0042.`,
  "**Clear scope and pricing.** You see what each package includes and what it does not.",
  "**Visible progress.** Your order shows its status from submission to completion.",
  "**Protected work and fair payment.** Drafts are watermarked low-resolution previews, and final files are released after final payment is verified.",
];

export const homePlotLinks: readonly ContentLink[] = [
  { label: "5 marla house design", href: ROUTES.plotPages.marla5 },
  { label: "10 marla house plan", href: ROUTES.plotPages.marla10 },
  { label: "1 kanal house design", href: ROUTES.plotPages.kanal1 },
  { label: "Modern house design", href: `${ROUTES.portfolio}?style=modern` },
  { label: "Classic house elevation", href: `${ROUTES.portfolio}?style=classic` },
];

export const homeGoodPlan: readonly string[] = [
  "**Light and ventilation.** Where the sun falls through the day, and how air moves through the home.",
  "**Daily movement.** The kitchen should connect naturally to dining, and bedrooms should stay quiet.",
  "**Future needs.** Space for a growing family, elderly parents or a second floor later.",
  "**Buildability.** Layouts that a builder can actually construct within your budget.",
];

export const homeFaq: readonly FaqItem[] = [
  {
    question: "How much does a house plan cost?",
    answer: `Pricing depends on the package and the size and complexity of your plot. Our [pricing page](${ROUTES.services}) shows each package's price, and your order receives a clear quote before you pay anything.`,
  },
  {
    question: "How long does it take to get a house plan?",
    answer: SITE_FACTS.firstDraftDays
      ? `A typical first draft takes ${SITE_FACTS.firstDraftDays} days after the advance payment is verified. The total time depends on how quickly you review drafts.`
      : "Delivery time depends on your package and how quickly you review drafts. Ask us for the current turnaround before you order.",
  },
  {
    question: "Can I change the design after I see the draft?",
    answer: `Yes. Every package includes free revisions, and you can request changes with notes and annotated images. See [How It Works](${ROUTES.howItWorks}).`,
  },
  {
    question: "Do I need to visit your office?",
    answer: `No. The whole process is online, with WhatsApp support if you prefer to [ask a question first](${ROUTES.contact}).`,
  },
  {
    question: "Can I use the drawings for construction?",
    answer:
      "Our drawings are design drawings. Local approval requirements may apply, so please confirm them with your authority or society before building.",
  },
];

/** Hero copy (home page mock). */
export const homeHero = {
  eyebrow: "Custom house plans, designed online",
  titleLead: "Your dream house plan.",
  titleAccent: "One click to begin.",
  lead: "Tell us about your plot once. We handle the quote, the design, the revisions and your final drawings, all in one place, from your phone.",
  note: "Under 5 minutes · No payment until you accept your quote",
  links: [
    { label: "Rather chat? Ask on WhatsApp", href: ROUTES.contact },
    { label: "Create account", href: ROUTES.register },
  ],
} as const;

/** "Press once…" section. */
export const homeProcess = {
  eyebrow: "One button. Everything handled.",
  heading: "Press once. We guide you through the rest.",
  text: "The button opens a short form. After that, every step lives in your dashboard, and you get an email whenever something changes.",
  cards: [
    { title: "Share your plot", text: "Size, facing, rooms, style and photos." },
    { title: "Get your quote", text: "A clear price. Accept it, or walk away." },
    { title: "Pay the advance", text: "Upload your proof; we start designing." },
    { title: "Review and revise", text: "See your draft and ask for changes." },
    { title: "Download finals", text: "Files unlock once the balance is paid." },
  ],
  cta: { label: "See the full process", href: ROUTES.howItWorks },
} as const;

export const homePackages = {
  eyebrow: "Packages",
  heading: "Pick what you need. Upgrade anytime.",
  text: "Every package includes free revisions. Extra revisions are quoted transparently, and prices are managed in the admin panel.",
  /** Seeded package slug shown as "Most popular". */
  featuredSlug: "plan-elevation",
} as const;

export const homePlotSize = {
  heading: "Start from your plot size",
  text: "Pick the size closest to yours — open the guide with ideas, or jump straight into the order form.",
  chips: [
    { label: "5 marla", href: ROUTES.plotPages.marla5 },
    { label: "10 marla", href: ROUTES.plotPages.marla10 },
    { label: "1 kanal", href: ROUTES.plotPages.kanal1 },
    { label: "30 x 60 ft", href: ROUTES.newOrder },
    { label: "25 x 50 ft", href: ROUTES.newOrder },
    { label: "Other size", href: ROUTES.newOrder },
  ],
  note: `Browsing first? See [10 marla house plans](${ROUTES.plotPages.marla10}) or our [house design portfolio](${ROUTES.portfolio}).`,
} as const;

export const homeTrust = {
  heading: "Built so nothing gets lost, and nobody gets surprised",
  cards: [
    { title: "Watermarked drafts", text: "Judge the design fully before you pay the balance." },
    { title: "Clear revision limits", text: "You always see how many free revisions remain." },
    { title: "Private by design", text: "Plot documents are visible only to you and our studio." },
  ],
} as const;

/** Short FAQ shown on the home page ("Quick answers"). */
export const homeQuickAnswers: readonly FaqItem[] = [homeFaq[0], homeFaq[1], homeFaq[4]];

export const homeCta = {
  heading: "Your house starts with one click.",
  text: "Five minutes now. A plan you can build from later.",
} as const;
