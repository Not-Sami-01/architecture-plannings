"use client";

import { MoonIcon, SunIcon, MonitorIcon } from "lucide-react";

import { THEME_MODES, THEME_SCHEMES } from "@/config/constants";
import type { ThemeMode, ThemeSchemeId } from "@/config/constants";
import { useTheme } from "@/hooks/theme/use-theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MODE_OPTIONS: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { value: THEME_MODES.light, label: "Light", icon: <SunIcon className="size-4" aria-hidden /> },
  { value: THEME_MODES.dark, label: "Dark", icon: <MoonIcon className="size-4" aria-hidden /> },
  { value: THEME_MODES.system, label: "System", icon: <MonitorIcon className="size-4" aria-hidden /> },
];

/** Two-dot swatch previewing a scheme's light (and current-mode) colors. */
function SchemeSwatch({ id, active }: { id: ThemeSchemeId; active: boolean }) {
  const { data } = useTheme();
  const scheme = THEME_SCHEMES.find((entry) => entry.id === id);
  if (!scheme) return null;
  const [primary, accent] =
    data.resolved === "dark" ? scheme.darkSwatch : scheme.lightSwatch;
  return (
    <span
      aria-hidden
      className="inline-flex items-center"
      style={{ opacity: active ? 1 : 0.85 }}
    >
      <span
        className="size-3.5 rounded-full ring-1 ring-foreground/10"
        style={{ backgroundColor: primary }}
      />
      <span
        className="-ml-1.5 size-3.5 rounded-full ring-1 ring-foreground/10"
        style={{ backgroundColor: accent }}
      />
    </span>
  );
}

/**
 * Appearance menu: light/dark/system + color schemes. The scheme is a class
 * on <html> (`scheme-{id}`) with a matching dark variant (`.scheme-{id}.dark`).
 */
export function ThemeSwitcher() {
  const { data, actions } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Theme and color scheme"
          />
        }
      >
        <SunIcon className="size-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" aria-hidden />
        <MoonIcon className="absolute size-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Mode</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={data.mode}
          onValueChange={(value) => actions.setMode(value as ThemeMode)}
        >
          {MODE_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              <span className="flex items-center gap-2">
                {option.icon}
                {option.label}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Color scheme</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={data.scheme}
          onValueChange={(value) => actions.setScheme(value as ThemeSchemeId)}
        >
          {THEME_SCHEMES.map((scheme) => (
            <DropdownMenuRadioItem key={scheme.id} value={scheme.id}>
              <span className="flex items-center gap-2">
                <SchemeSwatch id={scheme.id} active={data.scheme === scheme.id} />
                {scheme.label}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
