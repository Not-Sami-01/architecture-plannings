# Design System — ArchiPlan Studio

Design tokens and UI rules for the app, derived from the **ArchiPlan-Studio identity system** ("Built on stone. Defined by light."). Tokens live in `src/app/globals.css`; fixed strings (names, routes, labels) live in `src/config/constants.ts`.

## Direction

"Material clarity. Quiet depth." A grounded neutral palette — **Chalk canvas, Graphite ink, Limestone fills, Paper reading surfaces** — with a single distinctive **Patina** accent. Ruled grids carry structure; glass is used sparingly for floating surfaces. Ratio target: **70% stone & paper / 20% ink / 10% patina** — use Patina purposefully, keep reading surfaces neutral.

## Color palette

Tokens live in `src/app/globals.css` (hex below is the source of truth); never hard-code hex in components — use Tailwind token classes (`bg-primary`, `bg-cta-band`, `border-border`, …).

### Light theme (`:root`)

| Token | Value | Brand role | Use |
|-------|-------|-----------|-----|
| `--background` | `#F3F1EB` | **Chalk** | Page canvas, generous negative space |
| `--foreground` | `#202723` | **Graphite** | Headlines, body text |
| `--card` / `--popover` | `#FAF9F5` | **Paper** | Cards, reading surfaces, light panels |
| `--primary` | `#28665F` | **Patina** | Actions, active states, links, progress (≈5.7:1 on Chalk) |
| `--primary-foreground` | `#FAF9F5` | Paper on Patina | ≈6:1 |
| `--secondary` / `--muted` | `#DAD7CC` | **Limestone** | Quiet fills, alternate section backgrounds, table heads |
| `--muted-foreground` | `#5B605B` | Graphite ~72% over Chalk | Secondary text (≈5.5:1) |
| `--accent` / `--accent-foreground` | `#E1E7E3` / `#28665F` | Patina 12% over Paper | Chip fills, active rows; Patina eyebrow labels |
| `--border` / `--input` | `#DAD7CC` / `#C7C3B4` | Limestone | Hairlines and card borders / stronger input outlines |
| `--ring` | `#28665F` | Patina | Focus rings |
| `--destructive` | `oklch(0.577 0.245 27.325)` | — | Errors, cancelled status |
| `--cta` / `--cta-foreground` / `--cta-shadow` | `#28665F` / `#FFFFFF` / `#1C4A45` | Patina + white | **Hero and closing-band buttons only** (one clear action per screen); pressed-key shadow `shadow-[0_3px_0_0_var(--cta-shadow)]` + `active:translate-y-[3px] active:shadow-none` |
| `--cta-band` / `--cta-band-foreground` | `#DAD7CC` / `#202723` | Limestone + Graphite | Closing CTA band |
| `--hero` / `--hero-ink` / `--hero-accent` | `#202723` / `#F3F1EB` / `#83A49E` | Graphite / Chalk / light Patina | The **20% ink**: dark sections, image bands, the footer |
| `--glass` / `--glass-edge` / `--glass-shadow` | `#FAF9F5` / `rgb(255 255 255 / 55%)` / soft shadow | Paper | Glass recipe (below) |

**Patina tints:** `bg-primary/10` = icon chips; `bg-primary/5` + `border-primary` = selected package card; `text-primary/70` = supporting Patina text.

### Dark theme (`.dark`)

Deep graphite surfaces (`#191E1B` page, `#222925` cards), chalk ink `#F3F1EB`, lightened Patina actions `#58A69D` with dark foreground `#141917`, sand `#2A322D`, muted text `#A2AAA4`, accent `#2F3A34`/`#83A49E`, borders chalk/12%. `--cta-band` becomes a deep graphite panel `#262E29`; `--hero` is the darkest surface (`#141917`); glass tints to graphite with a chalk edge.

### Charts

`--chart-1…5`: Patina, Graphite, light Patina, Limestone, moss — used by the admin stats UI.

## Themes & dark mode

Two independent axes, both applied as classes on `<html>`:

- **Mode** — `dark` (managed by `next-themes`; `ThemeProvider` in `src/components/common/theme-provider.tsx`). Light/dark/system, persisted in `localStorage` (`archiplan-theme-mode`).
- **Color scheme** — `scheme-{id}` (`scheme-ocean`, `scheme-forest`, `scheme-violet`, `scheme-rose`; no class = **Patina**, the default). Persisted as `archiplan-theme-scheme`. Each scheme has a light block and a `.scheme-{id}.dark` block in `globals.css` (higher specificity than `.dark`) so every scheme works in both modes. Schemes swap only brand hues — `primary`, `ring`, `accent`, `chart-1`, and the `sidebar-*` brand tokens. Surfaces, borders, `--cta`, `--cta-band`, `--glass*` and `--hero` stay constant.

Schemes are declared in `THEME_SCHEMES` (`src/config/constants.ts`) with swatch pairs for the UI. The palette is restored pre-hydration by an inline script in the root layout (no flash); `useTheme()` (`src/hooks/theme/use-theme.ts`) is the four-key hook for mode + scheme; the switcher UI is `theme-switcher.tsx` (navbar, client shell, admin sidebar).

## Typography

Brand pairing: **DM Serif Display + Inter** — "editorial warmth for ideas, precision for everything else."

- **Display:** **DM Serif Display** (400 normal + italic, self-hosted via `next/font/google` → `--font-serif`, utility `font-display`) for **every** marketing `h1`/`h2`, card titles, the wordmark and closing-band headings. Italic carries accent headline lines. Never add `font-semibold` to serif headings — the face has one weight.
- **Body / UI:** **Inter** (variable, self-hosted → `--font-sans`) for body, nav, tables, forms and dashboards.
- **Mono:** Geist Mono for identifiers (order numbers) and `01`/`02` step numerals only.
- **Labels / eyebrows:** Inter Semibold 11/16, uppercase, tracked — `text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground` (`text-hero-accent` on Graphite bands).
- Scale (brand reference in parentheses): hero `text-4xl → lg:text-7xl leading-[1.05]` (88/95); page titles `text-4xl md:text-5xl` (48/52); section titles `text-3xl md:text-4xl`; card titles `font-display text-xl/2xl`; body `text-base`/`text-sm` (16/24).

## Spacing & radius

- `--radius: 0.375rem` drives `rounded-lg/xl/2xl…` — cards and controls stay crisp; **glass surfaces use `rounded-[20px]`** per the brand recipe.
- Sections: `py-16 md:py-24`; card grids `gap-6`; hairline grids `gap-x-8 gap-y-8`.
- Containers: `mx-auto w-full max-w-6xl px-4`.
- **Hairlines over shadows:** section rules are `border-t`/`border-y`; list and grid items are `border-t pt-4`. Shadows only lift glass and overlay panels.

## Glass recipe (brand §03 Digital expression)

Use glass for **floating navigation, image captions and a single featured panel**. Tables, forms and long text stay on opaque surfaces.

| Property | Value |
|----------|-------|
| Tint | 85% paper (`bg-glass/85`) |
| Blur | 18px (`backdrop-blur-[18px]`) |
| Edge | 1px luminous (`border border-glass-edge`) |
| Radius | 20px (`rounded-[20px]`) |
| Shadow | soft (`shadow-glass`) |

Implemented in `navbar.tsx` (floating bar) and the home hero's featured-package panel. Tokens: `--glass`, `--glass-edge`, `--glass-shadow`.

## Brand mark

The supplied brick **A** keeps its light field and original proportions — no redraws, gradients or distortion. Assets live in `public/logo/` (variants `Group 1…8.svg`, circular `favicon.svg`); the canonical web mark is `public/logo/mark.svg` (A on its white field, `#131413`), rendered by `common/logo.tsx` through `next/image` (`unoptimized` — it is an SVG) at 28px with the wordmark in DM Serif Display. The browser icon is `src/app/icon.svg` (Next's icon convention) from the supplied `favicon.svg`. Used by the navbar, footer, client shell and admin shell.

## Component conventions

- **Icons:** `lucide-react` only.
- **Buttons:** shadcn/Base-UI `Button`. For links use `render={<Link href={…} />}` — the shared `Button` sets `nativeButton={false}` automatically for non-button renders. Default buttons are Patina (`bg-primary`); `bg-cta` (pressed shadow) is reserved for the hero and closing-band CTAs.
- **Selected card state:** `border-primary ring-1 ring-primary/40` + a `Badge` (see `order-form-step-package.tsx`).
- **Status badge:** `order-status-badge.tsx` maps statuses to badge variants — do not improvise colors per status.
- **Images:** real renders live in `public/images/`; any section that needs a photo we do not have yet uses `PLACEHOLDER_IMAGE` (`https://placehold.net/400x400.png`, allowed in `next.config.ts` `images.remotePatterns`). Decorative photos get `alt=""` + `aria-hidden`; meaningful ones get copy from `src/content/*`.
- Every list: loading skeleton + empty state; every form: inline validation + pending state. Mobile first — verify at 375px. Touch targets ≥ 44px (`min-h-11` on inline links/chips).
