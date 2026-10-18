import { describe, it, expect, vi, beforeEach } from "vitest"
import { shareTextAsImage } from "./share-image"

describe("shareTextAsImage Luxury Islamic Design", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    if (typeof URL.createObjectURL === "undefined") {
      URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url")
    }
    if (typeof URL.revokeObjectURL === "undefined") {
      URL.revokeObjectURL = vi.fn()
    }
  })

  it("handles canvas generation and download fallback when navigator.share is absent", async () => {
    // Mock canvas methods
    const mockContext = {
      direction: "rtl",
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      font: "",
      textAlign: "right",
      shadowColor: "",
      shadowBlur: 0,
      shadowOffsetY: 0,
      createRadialGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
      createLinearGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 100 }),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
    }

    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockContext),
      toBlob: vi.fn((cb) => cb(new Blob(["test-image"], { type: "image/png" }))),
    }

    const origCreateElement = document.createElement.bind(document)
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "canvas") return mockCanvas as unknown as HTMLElement
      return origCreateElement(tagName)
    })

    const result = await shareTextAsImage({
      title: "أدعية من القرآن الكريم",
      text: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
      source: "سورة البقرة: 201",
      filename: "test-dua.png",
    })

    expect(result).toBe("downloaded")
    expect(mockCanvas.width).toBe(1080)
    expect(mockCanvas.height).toBe(1350)
    expect(mockContext.createRadialGradient).toHaveBeenCalled()
    expect(mockContext.fillText).toHaveBeenCalled()
  })

  it("calls navigator.share when available and supported", async () => {
    const mockContext = {
      direction: "rtl",
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      font: "",
      textAlign: "right",
      shadowColor: "",
      shadowBlur: 0,
      shadowOffsetY: 0,
      createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
      createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 100 }),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
    }

    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockContext),
      toBlob: vi.fn((cb) => cb(new Blob(["test-image"], { type: "image/png" }))),
    }

    const origCreateElement2 = document.createElement.bind(document)
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "canvas") return mockCanvas as unknown as HTMLElement
      return origCreateElement2(tagName)
    })

    const shareMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "share", {
      value: shareMock,
      configurable: true,
      writable: true,
    })
    Object.defineProperty(navigator, "canShare", {
      value: vi.fn().mockReturnValue(true),
      configurable: true,
      writable: true,
    })

    const result = await shareTextAsImage({
      title: "أدعية نبوية",
      text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالآخِرَةِ",
      source: "سنن أبي داود",
    })

    expect(result).toBe("shared")
    expect(shareMock).toHaveBeenCalled()
  })
})
