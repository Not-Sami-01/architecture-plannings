import { ROUTES } from "@/config/constants";
import type { SeoMeta } from "./types";

/**
 * Guide registry (CONTENT.md §4). Each entry powers `/guides/[slug]`.
 *
 * `published: false` renders the page with `noindex` and a short "in progress"
 * body so internal links never 404 — flip to `true` once the full 1,000+ word
 * article (in `blocks`) is written and reviewed.
 */

export type GuideEntry = {
  slug: string;
  seo: SeoMeta;
  /** Short description shown on the guides index and on the stub page. */
  summary: string;
  /** Section of the site this guide belongs to (for grouping on the index). */
  category: "Drawings" | "Planning" | "Process" | "Working together";
  published: boolean;
  /** Full article body — empty until the guide is written. */
  blocks: readonly [];
};

export const GUIDES: readonly GuideEntry[] = [
  {
    slug: "what-is-included-in-architectural-drawings",
    seo: {
      title: "What Is Included in Architectural Drawings?",
      description:
        "Floor plans, elevations, sections and schedules explained in plain language — what each drawing shows, who needs it and why builders rely on them.",
      path: ROUTES.guide("what-is-included-in-architectural-drawings"),
      keywords: ["what is included in architectural drawings", "architectural drawing set", "house drawing types"],
    },
    summary:
      "Floor plans, elevations, sections and schedules explained: what each drawing shows, who needs it, and why builders rely on them.",
    category: "Drawings",
    published: false,
    blocks: [],
  },
  {
    slug: "floor-plan-vs-elevation-vs-section",
    seo: {
      title: "Floor Plan vs Elevation vs Section: What Each Drawing Is For",
      description:
        "Three drawings, three jobs. See how a floor plan, a front elevation and a section differ, and which one you need at each stage of your house project.",
      path: ROUTES.guide("floor-plan-vs-elevation-vs-section"),
      keywords: ["floor plan vs elevation", "section drawing", "what is an elevation drawing"],
    },
    summary:
      "Three drawings, three jobs: how a floor plan, an elevation and a section differ, and which one you need at each stage.",
    category: "Drawings",
    published: false,
    blocks: [],
  },
  {
    slug: "how-much-does-a-house-plan-cost",
    seo: {
      title: "How Much Does a House Plan Cost?",
      description:
        "What affects the price of a house plan: plot size, floors, complexity, deliverables and revisions — with a clear way to budget for your project.",
      path: ROUTES.guide("how-much-does-a-house-plan-cost"),
      keywords: ["how much does a house plan cost", "house design price", "floor plan cost"],
    },
    summary:
      "What affects the price of a house plan: plot size, floors, complexity, deliverables and revisions — and how to budget for it.",
    category: "Process",
    published: false,
    blocks: [],
  },
  {
    slug: "prepare-for-your-architect",
    seo: {
      title: "How to Prepare for Your Architect: A Checklist",
      description:
        "Gather the right details before you order a house plan: plot dimensions, facing, room requirements and reference images, in one checklist.",
      path: ROUTES.guide("prepare-for-your-architect"),
      keywords: ["prepare for your architect", "house plan checklist", "what to give an architect"],
    },
    summary:
      "Gather the right details before you order: plot dimensions, facing, room requirements and reference images, in one checklist.",
    category: "Working together",
    published: false,
    blocks: [],
  },
  {
    slug: "choose-house-plan-for-your-plot-size",
    seo: {
      title: "How to Choose the Right House Plan for Your Plot Size",
      description:
        "Narrow, corner, wide or irregular — how your plot shape changes the plan you should choose, with practical layout strategies for each.",
      path: ROUTES.guide("choose-house-plan-for-your-plot-size"),
      keywords: ["house plan for plot size", "narrow plot house design", "corner plot house plan"],
    },
    summary:
      "Narrow, corner, wide or irregular — how your plot shape changes the plan you should choose, with strategies for each.",
    category: "Planning",
    published: false,
    blocks: [],
  },
  {
    slug: "plot-facing-and-house-layout",
    seo: {
      title: "North, South, East and West Facing Plots and House Layout",
      description:
        "How a plot's facing direction changes sunlight, heat and where rooms should sit — and what to check before you fix your layout.",
      path: ROUTES.guide("plot-facing-and-house-layout"),
      keywords: ["north facing house plan", "plot facing and layout", "sunlight in house design"],
    },
    summary:
      "How facing direction changes sunlight, heat and where rooms should sit — and what to check before you fix your layout.",
    category: "Planning",
    published: false,
    blocks: [],
  },
  {
    slug: "modern-vs-classic-elevation",
    seo: {
      title: "Modern vs Classic Elevation: How to Choose a Style",
      description:
        "Modern, contemporary or classic — what each elevation style looks like, which suits which plot, and how to choose with confidence.",
      path: ROUTES.guide("modern-vs-classic-elevation"),
      keywords: ["modern vs classic elevation", "house elevation styles", "front elevation design"],
    },
    summary:
      "Modern, contemporary or classic — what each elevation style looks like, which suits which plot, and how to choose.",
    category: "Drawings",
    published: false,
    blocks: [],
  },
  {
    slug: "single-vs-double-story-house",
    seo: {
      title: "Single Story vs Double Story House: Pros, Cons and Costs",
      description:
        "One floor or two? Compare cost, comfort, privacy and future flexibility to decide whether a single or double story home fits your family.",
      path: ROUTES.guide("single-vs-double-story-house"),
      keywords: ["single vs double story house", "double story house plan", "one floor home design"],
    },
    summary:
      "One floor or two? Compare cost, comfort, privacy and future flexibility to decide what fits your family.",
    category: "Planning",
    published: false,
    blocks: [],
  },
  {
    slug: "kitchen-layout-types",
    seo: {
      title: "Kitchen Layout Types Explained: Open, Closed, L-Shaped, Parallel",
      description:
        "The four common kitchen layouts, what each costs in space, and how to choose one that works with your dining and family routine.",
      path: ROUTES.guide("kitchen-layout-types"),
      keywords: ["kitchen layout types", "open kitchen layout", "L-shaped kitchen plan"],
    },
    summary:
      "The four common kitchen layouts, what each costs in space, and how to choose one that fits your routine.",
    category: "Planning",
    published: false,
    blocks: [],
  },
  {
    slug: "plan-parking-and-garage-small-plots",
    seo: {
      title: "Planning Parking and Garage Space in Small Plots",
      description:
        "How to fit a car, a bike and still keep the house comfortable: garage sizing, turning space and common parking mistakes on small plots.",
      path: ROUTES.guide("plan-parking-and-garage-small-plots"),
      keywords: ["garage in small house plan", "parking space design", "car porch house plan"],
    },
    summary:
      "How to fit a car and still keep the house comfortable: garage sizing, turning space and common parking mistakes.",
    category: "Planning",
    published: false,
    blocks: [],
  },
  {
    slug: "common-house-design-mistakes",
    seo: {
      title: "Common House Design Mistakes and How to Avoid Them",
      description:
        "Ten house design mistakes — from too many small rooms to ignored ventilation — with simple ways to avoid each one before you build.",
      path: ROUTES.guide("common-house-design-mistakes"),
      keywords: ["common house design mistakes", "house plan mistakes", "bad floor plan signs"],
    },
    summary:
      "Ten design mistakes — from too many small rooms to ignored ventilation — and simple ways to avoid each one.",
    category: "Planning",
    published: false,
    blocks: [],
  },
  {
    slug: "how-to-read-a-floor-plan",
    seo: {
      title: "How to Read a Floor Plan: Symbols, Dimensions and Notations",
      description:
        "Walls, doors, windows, stairs and dimensions: a plain-language guide to reading any floor plan with confidence before you build.",
      path: ROUTES.guide("how-to-read-a-floor-plan"),
      keywords: ["how to read a floor plan", "floor plan symbols", "floor plan dimensions"],
    },
    summary:
      "Walls, doors, windows, stairs and dimensions: a plain-language guide to reading any floor plan with confidence.",
    category: "Drawings",
    published: false,
    blocks: [],
  },
  {
    slug: "renovation-and-extension-drawings",
    seo: {
      title: "Renovation and Extension Planning: What Drawings You Need",
      description:
        "Renovating or extending? See which drawings you need, what to measure, and how to brief a designer for a change to an existing house.",
      path: ROUTES.guide("renovation-and-extension-drawings"),
      keywords: ["renovation drawings", "house extension plan", "floor plan for renovation"],
    },
    summary:
      "Renovating or extending? Which drawings you need, what to measure, and how to brief a designer for an existing house.",
    category: "Process",
    published: false,
    blocks: [],
  },
  {
    slug: "check-drawings-before-giving-to-builder",
    seo: {
      title: "What to Check Before Giving Drawings to a Builder",
      description:
        "A final checklist before construction: dimensions, openings, schedules and open questions to settle so the site runs smoothly.",
      path: ROUTES.guide("check-drawings-before-giving-to-builder"),
      keywords: ["check drawings before construction", "what to give a builder", "building drawing checklist"],
    },
    summary:
      "A final checklist before construction: dimensions, openings, schedules and questions to settle so the site runs smoothly.",
    category: "Working together",
    published: false,
    blocks: [],
  },
];

export const GUIDE_CATEGORIES = ["Drawings", "Planning", "Process", "Working together"] as const;

/** SEO for `/guides` (the index of every guide). */
export const guidesIndexSeo: SeoMeta = {
  title: "House Design Guides",
  description:
    "Plain-language guides on house plans, drawings, plot sizes, layouts and costs — written to help you plan your home before you order.",
  path: ROUTES.guides,
  keywords: [
    "house design guides",
    "house plan tips",
    "architectural drawings explained",
    "house design advice",
  ],
};

export const guideBySlug = (slug: string): GuideEntry | undefined =>
  GUIDES.find((g) => g.slug === slug);

export const publishedGuides = GUIDES.filter((g) => g.published);
