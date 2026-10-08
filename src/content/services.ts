import { ROUTES } from "@/config/constants";
import { SITE_FACTS } from "./site-facts";
import type { ContentBlock, FaqItem, SeoMeta } from "./types";

/** PAGE 2 — Services & Pricing (`/services`). Primary keyword: "house plan design services". */

export const servicesSeo: SeoMeta = {
  title: "House Plan Design Services and Pricing",
  description:
    "Compare our house plan design services: floor plan, plan + elevation and full architectural drawings. See what is included, revisions and pricing.",
  path: ROUTES.services,
  keywords: [
    "house plan design services",
    "architectural drawing packages",
    "floor plan and elevation",
    "house design pricing",
    "what is included in architectural drawings",
  ],
};

export const servicesLead =
  "Choose the package that matches how far along your project is. Every package is designed by our studio, delivered online and protected by a clear order process. You see the draft first, and final files are released after final payment.";

/** Static comparison rows. Price and revision rows are filled from the database packages. */
export const serviceComparisonRows: readonly {
  label: string;
  /** Package slugs that include this row. */
  slugs: readonly string[];
}[] = [
  { label: "2D floor plan(s)", slugs: ["floor-plan", "plan-elevation", "full-package"] },
  { label: "Front elevation", slugs: ["plan-elevation", "full-package"] },
  { label: "Section drawings", slugs: ["full-package"] },
  { label: "Door and window schedule", slugs: ["full-package"] },
];

export const serviceChoice: readonly { heading: string; text: string; href: string }[] = [
  {
    heading: "Choose Floor Plan if…",
    text: "You have a plot and need the layout resolved first: where rooms go, how big they are and how the family moves through the house. It is also a good starting point if you plan to add the elevation later.",
    href: ROUTES.packagePages.floorPlan,
  },
  {
    heading: "Choose Plan + Elevation if…",
    text: "You want to see both how the house works inside and how it looks outside. This suits most homeowners who want a complete concept before choosing a builder.",
    href: ROUTES.packagePages.planElevation,
  },
  {
    heading: "Choose the Full Package if…",
    text: "You are ready to build and your contractor needs complete drawings, including sections and a door and window schedule.",
    href: ROUTES.packagePages.fullPackage,
  },
];

export const servicePriceFactors: readonly string[] = [
  "**Plot size and shape.** A narrow or irregular plot can take more design effort than a regular rectangle.",
  "**Number of floors and rooms.** A double story home with four bedrooms needs more planning than a single floor.",
  "**Special requirements.** Items such as a basement, a separate guest portion or a rental unit.",
  "**Extra revisions.** Free revisions are included. More are charged per revision, and we quote this before work continues.",
];

export const serviceIncluded: readonly string[] = [
  "A short written brief review before design begins",
  "Design by our studio, not auto-generated templates",
  "A watermarked draft preview you can review in your dashboard",
  "A message thread on your order for questions",
  "Email updates whenever your order status changes",
  "Final files released after final payment is verified",
];

export const serviceNotIncluded: readonly string[] = [
  "Structural, electrical or plumbing engineering drawings (unless listed in your package)",
  "Local authority or society approval and submission",
  "3D renders or walkthroughs (unless added as a special request)",
  "Construction supervision or cost estimation",
];

export const servicesFaq: readonly FaqItem[] = [
  {
    question: "Can I upgrade my package later?",
    answer: `Yes. You can start with a floor plan and add an elevation afterwards. Contact us on your order thread, and we will quote the difference.`,
  },
  {
    question: "What is the advance payment?",
    answer: `An advance confirms your order and starts the design; the balance is paid when you approve the draft. The exact share is shown in your quote. See [How It Works](${ROUTES.howItWorks}).`,
  },
  {
    question: "How do I pay?",
    answer: SITE_FACTS.paymentMethods
      ? `We accept ${SITE_FACTS.paymentMethods}. Upload your payment proof in your dashboard and we verify it.`
      : "Upload your payment proof in your dashboard and we verify it. Ask us which payment methods are currently available.",
  },
  {
    question: "What file formats do I receive?",
    answer: SITE_FACTS.finalFileFormats
      ? `Final files are delivered as ${SITE_FACTS.finalFileFormats}.`
      : "The formats you receive are listed in your quote and package details before you order.",
  },
  {
    question: "How many revisions do I get?",
    answer: `Two for Floor Plan and Plan + Elevation, three for the Full Package. Extra revisions are priced individually.`,
  },
];

export const servicesBlocks: readonly ContentBlock[] = [
  { kind: "h2", id: "what-every-package-includes", text: "What every package includes" },
  { kind: "ul", items: serviceIncluded },
  { kind: "h2", id: "what-is-not-included", text: "What is not included" },
  { kind: "p", text: "Being clear helps both of us:" },
  { kind: "ul", items: serviceNotIncluded },
  {
    kind: "p",
    text: `If you need any of these, [contact us](${ROUTES.contact}) and we will tell you honestly what is possible.`,
  },
];
