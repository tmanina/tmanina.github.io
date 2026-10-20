import * as React from "react"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { RuqyahReader } from "./ruqyah-reader"
import { RuqyahPlayer } from "@/components/ruqyah-player"
import { RUQYAH_DUA_COUNT, RUQYAH_QURAN_COUNT, RUQYAH_TOTAL_COUNT } from "./ruqyah-data"

function cardById(id: string): HTMLElement {
    const card = document.querySelector(`[data-testid="ruqyah-item"][data-id="${id}"]`)
    if (!card) throw new Error(`Card not found: ${id}`)
    return card as HTMLElement
}

function counterFor(id: string): HTMLElement {
    return within(cardById(id)).getByTestId("ruqyah-counter")
}

function countTextFor(id: string): string {
    return within(cardById(id)).getByTestId("ruqyah-count").textContent ?? ""
}

function clickCounterTimes(id: string, times: number) {
    const button = counterFor(id)
    for (let i = 0; i < times; i += 1) {
        fireEvent.click(button)
    }
}

describe("RuqyahReader", () => {
    it("renders the dataset items with category and target badges", () => {
        render(<RuqyahReader />)

        const cards = screen.getAllByTestId("ruqyah-item")
        expect(cards).toHaveLength(RUQYAH_TOTAL_COUNT)
        expect(screen.getByText("سورة الفاتحة")).toBeInTheDocument()
        expect(screen.getByText("آية الكرسي - البقرة 255")).toBeInTheDocument()
        expect(screen.getByText("رقية جبريل للنبي ﷺ")).toBeInTheDocument()
        expect(cards.filter((card) => card.getAttribute("data-category") === "quran")).toHaveLength(
            RUQYAH_QURAN_COUNT
        )
        expect(cards.filter((card) => card.getAttribute("data-category") === "dua")).toHaveLength(RUQYAH_DUA_COUNT)
        expect(counterFor("quran-ayat-kursi")).toHaveTextContent("0 / 3")
    })

    it("increments the counter and clamps it at the target count", () => {
        render(<RuqyahReader />)

        clickCounterTimes("quran-ayat-kursi", 2)
        expect(countTextFor("quran-ayat-kursi")).toBe("2 / 3")

        clickCounterTimes("quran-ayat-kursi", 3)
        expect(countTextFor("quran-ayat-kursi")).toBe("3 / 3")
        expect(counterFor("quran-ayat-kursi")).toHaveTextContent("اكتمل")
    })

    it("filters items by category and by completed status", () => {
        render(<RuqyahReader />)

        fireEvent.click(screen.getByTestId("ruqyah-filter-quran"))
        let cards = screen.getAllByTestId("ruqyah-item")
        expect(cards).toHaveLength(RUQYAH_QURAN_COUNT)
        expect(cards.every((card) => card.getAttribute("data-category") === "quran")).toBe(true)

        fireEvent.click(screen.getByTestId("ruqyah-filter-dua"))
        cards = screen.getAllByTestId("ruqyah-item")
        expect(cards).toHaveLength(RUQYAH_DUA_COUNT)
        expect(cards.every((card) => card.getAttribute("data-category") === "dua")).toBe(true)

        fireEvent.click(screen.getByTestId("ruqyah-filter-all"))
        clickCounterTimes("dua-hifz-tahsin", 3)

        fireEvent.click(screen.getByTestId("ruqyah-filter-completed"))
        cards = screen.getAllByTestId("ruqyah-item")
        expect(cards).toHaveLength(1)
        expect(cards[0].getAttribute("data-id")).toBe("dua-hifz-tahsin")
        expect(screen.getByTestId("ruqyah-filter-completed")).toHaveTextContent("1")

        fireEvent.click(screen.getByTestId("ruqyah-filter-all"))
        expect(screen.getAllByTestId("ruqyah-item")).toHaveLength(RUQYAH_TOTAL_COUNT)
    })

    it("resets a single item counter back to zero", () => {
        render(<RuqyahReader />)

        const resetButton = within(cardById("quran-ayat-kursi")).getByTestId("ruqyah-reset-item")
        expect(resetButton).toBeDisabled()

        clickCounterTimes("quran-ayat-kursi", 2)
        expect(resetButton).toBeEnabled()
        fireEvent.click(resetButton)
        expect(countTextFor("quran-ayat-kursi")).toBe("0 / 3")
        expect(resetButton).toBeDisabled()
    })

    it("resets all counters and the global progress", () => {
        render(<RuqyahReader />)

        clickCounterTimes("quran-ayat-kursi", 3)
        clickCounterTimes("dua-karb", 1)
        expect(screen.getByTestId("ruqyah-progress-label")).toHaveTextContent("2 / 15 (13%)")

        fireEvent.click(screen.getByRole("button", { name: "إعادة ضبط الكل" }))

        expect(countTextFor("quran-ayat-kursi")).toBe("0 / 3")
        expect(countTextFor("dua-karb")).toBe("0 / 1")
        expect(screen.getByTestId("ruqyah-progress-label")).toHaveTextContent("0 / 15 (0%)")
    })

    it("changes the text size with the font controls", () => {
        render(<RuqyahReader />)

        const text = within(cardById("quran-fatiha")).getByTestId("ruqyah-text")
        expect(text).toHaveClass("text-xl")

        fireEvent.click(screen.getByRole("button", { name: "تكبير الخط" }))
        expect(text).toHaveClass("text-2xl")

        fireEvent.click(screen.getByRole("button", { name: "تصغير الخط" }))
        expect(text).toHaveClass("text-lg")
    })
})

describe("RuqyahPlayer tabs", () => {
    it("shows the written reader by default and switches to audio tracks", () => {
        const { container } = render(<RuqyahPlayer onBack={() => {}} />)

        expect(screen.getByTestId("ruqyah-reader")).toBeInTheDocument()
        expect(screen.queryByText("رقية شرعية - تحصين")).not.toBeInTheDocument()

        fireEvent.click(screen.getByRole("tab", { name: "استماع صوتي" }))

        expect(screen.queryByTestId("ruqyah-reader")).not.toBeInTheDocument()
        expect(screen.getByText("رقية شرعية - تحصين")).toBeInTheDocument()
        expect(screen.getAllByText("استماع للمقطع الصوتي")).toHaveLength(10)
        expect(container.querySelector("iframe")).toBeNull()
    })

    it("stops hidden audio when switching away from the audio tab", () => {
        const { container } = render(<RuqyahPlayer onBack={() => {}} />)

        fireEvent.click(screen.getByRole("tab", { name: "استماع صوتي" }))
        fireEvent.click(screen.getAllByText("استماع للمقطع الصوتي")[0])
        expect(container.querySelector("iframe")).not.toBeNull()

        fireEvent.click(screen.getByRole("tab", { name: "قراءة الرقية" }))
        expect(container.querySelector("iframe")).toBeNull()
        expect(screen.getByTestId("ruqyah-reader")).toBeInTheDocument()

        fireEvent.click(screen.getByRole("tab", { name: "استماع صوتي" }))
        expect(container.querySelector("iframe")).toBeNull()
        expect(screen.getAllByText("استماع للمقطع الصوتي")).toHaveLength(10)
    })
})
