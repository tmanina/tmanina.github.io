import "@testing-library/jest-dom/vitest"
import { vi, afterEach } from "vitest"
import { cleanup } from "@testing-library/react"

// Cleanup after each test
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
})

// Mock matchMedia (used by BottomNav and others)
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn()
  root = null
  rootMargin = ""
  thresholds = []
}

if (!window.IntersectionObserver) {
  window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver
}

// Mock MediaMetadata (used by audio players)
if (!window.MediaMetadata) {
  window.MediaMetadata = vi.fn().mockImplementation(() => ({})) as unknown as typeof MediaMetadata
}

// Mock navigator.mediaSession
if (!navigator.mediaSession) {
  Object.defineProperty(navigator, "mediaSession", {
    value: {
      metadata: null,
      playbackState: "none",
      setActionHandler: vi.fn(),
    },
    writable: true,
  })
}
