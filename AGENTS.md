# AGENTS.md

Instructions for AI coding agents (Claude Code, Cursor, Copilot, Codex, etc.) working in this repository. Read this file fully before making changes.

## Project Summary

ArchiPlan Studio is a Next.js (App Router) + TypeScript full-stack app where clients order house architecture designs and the admin (designer) fulfils them. Core flow: **order, quote, advance payment, design, watermarked draft, revisions, final payment, locked final files**.

Read these before coding:

| File | Read it when |
|------|--------------|
| `PRD.md` | Deciding what to build and why |
| `API.md` | Adding or changing any endpoint or action |
| `DESIGN.md` | Building or styling any UI |
| `RULES.md` | **Mandatory** frontend rules: TanStack Query, shadcn/ui, hook-per-API-call, `api` util with axios |
| `README.md` | Setup, scripts, structure |

## Stack

Next.js App Router, TypeScript (strict), PostgreSQL + Prisma, Clerk (sessions) + our DB (roles), S3-compatible private storage, Resend, Tailwind + shadcn/ui, Zod, React Hook Form, sharp.

## Commands

```bash
pnpm dev                 # run locally
pnpm lint                # must pass
pnpm typecheck           # must pass
pnpm test                # must pass
pnpm prisma migrate dev  # after schema changes
pnpm prisma generate     # regenerate client
pnpm prisma db seed      # seed packages (admin bootstraps via ADMIN_EMAILS)
```

Before declaring a task done, run `pnpm lint && pnpm typecheck && pnpm test`.

## Architecture Rules

1. **Server by default.** Use Server Components. Add `"use client"` only when you need state, effects, or browser APIs.
2. **Layers:** Component → Server Action / Route Handler (wrapped by `withMiddleware`) → service layer (`src/lib/**`) → Prisma. Business logic lives in the service layer, never in components or route files.
3. **One Prisma client** from `src/lib/db.ts`. Never instantiate `PrismaClient` elsewhere.
4. **Validate everything** with Zod schemas in `src/lib/validators/`. Reuse the same schema on client and server.
5. **Status changes go through `src/lib/orders/status.ts` only.** Never update `order.status` directly. The function enforces allowed transitions, writes an `OrderEvent`, and queues the email.
6. **Money** is stored as integers in the smallest sensible unit (no floats). Format only at the UI layer.
7. **Types:** no `any`. Prefer inferred types from Zod and Prisma.

## Frontend Data and UI Rules (strict)

All client-side data fetching and UI work must follow `RULES.md`. In short: TanStack Query for server state, shadcn/ui for components, one hook per API call returning `{ data, loadings, actions, query }`, and a single `api<data>(method, data)` util built on axios as the only way to reach the backend. Components never call the API or TanStack Query directly. Read `RULES.md` before touching any component, hook, or fetch logic.

## Configuration and Constants (strict)

Two files hold every fixed value in the app. Nothing is hard-coded anywhere else.

| File | Holds | Import |
|------|-------|--------|
| `src/config/constants.ts` | App name, tagline, currency, routes, roles, order statuses and labels, file limits, pagination, rate limits, error codes, email subjects | Server and client |
| `src/config/config.ts` | Validated environment variables exported as a typed `config` object (`config.db.url`, `config.storage.bucket`, ...) | **Server only** (`import "server-only"`) |
| `src/config/public-config.ts` | `NEXT_PUBLIC_*` values only | Server and client |

Rules:
1. **`process.env` is forbidden everywhere except `src/config/config.ts` and `src/config/public-config.ts`.** Import `config` instead.
2. The app name, tagline, support email, currency, routes, limits, and status labels come from `constants.ts`. Never type "ArchiPlan Studio" or `"/dashboard"` as a literal in components, emails, or API code.
3. Adding an env variable means: add it to the Zod schema in `config.ts`, expose it on the `config` object, and add it to `.env.example`.
4. Adding a new fixed value (limit, label, path) means: add it to `constants.ts` first, then use it.
5. Enforce with ESLint:

```js
// eslint.config.mjs (excerpt)
{
  files: ["src/**/*.{ts,tsx}"],
  ignores: ["src/config/**"],
  rules: {
    "no-restricted-properties": ["error", {
      object: "process", property: "env",
      message: "Use `config` from @/config/config (or publicConfig) instead of process.env."
    }]
  }
}
```

## API Structure (strict)

Every route handler follows one pattern. Reference implementations: `src/app/api/orders/route.ts` and `src/app/api/admin/orders/[id]/status/route.ts`.

```
src/lib/api/
├── types.ts              # ApiRequest, ApiResponse, Middleware, Handler, MiddlewareResult
├── response.ts           # ok(), created(), paginated(), noContent(), fail(), ApiError
├── request.ts            # getBody(), getQuery(), getParam(), getUser()
├── with-middleware.ts    # withMiddleware(handler, middlewares[], options?)
└── middlewares/
    ├── helpers.ts        # pass(), reject()
    ├── authenticate.ts
    ├── require-role.ts
    ├── validate.ts       # validateBody(schema), validateQuery(schema)
    ├── rate-limit.ts
    └── index.ts          # barrel + defaultMiddlewares
```

**Middleware signature**

```ts
type Middleware = (req: ApiRequest, res: ApiResponse) =>
  { success: boolean; message: string; req: ApiRequest; res: ApiResponse; status: number }
  | Promise<...>;
```

- Return `pass(req, res)` to continue, or `reject(req, res, status, message, { code, details })` to stop the chain.
- Middlewares communicate through `req.ctx` (`user`, `body`, `query`, `params`, `requestId`) and `res.headers` / `res.locals`.

**Registering and exporting**

```ts
const getHandler: Handler = async (req) => {
  const user = getUser(req);
  return ok(await listOrdersForUser(user.id));
};

export const GET = withMiddleware(getHandler, [authenticate]);
```

`withMiddleware(handler, middlewares[], options?)` runs `defaultMiddlewares` (rate limit) first, then the route's middlewares in order, then the handler. A failed middleware returns the standard error response; a thrown `ApiError` is converted automatically; unknown errors become a generic 500.

Rules:
1. **Every exported `GET/POST/PATCH/PUT/DELETE` must come from `withMiddleware`.** Never export a bare handler.
2. Order matters: `authenticate` → `requireRole` → `validateQuery/validateBody` → handler.
3. Handlers are thin: read input, call a service in `src/lib/**`, return `ok()/created()/paginated()`. No business logic, no direct Prisma calls in handlers.
4. Ownership checks (does this order belong to this client?) happen in the service layer and throw `ApiError.notFound()`.
5. Use `ApiError` for expected failures. Never return ad-hoc JSON shapes.
6. Webhooks that need the raw body use `{ skipDefaults: true }` and verify signatures in their own middleware.
7. New reusable behavior (e.g. `requirePaidFinal`, `idempotency`) becomes a new file in `middlewares/`, not inline code.

## Component Architecture (strict)

The UI is built from **small, file-based components**. One component per file.

```
src/components/
├── ui/            # shadcn/ui primitives (button, input, dialog...)
├── common/        # shared building blocks (logo, whatsapp-button, empty-state, page-header)
├── layout/        # navbar, footer, dashboard-sidebar, admin-sidebar
├── marketing/     # hero-section, package-card, portfolio-card, how-it-works-steps...
├── orders/        # order-card, order-status-badge, order-timeline, order-form-step-plot...
├── files/         # file-dropzone, file-list, draft-preview
├── payments/      # payment-card, proof-upload
├── messages/      # message-thread, message-bubble, message-input
└── admin/         # orders-table, status-controls, stats-card, portfolio-editor...
```

Rules:
1. **One exported component per file.** File name is the component name in `kebab-case.tsx` (`order-status-badge.tsx` exports `OrderStatusBadge`).
2. Props type is declared in the same file as `<ComponentName>Props`.
3. Components are presentational: no business logic, no direct database access. Data comes in through props or from a Server Component parent.
4. Pages (`page.tsx`) only **compose** components and fetch data. If a page grows past ~80 lines of JSX, extract components.
5. Split large components by responsibility (`order-form.tsx` composes `order-form-step-plot.tsx`, `order-form-step-rooms.tsx`, ...).
6. Place a component in the most specific folder that fits; promote it to `common/` only when a second feature needs it.
7. Text, labels, and routes come from `constants.ts`, not string literals.
8. Reference: `src/components/orders/order-status-badge.tsx`.

## Security Rules (non-negotiable)

- Every Server Action and Route Handler must: **(1)** check the session, **(2)** check the role, **(3)** verify the user owns the resource, **(4)** validate input.
- Return `404` (not `403`) when a client requests another client's resource, so existence is not leaked.
- **Never expose storage keys or permanent URLs.** Files are served only via `/api/files/[id]/download`, which issues a signed URL valid for 60 seconds.
- `FINAL` files must never be downloadable unless the order's final payment is verified. Enforce this server-side in the download route, not just in the UI.
- Draft files shown to clients are the **watermarked, low-res previews**. Never send `DRAFT_ORIGINAL` to a client.
- Validate uploads by mime type **and** size on the server; do not trust the client-supplied values.
- Payment webhooks: verify the signature, be idempotent, never trust amounts from the client.
- Credentials and sessions are owned by Clerk; never store passwords or auth tokens locally. Never log tokens, signed URLs, or personal documents.
- Do not commit secrets. Use `.env` locally and update `.env.example` when adding variables.
- Rate-limit auth, contact, upload-presign, and message endpoints.

## Code Style

- TypeScript strict mode, ESLint + Prettier as configured.
- File names: `kebab-case.ts`; React components: `PascalCase` exports.
- Prefer named exports, except for Next.js pages/layouts which require default exports.
- Keep components small. Extract hooks and helpers when a file passes about 200 lines.
- Use `async/await`, no unhandled promises. Handle errors explicitly and return the standard error shape from `API.md`.
- Comments explain *why*, not *what*.

## UI Rules

- Follow `DESIGN.md`: color tokens, typography, spacing, component specs.
- Use shadcn/ui primitives from `src/components/ui`. Do not add another component library.
- Use Tailwind classes with design tokens, never hard-coded hex values.
- Mobile first. Test at 375px.
- Every list needs a loading skeleton and an empty state. Every form needs inline validation and a pending state.
- Accessibility: labels on all inputs, visible focus, alt text on images, touch targets of at least 44px.

## Database Rules

- Change the schema only in `prisma/schema.prisma`, then create a migration (`pnpm prisma migrate dev --name <what-changed>`). Never edit applied migrations.
- Add indexes for fields used in filters: `Order.status`, `Order.userId`, `Order.createdAt`, `Payment.orderId`, `OrderFile.orderId`.
- Use transactions when a change touches multiple tables (e.g. verify payment + change status + create event).
- Never delete orders or payments; use soft states (`CANCELLED`, `REJECTED`).

## Emails

- Templates live in `src/lib/email/templates` (React Email).
- Sending an email must never block or fail the main action. Wrap in try/catch and log the failure.
- Each status change maps to the email events in `API.md`.

## Testing

- Unit-test: status machine transitions, revision-limit logic, payment calculations (advance/final split), authorization helpers.
- Integration-test: order creation, file download gating (paid vs unpaid), webhook idempotency.
- When fixing a bug, add a test that fails before the fix.

## Workflow for Agents

1. Restate the task and identify which docs (`PRD.md`, `API.md`, `DESIGN.md`) apply.
2. Check the current build phase in `README.md` (roadmap). **Do not build features from a later phase** unless asked.
3. Make the smallest change that fully solves the task. Avoid unrelated refactors.
4. Update docs when behavior changes: `API.md` for endpoints, `.env.example` for variables, `README.md` for setup.
5. Run lint, typecheck, and tests.
6. Summarize what changed, what was tested, and any follow-ups.

## Do

- Ask for clarification when requirements conflict with `PRD.md`.
- Reuse existing helpers and components before writing new ones.
- Keep PRs focused and small.
- Add migrations for every schema change.

## Don't

- Don't bypass the status machine or write order status directly.
- Don't serve files from public URLs or return raw storage keys.
- Don't put business logic in React components.
- Don't add dependencies without a clear reason; mention any you add.
- Don't use `localStorage` for anything sensitive (it may be used for form-draft autosave only).
- Don't disable lint or type rules to make errors go away.
- Don't hard-code prices, currency, bank details, or contact info; read from the database, `constants.ts`, or `config`.
- Don't read `process.env` outside `src/config/`.
- Don't hard-code the app name, routes, limits, or status labels; import them from `constants.ts`.
- Don't export a route handler without `withMiddleware`.
- Don't use axios or `fetch` outside the `api` util, or call API/TanStack Query from components (see `RULES.md`).
- Don't put more than one component in a file, or business logic in a component.

## Definition of Done

- [ ] Meets the acceptance criteria in `PRD.md`
- [ ] Authorization and validation in place
- [ ] Works at mobile and desktop widths
- [ ] Loading, empty, and error states handled
- [ ] Lint, typecheck, and tests pass
- [ ] Docs and `.env.example` updated if needed
- [ ] No secrets, debug logs, or dead code committed
- [ ] No `process.env` or hard-coded constants outside `src/config/`
- [ ] Routes exported via `withMiddleware`; components are one-per-file

## Suggested First Tasks (Phase 1)

1. Scaffold the Next.js app with Tailwind and shadcn/ui; configure the design tokens from `DESIGN.md`.
2. Add `src/config/` (`constants.ts`, `config.ts`, `public-config.ts`) and the ESLint `process.env` rule.
3. Add `src/lib/api/` (types, response, request, with-middleware, middlewares).
4. Write `prisma/schema.prisma` from the data model in `PRD.md`; seed 3 packages.
5. Set up Clerk (middleware + sign-in/sign-up routes) with role-based checks driven by `ADMIN_EMAILS` and the DB role.
6. Build the marketing pages (Home, Services, Portfolio placeholder).
7. Build the multi-step order form with direct-to-storage uploads.
8. Build the admin orders list and order detail (read-only first).
