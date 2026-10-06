# RULES.md

Mandatory frontend rules for ArchiPlan Studio. These are restrictions, not suggestions. They apply to every developer and every AI agent. If a rule here conflicts with another doc, this file wins for anything touching the frontend, data fetching, or components.

Related docs: `AGENTS.md` (agent workflow), `API.md` (endpoints and middleware), `DESIGN.md` (visual design), `PRD.md` (product).

---

## 1. Required Libraries

| Concern | Library | Rule |
|---------|---------|------|
| Server state (anything that comes from the API) | **TanStack Query** | The only way to fetch, cache, and mutate server data on the client |
| UI components | **shadcn/ui** | The only component library; build everything else by composing it |
| HTTP client | **axios** | Used in exactly one place: the `api` util |
| Forms | React Hook Form + Zod | Same Zod schemas as the server |
| Styling | Tailwind CSS | Tokens from `DESIGN.md` |

Do not add a second data-fetching library (SWR, Redux Toolkit Query, etc.), a second component library (MUI, Chakra, Ant, etc.), or a second HTTP client.

---

## 2. Server State vs Client State

- **Server state** (orders, packages, files, payments, messages, portfolio, stats, session-related data) lives in **TanStack Query** only.
- **Client state** (open modals, selected tab, multi-step form progress, filters before submit) lives in React state, or a small store if truly shared.
- Never copy query data into `useState` or a global store. Read it from the hook.
- Never use `useEffect` plus manual fetching to load data.

---

## 3. The `api` Util (the only way to call the backend)

**Location:** `src/lib/api-client/api.ts` (single file, single export named `api`).

**Name and shape:** a generic function called `api<data>(method, data)` that uses **axios** internally.

Rules:
1. `api` is the **only** place axios is imported or configured. No component, hook, or other util may import axios or call `fetch` for backend requests.
2. The first argument is the HTTP method. The second argument carries everything else the request needs (URL or endpoint key, body, query params, headers). Keep this as a single object so the signature stays stable.
3. The generic type `data` describes the expected response payload, so every hook is fully typed end to end.
4. It reads the base URL from `publicConfig` (never from `process.env`) and any fixed endpoint paths from `constants.ts`.
5. It unwraps the standard success envelope and returns the inner `data` (and `meta` for paginated responses), so hooks never deal with raw axios responses.
6. It converts API failures into one typed error (message, code, status, details) matching the error format in `API.md`, so every hook and UI handles errors the same way.
7. It sends cookies/credentials for the Auth.js session, and handles `401` consistently (redirect to login) in one place.
8. Request cancellation (abort signal from TanStack Query) must be supported.
9. File uploads to storage (presigned URLs) also go through `api` or a clearly named sibling util in the same folder. Components never talk to storage directly.
10. No business logic, no toasts, no UI code inside `api`.

---

## 4. One Hook per API Call

**Every API call has its own hook. Components never call `api` directly and never call `useQuery` / `useMutation` directly.** Components only use the feature hooks.

### Location and naming

- Folder: `src/hooks/<feature>/` (for example `hooks/orders/`, `hooks/packages/`, `hooks/payments/`, `hooks/messages/`, `hooks/files/`, `hooks/admin/`, `hooks/portfolio/`, `hooks/auth/`).
- One hook per file, kebab-case file name matching the hook: `use-orders.ts` exports `useOrders`, `use-order.ts` exports `useOrder`, `use-create-order.ts` exports `useCreateOrder`.
- Hook names describe the resource and the action: `useOrders` (list), `useOrder` (single), `useCreateOrder`, `useApproveDraft`, `useRequestRevision`, `useVerifyPayment`.
- A hook that both reads and writes the same resource (for example an order detail screen) is allowed to expose queries and mutations together, but each underlying API call is still defined once.

### Required return structure

Every hook returns the **same four-key object**:

| Key | Contains |
|-----|----------|
| `data` | The query state data (the resolved server data, or empty/undefined while loading). For mutation-only hooks, this is the last successful mutation result or empty. |
| `loadings` | An object of boolean flags, one per query and mutation the hook owns |
| `actions` | An object of functions, one per mutation the hook owns (the callable mutation triggers) |
| `query` | The full TanStack Query result object, exposed for advanced needs (error, refetch, status, isFetching) |

Rules for the structure:
1. The four keys are always present, even if one is empty. Do not rename them or add top-level keys.
2. `loadings` has descriptive keys, for example: initial load, background refetch, and one flag per mutation (such as creating, approving, cancelling). Names are consistent across hooks.
3. `actions` contains the mutation triggers only (create, update, delete, approve, verify, and so on). Reading data never goes through `actions`.
4. `query` is the escape hatch for `error`, `refetch`, `isFetching`, `isError`. Components should prefer `data` and `loadings`, and use `query` only when needed.
5. Hooks are typed so `data`, `loadings`, and `actions` have precise types, with no `any`.
6. A hook returns a stable object shape on every render.

### What a hook is responsible for

- Calling `api` (never axios or fetch).
- Defining the query key and options (stale time, enabled conditions).
- Defining mutations and the **cache invalidation** they trigger.
- Showing success and error toasts via the shared toast component (not in components).
- Nothing else: no JSX, no routing logic beyond simple callbacks.

### Query keys

- All query keys are built by one **query key factory** per feature, kept in the feature's hooks folder (for example `hooks/orders/order-keys.ts`).
- Never write ad-hoc string arrays in hooks or components.
- Key structure goes from broad to specific (feature, then list or detail, then filters or id) so invalidation can target a whole feature or a single record.

### Invalidation rules

- Every mutation must declare which keys it invalidates (for example, creating an order invalidates the orders list; approving a draft invalidates that order's detail and the orders list).
- Status-changing mutations always invalidate the order detail and the order list.
- Payment verification invalidates the order detail, payments, and admin stats.
- Optimistic updates are allowed only for low-risk actions (for example sending a message), and must roll back on error.

---

## 5. Where Data Fetching Is and Is Not Allowed

| Place | Allowed |
|-------|---------|
| Client components | Use feature hooks only |
| Feature hooks | Call `api` and TanStack Query |
| `api` util | The only place axios is used |
| Server Components / route handlers | Call the **service layer** (`src/lib/**`) directly. They must not call the HTTP `api` util |
| Server Actions | Not the default for UI mutations. UI mutations go through hooks and route handlers. Use a Server Action only when explicitly approved, and still call the service layer |

Public marketing pages (home, portfolio, services) may fetch on the server via the service layer for SEO, and pass the result as initial data to hooks when interactivity is needed.

---

## 6. shadcn/ui Component Rules

1. Every UI primitive comes from shadcn/ui: button, input, textarea, select, checkbox, radio, switch, dialog, sheet, dropdown, tabs, accordion, table, card, badge, toast, tooltip, skeleton, form, and so on.
2. Install primitives with the shadcn CLI into `src/components/ui/`. Do not hand-write replacements for primitives shadcn already provides.
3. Customize shadcn components only through design tokens and variants defined in `DESIGN.md`, not by scattering one-off overrides across the app.
4. Feature components (for example `order-card`, `package-card`) are built by **composing** shadcn primitives. They live in their feature folders, one component per file, as defined in `AGENTS.md`.
5. Use shadcn's form components together with React Hook Form and the shared Zod schemas.
6. Use shadcn `skeleton` for loading states, and shadcn toast (sonner) for feedback.
7. Do not mix in another component library, and do not install icon packs beyond the one already chosen (lucide-react).

---

## 7. Component and Hook Contract

- Components call a feature hook, read `data`, `loadings`, and `actions`, and render. That is all.
- Components never import `api`, axios, TanStack Query primitives, or the query key factories.
- Loading UI: use the relevant `loadings` flag to show skeletons or disable buttons.
- Error UI: read the error from `query` and show a consistent error component (shared, in `components/common`).
- Empty UI: every list handles the empty case with a shared empty-state component and a next action.
- Pages compose components; hooks fetch; `api` talks to the server. No layer skips another.

Layer order (top calls down, never the reverse or sideways):

Page → Feature component → Feature hook → `api` util → Route handler (wrapped by `withMiddleware`) → Service layer → Database

---

## 8. Provider Setup

- A single TanStack Query provider wraps the app, created once in a dedicated client component, with the query client configured in one place.
- Default options (stale time, retry count, refetch-on-focus) are decided once in that file and documented there. Hooks override only when they have a reason.
- Devtools are enabled in development only.
- Do not create additional query clients.

---

## 9. Error and Feedback Standards

- All API errors reach hooks as the single typed error from the `api` util.
- Hooks translate errors into user-friendly toasts using messages from the API error, with a safe fallback message from `constants.ts`.
- Validation errors from the API (field-level details) are mapped back onto form fields.
- Never show raw error objects, stack traces, or status codes to users.
- Payment-required responses on final file downloads show a clear "complete your payment to unlock" message, not a generic error.

---

## 10. File Upload Rules (client side)

- Uploads use the presign, upload, confirm flow from `API.md`, wrapped in dedicated hooks (for example a presign hook, an upload hook with progress, and a confirm hook, or one orchestrating upload hook).
- Progress, success, and failure are exposed through the same hook structure (`data`, `loadings`, `actions`, `query`).
- File type and size limits come from `constants.ts` and are checked before the request starts.

---

## 11. Naming Cheatsheet

| Thing | Convention |
|-------|-----------|
| Hook file | `use-<thing>.ts` (kebab-case) |
| Hook export | `use<Thing>` (camelCase, starts with `use`) |
| Query key factory | `<feature>-keys.ts` in the feature's hooks folder |
| Loading flags | Descriptive and boolean: loading, fetching, creating, updating, deleting, approving, verifying |
| Actions | Verb names: create, update, remove, approve, cancel, verify, send |
| Component file | `<component-name>.tsx` (kebab-case), one per file |

---

## 12. Restrictions (Quick List)

Never do these:

- Import or use axios anywhere except the `api` util.
- Use `fetch` for backend calls from the client.
- Call `api`, `useQuery`, or `useMutation` directly inside a component.
- Create a hook that returns anything other than the required four-key structure.
- Write query keys inline instead of using the feature's key factory.
- Store server data in `useState`, context, or a global store.
- Fetch data in `useEffect`.
- Add a UI library other than shadcn/ui.
- Handle API errors or toasts inside components instead of hooks.
- Read `process.env` anywhere outside `src/config/`.
- Hard-code endpoint paths, limits, or labels outside `constants.ts`.
- Put more than one hook or component in a file.

---

## 13. Review Checklist (before merging any frontend change)

- [ ] Data comes from a feature hook, not a direct call
- [ ] The hook returns the standard four-key structure
- [ ] The hook calls the `api` util, which is the only axios user
- [ ] Query keys come from the feature's key factory
- [ ] Mutations invalidate the correct keys
- [ ] UI is composed from shadcn/ui primitives
- [ ] Loading, empty, and error states are handled
- [ ] Toasts and error mapping live in the hook, not the component
- [ ] No server data duplicated into local state
- [ ] Constants and config used instead of literals and `process.env`
