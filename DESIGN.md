# Design System — ArchiPlan Studio

Design tokens and UI rules for the app. Tokens live in `src/app/globals.css`; fixed strings (names, routes, labels) live in `src/config/constants.ts`.

## Color palette

Theme: **warm paper + blueprint navy + terracotta accent** — an architectural drafting-desk feel. All values are OKLCH; never hard-code hex in components (use Tailwind token classes like `bg-primary`, `text-muted-foreground`).

### Light theme (`:root`)

| Token | Value | Use |
|-------|-------|-----|
| `--background` | `oklch(0.985 0.006 85)` | Page background — warm off-white paper |
| `--foreground` | `oklch(0.24 0.03 255)` | Body text — near-black slate blue |
| `--card` | `oklch(1 0 0)` | Card surfaces |
| `--primary` | `oklch(0.38 0.09 255)` | Buttons, links, selected states — blueprint navy |
| `--primary-foreground` | `oklch(0.985 0.006 85)` | Text on primary |
| `--secondary` / `--muted` | `oklch(0.955 0.012 85)` | Subtle fills — warm light gray |
| `--muted-foreground` | `oklch(0.5 0.025 255)` | Secondary text |
| `--accent` | `oklch(0.93 0.03 60)` | Icon chips, highlights — pale terracotta |
| `--accent-foreground` | `oklch(0.3 0.06 45)` | Text on accent |
| `--destructive` | `oklch(0.577 0.245 27.325)` | Errors, cancelled status |
| `--border` / `--input` | `oklch(0.9 0.015 85)` | Hairlines, input borders |
| `--ring` | `oklch(0.55 0.09 255)` | Focus rings |

### Dark theme (`.dark`)

Deep slate-blue surfaces (`0.17–0.26` lightness, hue 255), off-white ink, brighter navy primary (`oklch(0.68 0.12 255)`) for contrast, terracotta accent deepened (`oklch(0.32 0.05 45)` with light foreground).

### Charts

`--chart-1…5`: navy, terracotta, teal, sand, plum — used by future stats UI.

## Typography

- **Sans:** Geist Sans (`geist/font/sans`, self-hosted in `src/app/layout.tsx`) for everything.
- **Mono:** Geist Mono for identifiers (order numbers) when needed.
- Scale: page titles `text-3xl md:text-4xl font-semibold tracking-tight`; section titles `text-2xl font-semibold tracking-tight`; card titles `font-medium`; body `text-sm`.

## Spacing & radius

- `--radius: 0.625rem` drives `rounded-lg/xl/2xl…` scale.
- Sections: `py-16` (page rhythm), `gap-6` card grids, `gap-4` dense lists.
- Containers: `mx-auto w-full max-w-6xl px-4`.

## Component conventions

- **Icons:** `lucide-react` only. Standard icon chip: `flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary`.
- **Buttons:** shadcn/Base-UI `Button`. For links use `render={<Link href={…} />}` — the shared `Button` sets `nativeButton={false}` automatically for non-button renders.
- **Selected card state:** `border-primary bg-primary/5 ring-2 ring-primary/40` + `BadgeCheckIcon` (see `order-form-step-package.tsx`).
- **Status badge:** `order-status-badge.tsx` maps statuses to badge variants — do not improvise colors per status.
- Every list: loading skeleton + empty state; every form: inline validation + pending state. Mobile first — verify at 375px.
