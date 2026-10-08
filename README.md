# ArchiPlan Studio

A full-stack web app where clients order custom house architecture designs (floor plans, elevations, full drawing sets), track progress, request revisions, pay, and download final files. The designer (admin) manages orders, uploads drafts and finals, and runs the portfolio from a dashboard.

> Placeholder name. Replace "ArchiPlan Studio" with your real business name.

## Documentation Map

| File | Purpose |
|------|---------|
| `README.md` | Setup, stack, structure (this file) |
| `PRD.md` | Product requirements, user stories, phases |
| `DESIGN.md` | Visual design system and UX rules |
| `API.md` | Routes, server actions, request/response shapes |
| `ABOUT.md` | Business story, copy and brand content |
| `AGENTS.md` | Rules for AI coding agents working in this repo |
| `RULES.md` | Mandatory frontend rules (TanStack Query, shadcn/ui, hooks, api util) |
| `CONTENT.md` | SEO and content rules: keyword-rich genuine content, internal linking |

## Tech Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Database:** PostgreSQL (Neon or Supabase) with Prisma
- **Auth:** Auth.js (NextAuth) with email/password + Google, role-based (CLIENT, ADMIN)
- **File storage:** Cloudflare R2 / S3 (private bucket, signed URLs) or UploadThing
- **Email:** Resend + React Email templates
- **UI:** Tailwind CSS + shadcn/ui (the only component library)
- **Server state:** TanStack Query, with one hook per API call
- **HTTP client:** axios, used only inside the `api` util
- **Validation:** Zod (shared between forms and API)
- **Forms:** React Hook Form
- **Image processing:** sharp (watermark + low-res previews)
- **PDF invoices (Phase 5):** @react-pdf/renderer
- **Hosting:** Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (or npm/yarn)
- A PostgreSQL database (Neon free tier works)
- Accounts for: Resend, your storage provider

### Install

```bash
git clone <your-repo-url>
cd archiplan-studio
pnpm install
cp .env.example .env
```

### Environment Variables

> Never read `process.env` directly in app code. All variables are validated and exported from `src/config/config.ts` (`import { config } from "@/config/config"`). Fixed values such as the app name live in `src/config/constants.ts`.

Prisma CLI commands load environment variables from `.env.local` first, then `.env`. Keep these files local and untracked.

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/archiplan?sslmode=require"

# Auth
AUTH_SECRET="generate-with: openssl rand -base64 32"
AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Storage (S3-compatible, e.g. Cloudflare R2)
STORAGE_ENDPOINT=""
STORAGE_REGION="auto"
STORAGE_BUCKET="archiplan-private"
STORAGE_ACCESS_KEY_ID=""
STORAGE_SECRET_ACCESS_KEY=""

# Email
RESEND_API_KEY=""
EMAIL_FROM="ArchiPlan Studio <orders@yourdomain.com>"
ADMIN_NOTIFY_EMAIL="you@yourdomain.com"

# Payments (Phase 4)
PAYMENT_PROVIDER="manual"        # manual | stripe | other
PAYMENT_WEBHOOK_SECRET=""

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_WHATSAPP_NUMBER="923001234567"
```

### Google sign-in (optional)

Leave `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` empty and the "Continue with Google" button stays hidden (email/password always works). To enable it:

1. Create an OAuth 2.0 Client (Web) in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Authorized redirect URI: `${AUTH_URL}/api/auth/callback/google` (e.g. `http://localhost:3000/api/auth/callback/google`).
3. Fill the two env vars and restart `pnpm dev`.

Google sign-in links to an existing account with the same (Google-verified) email instead of conflicting; new Google users are created with the `CLIENT` role.

### Database

```bash
pnpm prisma migrate dev --name init
pnpm prisma db seed        # creates admin user + sample packages
```

### Run

```bash
pnpm dev
```

Open http://localhost:3000.

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm prisma studio` | Browse the database |
| `pnpm prisma db seed` | Seed admin + packages |

## Project Structure

```
.
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── config/
│   │   ├── constants.ts          # App name, routes, limits, labels, error codes
│   │   ├── config.ts             # Validated env -> typed `config` (server only)
│   │   └── public-config.ts      # NEXT_PUBLIC_* only (client safe)
│   ├── app/
│   │   ├── (marketing)/          # Home, portfolio, services, how-it-works, about, contact
│   │   ├── (auth)/               # login, register, forgot-password
│   │   ├── (client)/dashboard/   # Client dashboard + order detail
│   │   ├── (admin)/admin/        # Admin dashboard, orders, packages, portfolio
│   │   ├── order/new/            # Order form (multi-step)
│   │   └── api/                  # Route handlers, all wrapped by withMiddleware
│   ├── components/               # One component per file, grouped by feature
│   │   ├── ui/                   # shadcn/ui primitives
│   │   ├── common/  layout/  marketing/  orders/
│   │   └── files/  payments/  messages/  admin/
│   ├── lib/
│   │   ├── api/
│   │   │   ├── types.ts
│   │   │   ├── response.ts       # ok(), created(), fail(), ApiError
│   │   │   ├── request.ts        # getBody(), getQuery(), getParam(), getUser()
│   │   │   ├── with-middleware.ts
│   │   │   └── middlewares/      # authenticate, require-role, validate, rate-limit
│   │   ├── api-client/api.ts     # api<data>(method, data) on axios, the only HTTP caller
│   │   ├── db.ts                 # Prisma client singleton
│   │   ├── auth.ts               # Auth.js config
│   │   ├── storage.ts            # Signed URLs, upload helpers
│   │   ├── watermark.ts          # sharp watermark + preview generation
│   │   ├── email/                # Resend client + templates
│   │   ├── orders/               # Status machine, order services
│   │   ├── payments/             # Provider adapters
│   │   └── validators/           # Zod schemas
│   ├── hooks/                    # One hook per API call, grouped by feature (see RULES.md)
│   ├── actions/                  # Server actions (not the default for UI mutations)
│   └── middleware.ts             # Next.js route protection by role
├── public/
├── .env.example
└── package.json
```

## Conventions

- **Config:** `process.env` only inside `src/config/`. Everything else imports `config`, `publicConfig`, or constants.
- **Constants:** app name, routes, limits, labels live in `constants.ts`. No magic strings.
- **API routes:** handler functions are wrapped and exported as `export const GET = withMiddleware(getHandler, [authenticate])`.
- **Data fetching:** components use feature hooks returning `{ data, loadings, actions, query }`; hooks call the `api` util. See `RULES.md`.
- **Components:** one component per file, kebab-case file names, grouped by feature, presentational only.

### API in 30 seconds

```ts
// src/app/api/orders/route.ts
const getHandler: Handler = async (req) => {
  const user = getUser(req);
  return ok(await listOrdersForUser(user.id));
};

export const GET = withMiddleware(getHandler, [authenticate]);
```

A middleware is `(req, res) => { success, message, req, res, status }`. See `API.md` and `AGENTS.md` for the full pattern.

## Core Concepts

### Order Status Flow

```
SUBMITTED → QUOTED → AWAITING_ADVANCE → IN_DESIGN → DRAFT_DELIVERED
                                                        ↓        ↑
                                                REVISION_REQUESTED
                                                        ↓
                                              AWAITING_FINAL_PAYMENT → COMPLETED
```

Status changes only happen through `lib/orders/status.ts`. Every change writes an `OrderEvent` row and triggers an email.

### File Protection

- All files live in a **private** bucket.
- Clients download through `/api/files/[id]/download`, which checks ownership and payment state, then redirects to a short-lived signed URL.
- Draft files are served as **watermarked, low-resolution** previews.
- Final files are locked until the final payment is verified.

## Roadmap

- [ ] **Phase 1:** Auth, packages, order form with uploads, admin order list
- [ ] **Phase 2:** Client dashboard, status flow, email notifications
- [ ] **Phase 3:** Watermarked drafts, revisions, comment thread
- [ ] **Phase 4:** Payments and locked final downloads
- [ ] **Phase 5:** Portfolio CMS, stats, invoices, polish

## Deployment

1. Push to GitHub and import the repository into Vercel. Keep the **Root Directory** set to the repository root and the **Framework Preset** set to **Next.js**.
2. Use `pnpm build` as the build command. It generates the Prisma client in `src/generated/prisma` before building; that folder is intentionally gitignored and must not be committed.
3. Leave **Output Directory** unset so Vercel uses Next.js output. Do not set it to `generated` or `src/generated/prisma`—those are not deployment output folders.
4. Add `DATABASE_URL` and a strong `AUTH_SECRET` in Vercel's Environment Variables for the environments you deploy to. Set `NEXT_PUBLIC_APP_URL` to your deployed URL. Add provider variables (storage, email, Google) when those integrations are configured.
5. Apply database migrations separately with `pnpm prisma migrate deploy` against the production database before directing users to the deployment. Do not run migrations as part of each Vercel build.
6. Point your domain and verify the email domain in Resend.

## License

Proprietary. All rights reserved. Design work produced through this platform remains the property of the studio until paid in full.
