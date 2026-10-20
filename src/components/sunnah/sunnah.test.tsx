import * as React from "react"
import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { SunnahPage } from "./sunnah-page"
import { sunnahItems, normalizeArabic, SUNNAH_FAVS_KEY, categoryArabic } from "./sunnah-data"
import type { SunnahItem } from "./sunnah-data"

function cardById(id: string): HTMLElement {
    const card = document.querySelector(`[data-testid="sunnah-item"][data-id="${id}"]`)
    if (!card) throw new Error(`Card not found: ${id}`)
    return card as HTMLElement
}

describe("sunnah dataset", () => {
    it("has at least 20 items with valid unique ids", () => {
        expect(sunnahItems.length).toBeGreaterThanOrEqual(20)
        const ids = sunnahItems.map((item) => item.id)
        expect(new Set(ids).size).toBe(ids.length)
        for (const id of ids) {
            expect(id).toMatch(/^sunnah-[a-z-]+$/)
        }
    })

    it("populates all 5 categories with complete content", () => {
        const categories: SunnahItem["category"][] = ["prayer", "wudu", "sleep", "food", "daily"]
        for (const category of categories) {
            const items = sunnahItems.filter((item) => item.category === category)
            expect(items.length).toBeGreaterThan(0)
        }
        for (const item of sunnahItems) {
            expect(item.categoryAr).toBe(categoryArabic[item.category])
            expect(item.title.trim()).not.toBe("")
            expect(item.hadith.trim()).not.toBe("")
            expect(item.source.trim()).not.toBe("")
            expect(item.action.trim()).not.toBe("")
        }
    })
})

describe("SunnahPage", () => {
    beforeEach(() => {
        localStorage.clear()
        vi.restoreAllMocks()
    })

    it("renders the header hadith and all category filter buttons with counts", () => {
        render(<SunnahPage />)

        expect(screen.getByText(/مَنْ سَنَّ فِي الْإِسْلَامِ سُنَّةً حَسَنَةً/)).toBeInTheDocument()
        expect(screen.getByText("صحيح مسلم: 1017")).toBeInTheDocument()

        for (const key of ["all", "prayer", "wudu", "sleep", "food", "daily", "favs"] as const) {
            expect(screen.getByTestId(`sunnah-filter-${key}`)).toBeInTheDocument()
        }
        expect(screen.getByTestId("sunnah-count-all")).toHaveTextContent(String(sunnahItems.length))
    })

    it("filters items accurately by category", () => {
        render(<SunnahPage />)

        expect(screen.getAllByTestId("sunnah-item")).toHaveLength(sunnahItems.length)

        const prayerCount = sunnahItems.filter((item) => item.category === "prayer").length
        fireEvent.click(screen.getByTestId("sunnah-filter-prayer"))
        let cards = screen.getAllByTestId("sunnah-item")
        expect(cards).toHaveLength(prayerCount)
        expect(cards.every((card) => card.getAttribute("data-category") === "prayer")).toBe(true)

        const sleepCount = sunnahItems.filter((item) => item.category === "sleep").length
        fireEvent.click(screen.getByTestId("sunnah-filter-sleep"))
        cards = screen.getAllByTestId("sunnah-item")
        expect(cards).toHaveLength(sleepCount)
        expect(cards.every((card) => card.getAttribute("data-category") === "sleep")).toBe(true)

        fireEvent.click(screen.getByTestId("sunnah-filter-all"))
        expect(screen.getAllByTestId("sunnah-item")).toHaveLength(sunnahItems.length)
    })

    it("searches by title and hadith text with or without diacritics", () => {
        render(<SunnahPage />)
        const search = screen.getByTestId("sunnah-search")

        // Search with full tashkeel matches
        fireEvent.change(search, { target: { value: "الضَّحْىٰ" } })
        expect(screen.getAllByTestId("sunnah-item").length).toBeGreaterThan(0)
        expect(cardById("sunnah-prayer-duha")).toBeInTheDocument()

        // Same search without diacritics still matches
        fireEvent.change(search, { target: { value: "الضحى" } })
        expect(cardById("sunnah-prayer-duha")).toBeInTheDocument()

        // Search by hadith text without diacritics
        fireEvent.change(search, { target: { value: "الدعوه" } })
        expect(cardById("sunnah-prayer-dua-between-adhan-iqama")).toBeInTheDocument()
        expect(screen.getAllByTestId("sunnah-item").length).toBeLessThan(sunnahItems.length)

        // No results shows empty state
        fireEvent.change(search, { target: { value: "غير موجود إطلاقا" } })
        expect(screen.getByTestId("sunnah-empty")).toBeInTheDocument()
    })

    it("toggles favorites and updates the favorites filter", () => {
        render(<SunnahPage />)

        const favButton = within(cardById("sunnah-prayer-duha")).getByTestId("sunnah-fav-btn")
        fireEvent.click(favButton)

        // Persisted to localStorage
        expect(JSON.parse(localStorage.getItem(SUNNAH_FAVS_KEY) ?? "[]")).toEqual(["sunnah-prayer-duha"])
        // Favorites badge count updates
        expect(screen.getByTestId("sunnah-count-favs")).toHaveTextContent("1")
        // Button reflects pressed state
        expect(within(cardById("sunnah-prayer-duha")).getByTestId("sunnah-fav-btn")).toHaveAttribute("aria-pressed", "true")

        // Favorites tab shows only the favorited item
        fireEvent.click(screen.getByTestId("sunnah-filter-favs"))
        const cards = screen.getAllByTestId("sunnah-item")
        expect(cards).toHaveLength(1)
        expect(cards[0].getAttribute("data-id")).toBe("sunnah-prayer-duha")

        // Un-toggle from the favorites tab removes it and shows empty state
        fireEvent.click(within(cardById("sunnah-prayer-duha")).getByTestId("sunnah-fav-btn"))
        expect(screen.getByTestId("sunnah-empty")).toBeInTheDocument()
        expect(screen.getByTestId("sunnah-count-favs")).toHaveTextContent("0")
    })

    it("copies title, action, hadith and source to clipboard", async () => {
        const writeText = vi.fn().mockResolvedValue(undefined)
        Object.assign(navigator, { clipboard: { writeText } })

        render(<SunnahPage />)
        const item = sunnahItems.find((entry) => entry.id === "sunnah-food-bismillah-right")!
        await act(async () => {
            fireEvent.click(within(cardById(item.id)).getByTestId("sunnah-copy-btn"))
        })

        await vi.waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
        const copied = writeText.mock.calls[0][0] as string
        expect(copied).toContain(item.title)
        expect(copied).toContain(item.hadith)
        expect(copied).toContain(item.action)
        expect(copied).toContain(item.source)
    })

    it("falls back to clipboard when navigator.share is unavailable", async () => {
        const writeText = vi.fn().mockResolvedValue(undefined)
        Object.assign(navigator, { clipboard: { writeText } })
        if (typeof navigator.share === "function") {
            vi.spyOn(navigator, "share").mockRejectedValue(new Error("cancelled"))
        }

        render(<SunnahPage />)
        const item = sunnahItems.find((entry) => entry.id === "sunnah-daily-salam")!
        await act(async () => {
            fireEvent.click(within(cardById(item.id)).getByTestId("sunnah-share-btn"))
        })

        await vi.waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
        expect(writeText.mock.calls[0][0]).toContain(item.title)
    })

    it("calls onBack when the back button is pressed", () => {
        const onBack = vi.fn()
        render(<SunnahPage onBack={onBack} />)

        fireEvent.click(screen.getByRole("button", { name: /رجوع للمكتبة/ }))
        expect(onBack).toHaveBeenCalledTimes(1)
    })
})
