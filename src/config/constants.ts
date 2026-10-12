/**
 * Every fixed value in the app lives here (AGENTS.md, "Configuration and Constants").
 * Import from this file instead of typing literals anywhere else.
 */

export const APP = {
  name: "ArchiPlan Studio",
  tagline: "Custom house designs, delivered step by step",
  description:
    "Order custom house architecture designs: floor plans, elevations and full drawing sets, with a transparent process from quote to final delivery.",
  /** Fallback currency until the SiteSetting row loads (plan 3). */
  currency: "PKR",
  locale: "en-PK",
  orderNumberPrefix: "AP",
} as const;

/**
 * Admin-selectable currencies (plan 3). Codes are ISO 4217; symbols come from
 * Intl via formatMoney — only the code is stored (SiteSetting + Order.currency).
 */
export const SUPPORTED_CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "KRW", name: "South Korean Won" },
  { code: "INR", name: "Indian Rupee" },
  { code: "PKR", name: "Pakistani Rupee" },
  { code: "BDT", name: "Bangladeshi Taka" },
  { code: "LKR", name: "Sri Lankan Rupee" },
  { code: "NPR", name: "Nepalese Rupee" },
  { code: "AED", name: "UAE Dirham" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "QAR", name: "Qatari Riyal" },
  { code: "KWD", name: "Kuwaiti Dinar" },
  { code: "BHD", name: "Bahraini Dinar" },
  { code: "OMR", name: "Omani Rial" },
  { code: "JOD", name: "Jordanian Dinar" },
  { code: "ILS", name: "Israeli New Shekel" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "EGP", name: "Egyptian Pound" },
  { code: "ZAR", name: "South African Rand" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "GHS", name: "Ghanaian Cedi" },
  { code: "MAD", name: "Moroccan Dirham" },
  { code: "TND", name: "Tunisian Dinar" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "ARS", name: "Argentine Peso" },
  { code: "CLP", name: "Chilean Peso" },
  { code: "COP", name: "Colombian Peso" },
  { code: "PEN", name: "Peruvian Sol" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "NOK", name: "Norwegian Krone" },
  { code: "DKK", name: "Danish Krone" },
  { code: "ISK", name: "Icelandic Krona" },
  { code: "PLN", name: "Polish Zloty" },
  { code: "CZK", name: "Czech Koruna" },
  { code: "HUF", name: "Hungarian Forint" },
  { code: "RON", name: "Romanian Leu" },
  { code: "BGN", name: "Bulgarian Lev" },
  { code: "RSD", name: "Serbian Dinar" },
  { code: "UAH", name: "Ukrainian Hryvnia" },
  { code: "RUB", name: "Russian Ruble" },
  { code: "KZT", name: "Kazakhstani Tenge" },
  { code: "THB", name: "Thai Baht" },
  { code: "VND", name: "Vietnamese Dong" },
  { code: "IDR", name: "Indonesian Rupiah" },
  { code: "MYR", name: "Malaysian Ringgit" },
  { code: "PHP", name: "Philippine Piso" },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

export const isSupportedCurrency = (code: string): code is CurrencyCode =>
  SUPPORTED_CURRENCIES.some((currency) => currency.code === code);

/** Keys of the SiteSetting table (plan 3). */
export const SETTINGS_KEYS = {
  currency: "currency",
} as const;

/** Revision limits (PRD FR-20; free count comes from Package.revisionLimit). */
export const REVISIONS = {
  maxRefFiles: 5,
  maxLength: 2000,
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
    order: (id: string) => `/admin/orders/${id}`,
    /** Focused workspace: status, drop files, charge, chat (plan 2 P5). */
    orderProceed: (id: string) => `/admin/orders/${id}/proceed`,
    chats: "/admin/chats",
    chat: (orderId: string) => `/admin/chats/${orderId}`,
    files: "/admin/files",
    users: "/admin/users",
    packages: "/admin/packages",
    settings: "/admin/settings",
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

/**
 * One-line explanation of what each status means for the client (order
 * cards, detail header, dashboards). Keep it action-oriented and short.
 */
export const ORDER_STATUS_DETAIL: Record<OrderStatus, string> = {
  SUBMITTED: "We received your order and will send a quote shortly.",
  QUOTED: "Your quote is ready — review the price and accept to begin.",
  AWAITING_ADVANCE: "Quote accepted — pay the advance and we will start designing.",
  IN_DESIGN: "Your drawings are being prepared — drafts are on the way.",
  DRAFT_DELIVERED: "Your draft is ready — review it, then approve or request changes.",
  REVISION_REQUESTED: "Revision requested — updated drawings are being prepared.",
  AWAITING_FINAL_PAYMENT: "Draft approved — pay the balance to unlock the final files.",
  COMPLETED: "All done — your full drawing set is ready to download.",
  CANCELLED: "This order was cancelled.",
};

export const FILE_KINDS = {
  CLIENT: "CLIENT",
  DRAFT_PREVIEW: "DRAFT_PREVIEW",
  DRAFT_ORIGINAL: "DRAFT_ORIGINAL",
  FINAL: "FINAL",
  PAYMENT_PROOF: "PAYMENT_PROOF",
  REVISION_REF: "REVISION_REF",
  CHAT_ATTACHMENT: "CHAT_ATTACHMENT",
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

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  ADVANCE: "Advance payment",
  FINAL: "Final payment",
  EXTRA_REVISION: "Extra revision charge",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Awaiting payment",
  PAID: "Paid",
  REJECTED: "Rejected",
};

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
  /** Max files attached to one chat message. */
  maxChatAttachments: 4,
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
  messageUpdated: "message.updated",
  messageDeleted: "message.deleted",
  /** Messages were marked read by the counterpart (refId = order id). */
  messageRead: "message.read",
  /** A charge was created / verified (refId = order id). */
  paymentCreated: "payment.created",
  paymentUpdated: "payment.updated",
  /** Deliverables & revisions (plan 3; refId = order id). */
  revisionRequested: "revision.requested",
  revisionAccepted: "revision.accepted",
  draftDelivered: "draft.delivered",
  finalsRegistered: "finals.registered",
  /** Site settings changed (plan 3; refId = the setting key). */
  settingsUpdated: "settings.updated",
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
  /** Max message ids accepted in one read-receipt batch. */
  maxReadBatch: 100,
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
  { id: "default", label: "Patina", lightSwatch: ["#28665f", "#202723"], darkSwatch: ["#58a69d", "#83a49e"] },
  { id: "ocean", label: "Ocean", lightSwatch: ["#0e7490", "#155e75"], darkSwatch: ["#22d3ee", "#67e8f9"] },
  { id: "forest", label: "Forest", lightSwatch: ["#15803d", "#166534"], darkSwatch: ["#4ade80", "#86efac"] },
  { id: "violet", label: "Violet", lightSwatch: ["#7c3aed", "#6d28d9"], darkSwatch: ["#a78bfa", "#c4b5fd"] },
  { id: "rose", label: "Rose", lightSwatch: ["#be123c", "#9f1239"], darkSwatch: ["#fb7185", "#fda4af"] },
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

/** Stand-in image for any section that needs a render we do not have yet. */
export const PLACEHOLDER_IMAGE = "https://placehold.net/400x400.png";

export const API_ROUTES = {
  packages: "/api/packages",
  adminPackages: "/api/admin/packages",
  adminPackage: (id: string) => `/api/admin/packages/${id}`,
  session: "/api/session",
  settings: "/api/settings",
  orders: "/api/orders",
  order: (id: string) => `/api/orders/${id}`,
  acceptQuote: (id: string) => `/api/orders/${id}/accept-quote`,
  approveDraft: (id: string) => `/api/orders/${id}/approve-draft`,
  cancelOrder: (id: string) => `/api/orders/${id}/cancel`,
  revisions: (id: string) => `/api/orders/${id}/revisions`,
  messages: (id: string) => `/api/orders/${id}/messages`,
  message: (orderId: string, messageId: string) => `/api/orders/${orderId}/messages/${messageId}`,
  messagesRead: (id: string) => `/api/orders/${id}/messages/read`,
  messagesUnreadCount: (id: string) => `/api/orders/${id}/messages/unread-count`,
  payments: (id: string) => `/api/orders/${id}/payments`,
  paymentProof: (id: string) => `/api/payments/${id}/proof`,
  filesPresign: "/api/files/presign",
  filesConfirm: "/api/files/confirm",
  fileDownload: (id: string) => `/api/files/${id}/download`,
  adminUsers: "/api/admin/users",
  adminUser: (id: string) => `/api/admin/users/${id}`,
  adminThreads: "/api/admin/threads",
  adminFiles: "/api/admin/files",
  adminFile: (id: string) => `/api/admin/files/${id}`,
  adminOrderTake: (id: string) => `/api/admin/orders/${id}/take`,
  adminOrders: "/api/admin/orders",
  adminOrder: (id: string) => `/api/admin/orders/${id}`,
  adminQuote: (id: string) => `/api/admin/orders/${id}/quote`,
  adminOrderStatus: (id: string) => `/api/admin/orders/${id}/status`,
  adminOrderPayments: (id: string) => `/api/admin/orders/${id}/payments`,
  adminDrafts: (id: string) => `/api/admin/orders/${id}/drafts`,
  adminFinals: (id: string) => `/api/admin/orders/${id}/finals`,
  adminNotes: (id: string) => `/api/admin/orders/${id}/notes`,
  adminPayment: (id: string) => `/api/admin/payments/${id}`,
  adminRevision: (id: string) => `/api/admin/revisions/${id}`,
  adminStats: "/api/admin/stats",
  adminSettings: "/api/admin/settings",
  realtimeToken: "/api/realtime/token",
  portfolio: "/api/portfolio",
  adminPortfolio: "/api/admin/portfolio",
  adminPortfolioReorder: "/api/admin/portfolio/reorder",
  contact: "/api/contact",
} as const;
