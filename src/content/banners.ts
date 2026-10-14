/**
 * Copy for the full-bleed photo bands (ImageBanner) added below each page
 * header (Phase 5 polish). The images live in public/images/ — see
 * README "Images needed" for the exact files and sizes.
 */
export type BannerCopy = {
  imageSrc: string;
  eyebrow: string;
  heading: string;
  text: string;
  cta?: { label: string; href: string };
};

export const banners = {
  services: {
    imageSrc: "/images/banner-services.webp",
    eyebrow: "House plan packages",
    heading: "One studio, three levels of detail",
    text: "From a single floor plan to a complete drawing set — every package is delivered online, draft first, finals after payment.",
  },
  howItWorks: {
    imageSrc: "/images/banner-how-it-works.webp",
    eyebrow: "From plot to drawings",
    heading: "A clear path to your house plan",
    text: "Five steps, revisions built in, and a draft you see before any final file is released.",
  },
  about: {
    imageSrc: "/images/banner-about.webp",
    eyebrow: "The studio",
    heading: "Designing homes, online",
    text: "We work with clients across Pakistan and abroad — every plan drawn to your plot, your budget and your family's needs.",
  },
  contact: {
    imageSrc: "/images/banner-contact.webp",
    eyebrow: "Talk to us",
    heading: "Questions before you order?",
    text: "Send your plot size and we will tell you what is possible — usually within a few hours.",
  },
  guides: {
    imageSrc: "/images/banner-guides.webp",
    eyebrow: "Learn first",
    heading: "Plan smarter before you build",
    text: "Plain-language guides on plot sizes, layouts, drawings and costs — free to read, no order needed.",
  },
  marla5: {
    imageSrc: "/images/banner-5-marla.webp",
    eyebrow: "5 marla house design",
    heading: "Compact homes that use every foot",
    text: "Browse 5 marla layouts and elevations, then order a design adapted to your own plot.",
  },
  marla10: {
    imageSrc: "/images/banner-10-marla.webp",
    eyebrow: "10 marla house plan",
    heading: "The popular family-home size",
    text: "See how 10 marla plots turn into two-floor homes with garages, lounges and generous rooms.",
  },
  kanal1: {
    imageSrc: "/images/banner-1-kanal.webp",
    eyebrow: "1 kanal house design",
    heading: "Large plots, generous homes",
    text: "Lawns, parking and spacious layouts — browse 1 kanal projects and start your own.",
  },
} as const;

export type BannerKey = keyof typeof banners;
