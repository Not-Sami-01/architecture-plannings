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
  login: "/login",
  register: "/register",
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
  auth: { limit: 5, windowSeconds: 60 },
  contact: { limit: 3, windowSeconds: 3600 },
  presign: { limit: 30, windowSeconds: 60 },
  messages: { limit: 20, windowSeconds: 60 },
  default: { limit: 120, windowSeconds: 60 },
} as const;

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
  auth: {
    register: "/api/auth/register",
    forgotPassword: "/api/auth/forgot-password",
    resetPassword: "/api/auth/reset-password",
    verifyEmail: "/api/auth/verify-email",
  },
  packages: "/api/packages",
  adminPackages: "/api/admin/packages",
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
  portfolio: "/api/portfolio",
  adminPortfolio: "/api/admin/portfolio",
  adminPortfolioReorder: "/api/admin/portfolio/reorder",
  contact: "/api/contact",
} as const;
