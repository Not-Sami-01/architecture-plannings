# Product Requirements Document (PRD)

**Product:** ArchiPlan Studio (placeholder name)
**Version:** 1.0
**Owner:** Founder / Lead Designer
**Status:** Draft

---

## 1. Overview

ArchiPlan Studio is an online service where people order custom house architecture designs. The founder designs in Adobe Illustrator and delivers floor plans, elevations, and complete drawing sets. The web app handles the full order lifecycle: ordering, quoting, payment, drafts, revisions, final delivery.

## 2. Problem

- Clients find architects through word of mouth and WhatsApp, with no structure.
- Requirements get lost in chat threads. Files get scattered.
- There is no clear pricing, status visibility, or revision limit, which causes scope creep.
- Delivering files before payment risks non-payment and misuse of work.

## 3. Goals

1. Let a client place a complete, well-specified order in under 5 minutes.
2. Give the admin one place to manage all orders, files, payments, and messages.
3. Protect the designer's work until payment is received.
4. Reduce back-and-forth by capturing requirements up front.
5. Build trust with a strong portfolio and transparent process.

### Non-goals (v1)

- Real-time 3D rendering or an in-browser drawing editor
- Multi-designer / marketplace features
- Construction management, contractor hiring, or material estimation
- Native mobile apps (the site must be mobile-responsive instead)

## 4. Users and Roles

| Role | Description | Key needs |
|------|-------------|-----------|
| **Visitor** | Prospective client browsing | See quality work, pricing, process |
| **Client** | Registered user who orders | Easy ordering, status tracking, revisions, downloads |
| **Admin** | The designer (owner) | Manage orders, upload deliverables, verify payments, edit content |

## 5. User Stories

### Visitor
- As a visitor, I can browse the portfolio filtered by plot size and style, so I can judge quality.
- As a visitor, I can see package contents and prices, so I know what I will get.
- As a visitor, I can read how the process works, so I trust it.
- As a visitor, I can contact the studio on WhatsApp from any page.

### Client
- As a client, I can register and log in, so I can track my orders.
- As a client, I can fill a step-by-step order form with plot details, room requirements, style, budget, and file uploads.
- As a client, I can see each order's status and timeline.
- As a client, I can view watermarked draft previews.
- As a client, I can approve a draft or request a revision with notes and annotated images.
- As a client, I can see how many free revisions remain.
- As a client, I can pay the advance and final amount, and upload proof of payment for bank transfers.
- As a client, I can chat in a comment thread on each order.
- As a client, I can download final files once fully paid.
- As a client, I get an email on every status change.

### Admin
- As admin, I get notified when a new order arrives.
- As admin, I can filter orders by status, date, and payment state.
- As admin, I can send a quote, change status, and add private notes.
- As admin, I can upload drafts (auto-watermarked) and final files.
- As admin, I can verify or reject manual payments.
- As admin, I can manage packages, prices, and revision limits.
- As admin, I can add, edit, reorder, and hide portfolio projects without code.
- As admin, I can see revenue, monthly orders, and pending work.

## 6. Packages (initial seed, editable by admin)

| Package | Includes | Revisions |
|---------|----------|-----------|
| **Floor Plan** | 2D floor plan(s) | 2 |
| **Plan + Elevation** | Floor plan + front elevation | 2 |
| **Full Package** | Plans, elevations, sections, door/window schedule | 3 |

Prices are set in the admin panel. Extra revisions are charged per revision.

## 7. Functional Requirements

### 7.1 Authentication and Authorization
- FR-1: Email/password registration with email verification; optional Google login.
- FR-2: Roles: `CLIENT`, `ADMIN`. Admin accounts are created via seed only.
- FR-3: Middleware protects `/dashboard/*` (client) and `/admin/*` (admin).
- FR-4: A client can only access their own orders, files, and messages.
- FR-5: Password reset via email link.

### 7.2 Order Creation
- FR-6: Multi-step form: (1) Package, (2) Plot details, (3) Requirements, (4) Style and budget, (5) Uploads, (6) Review and submit.
- FR-7: Plot details: width, length, unit (ft/m/marla/kanal), facing direction, road side(s), location (city).
- FR-8: Requirements: floors, bedrooms, bathrooms, kitchen type, garage, lounge, extras (free text).
- FR-9: Uploads: up to 10 files (JPG, PNG, PDF), max 10 MB each.
- FR-10: Guests start the form, and are prompted to register/login at submit. Form data persists locally in the meantime.
- FR-11: Each order gets a human-readable number, e.g. `AP-2026-0042`.

### 7.3 Order Lifecycle
- FR-12: Status machine as defined in section 8. Invalid transitions are rejected.
- FR-13: Every transition writes an `OrderEvent` (who, from, to, timestamp, note).
- FR-14: Every client-visible transition sends an email.

### 7.4 Files
- FR-15: Files are stored in a private bucket; the DB stores keys, never public URLs.
- FR-16: Downloads go through an authorized route and return short-lived signed URLs (60 seconds).
- FR-17: Admin-uploaded drafts are processed: watermark overlay + max 1200px width preview. The original is stored separately.
- FR-18: `FINAL` files are only downloadable when `order.finalPaymentVerified = true`.

### 7.5 Revisions
- FR-19: A client can request a revision only when status is `DRAFT_DELIVERED`.
- FR-20: A revision includes a text message and up to 5 images.
- FR-21: Revision count is incremented automatically; when it exceeds the package limit, the admin quotes an extra fee before work continues.

### 7.6 Payments
- FR-22: Two payment types per order: `ADVANCE` (default 40% of total) and `FINAL` (remainder). Percentage configurable.
- FR-23: Manual flow: client uploads proof, admin verifies or rejects.
- FR-24: Gateway flow (optional): checkout session plus webhook that marks payment as `PAID`.
- FR-25: Webhooks are verified by signature and are idempotent.

### 7.7 Messaging
- FR-26: A message thread per order, visible to the client and admin.
- FR-27: Email notification for new messages, rate-limited to one per 10 minutes per order.
- FR-28: Admin can add private internal notes not visible to the client.

### 7.8 Admin Dashboard
- FR-29: Orders table with filters (status, payment, date range), search (order number, client name), and sort.
- FR-30: Order detail page with all files, timeline, messages, payments, and status controls.
- FR-31: CRUD for packages. CRUD, reorder, and visibility toggle for portfolio projects.
- FR-32: Stats: revenue (this month, all time), orders this month, orders by status, pending actions.

### 7.9 Marketing Site
- FR-33: Pages: Home, Portfolio, Services/Pricing, How It Works, About, Contact.
- FR-34: Floating WhatsApp button with prefilled message.
- FR-35: SEO: metadata, Open Graph images, sitemap, robots.txt, structured data.

### 7.10 Later (Phase 5+)
- PDF invoices, testimonials after completion, coupon codes, blog, multi-language.

## 8. Order Status Machine

| From | To | Triggered by |
|------|----|--------------|
| `SUBMITTED` | `QUOTED` | Admin sends quote |
| `SUBMITTED` | `CANCELLED` | Admin or client |
| `QUOTED` | `AWAITING_ADVANCE` | Client accepts quote |
| `QUOTED` | `CANCELLED` | Client declines |
| `AWAITING_ADVANCE` | `IN_DESIGN` | Admin verifies advance payment |
| `IN_DESIGN` | `DRAFT_DELIVERED` | Admin uploads draft |
| `DRAFT_DELIVERED` | `REVISION_REQUESTED` | Client requests revision |
| `DRAFT_DELIVERED` | `AWAITING_FINAL_PAYMENT` | Client approves draft |
| `REVISION_REQUESTED` | `IN_DESIGN` | Admin accepts revision |
| `AWAITING_FINAL_PAYMENT` | `COMPLETED` | Final payment verified and finals uploaded |

## 9. Data Model (summary)

- **User:** id, name, email, passwordHash, role, phone, createdAt
- **Package:** id, name, slug, description, price, revisionLimit, deliverables[], active, order
- **Order:** id, number, userId, packageId, status, plot fields, requirement fields, style, budget, notes, totalPrice, advancePercent, revisionCount, finalPaymentVerified, createdAt
- **OrderFile:** id, orderId, key, filename, mime, size, kind (`CLIENT | DRAFT_PREVIEW | DRAFT_ORIGINAL | FINAL | PAYMENT_PROOF | REVISION_REF`), uploadedById
- **OrderEvent:** id, orderId, actorId, fromStatus, toStatus, note, createdAt
- **Revision:** id, orderId, number, message, status (`OPEN | DONE`), createdAt
- **Payment:** id, orderId, type (`ADVANCE | FINAL | EXTRA_REVISION`), amount, method, status (`PENDING | PAID | REJECTED`), reference, proofFileId, verifiedById
- **Message:** id, orderId, senderId, body, internal (bool), createdAt
- **PortfolioProject:** id, title, slug, category, plotSize, style, images[], featured, visible, sortOrder
- **Testimonial:** id, userId, orderId, text, rating, approved

## 10. Non-Functional Requirements

- **Security:** OWASP basics, hashed passwords (bcrypt/argon2), CSRF protection, rate-limited auth routes, strict file type and size validation, signed URLs only.
- **Performance:** LCP under 2.5s on mid-range mobile; portfolio images optimized and lazy-loaded.
- **Reliability:** Daily DB backups; idempotent webhooks; email failures never block order creation.
- **Privacy:** Clients' land documents are visible only to the client and admin. Provide a delete-my-data path.
- **Accessibility:** WCAG 2.1 AA for core flows.
- **Maintainability:** All fixed values (app name, routes, limits, labels) live in `src/config/constants.ts`; all environment variables are validated and exported from `src/config/config.ts` (no direct `process.env` use). All API routes use the shared `withMiddleware` pattern. UI is built from one-component-per-file, feature-grouped components.
- **SEO and content:** Public pages follow `CONTENT.md`: keyword-mapped, genuinely useful, long-form content with strong internal linking, metadata, and structured data.
- **Frontend standards:** TanStack Query for server state, shadcn/ui for components, one hook per API call with a standard return structure, and a single axios-based `api` util. Details in `RULES.md`.
- **Responsiveness:** Fully usable on phones, since most clients will arrive from social media.

## 11. Success Metrics

- Order form completion rate above 60%
- Median time from submission to quote under 24 hours
- Average revisions per order at or below the package limit
- 100% of final deliveries made after verified payment
- Repeat/referral orders over 20% after 6 months

## 12. Release Plan

| Phase | Scope | Exit criteria |
|-------|-------|---------------|
| **1 MVP** | Auth, packages, order form + uploads, admin order list | A real client can submit an order and the admin sees it |
| **2** | Client dashboard, status machine, emails | Full order tracking works end to end |
| **3** | Watermarked drafts, revisions, messages | A full design cycle can run inside the app |
| **4** | Payments, locked finals | Money flows and final files stay protected until paid |
| **5** | Portfolio CMS, stats, invoices, polish | Admin runs everything without touching code |

## 13. Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Clients bypass payment by screenshotting drafts | Heavy watermark + low-res previews |
| Payment gateway unavailable locally | Manual bank/wallet transfer with proof verification |
| Scope creep from endless revisions | Revision limits + paid extra revisions |
| Large uploads fail on slow connections | Direct-to-storage uploads, retry, progress UI |
| Solo-founder time constraint | Strict phased delivery; ship Phase 1 early |

## 14. Open Questions

1. Which currencies and payment methods are required at launch?
2. Is guest checkout needed, or is registration mandatory?
3. What is the exact advance percentage?
4. Should the quote be automatic (formula by plot size) or manual by the admin?
5. Which languages are needed at launch?
