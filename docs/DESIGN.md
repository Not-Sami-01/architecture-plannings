# Design System — ArchiPlan Studio

Design tokens and UI rules for the app. Tokens live in `src/app/globals.css`; fixed strings (names, routes, labels) live in `src/config/constants.ts`.

## Color palette

Theme: **warm paper + blueprint navy + terracotta CTA** — an architectural drafting-desk feel. Tokens live in `src/app/globals.css` (hex below is the source of truth); never hard-code hex in components — use Tailwind token classes (`bg-primary`, `text-cta`, `border-border`, …).

### Light theme (`:root`)

| Token | Value | Use |
|-------|-------|-----|
| `--background` | `#FBF8F2` | Paper — page background, text on navy bands |
| `--foreground` | `#1F2A3D` | Ink — headings and body text |
| `--card` / `--popover` | `#FFFFFF` | Cards, chips, dialogs |
| `--primary` | `#24467A` | Blueprint navy — logo, links, default buttons, closing band, selected states |
| `--primary-foreground` | `#FBF8F2` | Paper text on navy |
| `--secondary` / `--muted` | `#F1ECE2` | Sand — alternate section backgrounds (process, plot size, FAQ), footer, admin sidebar |
| `--muted-foreground` | `#4A566B` | Secondary text — descriptions, subtext (micro-notes like "Under 5 minutes" may render at `text-muted-foreground/85` ≈ `#5A6578`) |
| `--accent` | `#F7E9E0` | Pale terracotta — chip fills, active select rows |
| `--accent-foreground` | `#A94A27` | Terracotta — uppercase eyebrow labels |
| `--border` / `--input` | `#E3DBCB` | Hairlines, card borders, input outlines |
| `--ring` | `#24467A` | Focus rings (navy) |
| `--destructive` | `oklch(0.577 0.245 27.325)` | Errors, cancelled status |
| `--cta` | `#A94A27` | Terracotta CTA — **hero and closing-band buttons only** (one clear action per screen) |
| `--cta-foreground` | `#FFFFFF` | CTA label — white on `#A94A27` is 5.7:1 (AA) |
| `--cta-shadow` | `#7B3419` | Pressed-key shadow under CTAs: `shadow-[0_3px_0_0_var(--cta-shadow)]` + `active:translate-y-[3px] active:shadow-none` |
| `--hero` | `#1B2A4A` | Cinematic hero surface — deep navy, stays dark in both themes |
| `--hero-ink` | `#FBF8F2` | Text on the hero banner |
| `--hero-accent` | `#E5A67E` | Warm glow accent on the hero (italic headline line, step icons) |

**Navy tints:** `bg-primary/10` = step-number and icon chips; `bg-primary/5` + `border-primary` = selected package card; `text-primary/70` = supporting navy text.

### Dark theme (`.dark`)

Deep slate-blue surfaces (`0.17–0.26` lightness, hue 255), off-white ink, brighter navy primary (`oklch(0.68 0.12 255)`) for contrast, terracotta accent deepened (`oklch(0.32 0.05 45)` with light foreground). `--cta` brightens to `#BC5A35` so white CTA text stays AA on dark surfaces.

### Charts

`--chart-1…5`: navy, terracotta, teal, sand, plum — used by future stats UI.

## Themes & dark mode

Two independent axes, both applied as classes on `<html>`:

- **Mode** — `dark` (managed by `next-themes`; `ThemeProvider` in `src/components/common/theme-provider.tsx`). Light/dark/system, persisted in `localStorage` (`archiplan-theme-mode`).
- **Color scheme** — `scheme-{id}` (`scheme-ocean`, `scheme-forest`, `scheme-violet`, `scheme-rose`; no class = **Blueprint**, the default). Persisted as `archiplan-theme-scheme`. Each scheme has a light block and a `.scheme-{id}.dark` block in `globals.css` (higher specificity than `.dark`) so every scheme works in both modes. Schemes swap only brand hues — `primary`, `ring`, `accent`, `chart-1`, and the `sidebar-*` brand tokens. Surfaces, borders, `--cta` (terracotta) and `--hero` stay constant.

Schemes are declared in `THEME_SCHEMES` (`src/config/constants.ts`) with swatch pairs for the UI. The palette is restored pre-hydration by an inline script in the root layout (no flash); `useTheme()` (`src/hooks/theme/use-theme.ts`) is the four-key hook for mode + scheme; the switcher UI is `theme-switcher.tsx` (navbar, client shell, admin sidebar).

## Typography

- **Sans:** Geist Sans (`geist/font/sans`, self-hosted in `src/app/layout.tsx`) for everything.
- **Display:** editorial serif (`--font-display`: `ui-serif, "Iowan Old Style", Georgia…`) for hero and banner headlines only — large `font-display` headings with an italic accent line.
- **Mono:** Geist Mono for identifiers (order numbers) when needed.
- Scale: page titles `text-3xl md:text-4xl font-semibold tracking-tight`; section titles `text-2xl font-semibold tracking-tight`; card titles `font-medium`; body `text-sm`.

## Spacing & radius

- `--radius: 0.625rem` drives `rounded-lg/xl/2xl…` scale.
- Sections: `py-16` (page rhythm), `gap-6` card grids, `gap-4` dense lists.
- Containers: `mx-auto w-full max-w-6xl px-4`.

## Component conventions

- **Icons:** `lucide-react` only. Standard icon chip: `flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary`.
- **Buttons:** shadcn/Base-UI `Button`. For links use `render={<Link href={…} />}` — the shared `Button` sets `nativeButton={false}` automatically for non-button renders. Default buttons are navy (`bg-primary`); terracotta (`bg-cta` + pressed shadow) is reserved for the hero and closing-band CTAs.
- **Selected card state:** `border-primary bg-primary/5 ring-2 ring-primary/40` + `BadgeCheckIcon` (see `order-form-step-package.tsx`).
- **Status badge:** `order-status-badge.tsx` maps statuses to badge variants — do not improvise colors per status.
- Every list: loading skeleton + empty state; every form: inline validation + pending state. Mobile first — verify at 375px.
