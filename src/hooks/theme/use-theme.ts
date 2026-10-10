"use client";

import { useTheme as useNextThemes } from "next-themes";

import type { ThemeMode, ThemeSchemeId } from "@/config/constants";

import { useThemeContext } from "@/components/common/theme-provider";

/**
 * Combined theme state: light/dark/system (next-themes) + palette scheme.
 * Follows the four-key hook shape from RULES.md for consistency, though
 * theme state is local (localStorage), not server state.
 */
export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextThemes();
  const { scheme, setScheme } = useThemeContext();

  return {
    data: {
      mode: (theme ?? "system") as ThemeMode,
      resolved: resolvedTheme === "dark" ? "dark" : "light",
      scheme,
    },
    loadings: {},
    actions: {
      setMode: (mode: ThemeMode) => setTheme(mode),
      setScheme: (next: ThemeSchemeId) => setScheme(next),
    },
    query: {},
  };
}
