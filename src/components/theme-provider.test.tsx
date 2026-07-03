import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, act, fireEvent, waitFor } from "@testing-library/react"
import * as React from "react"
import {
  ThemeProvider,
  useTheme,
  THEME_STORAGE_KEY,
  THEME_META_COLORS,
  THEME_COLOR_SELECTOR,
  readStoredTheme,
  themePreHydrationScript,
} from "./theme-provider"
import { ThemeToggle } from "./theme-toggle"

function Probe() {
  const { theme, toggle, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button data-testid="toggle" onClick={toggle}>
        toggle
      </button>
      <button data-testid="set-dark" onClick={() => setTheme("dark")}>
        dark
      </button>
      <button data-testid="set-light" onClick={() => setTheme("light")}>
        light
      </button>
    </div>
  )
}

function renderWithProvider() {
  return render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ""
  // jsdom doesn't ship a <meta name="theme-color"> tag — make sure one
  // exists so applyTheme() can mutate it. layout.tsx renders this tag, so
  // this mirrors real production DOM.
  let meta = document.querySelector('meta[name="theme-color"]')
  if (!(meta instanceof HTMLMetaElement)) {
    meta = document.createElement("meta")
    meta.setAttribute("name", "theme-color")
    document.head.appendChild(meta)
  }
  meta.setAttribute("content", THEME_META_COLORS.light)
})

describe("ThemeProvider", () => {
  it("defaults to light when localStorage is empty and system prefers light", async () => {
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: false,
      media: q,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as typeof window.matchMedia

    renderWithProvider()
    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("light")
    })
  })

  it("defaults to dark when system prefers dark and localStorage is empty", async () => {
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: q === "(prefers-color-scheme: dark)",
      media: q,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as typeof window.matchMedia

    renderWithProvider()
    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("dark")
    })
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("honours a persisted preference from localStorage on mount", async () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark")
    renderWithProvider()
    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("dark")
    })
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    const meta = document.querySelector('meta[name="theme-color"]')
    expect(meta?.getAttribute("content")).toBe(THEME_META_COLORS.dark)
  })

  it("toggle persists to localStorage and updates DOM class + meta tag", async () => {
    renderWithProvider()
    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("light")
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId("toggle"))
    })

    expect(screen.getByTestId("theme").textContent).toBe("dark")
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    const meta = document.querySelector('meta[name="theme-color"]')
    expect(meta?.getAttribute("content")).toBe(THEME_META_COLORS.dark)

    await act(async () => {
      fireEvent.click(screen.getByTestId("toggle"))
    })

    expect(screen.getByTestId("theme").textContent).toBe("light")
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light")
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    expect(meta?.getAttribute("content")).toBe(THEME_META_COLORS.light)
  })

  it("setTheme writes the exact theme value requested", async () => {
    renderWithProvider()
    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("light")
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId("set-dark"))
    })
    expect(screen.getByTestId("theme").textContent).toBe("dark")
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark")

    await act(async () => {
      fireEvent.click(screen.getByTestId("set-light"))
    })
    expect(screen.getByTestId("theme").textContent).toBe("light")
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light")
  })

  it("syncs across tabs on the storage event", async () => {
    renderWithProvider()
    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("light")
    })

    await act(async () => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: THEME_STORAGE_KEY,
          newValue: "dark",
          oldValue: "light",
          storageArea: window.localStorage,
        }),
      )
    })
    expect(screen.getByTestId("theme").textContent).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("ignores storage events for unrelated keys", async () => {
    renderWithProvider()
    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("light")
    })

    await act(async () => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "something-else",
          newValue: "dark",
          storageArea: window.localStorage,
        }),
      )
    })
    expect(screen.getByTestId("theme").textContent).toBe("light")
  })

  it("ignores storage events with invalid theme values", async () => {
    renderWithProvider()
    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("light")
    })

    await act(async () => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: THEME_STORAGE_KEY,
          newValue: "turquoise",
          storageArea: window.localStorage,
        }),
      )
    })
    expect(screen.getByTestId("theme").textContent).toBe("light")
  })
})

describe("readStoredTheme", () => {
  it("returns the stored value when valid", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark")
    expect(readStoredTheme()).toBe("dark")
    localStorage.setItem(THEME_STORAGE_KEY, "light")
    expect(readStoredTheme()).toBe("light")
  })

  it("falls back to system preference when storage is empty", () => {
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: q === "(prefers-color-scheme: dark)",
      media: q,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as typeof window.matchMedia
    expect(readStoredTheme()).toBe("dark")
  })

  it("ignores stale or unknown storage values", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "auto")
    expect(readStoredTheme()).toBe("light")
  })
})

describe("themePreHydrationScript", () => {
  it("references the same storage key / class / meta selector as the React side", () => {
    // Storage key + dark class + meta selector must all appear in the same
    // stringified form the React side uses; otherwise the inline script and
    // the context provider can silently diverge.
    expect(themePreHydrationScript).toContain(JSON.stringify(THEME_STORAGE_KEY))
    expect(themePreHydrationScript).toContain(JSON.stringify("dark"))
    expect(themePreHydrationScript).toContain(JSON.stringify(THEME_COLOR_SELECTOR))
    expect(themePreHydrationScript).toContain(JSON.stringify(THEME_META_COLORS.dark))
    // The script adds the class only when storage holds "dark" — never toggles.
    expect(themePreHydrationScript).toContain('localStorage.getItem')
    expect(themePreHydrationScript).not.toContain("toggle")
  })
})

describe("useTheme outside provider", () => {
  it("throws a helpful error", () => {
    // Silence the expected React error log so the test runner stays clean.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    function Naked() {
      useTheme()
      return null
    }
    expect(() => render(<Naked />)).toThrow(/ThemeProvider/)
    spy.mockRestore()
  })
})

describe("ThemeToggle", () => {
  // jsdom + @testing-library flushes useEffect synchronously inside render(),
  // so there is no observable pre-mount DOM to assert against. We only pin
  // the post-mount contract — the hydration-safe label and the click action.

  it("announces the accurate action after mount when stored=dark", async () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark")
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    await screen.findByRole("button", { name: "تبديل إلى الوضع النهاري" })
  })

  it("announces the accurate action after mount when stored=light", async () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light")
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    await screen.findByRole("button", { name: "تبديل إلى الوضع الليلي" })
  })

  it("falls back to the system preference in its announcement", async () => {
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: q === "(prefers-color-scheme: dark)",
      media: q,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as typeof window.matchMedia
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    await screen.findByRole("button", { name: "تبديل إلى الوضع النهاري" })
  })

  it("clicking the button toggles theme and persists it", async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )

    const button = await screen.findByRole("button", {
      name: "تبديل إلى الوضع الليلي",
    })
    await act(async () => {
      fireEvent.click(button)
    })
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })
})
