# Plans

- **Plan 1** (below): Role Separation + Full Admin Panel Expansion — ✅ executed (see `PLAN.md` step 24).
- **Plan 2** (bottom): Proceed Order Page, Chat UX, Read Receipts & Charge User — ✅ executed (see `PLAN.md` step 25).

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
