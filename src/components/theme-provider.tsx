"use client"

import * as React from "react"

// ---------------------------------------------------------------------------
// Theme contract — single source of truth.
// Keep STORAGE_KEY and THEME_COLORS aligned with the pre-hydration bootstrap
// so the inline script and the React side stay in sync.
// ---------------------------------------------------------------------------

export type Theme = "light" | "dark"

export const THEME_STORAGE_KEY = "theme"

export const THEME_META_COLORS: Record<Theme, string> = {
  light: "#2b5a4b",
  dark: "#0d1515",
}

const DARK_CLASS = "dark"
export const THEME_COLOR_SELECTOR = 'meta[name="theme-color"]'
const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)"

// ---------------------------------------------------------------------------
// SSR-safe helper — exported so tests can drive the same code path.
// Browser-only: returns the persisted preference when valid, otherwise falls
// back to `prefers-color-scheme: dark`, then to "light". We deliberately
// validate the storage value (not just "is it truthy?") so future versions
// that store other values won't accidentally resolve to dark/light.
// ---------------------------------------------------------------------------

export function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "light"
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === "light" || stored === "dark") return stored
  } catch {
    // localStorage can throw in private modes / Safari strict mode.
  }
  try {
    if (window.matchMedia?.(SYSTEM_DARK_QUERY).matches) return "dark"
  } catch {
    // matchMedia can be unavailable on very old runtimes.
  }
  return "light"
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  root.classList.toggle(DARK_CLASS, theme === "dark")
  const meta = document.querySelector(THEME_COLOR_SELECTOR)
  if (meta instanceof HTMLMetaElement) {
    meta.setAttribute("content", THEME_META_COLORS[theme])
  }
}

// ---------------------------------------------------------------------------
// Pre-hydration bootstrap — runs synchronously in <head> before first paint
// to avoid flash-of-light-theme on dark users in static exports.
// Kept as a string (not injected via next/script) so it executes before React
// hydration. Exports share the same constants above, so the storage key and
// meta-color values can't drift between script and component.
// ---------------------------------------------------------------------------

export const themePreHydrationScript = `(()=>{try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="dark"){document.documentElement.classList.add(${JSON.stringify(
  DARK_CLASS,
)});var m=document.querySelector(${JSON.stringify(
  THEME_COLOR_SELECTOR,
)});if(m)m.setAttribute("content",${JSON.stringify(THEME_META_COLORS.dark)})}}catch(e){}})()`

// ---------------------------------------------------------------------------
// React context + provider.
// ---------------------------------------------------------------------------

type ThemeContextValue = {
  theme: Theme
  setTheme: (next: Theme) => void
  toggle: () => void
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Render a stable "light" default during server render and the very first
  // client paint. The pre-hydration bootstrap already set the DOM class, and
  // `suppressHydrationWarning` on <html> keeps React quiet about it. We
  // reconcile the context value on mount so React state and DOM agree.
  const [theme, setThemeState] = React.useState<Theme>("light")

  React.useEffect(() => {
    // Two cases on mount:
    //   1. Pre-hydration bootstrap matched storage ("dark") and already
    //      mutated <html> + meta — applyTheme is a no-op there.
    //   2. Storage was empty but system prefers dark (cold first visit):
    //      the bootstrap didn't run because it only acts on the explicit
    //      `"dark"` string, so applyTheme is required to converge DOM and
    //      React state. Without this call, the page stays light until the
    //      user toggles.
    const initial = readStoredTheme()
    setThemeState(initial)
    applyTheme(initial)
  }, [])

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Ignore quota / privacy-mode failures.
    }
    applyTheme(next)
  }, [])

  const toggle = React.useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark")
  }, [theme, setTheme])

  // Cross-tab sync — the existing `storage` event pattern already used by
  // dashboard.tsx and quran-completion-plan.tsx.
  React.useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return
      const next = event.newValue
      if (next !== "light" && next !== "dark") return
      setThemeState(next)
      applyTheme(next)
    }
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

  const value = React.useMemo(
    () => ({ theme, setTheme, toggle }),
    [theme, setTheme, toggle],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) {
    throw new Error("useTheme must be used within a <ThemeProvider>")
  }
  return ctx
}
