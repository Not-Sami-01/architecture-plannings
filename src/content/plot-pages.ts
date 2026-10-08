import { ROUTES } from "@/config/constants";
import { SITE_FACTS } from "./site-facts";
import type { ContentBlock, FaqItem, SeoMeta } from "./types";

/** PAGE 8 — Plot-size landing pages. `/10-marla-house-plan` is full; 5 marla and 1 kanal are stubs (next batch). */

export const marla10Seo: SeoMeta = {
  title: "10 Marla House Plan and Design Ideas",
  description:
    "Plan your 10 marla house: typical layouts, room sizes, double story ideas and mistakes to avoid. See designs and order your custom plan online.",
  path: ROUTES.plotPages.marla10,
  keywords: [
    "10 marla house plan",
    "10 marla house design",
    "double story 10 marla",
    "10 marla front elevation",
    "10 marla floor plan",
    "house plan with garage",
  ],
};

export const marla10Lead =
  "A 10 marla plot is one of the most popular sizes for a family home, big enough for four or five bedrooms, a garage and a lounge, and compact enough to build within a sensible budget. This guide explains how a 10 marla house is usually planned, what to watch for, and how to get a custom design for your own plot.";

export const marla10Links = [
  { label: "Start your order", href: ROUTES.newOrder },
  { label: "See 10 marla designs in our portfolio", href: `${ROUTES.portfolio}?plot=10-marla` },
];

export const marla10Blocks: readonly ContentBlock[] = [
  { kind: "h2", id: "how-big-is-a-10-marla-plot", text: "How big is a 10 marla plot?" },
  {
    kind: "p",
    text: "A marla is a traditional unit of land area, and its exact size varies by city and society. A 10 marla plot is commonly around 2,250 to 2,722 square feet, and typical dimensions include around 35 x 65 ft. Always check your plot's exact size against your documents and your society's rules, as covered area limits and setbacks differ.",
  },
  { kind: "h2", id: "typical-layouts", text: "Typical 10 marla house layouts" },
  { kind: "h3", text: "Single story 10 marla house" },
  {
    kind: "p",
    text: "Everything on one level, which suits elderly family members and keeps the structure simple. You can fit three to four bedrooms, a lounge, a kitchen, a garage and a small lawn, depending on setbacks.",
  },
  { kind: "h3", text: "Double story 10 marla house plan" },
  { kind: "p", text: "The most common choice. A typical arrangement:" },
  {
    kind: "ul",
    items: [
      "**Ground floor:** drawing room, lounge, kitchen, dining, one bedroom (useful for parents), garage",
      "**First floor:** three bedrooms with attached bathrooms, a family lounge, a balcony",
    ],
  },
  {
    kind: "p",
    text: `A double story plan gives you more rooms on the same plot and keeps bedrooms private and quiet. Read more in [single story vs double story: pros, cons and costs](${ROUTES.guide("single-vs-double-story-house")}).`,
  },
  { kind: "h3", text: "Plan with a separate portion" },
  {
    kind: "p",
    text: "Some owners plan an independent upper portion for family or rental use. This needs a separate entrance and careful planning of stairs and utilities.",
  },
  { kind: "h2", id: "planning-the-rooms", text: "Planning the rooms on a 10 marla plot" },
  {
    kind: "table",
    head: ["Space", "Typical considerations"],
    rows: [
      ["Bedrooms", "Master bedroom with attached bath and dressing; keep bedrooms away from the street side if possible"],
      ["Kitchen", `Open, closed, L-shaped or parallel. See [kitchen layout types explained](${ROUTES.guide("kitchen-layout-types")})`],
      ["Lounge", "A central family space that links the bedrooms and kitchen"],
      ["Drawing room", "Near the entrance so guests do not cross private areas"],
      ["Garage", `Space for one or two cars. See [planning parking in small plots](${ROUTES.guide("plan-parking-and-garage-small-plots")})`],
      ["Staircase", "Position it so it does not split the ground floor into awkward pieces"],
    ],
  },
  { kind: "h2", id: "light-air-and-facing", text: "Light, air and facing" },
  {
    kind: "p",
    text: `A plot's facing direction changes where the sun and breeze come from. Place living rooms and main bedrooms where they get good daylight, and put service areas such as bathrooms and stores on the edges that need less. Our guide to [north, south, east and west facing plots](${ROUTES.guide("plot-facing-and-house-layout")}) shows how this affects the layout.`,
  },
  { kind: "h2", id: "elevation-ideas", text: "Elevation ideas for a 10 marla house" },
  {
    kind: "p",
    text: `Common directions include **modern** (flat planes, large glazing, clean parapets), **contemporary** (mixed materials, projecting bays) and **classic** (columns, arches, formal entrance). The elevation should grow from the floor plan, not be painted over it. See [modern vs classic elevation](${ROUTES.guide("modern-vs-classic-elevation")}) and browse our [house design portfolio](${ROUTES.portfolio}).`,
  },
  { kind: "h2", id: "common-mistakes", text: "Common mistakes in 10 marla house planning" },
  {
    kind: "ol",
    items: [
      "**Too many small rooms.** Fewer, better-proportioned rooms usually feel larger.",
      "**A staircase that eats usable space.** Plan it early.",
      "**Ignoring the garage turning space.** A garage that is hard to enter is rarely used.",
      "**Kitchens far from dining.** Daily life becomes inconvenient.",
      "**Bedrooms facing the street noise.** Think about privacy.",
      "**Forgetting future needs.** Leave room to add a floor or a bathroom later.",
    ],
  },
  {
    kind: "p",
    text: `Read more in [common house design mistakes and how to avoid them](${ROUTES.guide("common-house-design-mistakes")}).`,
  },
  { kind: "h2", id: "what-we-can-design", text: "What we can design for your 10 marla plot" },
  {
    kind: "table",
    head: ["Package", "You get", "Link"],
    rows: [
      ["Floor Plan", "Custom 2D layout for your plot", `[Floor Plan package](${ROUTES.packagePages.floorPlan})`],
      ["Plan + Elevation", "Layout and front elevation", `[Plan + Elevation](${ROUTES.packagePages.planElevation})`],
      ["Full Package", "Plans, elevations, sections and schedules", `[Full Package](${ROUTES.packagePages.fullPackage})`],
    ],
  },
  {
    kind: "p",
    text: `See [pricing and revisions](${ROUTES.services}) and [how the process works](${ROUTES.howItWorks}).`,
  },
  { kind: "h2", id: "what-to-prepare", text: "What to prepare before ordering" },
  {
    kind: "ul",
    items: [
      "Plot dimensions and a copy of the plot map or file if you have one",
      "Facing direction and which sides touch the road",
      "Number of bedrooms and bathrooms, plus extras such as a prayer room or study",
      "Garage requirements",
      "Two or three reference images of houses you like",
    ],
  },
  {
    kind: "p",
    text: `Use our [preparation checklist](${ROUTES.guide("prepare-for-your-architect")}).`,
  },
];

export const marla10Faq: readonly FaqItem[] = [
  {
    question: "What is the standard size of a 10 marla house?",
    answer:
      "The plot is commonly around 2,250 to 2,722 sq ft, and the covered area depends on your society's rules.",
  },
  {
    question: "How many bedrooms fit on 10 marla?",
    answer: "Usually four to five across two floors, depending on room sizes and garage needs.",
  },
  {
    question: "Is a double story better for 10 marla?",
    answer:
      "Often yes, since it adds rooms without needing more land, but a single story can suit some families better.",
  },
  {
    question: "How much does a 10 marla house plan cost?",
    answer: `See our [pricing page](${ROUTES.services}) for current package prices.`,
  },
  {
    question: "Can I get a 10 marla front elevation only?",
    answer: `Elevations are designed with the plan so the two match. See [Plan + Elevation](${ROUTES.packagePages.planElevation}).`,
  },
];

export type PlotStubContent = {
  seo: SeoMeta;
  title: string;
  lead: string;
};

/** Stub pages (full copy lands in the next content batch). */
export const PLOT_STUBS: Record<string, PlotStubContent> = {
  marla5: {
    seo: {
      title: "5 Marla House Design",
      description:
        "Compact 5 marla house design ideas: smart layouts for small plots, room planning and elevation directions. Order a custom plan online.",
      path: ROUTES.plotPages.marla5,
      keywords: ["5 marla house design", "5 marla house plan", "small plot house design"],
    },
    title: "5 Marla House Design: Making Every Foot Count",
    lead: "A full guide to 5 marla house design is being written. Until then, browse compact projects in our portfolio or start an order and tell us your plot — we will design around it.",
  },
  kanal1: {
    seo: {
      title: "1 Kanal House Design",
      description:
        "1 kanal house design ideas: spacious layouts with lawns, parking and generous rooms. See examples and order a custom plan online.",
      path: ROUTES.plotPages.kanal1,
      keywords: ["1 kanal house design", "1 kanal house plan", "large plot house design"],
    },
    title: "1 Kanal House Design: Space, Lawns and Parking",
    lead: "A full guide to 1 kanal house design is being written. Until then, browse large-plot projects in our portfolio or start an order and tell us your plot — we will design around it.",
  },
};

/** Shown on stub pages once facts are confirmed. */
export const plotStubDraftNote = SITE_FACTS.firstDraftDays
  ? `A first draft is typically ready ${SITE_FACTS.firstDraftDays} days after the advance payment is verified.`
  : null;
