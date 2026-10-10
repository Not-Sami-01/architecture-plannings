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

## 2. Packages

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/packages` | public | List active packages |
| GET | `/api/admin/packages` | admin | List all packages (incl. inactive) |
| POST | `/api/admin/packages` | admin | Create package |
| PATCH | `/api/admin/packages/:id` | admin | Update package (content, price, active flag) |
| DELETE | `/api/admin/packages/:id` | admin | Deactivate package |

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
    "deliverables": ["Floor plan", "Front elevation"]
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
- `FINAL` download returns `402 PAYMENT_REQUIRED` unless final payment is verified.
- Signed URL lifetime: 60 seconds.

---

## 5. Revisions

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/api/orders/:id/revisions` | client | Request a revision |
| GET | `/api/orders/:id/revisions` | client/admin | List revisions |
| PATCH | `/api/admin/revisions/:id` | admin | Mark done / accept |

```json
// POST /api/orders/ord_1/revisions
{ "message": "Move the kitchen next to the dining area", "fileIds": ["file_12"] }
// 201
{ "data": { "id": "rev_1", "number": 2, "status": "OPEN", "extraFeeRequired": false } }
```
If the free limit is exceeded, the response is `409 REVISION_LIMIT_REACHED` with an `extraFee` in `details`, and the client can confirm the paid revision.

---

## 6. Messages

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/orders/:id/messages` | client/admin | List messages (clients never see `internal`) |
| POST | `/api/orders/:id/messages` | client/admin | Send message |

```json
{ "body": "Can you add a balcony on the first floor?", "internal": false }
```
`internal: true` is accepted from admins only.

---

## 7. Payments

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/orders/:id/payments` | client/admin | List payments |
| POST | `/api/orders/:id/payments` | client | Start a payment (`ADVANCE` or `FINAL`) |
| POST | `/api/payments/:id/proof` | client | Attach proof file (manual transfers) |
| PATCH | `/api/admin/payments/:id` | admin | Verify or reject |
| POST | `/api/webhooks/payments` | public (signed) | Gateway webhook |

```json
// POST /api/orders/ord_1/payments
{ "type": "ADVANCE", "method": "BANK_TRANSFER" }
// 201
{
  "data": {
    "id": "pay_1", "amount": 10000, "status": "PENDING",
    "instructions": { "bank": "Bank Name", "account": "000000", "reference": "AP-2026-0042" }
  }
}
```
```json
// PATCH /api/admin/payments/pay_1
{ "status": "PAID" }          // or { "status": "REJECTED", "reason": "Amount mismatch" }
```

**Webhook rules:** verify the signature header with `PAYMENT_WEBHOOK_SECRET`; process idempotently using the provider event id; return `200` quickly; never trust client-supplied amounts.

---

## 8. Admin Orders

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/admin/orders` | admin | List with filters |
| GET | `/api/admin/orders/:id` | admin | Full detail |
| POST | `/api/admin/orders/:id/quote` | admin | Send quote |
| POST | `/api/admin/orders/:id/status` | admin | Change status (validated) |
| POST | `/api/admin/orders/:id/drafts` | admin | Register draft (triggers watermark job) |
| POST | `/api/admin/orders/:id/finals` | admin | Register final files |
| POST | `/api/admin/orders/:id/notes` | admin | Add internal note |
| GET | `/api/admin/stats` | admin | Dashboard stats |

**Query params for `GET /api/admin/orders`:** `status`, `paymentStatus`, `from`, `to`, `q` (order number or client name), `sort`, `page`, `pageSize`.

```json
// POST /api/admin/orders/ord_1/quote
{ "totalPrice": 25000, "advancePercent": 40, "message": "Delivery in 7 days after advance." }
```

```json
// GET /api/admin/stats
{
  "data": {
    "revenueThisMonth": 180000,
    "revenueAllTime": 940000,
    "ordersThisMonth": 12,
    "byStatus": { "SUBMITTED": 3, "IN_DESIGN": 5, "DRAFT_DELIVERED": 2 },
    "awaitingAction": 6
  }
}
```

---

## 9. Portfolio

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

Client events (`REALTIME_EVENTS` in `constants.ts`): `quote.sent` / `order.status_changed` invalidate `orderKeys` + `adminOrderKeys`; `order.created` invalidates `adminOrderKeys`; `message.created` invalidates that thread's `messageKeys`. The browser SDK renews its token through the same endpoint (Ably `authCallback`).

---

## Server Actions (UI mutations)

> **Superseded for the client UI:** per `RULES.md`, UI reads and mutations go through feature hooks (TanStack Query) that call the `api` util, which hits the route handlers above. Server Actions are not the default and need explicit approval.

Prefer Server Actions inside the app for form submissions; they call the same service layer (`src/lib/orders/*`) as the route handlers.

| Action | File | Used by |
|--------|------|---------|
| `createOrder` | `actions/orders.ts` | Order form |
| `requestRevision` | `actions/revisions.ts` | Order detail |
| `sendMessage` | `actions/messages.ts` | Message thread |
| `updateOrderStatus` | `actions/admin-orders.ts` | Admin order page |
| `verifyPayment` | `actions/admin-payments.ts` | Admin payments |
| `savePortfolioProject` | `actions/admin-portfolio.ts` | Portfolio CMS |

Every action must: (1) check the session and role, (2) validate input with Zod, (3) check resource ownership, (4) call the service layer, (5) `revalidatePath` where needed.

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
