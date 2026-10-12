# Plans

- **Plan 1** (below): Role Separation + Full Admin Panel Expansion — ✅ executed (see `PLAN.md` step 24).
- **Plan 2** (middle): Proceed Order Page, Chat UX, Read Receipts & Charge User — ✅ executed (see `PLAN.md` step 25).
- **Plan 3** (bottom): Deliverables, Revisions, Dashboard & Configurable Currency — ✅ executed (see `PLAN.md` step 26).

---

# Plan 1 — Role Separation + Full Admin Panel Expansion

Status: ✅ **executed** (phases A–E complete, see `PLAN.md` step 24).

Decisions locked in:
1. **Delete order = hard delete** (row + files + storage objects, destructive-confirm dialog). The AGENTS.md "never delete orders" rule is updated to allow admin-only hard delete with confirmation.
2. **User settings = edit name + role** (role synced to Clerk + DB). Deletion/deactivation of users is **out of scope** (users with orders can never be removed; revisit only if requested).
3. **Message moderation**: admin edits/deletes **any** message; client edits/deletes **own** messages. Clients can never touch the `internal` flag.
4. **Watermarking is deferred** — drafts/finals are delivered as uploaded; sharp-based watermarked previews become a separate later phase.

---

## Current state (what's missing)

- **Roles** come from the DB (`ADMIN_EMAILS` ↔ `User.role`), with zero Clerk-role infrastructure. Admins can browse `/dashboard` freely and see an "Admin panel" link in the client shell; `/order/new` happily accepts admin orders.
- **Chat** is text-only, immutable (no edit/delete API), per-order threads only — no inbox view.
- **Files**: the pipeline exists (presign → confirm → download; 10 MB client / 100 MB admin, server-validated), but `presign` silently ignores `orderId` (admin cannot attach to an existing order), there is no admin upload UI, no global files listing, no `DELETE /api/files/:id` route (the service exists, unused), and the client order detail only ever lists `CLIENT` files — drafts/finals are never shown even when they should be.
- **Orders**: admin can only quote (once, from `SUBMITTED`) and change status. No field editing, no assignment ("take"), no delete.
- **Admin panel**: 3 pages (orders, order detail, pricing); nav has 2 entries.

---

## Phase A — Strict separation with Clerk auth roles

**A1. Role source of truth → Clerk `publicMetadata.role`**
- `resolveApiUser` reads `clerkClient().users.getUser(clerkId).publicMetadata.role`.
- First sign-in (or metadata missing): **bootstrap** from `ADMIN_EMAILS`, writing the role to *both* Clerk metadata and the DB row.
- DB `User.role` stays as the **mirror** for queries/joins (indexed), re-synced per resolve — no Clerk-dashboard token customization required, existing `requireRole` middleware keeps working unchanged.
- Admin-panel role changes write **both** Clerk metadata (`clerkClient.users.updateUserMetadata`) and the DB in one service call.

**A2. Hard panel gating**
- `(client)/layout`: `role === ADMIN` → `redirect(/admin)` — admins never render client markup. Remove the "Admin panel" link from `ClientShell`.
- `(admin)/layout`: non-admin → `redirect(/dashboard)` (exists; keep).
- **Admins cannot place orders**: `createOrder` service rejects `ADMIN` (403); `/order/new` redirects admins to `/admin`; the "Start an order" CTA disappears with the client shell.
- Sign-in flow unchanged (`?next` honored); the `(client)` layout's role-redirect lands admins on `/admin` automatically.
- `proxy.ts` stays session-only (edge has no role claim) — role checks remain server-side in layouts/services (defense in depth, per AGENTS).

**A3. Tests**
- `resolveApiUser` bootstrap/sync/promote/demote (mock `clerkClient`) — currently untested.
- `createOrder` rejects admins.
- Existing role-middleware, messages, and realtime role tests stay green.

---

## Phase B — Chat attachments + message moderation

**B1. Schema (migration `prisma migrate dev`)**
- `Message.editedAt DateTime?`
- `OrderFile.messageId String?` + relation (`Message.attachments OrderFile[]`)
- New indexes: `OrderFile.kind`, `OrderFile.messageId`, `OrderFile.uploadedById`
- `FileKind` enum += `CHAT_ATTACHMENT`
- New constant `MAX_CHAT_ATTACHMENTS = 4`

**B2. Upload pipeline**
- Fix `presignForUser` to **honor `orderId`** (admin: any order; client: own order) — also the mechanism for Phase D4.
- `messageSchema` += `fileIds: z.array(z.string().cuid2()).max(MAX_CHAT_ATTACHMENTS)` (default `[]`).
- `createMessage` validates each file (confirmed, `uploadedById === user.id`, `messageId` null, kind `CHAT_ATTACHMENT`) and attaches in the same transaction.
- Limits reuse `FILE_LIMITS` (client 10 MB / admin 100 MB) + mime allow-lists (`CLIENT_MIME_TYPES`, admin extras allowed for admin senders).

**B3. Edit/delete messages**
- `PATCH` + `DELETE /api/orders/:id/messages/:messageId` — admin any, client own (client cannot toggle `internal` on edit).
- Edit sets `editedAt`; delete purges attachment rows **and their storage objects** in one transaction/service.
- Realtime pings `message.updated` / `message.deleted` (new `REALTIME_EVENTS`) → both sides invalidate `messageKeys.list(orderId)`.

**B4. UI**
- `message-input`: file picker with **client-side validation** (count, per-file size from `FILE_LIMITS`, mime allow-list, inline rejection reasons reusing `staged-files` patterns), upload-with-progress on send.
- `message-bubble`: attachment chips (type icon + filename + size → existing gated download route), "edited" marker, hover edit/delete actions (shown per B3 permissions).
- New four-key hooks: `use-update-message`, `use-delete-message`, chat-attachment staging/upload hook.

**B5. Tests**
- `messages.test.ts`: attachment validation, edit/delete permissions, internal-flag rules.
- `validators/message.test.ts`: `fileIds` limits.

---

## Phase C — Admin panel: Users, Chats, Files

**C1. `/admin/users`**
- `GET /api/admin/users` — search (name/email), role filter, pagination.
- `PATCH /api/admin/users/[id]` — `{ name?, role? }` → Clerk metadata + DB sync.
- UI: table (name, email, role badge, joined, orders count) + edit dialog + loading/empty/error states.

**C2. `/admin/chats`**
- `GET /api/admin/threads` — orders having messages: order #, client, last-message preview, message count, timestamp (uses new/adjusted `Message` indexes; `lastMessageAt` computed).
- Open `/admin/chats/[orderId]` → full thread via existing `MessageThread allowInternal`, with B3 edit/delete controls active.
- `loading.tsx` + empty states for both pages.

**C3. `/admin/files`**
- `GET /api/admin/files` — kind filter, filename/order search, pagination (new indexes make this cheap).
- `PATCH /api/admin/files/[id]` — rename (`filename`), change `kind`.
- `DELETE /api/admin/files/[id]` — storage object + row; **payment-proof rows blocked**; destructive confirm.
- Download via existing `GET /api/files/:id/download` (admin bypass already in place).

**C4. Navigation**
- `AdminShell` desktop `NAV` **and** the mobile header both get: **Orders · Chats · Files · Users · Pricing** (currently hard-coded in two places).

---

## Phase D — Order management + client deliverables

**D1. Take the order**
- `Order.assignedToId String?` FK → `User` (+index) in the same migration as B1.
- `POST /api/admin/orders/:id/take` — assign current admin / release (`null`).
- "Taken by you / Taken by <email>" badge in orders table + detail; optional assignee filter on the list (nice-to-have, include if cheap).

**D2. Edit the order**
- `PATCH /api/admin/orders/[id]` with new `adminOrderUpdateSchema`: `city`, `plot`, `requirements`, `style`, `budget`, `notes`, `packageId`.
- **Never** status or price — status stays on the machine (`lib/orders/status.ts`), price stays on the quote flow.
- Edit dialog on the admin order detail; writes with an `OrderEvent` audit note where sensible (or skip events for non-status edits — decide during implementation; timeline must never show fake transitions).

**D3. Delete the order**
- `DELETE /api/admin/orders/:id` — hard delete: cascade DB rows (events, messages, files, payments, revisions, testimonials FKs handled explicitly — Prisma relation rules checked), purge all storage objects for the order, realtime ping invalidating admin lists.
- Destructive two-step confirm (order number must match the existing cancel-confirm pattern in `status-controls.tsx`).
- Client-facing behavior after delete: their order 404s (existing error branch shows "Order not found").

**D4. Admin uploads to an order**
- Relies on B2's presign `orderId` fix.
- Admin order detail gains an upload control: kind picker (`DRAFT_PREVIEW`, `DRAFT_ORIGINAL`, `FINAL`, `REVISION_REF`, `PAYMENT_PROOF`), multi-file, per-file progress (reuse `uploadToStorage` with a kind parameter — today it hard-codes `kind: "CLIENT"` in `use-upload-batch`).
- Files appear in the existing uploads card + the global Files listing.

**D5. Client sees deliverables when fulfilled**
- `getOrderForUser` file select becomes status-aware **server-side** (the security boundary):
  - `CLIENT` files: always.
  - `DRAFT_PREVIEW`: once status ≥ `DRAFT_DELIVERED` (`DRAFT_DELIVERED`, `REVISION_REQUESTED`, `AWAITING_FINAL_PAYMENT`, `COMPLETED`).
  - `FINAL`: only when `finalPaymentVerified` (mirrors download-route 402 gate).
  - `DRAFT_ORIGINAL`: never (download route 404s it for clients — keep consistent).
- Client detail view gains a **"Deliverables"** section (replacing/extending "Your files"): status-aware labels, download buttons, empty states ("Draft will appear here…").

**D6. Client-side size limits**
- Order wizard already enforces count/mime/size in `staged-files.ts` + `upload.ts` (10 MB) — verify no regression.
- Phase B brings identical validation to chat uploads.
- All limit copy is generated from `FILE_LIMITS` (no hard-coded "10 MB" strings).

---

## Phase E — Docs, tests, gates

**Docs**
- `API.md`: new endpoints — admin users/threads/files, admin order `PATCH`/`DELETE`/`take`, message `PATCH`/`DELETE`, presign `orderId`; note message `fileIds`.
- `AGENTS.md`: role rules (Clerk `publicMetadata` source of truth + DB mirror); revise "Never delete orders" to "admin hard delete with confirmation, cascade + storage purge; clients never delete."
- `README.md` roadmap rows; `PRD.md` note (admin users management story added); `.env` unchanged.

**Tests (all suites must pass)**
- New: admin users service/validators, threads listing, files list/patch/delete, order update/take/delete, admin-rejected `createOrder`, message edit/delete, attachment validation.
- Extended: `messages.test.ts`, `validators/message.test.ts`, `staged-files` chat limits if constants differ.
- Existing 113 tests stay green (role/middleware/realtime especially).

**Gates + rollout**
1. `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
2. Headless-Chrome smoke: admin → `/dashboard` redirect (and reverse), attach → send → edit → delete flow, oversize file rejected client-side, admin upload → client deliverables visibility.
3. `pnpm prisma migrate dev` locally, `prisma migrate deploy` on the live pooled DB (data-safe additive columns; verify with row counts after).
4. Commit per phase (A–E), push to `main`.

---

## Risks / guardrails

- **Presign `orderId` abuse** — validate ownership (client: own order only, pre-submit kinds) and role (admin: any) server-side in `presignForUser`; never trust the client-supplied `orderId`.
- **Deletes** — always purge storage objects before DB rows; payment-proof file deletes blocked; order delete must enumerate FK relations explicitly (no silent `onDelete: Cascade` surprises — decide per relation during migration authoring).
- **Role freshness** — DB mirror refreshed on every authenticated request (same freshness model as today); Clerk metadata write is fire-safe (failure → log, keep DB change).
- **`internal` flag** — only `requireRole(ADMIN)` paths may set it (existing rule; keep on edit path too).
- **Realtime payload rules** — id-only pings, never bodies (existing contract; new events follow it).

---

# Plan 2 — Proceed Order Page, Chat UX, Read Receipts & Charge User

Status: ✅ **executed** (P0–P6 complete, see `PLAN.md` step 25; tests 173/173, lint/typecheck/build green).

Decisions locked in:
1. **Dedicated proceed page** — `/admin/orders/[id]/proceed` (entered via a "Proceed" button on the order detail), not an enhancement of the existing detail layout.
2. **"Charge user" = real payment-request flow** (Phase 4 minimal slice): admin creates a `Payment(PENDING)` row with a custom amount → client sees amount due and uploads a payment proof → admin verifies/rejects. No gateway/webhooks.
3. **Per-message read receipts** — new `MessageRead` table; opening the chat marks messages read and pings the counterpart; hover shows exact seen status.
4. **Sender labels** — admin messages show `Name (Admin)` for everyone; own messages show "You"; names always visible in both views.

---

## P0 — Chat bug fixes (independent, do first)

1. **Attachments not showing (root cause):** `src/components/messages/message-thread.tsx` wraps `uploadAll` and `return []`, discarding the uploaded file ids — every message is sent with `fileIds: []`. Fix: return `attachments.actions.uploadAll()` result. (Bubbles/server select already support attachments.)
2. **Ctrl+Enter sends:** `message-input.tsx` textarea `onKeyDown` — `(e.metaKey || e.ctrlKey) && e.key === "Enter"` submits; Enter alone stays a newline.
3. **Realtime gap:** `realtime-queries.ts` has no cases for `message.updated`/`message.deleted` (published but never consumed) — add them → `[messageKeys.list(refId)]`.

---

## P1 — Schema migration (`pnpm prisma migrate dev`)

```prisma
model MessageRead {
  id        String   @id @default(cuid())
  messageId String
  readerId  String
  readAt    DateTime @default(now())
  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  reader    User     @relation(fields: [readerId], references: [id])
  @@unique([messageId, readerId])
  @@index([readerId])
}
```

- `Message` += `reads MessageRead[]`; `User` += reverse relation.
- `Payment` += `note String?` (admin's charge note shown to client).
- Indexes: `MessageRead(messageId, readerId)` unique + `readerId`.

---

## P2 — Read receipts (server)

- **`POST /api/orders/:id/messages/read`** — body `{ messageIds: string[] }` (cuid2, capped e.g. 100). Service `markMessagesRead`: thread-access 404 gate → keep only messages in this order with `senderId ≠ reader` and `internal: false` → `createMany(skipDuplicates)` (idempotent) → after commit, ping counterpart channel `message.read` (new `REALTIME_EVENTS.messageRead`, refId = orderId, id-only).
- **`GET /api/orders/:id/messages/unread-count`** → `{ count }` (`senderId ≠ me`, `internal: false` for clients, no read row by me). Invalidated by `message.created` + `message.read` pings.
- `messageSelect` += `reads { readerId, readAt }`.
- Rate-limit both with `RATE_LIMITS.messages`.

---

## P3 — Chat UI

- **`src/lib/format-message-time.ts`** (pure, unit-tested): <1m "just now" · <60m "x min ago" · <24h "x h ago" · ≥24h → date ("8 Oct").
- **`message-bubble.tsx`:** sender label always shown — own → "You", admin → `Name (Admin)`, client → name; relative timestamp; subtle read-tick on own messages (read = counterpart has a read row). **shadcn Tooltip** (adds `@radix-ui/react-tooltip`) on timestamp/tick: full "8 Oct 2026, 14:32" + "Seen by client · 9 Oct, 09:11" / "Not seen yet" + "(edited)".
- **`message-thread.tsx`:** effect collects counterpart, non-internal, not-yet-read ids on load/new messages → POST read (fires on open). `allowInternal` no longer suppresses sender names.
- Unread badge prop on the thread for P5's collapsible toggle.

---

## P4 — "Charge user" = payments slice (Phase 4 minimal)

- **Validators** `src/lib/validators/payments.ts`: `createPaymentSchema` `{ amount: int > 0, type: ADVANCE|FINAL|EXTRA_REVISION, note?: ≤500 }`, `verifyPaymentSchema` `{ status: PAID|REJECTED, note?: ≤500 }`.
- **Service** `src/lib/payments.ts`:
  - `createOrderPayment` — admin; 409 if a PENDING payment of same type exists; `OrderEvent` note; realtime ping → client.
  - `listPaymentsForOrder` — client: own order 404 else; admin: any.
  - `attachPaymentProof` — client: own pending payment; binds a `PAYMENT_PROOF` file uploaded by them; realtime ping → admins.
  - `verifyPayment` — admin; PAID sets `verifiedById`; **type FINAL + PAID → `order.finalPaymentVerified = true`**. Status never auto-moves — admin uses Change status.
- **Routes:** `POST /api/admin/orders/:id/payments` · `PATCH /api/admin/payments/:id` · `GET /api/orders/:id/payments` · `POST /api/payments/:id/proof` (API.md §7; constants already reserve these paths).
- **Presign tweak:** `assertCanUpload` allows clients `PAYMENT_PROOF` only on their own order (ownership check already there).
- **Client side:** order detail gains a "Payment due" card when a PENDING payment exists (amount, type, note, proof upload → `PAYMENT_PROOF` kind, shows uploaded proof + state). Hooks: `use-order-payments`, `use-upload-payment-proof`, `use-admin-create-payment`, `use-admin-verify-payment` (four-key, RULES shape). Realtime `payment.*` → invalidate order detail + payment keys.

---

## P5 — Proceed page `/admin/orders/[id]/proceed`

- New route + `ROUTES.admin.orderProceed(id)`; "Proceed" button in the admin order-detail header links there.
- **`AdminProceedView`** layout:
  - Header: back link, order #, client, `OrderStatusBadge`.
  - **Proceed panel:** primary "Proceed" button → single Dialog with view state `menu | dropFiles | chargeUser`:
    - **Drop files** — real drag-and-drop dropzone (pattern from the order wizard), kind Select (`DRAFT_PREVIEW / DRAFT_ORIGINAL / FINAL / REVISION_REF / PAYMENT_PROOF`), per-file progress via existing `useAdminOrderUpload`; recent files list (`OrderDetailUploads` reuse) below.
    - **Charge user** — amount **prefilled from `order.package.price`** (editable), type Select auto-derived from status (`AWAITING_ADVANCE`→Advance, `AWAITING_FINAL_PAYMENT`→Final, else Extra revision), note; submits P4's create-payment. Payments list card (pending/paid/rejected + verify/reject buttons with proof preview for admin).
  - **Change status card** — reuses existing `StatusControls` unchanged.
  - **Collapsible chat** — chevron toggle (persisted open state in localStorage), wraps `MessageThread allowInternal`, unread badge on the collapsed toggle.

---

## P6 — Docs, tests, gates

- **API.md:** new/changed endpoints (`messages/read`, `unread-count`, admin payments, client payments + proof, message `reads` shape); **constants:** routes, `REALTIME_EVENTS.messageRead`, payment labels; **README/PLAN.md** rows; **AGENTS.md** if behavior rules change.
- **Tests:** `format-message-time`, `markMessagesRead` (skips own/internal/foreign, idempotent, ping target), unread-count, payments service (dup pending 409, verify FINAL→`finalPaymentVerified`, proof ownership 404), validators, realtime-queries new cases. Existing suites stay green.
- **Gates:** `pnpm lint && pnpm typecheck && pnpm test` + production build; migrate on local DB.

**Explicitly out of scope:** auto status change on payment verify, client-side chat collapse, gateway/webhook payments (manual proof only), watermarking.

---

# Plan 3 — Deliverables, Revisions, Dashboard & Configurable Currency

Status: ✅ **executed** (P0–P9; see `PLAN.md` step 26). Watermarking stays deferred (decision 2). Out of scope (unchanged): emails (plan 4), Stripe, invoices, FX conversion, portfolio CMS/testimonials.

Decisions locked in:
1. **Extra revisions are admin-quoted** — beyond-limit requests are still recorded (`extraFeeRequired: true`, status → `REVISION_REQUESTED`); the admin sets the amount with the existing EXTRA_REVISION charge dialog; `acceptRevision` is refused until that payment is PAID. (PRD FR-21.)
2. **Watermarking stays deferred** (plan 1 decision 4). "Deliver draft" triggers no job; `DRAFT_PREVIEW` remains the client-visible draft kind. Drop-files label must stop saying "(watermarked)".
3. **Gateway stays manual** — EXTRA_REVISION reuses the plan-2 charge flow verbatim.
4. **Currency = global admin setting + per-order snapshot** — `Order.currency` frozen at creation; packages/marketing follow the live setting. Switching never converts amounts (relabel only; admin re-prices packages manually — helper text says so).
5. Proceed page = delivery workspace (deliver-draft, register-finals, revision queue); `/admin/settings` = currency; `/admin` = real dashboard overview (no more redirect).

## P0 — Hotfix: live DB migration ✅

Plan 2's migration (`MessageRead`, `Payment.note`) had only been applied to the **local** DB; the app runs against the Prisma Cloud pooled DB, so every messages query selecting `reads` 500'd (P2021). Fixed: `migrate deploy` against the **direct** host (`pooled.db.prisma.io` → `db.prisma.io`, same credentials), verified `MessageRead`/`Payment.note` exist with 18 messages intact. Rule going forward: **deploy migrations to every DATABASE_URL the app uses** (local + cloud), direct URL for migrate, pooled for runtime.

## P1 — Schema + constants

- Migration (hand-written via `migrate diff --from-config-datasource --to-schema`, applied locally via `migrate deploy`; cloud after review):
  - `SiteSetting { key String @id, value String, updatedAt DateTime @updatedAt }`, seeded `("currency","PKR")`.
  - `Order.currency String` + `UPDATE "Order" SET currency='PKR'` backfill (no Prisma default — the service always sets it).
  - `Revision`: `extraFeeRequired Boolean @default(false)`, `acceptedAt DateTime?`, `acceptedById String?` → `User` (SetNull).
- `constants.ts`: `SUPPORTED_CURRENCIES` (~55 `{code,name}` — USD, CAD, EUR, GBP, AUD, NZD, CHF, JPY, CNY, HKD, SGD, KRW, INR, PKR, BDT, LKR, NPR, AED, SAR, QAR, KWD, BHD, OMR, JOD, ILS, TRY, EGP, ZAR, NGN, KES, GHS, MAD, TND, BRL, MXN, ARS, CLP, COP, PEN, SEK, NOK, DKK, ISK, PLN, CZK, HUF, RON, BGN, RSD, UAH, RUB, KZT, THB, VND, IDR, MYR, PHP…), `SETTINGS_KEYS = { currency: "currency" }`, `REVISIONS = { maxRefFiles: 5, maxLength: 2000 }`; `API_ROUTES` += `settings`, `adminSettings`, `revisions(orderId)`, `adminRevision(id)`, `adminOrderDrafts(id)`, `adminOrderFinals(id)`, `adminStats`; `ROUTES.admin` += `dashboard: "/admin"`, `settings: "/admin/settings"`; `REALTIME_EVENTS` += `revisionRequested`, `revisionAccepted`, `draftDelivered`, `finalsRegistered`, `settingsUpdated`; delete dead `APP.currencySymbol`.
- `formatMoney(amount, currency = APP.currency)` — locale unchanged (`APP.locale`).

## P2 — Settings service + currency plumbing

- `src/lib/settings.ts`: `getSiteSettings()` (unstable_cache tag `settings`; fallback `APP.currency`), `setCurrency(user, code)` (admin-only; allow-list → 400; upsert; revalidateTag; fire-and-forget `settingsUpdated` ping).
- Routes: public `GET /api/settings` (rate-limited) → `{ data: { currency } }`; `PATCH /api/admin/settings` (`settingsSchema { currency }`; authenticate+requireRole+validateBody).
- Client: `use-settings.ts` (query, seeded from server), `CurrencyProvider` in `providers.tsx`, `useMoney()` → bound formatter, `use-update-settings`.
- Call-site migration: client money components → `useMoney()` or `formatMoney(x, order.currency)` when an order is in scope; server pages (home/services/[slug]/package) + `seo/schema.ts` → `await getSiteSettings()`.
- Snapshot: `createOrder` sets `currency` from settings; `ClientOrderDetail`/admin order selects gain `currency`; quote card, charges, payments list/card, orders table format with `order.currency`.

## P3 — Drafts & finals

- `registerDraft(user, orderId, { fileIds, note? })` in `admin-orders.ts`: admin-only; status must be `IN_DESIGN` (409); files confirmed admin `DRAFT_PREVIEW|DRAFT_ORIGINAL` on the order, ≥1 (400); one tx: `applyStatusChange(IN_DESIGN→DRAFT_DELIVERED)` + close OPEN revisions (`DONE`) + event note (filenames + note); pings `order.status_changed` + `draftDelivered`.
- `registerFinals(user, orderId, { fileIds })`: ≥ `IN_DESIGN` (not COMPLETED/CANCELLED); confirmed admin `FINAL` files ≥1; **no status change** (gate stays `finalPaymentVerified`); event note + `finalsRegistered`.
- Routes `POST /api/admin/orders/[id]/drafts` · `POST /api/admin/orders/[id]/finals`; validators `registerDraftSchema` (fileIds 1–20, note ≤1000) · `registerFinalsSchema` (1–50).

## P4 — Revisions

- `src/lib/revisions.ts`:
  - `requestRevision(user, orderId, { message, fileIds })` — owner; only from `DRAFT_DELIVERED` (else 409 `INVALID_TRANSITION`); ≤5 confirmed own `REVISION_REF`s connected via `revisionId`; `extraFeeRequired = order.revisionCount >= package.revisionLimit`; `number = max+1`; `revisionCount++` + machine `DRAFT_DELIVERED→REVISION_REQUESTED` in one tx; pings admins. Returns `{ id, number, status, extraFeeRequired }`.
  - `acceptRevision(user, revisionId)` — admin; if `extraFeeRequired`, require a PAID `EXTRA_REVISION` payment on the order (else 409 `details: { paymentStatus }`); machine `REVISION_REQUESTED→IN_DESIGN`; stamp `acceptedAt/ById`; ping owner.
  - `listRevisions(user, orderId)` — thread access; includes files + extra payment status.
- Routes `POST /api/orders/[id]/revisions` (client; validateBody + rate limit) · `GET /api/orders/[id]/revisions` · `PATCH /api/admin/revisions/[id]` (`{ action: "accept" }`); validators `revisionSchema` (message 1–2000, fileIds ≤5) · `acceptRevisionSchema`.

## P5 — Client UI (revisions)

- `order-actions.tsx` at `DRAFT_DELIVERED`: **Approve draft** + **Request revision** + "N of M free revisions left" (0 → "further revisions are quoted by the designer first").
- New `revision-request-dialog.tsx` + `order-revision-form.tsx` (RHF+zod; ≤5 images via `stageFiles`/`useUploadFile` kind `REVISION_REF`) + `use-request-revision`.
- New `order-revisions-card.tsx` after Deliverables; `getOrderForUser` select += `revisions`, `revisionCount`, `package.revisionLimit`, `currency`.

## P6 — Admin UI (proceed page)

- `admin-proceed-view.tsx`: **Deliver draft** (status `IN_DESIGN`; dialog: pick undelivered `DRAFT_*` files or drop new via `proceed-drop-files`, optional note → `use-admin-register-draft`); **Register finals** (≥ `IN_DESIGN`, `FINAL` files → `use-admin-register-finals`).
- New `admin-revisions-card.tsx`: revision list, extra-fee badge, **Accept** (disabled + "Charge extra revision" pre-filling `ProceedChargeForm` type `EXTRA_REVISION` while unpaid) → `use-admin-accept-revision`; deliver auto-closes OPEN revisions server-side.
- `proceed-drop-files.tsx` label: "Draft preview (watermarked)" → "Draft preview".
- Realtime cases for `revisionRequested/revisionAccepted/draftDelivered/finalsRegistered` → `[orderKeys.detail(refId), adminOrderKeys.detail(refId)]` (+tests).

## P7 — Admin dashboard

- `src/lib/admin-stats.ts` `getAdminStats`: `statusCounts`, `revenue{totalPaid,advancePaid,finalPaid,extraRevisionPaid,thisMonthPaid}`, `needsAttention{submitted,awaitingAdvance,inDesign,draftDelivered,awaitingFinalPayment,pendingPayments,openRevisions}`, `recentOrders`(10), `avgRevisionsPerCompletedOrder` — groupBy/count/aggregate.
- Route `GET /api/admin/stats`; hook `use-admin-stats` + `adminStatsKeys`; invalidated by `order.status_changed` / `payment.updated` / `revision.*` / `settingsUpdated`.
- `/admin/page.tsx` real overview (redirect removed): `stats-card.tsx`, `stats-overview.tsx` (KPI grid + status funnel), `needs-attention-card.tsx` (links to `?status=`-filtered orders), `recent-orders-card.tsx`; skeleton + error/refetch.
- `admin-shell.tsx` nav: **Dashboard · Orders · Chats · Files · Users · Pricing · Settings**; logo → `ROUTES.admin.dashboard`.

## P8 — Admin settings page

- `ROUTES.admin.settings`; page + `admin-settings-view.tsx` + `currency-card.tsx`: shadcn `Select` over `SUPPORTED_CURRENCIES` (typeahead; "Name (CODE)"), save → `use-update-settings` → PATCH → toast + live re-render via `settingsUpdated` → `settingsKeys` invalidation. Helper text: "Switching currency changes the label only — amounts are never converted. In-flight orders keep the currency they were created with."

## P9 — Docs, tests, gates

- **API.md**: §5 rewritten (request/accept + extraFee), §8 drafts/finals (drop "watermark job"), new §8b stats + §8c settings, §12 event list. **README** roadmap. **AGENTS.md** component list. **PLAN.md** step 26.
- **Tests** (~+35, expect ~205–210): revisions service (limit math, extraFee, wrong status, file validation, stranger 404, accept-blocked-until-PAID, auto-close on re-deliver), drafts/finals guards, settings (allow-list, admin-only, snapshot), formatMoney currency param, admin-stats, validators, realtime rows.
- **Gates**: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`; local `migrate deploy`; **deploy migration to cloud direct URL too**; dev smoke: USD switch re-renders live; old orders keep PKR; revision loop request→charge→accept→re-deliver; `/admin` 200 with stats; chats still load.

**Out of scope:** watermarking, emails (plan 4), Stripe, invoices, FX conversion, portfolio CMS/testimonials.
