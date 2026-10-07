# Implementation Plan — ArchiPlan Studio

Derived from `PRD.md`, `API.md`, `RULES.md`, `AGENTS.md`, `README.md`. Follows the PRD release plan: **Phase 1 MVP first** ("a real client can submit an order and the admin sees it"), no features from later phases unless asked.

## Progress

| Step | Status | Notes |
|------|--------|-------|
| 1. Scaffold Next.js 16 + TS strict + Tailwind 4 + pnpm | ✅ Done | App Router, src dir, `@/*` alias |
| 2. Vitest, Prettier, deps, shadcn/ui init + 21 primitives | ✅ Done | pnpm 12 `allowBuilds` set in pnpm-workspace.yaml |
| 3. `src/config/` + ESLint `process.env` ban + `.env.example` | ✅ Done | constants.ts, config.ts (Zod, server-only), public-config.ts |
| 4. `src/lib/api/` framework + unit tests | ✅ Done | types, response, request, with-middleware, middlewares; **32/32 tests pass** |
| 5. Prisma 7 schema + seed + baseline migration + generate | ✅ Done | `validate` + `generate` pass; migration SQL generated offline via `migrate diff` |
| 6. Phase 0 verification (lint / typecheck / test) | ✅ Done | All three pass |
| 7. Apply migration + seed on a live DB | ⏳ Pending | Local Postgres available but credentials unknown; run `pnpm prisma migrate deploy && pnpm prisma db seed` once `DATABASE_URL` in `.env.local` points at it |
| 8. Phase 1.5 — Auth (routes, role middleware, pages, hooks) | ✅ Done | register route + Auth.js + login/register pages + hooks; register API verified with curl |
| 9. Phase 1.6 — Marketing shell | ✅ Done | navbar/footer/WhatsApp/home/services/portfolio/how-it-works/about/contact; all routes 200 |
| 10. Phase 1.7 — File presign/confirm + upload hooks | 🔄 In progress | storage lib with S3 backend + local dev fallback |
| 11. Phase 1.8 — Multi-step order form | ⏳ Pending | |
| 12. Phase 1.9 — Admin orders table + read-only detail | ⏳ Pending | |
| 13. Phase 1.10 — End-to-end verification | ⏳ Pending | |

**Environment notes:**
- No Docker daemon access and no preinstalled Postgres at session start → migration was generated offline (machine-generated from the validated schema, not yet applied to a live DB).
- The user installed PostgreSQL locally during the session (port 5432 open); waiting on credentials to run migrate + seed.
- Prisma 7 specifics: `prisma.config.ts` holds the CLI datasource URL; the runtime client uses the `@prisma/adapter-pg` adapter; generated client lives in `src/generated/` (gitignored).

## Current state

Greenfield: docs only (plus `files.zip` = copies of the docs). No code, no `package.json`.
`DESIGN.md` and `ABOUT.md` are referenced by `README.md` but **do not exist** — DESIGN.md is needed before shadcn theming.

## Build order

### Phase 0 — Foundations
1. **Scaffold:** `create-next-app` (App Router, TS strict, Tailwind), Prettier, Vitest, pnpm. Install shadcn/ui CLI primitives.
2. **Config layer (`src/config/`):** `constants.ts` (name, routes, roles, statuses/labels, limits, error codes, rate limits), `config.ts` (Zod-validated env, `server-only`), `public-config.ts`. Add the ESLint `no-restricted-properties` rule banning `process.env` outside `src/config/`. Write `.env.example`.
3. **API framework (`src/lib/api/`):** `types.ts`, `response.ts` (ok/created/paginated/noContent/fail/ApiError), `request.ts`, `with-middleware.ts`, `middlewares/` (authenticate, require-role, validate, rate-limit, helpers, index barrel). Unit tests: middleware chain ordering, reject/pass, ApiError → error shape, rate limit.
4. **Database:** `prisma/schema.prisma` from PRD §9 (User, Package, Order, OrderFile, OrderEvent, Revision, Payment, Message, PortfolioProject, Testimonial) with the required indexes. `seed.ts`: admin + 3 packages. Migration `init`.
   - Deferred columns are fine, but model the full schema now so later phases only migrate additively.

### Phase 1 — MVP
5. **Auth:** Auth.js email/password (+ Google behind a flag), role middleware protecting `/dashboard/*` and `/admin/*`, register/login/forgot-password routes, auth feature hooks (`hooks/auth/`).
6. **Marketing shell:** navbar, footer, floating WhatsApp button (`NEXT_PUBLIC_WHATSAPP_NUMBER`), home page: hero, packages (read from DB via service layer), how-it-works, portfolio placeholder. Services/About/Contact pages minimal.
7. **File plumbing (needed by the order form):** `src/lib/storage.ts` (S3/R2 presign), `POST /api/files/presign`, `POST /api/files/confirm`, upload hooks with progress. Client mime/size checks from `constants.ts`, re-validated server-side.
8. **Multi-step order form** (`/order/new`): 6 steps (Package → Plot → Requirements → Style/Budget → Uploads → Review) per FR-6, React Hook Form + shared Zod schemas from `src/lib/validators/`, draft autosave to `localStorage` (FR-10, allowed), guest prompted to register at submit, `POST /api/orders`. Order number `AP-YYYY-NNNN` generated in the service layer.
9. **Admin (read-only):** orders table with filters/search/sort/pagination (`GET /api/admin/orders`), order detail page showing client answers, uploads, timeline. Quote/status controls are Phase 2.
10. **Verify Phase 1:** seed → register a client → submit an order with uploads → see it in `/admin`. Tests for validators, order-creation service, ownership helpers. `pnpm lint && pnpm typecheck && pnpm test`.

### Phase 2 (after MVP is verified)
Status machine (`src/lib/orders/status.ts`), quote + accept flows, client dashboard + order detail, OrderEvent timeline, email service (Resend + React Email templates) wired non-blocking into transitions.

### Phase 3
Watermark/preview pipeline (sharp), draft upload route, revisions with limits, message thread per order.

### Phase 4
Payments (manual proof → verify first; gateway + idempotent signed webhook second), locked `FINAL` downloads (402 until verified).

### Phase 5
Portfolio CMS, stats, invoices, SEO polish, testimonials.

## Cross-cutting rules (enforced every step)

- Layers: component → hook → `api` util → route handler (`withMiddleware`) → service layer → Prisma. Never skip a layer.
- One hook per API call returning `{ data, loadings, actions, query }`; query keys from per-feature factories.
- Status changes only via `src/lib/orders/status.ts`; money as integers; no `any`; no literals for name/routes/limits/labels.
- 404 (not 403) for other users' resources; private bucket + 60s signed URLs only.
- Every list: loading skeleton + empty state; every form: inline validation + pending state; test at 375px.

## Decisions needed before/early in Phase 1

| Decision | Notes |
|----------|-------|
| `DESIGN.md` | Missing — I can draft color tokens/typography, or you supply brand colors |
| DB provider | Neon vs Supabase (both free-tier Postgres) |
| Storage | Cloudflare R2 vs S3 vs UploadThing (needed by step 7) |
| PRD §14 open questions | Currency (PKR implied), advance % default, guest checkout allowed per FR-10, quote is manual per API.md, languages |
