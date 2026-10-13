# API Reference

Backend contracts for ArchiPlan Studio. The app uses **Next.js Route Handlers** (`src/app/api/**/route.ts`) for REST endpoints and **Server Actions** (`src/actions/*`) for authenticated form mutations. Both share the same Zod validators in `src/lib/validators/`.

Base URL: `/api`
Format: JSON unless stated otherwise.

---

## Conventions

### Authentication
Session cookie issued by Clerk (sign-in via `/sign-in`, sign-up via `/sign-up`; both are Clerk-hosted pages, not API endpoints). Every authenticated request resolves the local user (and role) via `resolveApiUser`. Access levels:

| Level | Meaning |
|-------|---------|
| `public` | No login |
| `client` | Logged in; resource must belong to the user |
| `admin` | Role `ADMIN` only |

### Success response
```json
{ "data": { } }
```

### Error response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Plot width is required",
    "details": [{ "path": ["plot", "width"], "message": "Required" }]
  }
}
```

### Error codes

| HTTP | Code | Meaning |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | Body or query failed Zod validation |
| 401 | `UNAUTHENTICATED` | Login required |
| 403 | `FORBIDDEN` | Not allowed (wrong role or not the owner) |
| 409 | `CONFLICT` | Resource state conflict (e.g. email already registered) |
| 404 | `NOT_FOUND` | Resource missing (also used to hide others' resources) |
| 409 | `INVALID_TRANSITION` | Status change not allowed |
| 409 | `REVISION_LIMIT_REACHED` | Free revisions used up |
| 402 | `PAYMENT_REQUIRED` | Final payment not verified |
| 413 | `FILE_TOO_LARGE` | Over the size limit |
| 415 | `UNSUPPORTED_FILE_TYPE` | Disallowed mime type |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected error |

### Pagination
`?page=1&pageSize=20` returns:
```json
{ "data": [], "meta": { "page": 1, "pageSize": 20, "total": 134 } }
```

---

## Handler Architecture

Every route is a thin handler wrapped by `withMiddleware`. Source: `src/lib/api/`.

### Middleware contract

```ts
type Middleware = (req: ApiRequest, res: ApiResponse) =>
  MiddlewareResult | Promise<MiddlewareResult>;

type MiddlewareResult = {
  success: boolean;      // false stops the chain
  message: string;       // becomes the error message when success is false
  req: ApiRequest;       // NextRequest + req.ctx { requestId, ip, params, query, body, user }
  res: ApiResponse;      // { headers, locals }, headers are merged into the final Response
  status: number;        // HTTP status used when success is false
  code?: ApiErrorCode;   // optional, defaults from status
  details?: unknown;     // optional, e.g. validation issues
};
```

Build results with `pass(req, res)` and `reject(req, res, status, message, { code, details })`.

### Register and export

```ts
export const GET = withMiddleware(getHandler, [authenticate]);
export const POST = withMiddleware(postHandler, [
  authenticate,
  requireRole(ROLES.ADMIN),
  validateBody(createThingSchema),
]);
```

`withMiddleware(handler, middlewares[], { skipDefaults? })`:

1. Builds `req.ctx` and `res`.
2. Runs `defaultMiddlewares` (rate limit), then the route's middlewares, in order.
3. First `success: false` returns the standard error response and skips the handler.
4. Runs the handler. A thrown `ApiError` becomes the standard error; any other error becomes a logged generic `500`.
5. Merges `res.headers`, adds `X-Request-Id`, logs method, path, status, and duration.

### Built-in middlewares

| Middleware | Purpose | Sets |
|------------|---------|------|
| `rateLimit({ limit, windowSeconds })` | Per user or IP throttling (default on every route) | `Retry-After` header on 429 |
| `authenticate` | Requires a session | `req.ctx.user` |
| `requireRole(...roles)` | Role guard (after `authenticate`) | none |
| `validateBody(zodSchema)` | Validates JSON body | `req.ctx.body` |
| `validateQuery(zodSchema)` | Validates query string | `req.ctx.query` |

Read validated data in handlers with `getBody<T>(req)`, `getQuery<T>(req)`, `getParam(req, "id")`, `getUser(req)`.

### Response helpers

`ok(data)`, `created(data)`, `paginated(items, meta)`, `noContent()`, `fail(status, message, code?, details?)`, and `throw ApiError.notFound()` / `forbidden()` / `unauthenticated()` / `badRequest()` / `paymentRequired()` / `conflict()`.

### Middleware order per route type

| Route type | Middlewares |
|------------|-------------|
| Public | `[]` (defaults only) |
| Client | `[authenticate, validate*]` |
| Admin | `[authenticate, requireRole(ROLES.ADMIN), validate*]` |
| Webhook | `[verifyWebhookSignature]` with `{ skipDefaults: true }` |
| Rate-limited sensitive | `[rateLimit(RATE_LIMITS.auth)]` plus the above |

All limits, error codes, and roles come from `src/config/constants.ts`.

---

## 1. Auth

No local auth endpoints: Clerk owns credentials and session cookies (`/sign-in`, `/sign-up`, and `clerkMiddleware` in `src/proxy.ts`). Our API only reads the session:

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/session` | public | `{ data: { id, name, email, role } }` or `{ data: null }` when signed out |

---

## 1b. Account page & UserButton (Clerk-managed UI)

No custom endpoints — the account page embeds Clerk's `<UserProfile />` at a **catch-all route** (`src/app/(marketing)/account/[[...account]]/page.tsx`):

- **Gate:** the page itself calls `auth()` server-side and redirects signed-out visitors to `/sign-in?next=/account` (Clerk middleware does not cover `/account`).
- **Access:** any signed-in role (CLIENT **and** ADMIN). It lives outside the `(client)` group on purpose — the `/dashboard` layout redirects admins away, `/account` must not.
- **Discovery:** every `<UserButton />` (navbar, client shell) uses `userProfileMode="navigation"` + `userProfileUrl="/account"`, so "Manage account" navigates here; sign out stays in the Clerk menu. The navbar also shows a role-aware **Dashboard** link (ADMIN → `/admin`, CLIENT → `/dashboard`).
- **SEO:** `robots: { index: false, follow: false }`; title "Account".

---

## 2. Packages

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/packages` | public | List active packages |
| GET | `/api/admin/packages` | admin | List all packages (incl. inactive) |
| POST | `/api/admin/packages` | admin | Create package |
| PATCH | `/api/admin/packages/:id` | admin | Update package (content, price, active flag) |
| DELETE | `/api/admin/packages/:id` | admin | Deactivate package |
| POST | `/api/admin/packages/:id/image` | admin | Upload the card image (**multipart form-data**, field `image`; server re-validates mime + size, crops client-side to 4:3). Replaces any previous image (old storage object deleted). Returns the package with `imageKey`. |
| DELETE | `/api/admin/packages/:id/image` | admin | Remove the card image (`imageKey: null`) |
| GET | `/api/packages/:id/image` | public | Stream the card image (`Cache-Control: public, max-age=3600, stale-while-revalidate=86400`). 404 when none. |

```json
// GET /api/packages
{
  "data": [{
    "id": "pkg_1",
    "name": "Plan + Elevation",
    "slug": "plan-elevation",
    "description": "Floor plan with front elevation.",
    "price": 25000,
    "revisionLimit": 2,
    "deliverables": ["Floor plan", "Front elevation"],
    "imageKey": "packages/pkg_1/abc123-plan.jpg"   // null until an image is uploaded; never a URL — the browser loads /api/packages/:id/image
  }]
}

// POST /api/admin/packages  → 201
{
  "name": "Plan + Elevation",
  "slug": "plan-elevation",        // optional — derived from name when omitted
  "description": "Floor plan with front elevation.",
  "price": 25000,                  // integer, smallest unit (PKR, no decimals)
  "revisionLimit": 2,
  "deliverables": ["Floor plan", "Front elevation"],
  "sortOrder": 1                   // optional
}

// PATCH /api/admin/packages/:id — any subset of the POST body + "active": boolean
// DELETE /api/admin/packages/:id → { "data": { …package with active: false } }
// Slug conflicts return 409 CONFLICT; missing ids return 404.
```

---

## 3. Orders (client)

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/api/orders` | client | Create order |
| GET | `/api/orders` | client | List my orders |
| GET | `/api/orders/:id` | client | Order detail |
| POST | `/api/orders/:id/accept-quote` | client | Accept quote, move to `AWAITING_ADVANCE` |
| POST | `/api/orders/:id/approve-draft` | client | Approve draft, move to `AWAITING_FINAL_PAYMENT` |
| POST | `/api/orders/:id/cancel` | client | Cancel (only before `IN_DESIGN`) |

**POST `/api/orders`**
```json
{
  "packageId": "pkg_1",
  "plot": {
    "width": 30, "length": 60, "unit": "FT",
    "facing": "NORTH", "roadSides": ["FRONT"], "city": "Lahore"
  },
  "requirements": {
    "floors": 2, "bedrooms": 4, "bathrooms": 4,
    "kitchenType": "OPEN", "garage": true, "lounge": true,
    "extras": "Prayer room, small lawn"
  },
  "style": "MODERN",
  "budget": 15000000,
  "notes": "Need ground floor for parents",
  "fileIds": ["file_1", "file_2"]
}
```
Response `201`:
```json
{ "data": { "id": "ord_1", "number": "AP-2026-0042", "status": "SUBMITTED" } }
```

**GET `/api/orders`** — my orders, filtered + paginated (mirrors the admin list query).

Query: `?status=IN_DESIGN&q=AP-2026&sort=newest|oldest&page=1&pageSize=20`
- `status` optional, one of `OrderStatus`; `q` free-text over number, city and package name (≤120 chars); `page ≥ 1`, `pageSize` 1–100 (defaults 1/20).

Response `200`:
```json
{
  "data": [
    {
      "id": "ord_1", "number": "AP-2026-0042", "status": "IN_DESIGN",
      "city": "Lahore", "createdAt": "2026-10-07T10:00:00Z",
      "currency": "PKR", "totalPrice": 25000,
      "package": { "name": "Plan + Elevation" }
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 12 }
}
```
Admins calling it get `403` — the panel has `/api/admin/orders`.

**GET `/api/orders/:id`**
```json
{
  "data": {
    "id": "ord_1",
    "number": "AP-2026-0042",
    "status": "DRAFT_DELIVERED",
    "package": { "id": "pkg_1", "name": "Plan + Elevation" },
    "totalPrice": 25000,
    "revisionsUsed": 1,
    "revisionLimit": 2,
    "payments": [{ "id": "pay_1", "type": "ADVANCE", "amount": 10000, "status": "PAID" }],
    "files": [{ "id": "file_9", "kind": "DRAFT_PREVIEW", "filename": "draft-v1.jpg" }],
    "events": [{ "from": "IN_DESIGN", "to": "DRAFT_DELIVERED", "at": "2026-10-07T10:00:00Z" }]
  }
}
```

---

## 4. Files

Uploads go **directly to storage** using presigned URLs, then are registered.

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/api/files/presign` | client/admin | Get a presigned upload URL |
| POST | `/api/files/confirm` | client/admin | Register uploaded file in DB |
| GET | `/api/files/:id/download` | client/admin | Authorized download (redirects to signed URL) |
| DELETE | `/api/files/:id` | client/admin | Delete (owner only; only before submit for client files) |

**POST `/api/files/presign`**
```json
// request
{ "filename": "plot.pdf", "mime": "application/pdf", "size": 2480000, "kind": "CLIENT", "orderId": "ord_1" }
// 200
{ "data": { "fileId": "file_1", "uploadUrl": "https://...", "expiresIn": 300 } }
```

**Rules**
- Allowed mime: `image/jpeg`, `image/png`, `application/pdf` (admin may also upload `application/zip`, `application/postscript`, `image/svg+xml`, `.ai` and `.dwg` as finals).
- Max size: 10 MB for clients, 100 MB for admin.
- `orderId` is honored: admins may attach files to any order; clients only to their own (404 otherwise, existence never leaks).
- `CHAT_ATTACHMENT` kind is allowed for both roles and must later be bound to a message by the same sender.
- `FINAL` download returns `402 PAYMENT_REQUIRED` unless final payment is verified.
- Signed URL lifetime: 60 seconds.
- **Seen tracking (plan 5 C):** a download by the *order owner* (not the uploader — clients never "see" their own payment proofs) stamps `OrderFile.seenAt` once and publishes the `file.seen` realtime ping; the admin order detail shows a "Seen by client" badge from it. Admin downloads never stamp it.

---

## 5. Revisions (plan 3)

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/api/orders/:id/revisions` | client(own) | Request a revision. Only from `DRAFT_DELIVERED` (else `409 INVALID_TRANSITION`). Up to 5 confirmed own `REVISION_REF` files. |
| GET | `/api/orders/:id/revisions` | client(own)/admin | Revision thread incl. files + per-order `extraFeePaid` flag |
| PATCH | `/api/admin/revisions/:id` | admin | `{ "action": "accept" }` — `REVISION_REQUESTED → IN_DESIGN` via the machine; stamps `acceptedAt/ById`; extra-fee revisions stay 409 until an `EXTRA_REVISION` payment is PAID (details: `{ paymentStatus }`) |

```json
// POST /api/orders/ord_1/revisions
{ "message": "Move the kitchen next to the dining area", "fileIds": ["file_12"] }
// 201
{ "data": { "id": "rev_1", "number": 2, "status": "OPEN", "extraFeeRequired": false } }
```
When the package's free limit is used up the request is **still recorded** with `extraFeeRequired: true` and the order moves to `REVISION_REQUESTED` (PRD FR-21); acceptance is refused until the admin charges and verifies an `EXTRA_REVISION` payment (plan 3 decision 1). Re-delivering a draft auto-closes OPEN revisions.

---

## 6. Messages

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/orders/:id/messages` | client/admin | List messages (clients never see `internal`) |
| POST | `/api/orders/:id/messages` | client/admin | Send message |
| POST | `/api/orders/:id/messages/read` | client/admin | Mark messages read (`{ "messageIds": [...] }`, max 100) |
| GET | `/api/orders/:id/messages/unread-count` | client/admin | `{ "count": 3 }` — counterpart messages without a read row |
| PATCH | `/api/orders/:id/messages/:messageId` | client(own)/admin | Edit message — sets `editedAt` |
| DELETE | `/api/orders/:id/messages/:messageId` | client(own)/admin | Delete message + purges attachments (rows and storage objects) |

```json
// POST body (creates attachments when fileIds are included)
{ "body": "Can you add a balcony on the first floor?", "internal": false, "fileIds": ["file_31"] }
```
`internal: true` is accepted from admins only (on send **and** edit). Chat
attachments are uploaded first with kind `CHAT_ATTACHMENT` (presign accepts an
`orderId` and validates ownership), then attached by id — max 4 per message
(`FILE_LIMITS.maxChatAttachments`); each must be confirmed and belong to the
sender. Clients may edit/delete only their own non-internal messages (others
404); admins may moderate any message in any thread. Realtime pings
`message.updated` / `message.deleted` on edits and deletes.

**Read receipts.** Every message in the list response carries
`reads: { readerId, readAt }[]` (selected server-side). `POST …/messages/read`
writes a `MessageRead` row per **counterpart, visible** message
(`skipDuplicates` — own messages and, for clients, internal notes are skipped),
returns `{ "marked": 12 }`, and pings `message.read` only when something new
was written. `unread-count` powers the sidebar badge; the same event name
invalidates both the thread list and the count.

```json
// POST /api/orders/ord_1/messages/read
{ "messageIds": ["msg_1", "msg_2"] }
// 200
{ "data": { "marked": 2 } }
```

---

## 7. Payments

Manual payment-request flow (plan 2 P4): the **admin** creates a charge, the
client uploads a transfer proof, the admin verifies. Statuses never move on
their own — that stays on the status machine (`POST /api/admin/orders/:id/status`).

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/orders/:id/payments` | client/admin | List payments (stranger → 404) |
| POST | `/api/admin/orders/:id/payments` | admin | Create a charge (`createPaymentSchema`: `amount` int minor-units, `type`, optional `note`) |
| POST | `/api/payments/:id/proof` | client(own)/admin | Attach proof file (`{ "fileId": "…" }` — confirmed `PAYMENT_PROOF` upload by the caller on that order) |
| PATCH | `/api/admin/payments/:id` | admin | Verify or reject (`{ "status": "PAID" \| "REJECTED", "note"? }`) |
| POST | `/api/webhooks/payments` | public (signed) | Gateway webhook (deferred — no gateway yet) |

```json
// POST /api/admin/orders/ord_1/payments
{ "amount": 250000, "type": "ADVANCE", "note": "Transfer to account X, then upload the slip" }
// 201 — paymentSelect shape
{
  "data": {
    "id": "pay_1", "type": "ADVANCE", "amount": 250000, "status": "PENDING",
    "note": "…", "createdAt": "…", "updatedAt": "…", "proofFile": null
  }
}
```

Rules:
- One `PENDING` payment per `(order, type)` — a second create → **409**.
- Each create/verify writes a same-status `OrderEvent` note, so the timeline
  shows charges next to status changes.
- A verified **FINAL** payment sets `order.finalPaymentVerified = true`, which
  unlocks FINAL downloads server-side; the order status itself only moves when
  the admin changes it on the proceed page.
- Rejecting a proof attachment: wrong kind, foreign file, unconfirmed upload or
  already attached → **400**.
- Realtime: `payment.created` / `payment.updated` pings keep the client's
  charges card and the admin's proceed page in sync.

```json
// PATCH /api/admin/payments/pay_1
{ "status": "PAID" }          // or { "status": "REJECTED", "note": "Amount mismatch" }
```

**Webhook rules:** verify the signature header with `PAYMENT_WEBHOOK_SECRET`; process idempotently using the provider event id; return `200` quickly; never trust client-supplied amounts.

---

## 8. Admin Orders

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/admin/orders` | admin | List with filters |
| GET | `/api/admin/orders/:id` | admin | Full detail |
| PATCH | `/api/admin/orders/:id` | admin | Edit order fields (`adminOrderUpdateSchema`: city, plot, requirements, style, budget, notes, packageId). Status and price are never settable here. |
| DELETE | `/api/admin/orders/:id` | admin | **Hard delete** (plan decision 1): purges all storage objects, then cascades rows (files, messages, events, revisions, payments, testimonials) in one transaction. Destructive; UI confirms with the order number. |
| POST | `/api/admin/orders/:id/take` | admin | `{ "take": true \| false }` — assign the current admin to the order, or release (`null`). Not a status change; no OrderEvent. |
| POST | `/api/admin/orders/:id/quote` | admin | Send quote |
| POST | `/api/admin/orders/:id/status` | admin | Change status (validated) |
| POST | `/api/admin/orders/:id/drafts` | admin | Deliver the draft — `{ "fileIds": [...] }` (confirmed admin `DRAFT_PREVIEW/DRAFT_ORIGINAL`, ≥1) + optional note; machine `IN_DESIGN → DRAFT_DELIVERED`; auto-closes OPEN revisions in the same transaction. No watermark job (plan 1 decision 4). |
| POST | `/api/admin/orders/:id/finals` | admin | Register final files — `{ "fileIds": [...] }` (confirmed admin `FINAL`, ≥1, from `IN_DESIGN` onward); **no status change**, client downloads stay gated on `finalPaymentVerified` |
| POST | `/api/admin/orders/:id/notes` | admin | Add internal note |
| GET | `/api/admin/stats` | admin | Dashboard stats |

**Query params for `GET /api/admin/orders`:** `status`, `paymentStatus`, `from`, `to`, `q` (order number or client name), `sort`, `page`, `pageSize`.

```json
// POST /api/admin/orders/ord_1/quote
{ "totalPrice": 25000, "advancePercent": 40, "message": "Delivery in 7 days after advance." }
```

Revenue is **grouped per currency** (orders snapshot their own `currency`; sums are never mixed — the UI formats each entry with its own code). `thisMonthPaid` keys off `Payment.updatedAt` (when it flipped to PAID), and `avgRevisionsPerCompletedOrder` counts DONE revisions on completed orders only.

```json
// GET /api/admin/stats (plan 3 §8b; revenue shape as of plan 5 B)
{
  "data": {
    "statusCounts": { "SUBMITTED": 3, "IN_DESIGN": 5, "DRAFT_DELIVERED": 2, "CANCELLED": 0 },
    "revenue": { "byCurrency": { "PKR": { "totalPaid": 940000, "advancePaid": 300000, "finalPaid": 515000, "extraRevisionPaid": 125000, "thisMonthPaid": 180000 } } },
    "needsAttention": { "submitted": 3, "awaitingAdvance": 1, "inDesign": 5, "draftDelivered": 2, "awaitingFinalPayment": 1, "pendingPayments": 2, "openRevisions": 1 },
    "recentOrders": [{ "id": "ord_1", "number": "AP-2026-0009", "status": "SUBMITTED", "createdAt": "2026-10-07T10:00:00.000Z", "clientName": "Sami", "clientEmail": "sami@example.com", "packagePrice": 10000, "currency": "PKR" }],
    "avgRevisionsPerCompletedOrder": 1.3
  }
}
```

### 8b. Admin Settings (plan 3 §8c)

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/settings` | public (rate-limited) | `{ "data": { "currency": "PKR" } }` — live site setting |
| PATCH | `/api/admin/settings` | admin | `{ "currency": "USD" }` — allow-listed (`SUPPORTED_CURRENCIES`); relabel-only, amounts are never converted; in-flight orders keep their `Order.currency` snapshot; publishes `settings.updated` |

---

## 9. Admin Users (plan C1)

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/admin/users` | admin | List users. Query: `q` (name/email), `role`, `page`, `pageSize` |
| PATCH | `/api/admin/users/:id` | admin | Edit `{ name?, role? }`. Role changes write Clerk `publicMetadata` (source of truth) **and** the DB mirror in one service call. |

Users are never deleted or deactivated (plan decision 2).

## 9b. Admin Threads (plan C2)

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/admin/threads` | admin | Orders having messages: order number, client, last-message preview, message count, `lastMessageAt`. Query: `q`, `page`, `pageSize`. |

Open a thread at `/admin/chats/[orderId]`; the per-order messages endpoints above serve it.

## 9c. Admin Files (plan C3)

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/admin/files` | admin | Global file listing. Query: `kind`, `q` (filename/order number), `page`, `pageSize` |
| PATCH | `/api/admin/files/:id` | admin | Rename (`filename`) and/or change `kind` |
| DELETE | `/api/admin/files/:id` | admin | Delete row + storage object. **Blocked for payment-proof rows** (`409`). |

## 10. Portfolio

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/portfolio` | public | List visible projects (`category`, `plotSize`, `style` filters) |
| GET | `/api/portfolio/:slug` | public | Project detail |
| POST | `/api/admin/portfolio` | admin | Create |
| PATCH | `/api/admin/portfolio/:id` | admin | Update |
| POST | `/api/admin/portfolio/reorder` | admin | Reorder (`{ "ids": ["p1","p2"] }`) |
| DELETE | `/api/admin/portfolio/:id` | admin | Delete |

---

## 10. Testimonials (Phase 5)

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/testimonials` | public | Approved testimonials |
| POST | `/api/orders/:id/testimonial` | client | Submit after `COMPLETED` |
| PATCH | `/api/admin/testimonials/:id` | admin | Approve / hide |

---

## 10b. Blog (plan 6)

Admin-authored blog. Content is TipTap HTML, sanitized on write (`sanitize-html` allowlist) and re-sanitized on read before render. Public reads go through `unstable_cache` tagged `POSTS_CACHE_TAG`; every write revalidates it.

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/admin/posts` | admin | Filtered list (`q`, `status`, `page`, `pageSize`) |
| POST | `/api/admin/posts` | admin | Create draft (auto-slug from title when `slug` blank; 409 on taken slug) |
| GET | `/api/admin/posts/:id` | admin | Full record for the edit form |
| PATCH | `/api/admin/posts/:id` | admin | Partial update; **409 if slug changes while PUBLISHED**; re-sanitizes `contentHtml` + recomputes `readingMinutes` |
| DELETE | `/api/admin/posts/:id` | admin | Hard delete; purges the cover object + row |
| POST | `/api/admin/posts/:id/publish` | admin | `{ publish: true\|false }` — stamps `publishedAt` on the first publish only; validates title/excerpt/content before publish |
| POST | `/api/admin/posts/images` | admin | Multipart image upload (field `image`); re-validates mime + size; returns `{ data: { id, url } }` where `url` = `/api/posts/images/:id` |
| GET | `/api/posts/images/:fileId` | public | Serves `OrderFile` rows of kind `POST_IMAGE` only; immutable cache |

Cover images use the shared crop dialog at 1200×630 (`BLOG_COVER` in `constants.ts`) and double as the OG/Twitter image. Tag pages live at `/blog/tag/:tag`; the RSS feed at `/blog/rss.xml`.

---

## 11. Contact

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/api/contact` | public | Contact form; rate-limited, spam-protected |

---

## 12. Realtime

Ably delivers **id-only pings** that tell subscribed browsers which query keys to invalidate; payloads never contain names, emails, message bodies, or amounts. Publishing happens server-side from the services (`src/lib/realtime.ts`), fire-and-forget: a realtime outage can never fail or delay the main action. With `ABLY_API_KEY` unset, publishing no-ops and the token route reports `enabled: false`.

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/api/realtime/token` | authenticated | `{ data: { enabled, tokenRequest } }` — signed Ably `TokenRequest` (single use, 60 min TTL, subscribe-only capability on `user:{id}` and, for admins, `role:admin`). `enabled: false` when realtime is not configured. |

Client events (`REALTIME_EVENTS` in `constants.ts`): `quote.sent` / `order.status_changed` invalidate `orderKeys` + `adminOrderKeys` + admin stats; `order.created` invalidates `adminOrderKeys` + stats; `message.created` / `message.updated` / `message.deleted` invalidate that thread's `messageKeys`; `message.read` invalidates that thread's `messageKeys` + the unread count; `payment.created` / `payment.updated` invalidate the thread's `paymentKeys` + order keys + stats; `revision.requested` / `revision.accepted` / `draft.delivered` / `finals.registered` invalidate both parties' order keys + stats; `settings.updated` invalidates the settings key so every open tab re-renders money labels. The browser SDK renews its token through the same endpoint (Ably `authCallback`).

---

## Server Actions (UI mutations)

> **Superseded:** per `RULES.md`, UI reads and mutations go through feature hooks
> (TanStack Query) that call the `api` util, which hits the route handlers above.
> No Server Actions remain — the table of historical names is kept only as a
> pointer to their service-layer replacements in `src/lib/`.

---

## Email Events

> **Status: not yet active.** Status changes write `OrderEvent` rows immediately (visible on the
> order timeline), but no email is sent — Resend integration is deferred to a later phase. The
> table below is the contract for when sending lands; templates live in `src/lib/email/templates`
> once implemented.

| Event | Recipient | Template |
|-------|-----------|----------|
| Order submitted | Client + Admin | `order-received` |
| Quote sent | Client | `quote-ready` |
| Advance verified | Client | `payment-confirmed` |
| Draft delivered | Client | `draft-ready` |
| Revision requested | Admin | `revision-requested` |
| Final payment verified | Client | `final-ready` |
| New message | Other party | `new-message` (rate-limited) |
| Order completed | Client | `order-completed` |

---

## Rate Limits (suggested)

| Route group | Limit |
|-------------|-------|
| Contact form | 3 per hour per IP |
| File presign | 30 per minute per user |
| Messages | 20 per minute per user |
| Realtime token | 30 per minute per user |
| Everything else | 120 per minute per user |
