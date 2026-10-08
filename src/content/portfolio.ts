import { ROUTES } from "@/config/constants";
import { SITE_FACTS } from "./site-facts";
import type { FaqItem, SeoMeta } from "./types";

/** PAGE 7 — Portfolio list (`/portfolio`) and the `/portfolio/[slug]` project template. */

export const portfolioSeo: SeoMeta = {
  title: "House Design Portfolio",
  description:
    "Browse our house design portfolio by plot size and style: 5 marla, 10 marla, 1 kanal, modern and classic homes. Find ideas and order a similar design.",
  path: ROUTES.portfolio,
  keywords: [
    "house design portfolio",
    "modern house design",
    "10 marla house plan",
    "5 marla house design",
    "classic house elevation",
    "house plan examples",
  ],
};

export const portfolioLead =
  "See how we turn plot sizes and family needs into homes. Each project shows the plot size, covered area, rooms, style and the thinking behind the layout, so you can judge our work and find ideas for your own house.";

export const portfolioPlotFilters: readonly { label: string; href: string; text: string }[] = [
  {
    label: "5 marla designs",
    href: `${ROUTES.portfolio}?plot=5-marla`,
    text: `compact homes that make good use of every foot. Read the [5 marla house design guide](${ROUTES.plotPages.marla5}).`,
  },
  {
    label: "10 marla designs",
    href: `${ROUTES.portfolio}?plot=10-marla`,
    text: `the popular family-home size, often with a garage and two floors. Read the [10 marla house plan page](${ROUTES.plotPages.marla10}).`,
  },
  {
    label: "1 kanal designs",
    href: `${ROUTES.portfolio}?plot=1-kanal`,
    text: `large homes with lawns, parking and generous rooms. Read the [1 kanal house design page](${ROUTES.plotPages.kanal1}).`,
  },
  {
    label: "Other sizes",
    href: `${ROUTES.portfolio}?plot=other`,
    text: "such as 25x50 ft and 30x60 ft.",
  },
];

export const portfolioStyleFilters: readonly { label: string; href: string; text: string }[] = [
  { label: "Modern house design", href: `${ROUTES.portfolio}?style=modern`, text: "clean lines, large openings, minimal ornament" },
  { label: "Contemporary home design", href: `${ROUTES.portfolio}?style=contemporary`, text: "modern shapes with warmer finishes" },
  { label: "Classic house elevation", href: `${ROUTES.portfolio}?style=classic`, text: "traditional proportions and detailing" },
];

export const portfolioProjectFields: readonly string[] = [
  "Plot size and covered area",
  "Number of bedrooms, bathrooms and floors",
  "Floor plan and elevation images",
  "A short explanation of **why the layout works**",
  "A link to **order a similar design**",
];

export const portfolioHowToUse: readonly string[] = [
  "Look at projects with a **similar plot size** to yours",
  "Save the ones with **layouts or elevations you like**",
  "Note what you like (kitchen position, staircase, facade) and what you would change",
  `Upload those references in your [order form](${ROUTES.newOrder})`,
];

export const portfolioFaq: readonly FaqItem[] = [
  {
    question: "Can you design something similar to a project I like?",
    answer:
      'Use the "Order a similar design" link on any project. We adapt the idea to your plot rather than copying it exactly.',
  },
  {
    question: "Are these real client projects?",
    answer: SITE_FACTS.portfolioSource
      ? SITE_FACTS.portfolioSource
      : "Ask us about any project and we will share its background before you order.",
  },
  {
    question: "Can I see more examples?",
    answer: `Message us on [WhatsApp](${ROUTES.contact}) and we will share relevant examples.`,
  },
];

/** Template copy for `/portfolio/[slug]` (Phase 5 CMS fills the actual data). */
export const portfolioProjectTemplate = {
  title: "[Plot Size] [Style] House Design: [Project Name]",
  summary:
    "[One-paragraph summary: who this home is for, the plot, the style and the key idea.]",
  facts: [
    "Plot [size]",
    "Covered area [sq ft]",
    "[X] bedrooms",
    "[X] bathrooms",
    "[X] floors",
    "Style [modern/classic]",
    "Package [name]",
  ],
  sections: [
    { heading: "The brief", text: "[What the client asked for in two or three sentences.]" },
    {
      heading: "Layout and design thinking",
      text: "[Explain why the layout works: the entrance, kitchen position, light, privacy, parking, and any constraint such as a narrow plot.]",
    },
    { heading: "Floor plan", text: '[Image. Alt text: "Ground floor plan of a [plot size] [style] house with [features]".]' },
    { heading: "Front elevation", text: '[Image. Alt text: "[Style] front elevation of a [plot size] house".]' },
    { heading: "Lessons for your own plot", text: "[2 to 3 practical tips others can use.]" },
  ],
} as const;
