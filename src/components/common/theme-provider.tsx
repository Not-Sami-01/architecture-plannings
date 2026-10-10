"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";

import {
  THEME_SCHEMES,
  THEME_SCHEME_CLASSES,
  THEME_STORAGE_KEYS,
  type ThemeSchemeId,
} from "@/config/constants";

type ThemeContextValue = {
  scheme: ThemeSchemeId;
  setScheme: (scheme: ThemeSchemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  scheme: "default",
  setScheme: () => undefined,
});

/** Scheme id currently on <html>, validated against the known list. */
function currentScheme(): ThemeSchemeId {
  const classes = document.documentElement.classList;
  for (const scheme of THEME_SCHEMES) {
    if (scheme.id !== "default" && classes.contains(`scheme-${scheme.id}`)) {
      return scheme.id;
    }
  }
  return "default";
}

// Palette is a DOM-class store: the pre-hydration script owns the first
// value, setScheme mutates <html>, and subscribers re-read the class.
const paletteListeners = new Set<() => void>();

function subscribePalette(listener: () => void): () => void {
  paletteListeners.add(listener);
  return () => {
    paletteListeners.delete(listener);
  };
}

function emitPaletteChange(): void {
  paletteListeners.forEach((listener) => listener());
}

/**
 * Applies the palette class to <html> and persists it. Dark/light mode is
 * handled by next-themes (`.dark` class); the scheme class is ours.
 */
function PaletteController({ children }: { children: React.ReactNode }) {
  const scheme = useSyncExternalStore(
    subscribePalette,
    currentScheme,
    () => "default" as ThemeSchemeId,
  );

  const setScheme = useCallback((next: ThemeSchemeId) => {
    const classes = document.documentElement.classList;
    THEME_SCHEME_CLASSES.forEach((cls) => classes.remove(cls));
    if (next !== "default") classes.add(`scheme-${next}`);
    localStorage.setItem(THEME_STORAGE_KEYS.scheme, next);
    emitPaletteChange();
  }, []);

  return (
    <ThemeContext.Provider value={{ scheme, setScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Theme root: light/dark/system via next-themes (`dark` class) plus the
 * palette scheme (`scheme-{id}` class). The inline script in the root layout
 * re-applies the stored scheme before hydration to avoid a flash.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey={THEME_STORAGE_KEYS.mode}
    >
      <PaletteController>{children}</PaletteController>
    </NextThemesProvider>
  );
}

/** Re-exported so components use one import for the whole theme API. */
export { useNextTheme as useNextThemes };

export function useThemeContext(): ThemeContextValue {
  return useContext(ThemeContext);
}

/**
 * Pre-hydration script: restores the stored palette class on <html> before
 * React mounts (next-themes handles the `dark` class the same way).
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k=${JSON.stringify(
  THEME_STORAGE_KEYS.scheme,
)};var v=localStorage.getItem(k);var ok=${JSON.stringify(
  THEME_SCHEME_CLASSES.reduce<Record<string, true>>((acc, cls) => {
    acc[cls] = true;
    return acc;
  }, {}),
)};if(v&&v!=="default"&&ok["scheme-"+v]){document.documentElement.classList.add(
  "scheme-"+v,
);}}catch(e){}})();`;
