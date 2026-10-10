/**
 * Every fixed value in the app lives here (AGENTS.md, "Configuration and Constants").
 * Import from this file instead of typing literals anywhere else.
 */

export const APP = {
  name: "ArchiPlan Studio",
  tagline: "Custom house designs, delivered step by step",
  description:
    "Order custom house architecture designs: floor plans, elevations and full drawing sets, with a transparent process from quote to final delivery.",
  currency: "PKR",
  currencySymbol: "Rs",
  locale: "en-PK",
  orderNumberPrefix: "AP",
} as const;

export const ROLES = {
  CLIENT: "CLIENT",
  ADMIN: "ADMIN",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROUTES = {
  home: "/",
  portfolio: "/portfolio",
  services: "/services",
  howItWorks: "/how-it-works",
  about: "/about",
  contact: "/contact",
  guides: "/guides",
  guide: (slug: string) => `/guides/${slug}`,
  /** One landing page per package (CONTENT.md keyword map). */
  packagePages: {
    floorPlan: "/services/floor-plan-design",
    planElevation: "/services/plan-and-elevation-design",
    fullPackage: "/services/full-architectural-drawings",
  },
  /** Plot-size landing pages (CONTENT.md §4). */
  plotPages: {
    marla5: "/5-marla-house-design",
    marla10: "/10-marla-house-plan",
    kanal1: "/1-kanal-house-design",
  },
  login: "/sign-in",
  register: "/sign-up",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",
  dashboard: "/dashboard",
  dashboardOrders: "/dashboard/orders",
  dashboardOrder: (id: string) => `/dashboard/orders/${id}`,
  newOrder: "/order/new",
  admin: {
    root: "/admin",
    orders: "/admin/orders",
    packages: "/admin/packages",
    portfolio: "/admin/portfolio",
  },
} as const;

export const ORDER_STATUSES = {
  SUBMITTED: "SUBMITTED",
  QUOTED: "QUOTED",
  AWAITING_ADVANCE: "AWAITING_ADVANCE",
  IN_DESIGN: "IN_DESIGN",
  DRAFT_DELIVERED: "DRAFT_DELIVERED",
  REVISION_REQUESTED: "REVISION_REQUESTED",
  AWAITING_FINAL_PAYMENT: "AWAITING_FINAL_PAYMENT",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  SUBMITTED: "Submitted",
  QUOTED: "Quote Sent",
  AWAITING_ADVANCE: "Awaiting Advance",
  IN_DESIGN: "In Design",
  DRAFT_DELIVERED: "Draft Delivered",
  REVISION_REQUESTED: "Revision Requested",
  AWAITING_FINAL_PAYMENT: "Awaiting Final Payment",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const FILE_KINDS = {
  CLIENT: "CLIENT",
  DRAFT_PREVIEW: "DRAFT_PREVIEW",
  DRAFT_ORIGINAL: "DRAFT_ORIGINAL",
  FINAL: "FINAL",
  PAYMENT_PROOF: "PAYMENT_PROOF",
  REVISION_REF: "REVISION_REF",
} as const;

export type FileKind = (typeof FILE_KINDS)[keyof typeof FILE_KINDS];

export const PAYMENT_TYPES = {
  ADVANCE: "ADVANCE",
  FINAL: "FINAL",
  EXTRA_REVISION: "EXTRA_REVISION",
} as const;

export type PaymentType = (typeof PAYMENT_TYPES)[keyof typeof PAYMENT_TYPES];

export const PAYMENT_STATUSES = {
  PENDING: "PENDING",
  PAID: "PAID",
  REJECTED: "REJECTED",
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[keyof typeof PAYMENT_STATUSES];

export const PAYMENT_METHODS = {
  BANK_TRANSFER: "BANK_TRANSFER",
  CARD: "CARD",
  OTHER: "OTHER",
} as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

export const REVISION_STATUSES = {
  OPEN: "OPEN",
  DONE: "DONE",
} as const;

export type RevisionStatus = (typeof REVISION_STATUSES)[keyof typeof REVISION_STATUSES];

export const PLOT_UNITS = ["FT", "M", "MARLA", "KANAL"] as const;
export type PlotUnit = (typeof PLOT_UNITS)[number];

export const DIRECTIONS = ["NORTH", "SOUTH", "EAST", "WEST", "CORNER"] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const ROAD_SIDES = ["FRONT", "BACK", "LEFT", "RIGHT"] as const;
export type RoadSide = (typeof ROAD_SIDES)[number];

export const KITCHEN_TYPES = ["OPEN", "CLOSED"] as const;
export type KitchenType = (typeof KITCHEN_TYPES)[number];

export const STYLES = ["MODERN", "CLASSIC", "MINIMAL", "SPANISH", "ARABIC", "OTHER"] as const;
export type Style = (typeof STYLES)[number];

export const FILE_LIMITS = {
  /** Max size for a client upload, in bytes (10 MB). */
  clientMaxSizeBytes: 10 * 1024 * 1024,
  /** Max size for an admin upload, in bytes (100 MB). */
  adminMaxSizeBytes: 100 * 1024 * 1024,
  /** Max files attached to one order by a client. */
  maxClientFiles: 10,
  /** Max images attached to one revision request. */
  maxRevisionImages: 5,
  /** Signed download URL lifetime, in seconds. */
  signedUrlTtlSeconds: 60,
  /** Presigned upload URL lifetime, in seconds. */
  presignTtlSeconds: 300,
} as const;

export const CLIENT_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;

export const ADMIN_EXTRA_MIME_TYPES = [
  "application/zip",
  "application/postscript",
  "image/svg+xml",
  "application/vnd.adobe.illustrator",
  "application/acad",
  "image/vnd.dwg",
] as const;

export const PAGINATION = {
  defaultPage: 1,
  defaultPageSize: 20,
  maxPageSize: 100,
} as const;

export const RATE_LIMITS = {
  contact: { limit: 3, windowSeconds: 3600 },
  presign: { limit: 30, windowSeconds: 60 },
  messages: { limit: 20, windowSeconds: 60 },
  realtime: { limit: 30, windowSeconds: 60 },
  default: { limit: 120, windowSeconds: 60 },
} as const;

/**
 * Realtime pings (Ably): id-only events that tell subscribed clients which
 * query keys to invalidate. Never carry names, emails, bodies, or amounts.
 */
export const REALTIME_EVENTS = {
  quoteSent: "quote.sent",
  statusChanged: "order.status_changed",
  orderCreated: "order.created",
  messageCreated: "message.created",
} as const;

export type RealtimeEventType =
  (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

/** Channels are subscribe-only for clients; publishing happens server-side. */
export const REALTIME_CHANNELS = {
  user: (id: string) => `user:${id}`,
  admins: "role:admin",
  /** Single event name on every channel; the payload carries `type`. */
  ping: "ping",
} as const;

/** Realtime token lifetime; the SDK renews before expiry via the token route. */
export const REALTIME_TOKEN_TTL_MS = 60 * 60_000;

/** Per-order chat limits (FR-26). */
export const MESSAGES = {
  maxLength: 2000,
} as const;

/**
 * Theme system: dark mode is the `.dark` class on <html> (next-themes);
 * each color scheme is a `scheme-{id}` class with a light block and a
 * `.scheme-{id}.dark` block in globals.css. Swatches drive the switcher UI.
 */
export const THEME_STORAGE_KEYS = {
  mode: "archiplan-theme-mode",
  scheme: "archiplan-theme-scheme",
} as const;

export const THEME_MODES = {
  light: "light",
  dark: "dark",
  system: "system",
} as const;

export type ThemeMode = (typeof THEME_MODES)[keyof typeof THEME_MODES];

export const THEME_SCHEMES = [
  { id: "default", label: "Blueprint", lightSwatch: ["#24467a", "#a94a27"], darkSwatch: ["#5b8ddd", "#bc5a35"] },
  { id: "ocean", label: "Ocean", lightSwatch: ["#0e7490", "#c2410c"], darkSwatch: ["#22d3ee", "#f97316"] },
  { id: "forest", label: "Forest", lightSwatch: ["#15803d", "#b45309"], darkSwatch: ["#4ade80", "#f59e0b"] },
  { id: "violet", label: "Violet", lightSwatch: ["#7c3aed", "#db2777"], darkSwatch: ["#a78bfa", "#f472b6"] },
  { id: "rose", label: "Rose", lightSwatch: ["#be123c", "#9f1239"], darkSwatch: ["#fb7185", "#f43f5e"] },
] as const;

export type ThemeSchemeId = (typeof THEME_SCHEMES)[number]["id"];

/** Classes the palette script/provider may legally place on <html>. */
export const THEME_SCHEME_CLASSES = THEME_SCHEMES.map((scheme) =>
  scheme.id === "default" ? "" : `scheme-${scheme.id}`,
).filter(Boolean);

export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",
  NOT_FOUND: "NOT_FOUND",
  INVALID_TRANSITION: "INVALID_TRANSITION",
  REVISION_LIMIT_REACHED: "REVISION_LIMIT_REACHED",
  PAYMENT_REQUIRED: "PAYMENT_REQUIRED",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  UNSUPPORTED_FILE_TYPE: "UNSUPPORTED_FILE_TYPE",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ApiErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";

export const ORDER_DEFAULTS = {
  /** Default advance share of the total price, in percent. Editable per quote. */
  advancePercent: 40,
} as const;

export const EMAIL_SUBJECTS = {
  orderReceived: "We received your order",
  quoteReady: "Your quote is ready",
  paymentConfirmed: "Payment confirmed",
  draftReady: "Your draft is ready",
  revisionRequested: "New revision request",
  finalReady: "Your final files are ready",
  newMessage: "New message on your order",
  orderCompleted: "Your order is complete",
} as const;

/** One email notification per order per this window (FR-27). */
export const MESSAGE_NOTIFICATION_WINDOW_MINUTES = 10;

export const WHATSAPP = {
  prefilledMessage: "Hello! I am interested in a custom house design.",
} as const;

export const NAV_LINKS = [
  { label: "Services", href: ROUTES.services },
  { label: "Portfolio", href: ROUTES.portfolio },
  { label: "How It Works", href: ROUTES.howItWorks },
  { label: "Guides", href: ROUTES.guides },
  { label: "About", href: ROUTES.about },
  { label: "Contact", href: ROUTES.contact },
] as const;

/** Primary action label on every page (CONTENT.md §8). */
export const CTA = {
  primary: "Start your order",
} as const;

/** Required on the footer and on every package and guide page (CONTENT.md). */
export const DISCLAIMER =
  "Our drawings are design drawings. Local approval requirements (such as society or development authority rules) may apply. Please confirm them before construction.";

export const API_ROUTES = {
  packages: "/api/packages",
  adminPackages: "/api/admin/packages",
  adminPackage: (id: string) => `/api/admin/packages/${id}`,
  session: "/api/session",
  orders: "/api/orders",
  order: (id: string) => `/api/orders/${id}`,
  acceptQuote: (id: string) => `/api/orders/${id}/accept-quote`,
  approveDraft: (id: string) => `/api/orders/${id}/approve-draft`,
  cancelOrder: (id: string) => `/api/orders/${id}/cancel`,
  revisions: (id: string) => `/api/orders/${id}/revisions`,
  messages: (id: string) => `/api/orders/${id}/messages`,
  payments: (id: string) => `/api/orders/${id}/payments`,
  paymentProof: (id: string) => `/api/payments/${id}/proof`,
  filesPresign: "/api/files/presign",
  filesConfirm: "/api/files/confirm",
  fileDownload: (id: string) => `/api/files/${id}/download`,
  adminOrders: "/api/admin/orders",
  adminOrder: (id: string) => `/api/admin/orders/${id}`,
  adminQuote: (id: string) => `/api/admin/orders/${id}/quote`,
  adminOrderStatus: (id: string) => `/api/admin/orders/${id}/status`,
  adminDrafts: (id: string) => `/api/admin/orders/${id}/drafts`,
  adminFinals: (id: string) => `/api/admin/orders/${id}/finals`,
  adminNotes: (id: string) => `/api/admin/orders/${id}/notes`,
  adminPayment: (id: string) => `/api/admin/payments/${id}`,
  adminRevision: (id: string) => `/api/admin/revisions/${id}`,
  adminStats: "/api/admin/stats",
  realtimeToken: "/api/realtime/token",
  portfolio: "/api/portfolio",
  adminPortfolio: "/api/admin/portfolio",
  adminPortfolioReorder: "/api/admin/portfolio/reorder",
  contact: "/api/contact",
} as const;
