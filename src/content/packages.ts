import { ROUTES } from "@/config/constants";
import { SITE_FACTS } from "./site-facts";
import type { ContentBlock, FaqItem, SeoMeta } from "./types";

/**
 * PAGES 3–5 — one landing page per package (`/services/<page>`).
 * `slug` matches the seeded `Package.slug`; price and revision limits are read
 * from the database at render time, never hard-coded here.
 */

export type PackagePageContent = {
  /** Seeded package slug this page describes. */
  slug: string;
  crumbLabel: string;
  seo: SeoMeta;
  title: string;
  lead: string;
  /** Link row under the lead. */
  links: readonly { label: string; href: string }[];
  blocks: readonly ContentBlock[];
  faq: readonly FaqItem[];
  /** Renders the "Pricing and revisions" section heading. */
  pricingHeading: string;
  /** Sentence after the price, built at render time from DB revision limits. */
  pricingNote: string;
};

const compareLink = { label: "Compare all packages", href: ROUTES.services };

export const PACKAGE_PAGES: Record<string, PackagePageContent> = {
  "floor-plan-design": {
    slug: "floor-plan",
    crumbLabel: "Floor Plan Design",
    seo: {
      title: "Floor Plan Design Online: Custom 2D Plans",
      description:
        "Order a custom floor plan design for your plot. Room layouts, dimensions, 2 free revisions and a clear process. Get your quote online today.",
      path: ROUTES.packagePages.floorPlan,
      keywords: [
        "floor plan design",
        "custom floor plan",
        "2D floor plan",
        "house floor plan online",
        "room layout design",
        "how to read a floor plan",
      ],
    },
    title: "Floor Plan Design: Custom 2D Layouts for Your Plot",
    lead: "A floor plan is the foundation of your whole house. It decides where each room sits, how big it is, how people move through the home and how much light and air each space receives. Our floor plan design package gives you a custom 2D layout drawn for your plot, your family and your budget.",
    links: [{ label: "Start your order", href: ROUTES.newOrder }, compareLink],
    pricingHeading: "Pricing and revisions",
    pricingNote:
      "includes free revisions. If you need more, each extra revision is quoted separately before we continue.",
    blocks: [
      { kind: "h2", id: "what-is-a-floor-plan", text: "What is a floor plan?" },
      {
        kind: "p",
        text: `A floor plan is a top-down drawing of a floor of your house, as if the roof were lifted off. It shows walls, doors, windows, room sizes, staircases, and often furniture positions. You can read more in our guide on [how to read your floor plan](${ROUTES.guide("how-to-read-a-floor-plan")}).`,
      },
      {
        kind: "p",
        text: `Every other drawing, including the [front elevation](${ROUTES.packagePages.planElevation}) and [sections](${ROUTES.packagePages.fullPackage}), follows from the floor plan. Getting it right first saves time and money later.`,
      },
      { kind: "h2", id: "what-is-included", text: "What is included in the Floor Plan package" },
      { kind: "ul", items: [
        "**Custom 2D floor plan(s)** for each floor you need (ground floor, first floor and so on)",
        "**Room dimensions** clearly marked",
        "**Placement of doors, windows and staircases**",
        "**Kitchen, bathroom and garage layout** based on your brief",
        "**A watermarked draft preview** in your dashboard",
        "**Final files** after final payment is verified",
      ] },
      { kind: "p", text: "Your package's exact deliverables are listed at checkout and in your quote." },
      { kind: "h2", id: "how-we-design", text: "How we design your floor plan" },
      { kind: "steps", items: [
        {
          title: "We study your plot",
          text: `We use your plot width, length, facing direction (north, south, east or west) and road sides. Facing matters because it affects sunlight, heat and where the main entrance works best. See our guide on [how plot facing affects your layout](${ROUTES.guide("plot-facing-and-house-layout")}).`,
        },
        {
          title: "We translate your brief into rooms",
          text: "You tell us how many bedrooms, bathrooms, kitchen type (open, closed), lounge, garage and extras you need. If you have reference images or a rough sketch, upload them with your order.",
        },
        {
          title: "We design zones, not just rooms",
          text: "We separate public areas (lounge, dining), private areas (bedrooms) and service areas (kitchen, laundry), so the home feels calm and works well. We also check circulation, so you do not walk through one room to reach another.",
        },
        {
          title: "We check light and ventilation",
          text: "Windows and openings are placed so each main room gets daylight and cross-ventilation where the plot allows.",
        },
        {
          title: "You review and request revisions",
          text: "You see the draft in your dashboard and can ask for changes. Typical requests include moving a kitchen, resizing a bedroom or adding a prayer room.",
        },
      ] },
      { kind: "h2", id: "who-should-choose", text: "Who should choose the Floor Plan package?" },
      { kind: "ul", items: [
        "Owners who want to **settle the layout** before deciding on the exterior look",
        "Families **comparing layout ideas** before building",
        "People who already have an elevation designer but need a proper plan",
        `Anyone planning a **renovation or extension** who needs a clear updated layout (read [renovation planning: what drawings you need](${ROUTES.guide("renovation-and-extension-drawings")}))`,
      ] },
      {
        kind: "p",
        text: `If you want to see the outside of the house too, the [Plan + Elevation package](${ROUTES.packagePages.planElevation}) is usually a better value.`,
      },
      { kind: "h2", id: "plot-sizes", text: "Plot sizes we commonly design for" },
      { kind: "links", items: [
        { label: "5 marla house design", href: ROUTES.plotPages.marla5 },
        { label: "10 marla house plan", href: ROUTES.plotPages.marla10 },
        { label: "1 kanal house design", href: ROUTES.plotPages.kanal1 },
        { label: "Browse real examples in our portfolio", href: ROUTES.portfolio },
      ] },
      { kind: "p", text: "Custom sizes such as 25x50 ft, 30x60 ft and irregular plots are welcome too." },
    ],
    faq: [
      {
        question: "How much does a floor plan cost?",
        answer: `The package price is shown on the [services page](${ROUTES.services}). Your quote confirms the final amount before you pay.`,
      },
      {
        question: "How long does a floor plan take?",
        answer: SITE_FACTS.firstDraftDays
          ? `A first draft is typically ready ${SITE_FACTS.firstDraftDays} days after the advance payment is verified.`
          : "Ask us for the current turnaround — it depends on package and season.",
      },
      {
        question: "Can I use a floor plan for construction?",
        answer: `A floor plan is the starting point. Builders usually also need elevations and sections, available in the [Full Package](${ROUTES.packagePages.fullPackage}). Local approval requirements may apply.`,
      },
      {
        question: "Can I send my own sketch?",
        answer: "Yes. Upload a sketch, photo or PDF in the order form. We work from it where it makes sense.",
      },
      {
        question: "What information should I prepare?",
        answer: `Plot dimensions, facing direction, number of rooms and a few reference images. Our [preparation checklist](${ROUTES.guide("prepare-for-your-architect")}) lists everything.`,
      },
    ],
  },

  "plan-and-elevation-design": {
    slug: "plan-elevation",
    crumbLabel: "Plan + Elevation",
    seo: {
      title: "House Plan and Front Elevation Design",
      description:
        "Get a custom floor plan plus front elevation design for your home. See your house inside and out with 2 free revisions. Order online today.",
      path: ROUTES.packagePages.planElevation,
      keywords: [
        "house plan and elevation design",
        "front elevation design",
        "house elevation drawing",
        "modern house design",
        "classic elevation",
        "floor plan and elevation",
      ],
    },
    title: "House Plan and Elevation Design: See Your Home Inside and Out",
    lead: "Your home needs to work on the inside and look right on the outside. Our Plan + Elevation package combines a custom floor plan with a front elevation design, so you can see the layout and the face of your house together before you build.",
    links: [{ label: "Start your order", href: ROUTES.newOrder }, compareLink],
    pricingHeading: "Pricing and revisions",
    pricingNote: "includes free revisions. Extra revisions are quoted before work continues.",
    blocks: [
      { kind: "h2", id: "what-is-a-front-elevation", text: "What is a front elevation?" },
      {
        kind: "p",
        text: `A front elevation is a drawing of the house as seen from the street. It shows the height of the building, the style of the facade, windows, doors, balconies, parapet lines and materials. People often search for "front elevation design" or "house elevation drawing" when they want to decide how their house will look.`,
      },
      {
        kind: "p",
        text: `New to the term? Read [floor plan vs elevation vs section: what each drawing is for](${ROUTES.guide("floor-plan-vs-elevation-vs-section")}).`,
      },
      { kind: "h2", id: "what-is-included", text: "What is included" },
      { kind: "ul", items: [
        "**Custom floor plan(s)** for each floor, with room dimensions",
        "**Front elevation design** matched to the floor plan",
        "**Style direction** such as modern, contemporary or classic",
        "**A watermarked draft preview** in your dashboard",
        "**Final files** after final payment is verified",
      ] },
      {
        kind: "p",
        text: "The plan and elevation are designed together, so windows, balconies and staircases line up properly, which is a common problem when the two are drawn by different people.",
      },
      { kind: "h2", id: "choosing-your-style", text: "Choosing your style" },
      { kind: "h3", text: "Modern house design" },
      {
        kind: "p",
        text: "Clean lines, flat or low-slope rooflines, large windows, simple planes and a minimal look. A good fit for compact plots because the facade stays uncluttered.",
      },
      { kind: "h3", text: "Contemporary home design" },
      {
        kind: "p",
        text: "A flexible mix of modern shapes with warmer materials and more detail. Suits owners who like a current look without a strict minimalist feel.",
      },
      { kind: "h3", text: "Classic house elevation" },
      {
        kind: "p",
        text: "Traditional proportions, columns, arches, ornamented windows and a formal entrance. Suits larger plots and owners who want a timeless look.",
      },
      {
        kind: "p",
        text: `Not sure which to choose? See [modern vs classic elevation: how to choose a style](${ROUTES.guide("modern-vs-classic-elevation")}) and browse [real projects in our portfolio](${ROUTES.portfolio}).`,
      },
      { kind: "h2", id: "how-the-process-works", text: "How the process works" },
      { kind: "steps", items: [
        { title: "Submit your order", text: `including style preferences and reference images on the [order form](${ROUTES.newOrder})` },
        { title: "Receive a quote", text: "and pay the advance to start" },
        { title: "We design the layout first", text: "then shape the elevation around it" },
        { title: "Review your draft", text: "and request your free revisions with notes and images" },
        { title: "Approve, pay the balance", text: "and download your final files" },
      ] },
      {
        kind: "p",
        text: `The complete journey is explained on our [How It Works page](${ROUTES.howItWorks}).`,
      },
      { kind: "h2", id: "who-should-choose", text: "Who should choose Plan + Elevation?" },
      { kind: "ul", items: [
        "Most first-time homeowners who want a **complete concept** of the house",
        "Owners **comparing builders**, who want clear visuals to discuss",
        "People who want to **finalize the look** before ordering full construction drawings",
        "Anyone who has a plot and a style in mind but is unsure how to turn it into a design",
      ] },
      {
        kind: "p",
        text: `If your builder needs sections and a door and window schedule, upgrade to the [Full Package](${ROUTES.packagePages.fullPackage}).`,
      },
      { kind: "h2", id: "examples-by-plot-size", text: "Examples by plot size" },
      { kind: "links", items: [
        { label: "5 marla house design", href: ROUTES.plotPages.marla5 },
        { label: "10 marla house plan", href: ROUTES.plotPages.marla10 },
        { label: "1 kanal house design", href: ROUTES.plotPages.kanal1 },
        { label: "House design portfolio", href: ROUTES.portfolio },
      ] },
      {
        kind: "p",
        text: SITE_FACTS.elevationDeliverable
          ? `The elevation you receive is a ${SITE_FACTS.elevationDeliverable}. 3D renders are not included unless listed in your quote.`
          : "What exactly the elevation deliverable includes is stated in your quote before you pay.",
      },
    ],
    faq: [
      {
        question: "Is the elevation 2D or 3D?",
        answer: SITE_FACTS.elevationDeliverable
          ? `The elevation is a ${SITE_FACTS.elevationDeliverable}. 3D renders are not included unless listed in your quote.`
          : "Your quote states exactly what the elevation deliverable includes before you pay.",
      },
      {
        question: "Can I choose my own style?",
        answer: "Yes. Share reference images in the order form and we will design to that direction.",
      },
      {
        question: "Do I get side and rear elevations?",
        answer: `This package covers the front elevation. For additional elevations, ask in your order or choose the [Full Package](${ROUTES.packagePages.fullPackage}).`,
      },
      {
        question: "Can I upgrade later?",
        answer: "Yes. Contact us on your order thread for a quote on adding sections and schedules.",
      },
      {
        question: "How do I start?",
        answer: `Go straight to the [order form](${ROUTES.newOrder}), or [create an account](${ROUTES.register}) first if you prefer.`,
      },
    ],
  },

  "full-architectural-drawings": {
    slug: "full-package",
    crumbLabel: "Full Architectural Drawings",
    seo: {
      title: "Full Architectural Drawings for Houses",
      description:
        "Order a complete architectural drawing set: floor plans, elevations, sections and door and window schedule, with 3 free revisions. Start online.",
      path: ROUTES.packagePages.fullPackage,
      keywords: [
        "full architectural drawings",
        "house section drawings",
        "door and window schedule",
        "architectural drawing set",
        "complete house drawings",
        "drawings for builder",
      ],
    },
    title: "Full Architectural Drawings: A Complete Drawing Set for Your House",
    lead: "When you are ready to build, your builder needs more than a floor plan. Our Full Package delivers a complete set of architectural drawings: plans, elevations, sections and a door and window schedule, so everyone on site works from the same information.",
    links: [{ label: "Start your order", href: ROUTES.newOrder }, compareLink],
    pricingHeading: "Pricing and revisions",
    pricingNote: "includes free revisions. Extra revisions are quoted before work continues.",
    blocks: [
      { kind: "h2", id: "what-is-included", text: "What is included in the Full Package" },
      {
        kind: "table",
        head: ["Drawing", "What it shows", "Why it matters"],
        rows: [
          ["Floor plans", "Layout of each floor with dimensions", "Where rooms, walls, doors and stairs go"],
          ["Elevations", "The exterior faces of the house", "How the house looks and its heights"],
          ["Section drawings", "A vertical slice through the building", "Floor heights, stair rise, roof and slab levels"],
          ["Door and window schedule", "A table of every door and window with size and type", "Ordering and fitting without confusion"],
        ],
        note: "Confirm the final deliverables and which elevations are included in your quote.",
      },
      {
        kind: "p",
        text: `Our guide on [what is included in architectural drawings](${ROUTES.guide("what-is-included-in-architectural-drawings")}) explains each in more detail.`,
      },
      { kind: "h2", id: "what-are-sections", text: "What are section drawings?" },
      {
        kind: "p",
        text: `A section drawing cuts through the house vertically, as if the building were sliced open. It shows floor-to-floor heights, ceiling heights, staircase proportions, roof levels and foundation depth. Builders rely on sections to make sure the structure matches the design. Compare the three drawing types in [floor plan vs elevation vs section](${ROUTES.guide("floor-plan-vs-elevation-vs-section")}).`,
      },
      { kind: "h2", id: "door-window-schedule", text: "What is a door and window schedule?" },
      {
        kind: "p",
        text: "A door and window schedule is a table that lists every door and window in the house with a reference number, size, type and location. It stops the common site problem of the wrong size being ordered or fitted. It also makes it easier to get accurate quotes from carpenters and window fabricators.",
      },
      { kind: "h2", id: "how-we-prepare", text: "How we prepare your drawing set" },
      { kind: "steps", items: [
        { title: "Layout first.", text: "We finalize the floor plan with you, because everything else depends on it." },
        { title: "Elevation next.", text: "The exterior is shaped around the approved plan." },
        { title: "Sections and schedules.", text: "Once plan and elevation are agreed, we add the technical drawings." },
        { title: "Consistency check.", text: "We cross-check dimensions and openings across all drawings." },
        { title: "Review and revise.", text: "You see watermarked drafts and request your free revisions." },
      ] },
      { kind: "h2", id: "who-should-choose", text: "Who should choose the Full Package?" },
      { kind: "ul", items: [
        "Owners who are **ready to hand drawings to a builder**",
        "People planning to **get quotes from several contractors** and want comparable information",
        "Those who want **fewer site mistakes** and fewer disputes over details",
        "Clients who need drawings prepared **for further engineering or approval work**",
      ] },
      {
        kind: "p",
        text: `Before you hand over your files, read our guide: [what to check before giving drawings to a builder](${ROUTES.guide("check-drawings-before-giving-to-builder")}).`,
      },
      { kind: "h2", id: "what-it-does-not-cover", text: "What the Full Package does not cover" },
      { kind: "ul", items: [
        "Structural design, electrical and plumbing engineering",
        "Authority or society approval submission",
        "Bills of quantities or cost estimates",
        "Site supervision",
      ] },
      {
        kind: "callout",
        text: "Our drawings are design drawings. Local approval requirements may apply, so confirm them before construction. If you need services we do not provide, we will say so honestly.",
      },
      {
        kind: "p",
        text: SITE_FACTS.finalFileFormats
          ? `Final files are delivered as ${SITE_FACTS.finalFileFormats} after final payment is verified.`
          : "The exact file formats you receive are listed in your quote before you pay.",
      },
    ],
    faq: [
      {
        question: "Are these drawings enough to start construction?",
        answer:
          "They are a complete architectural set. Builders typically also need structural details from an engineer, and local approval rules may apply.",
      },
      {
        question: "Can I start with a smaller package and upgrade?",
        answer: `Yes. Start with [Plan + Elevation](${ROUTES.packagePages.planElevation}) and ask for an upgrade quote on your order thread.`,
      },
      {
        question: "Do I get editable files?",
        answer: SITE_FACTS.editableFilesAnswer
          ? SITE_FACTS.editableFilesAnswer
          : "Your quote states which file formats you receive before you pay.",
      },
      {
        question: "How long does the full set take?",
        answer: SITE_FACTS.firstDraftDays
          ? `A first draft is typically ready ${SITE_FACTS.firstDraftDays} days after the advance is verified. Sections and schedules follow once the plan and elevation are approved.`
          : "Ask us for the current turnaround. Sections and schedules follow once the plan and elevation are approved.",
      },
      {
        question: "What do I need to provide?",
        answer: `Plot dimensions, facing, room requirements and reference images. See the [preparation checklist](${ROUTES.guide("prepare-for-your-architect")}).`,
      },
    ],
  },
};

/** Route segment for each package page (matches `seo.path`). */
export const packagePageSlugs = Object.keys(PACKAGE_PAGES);
