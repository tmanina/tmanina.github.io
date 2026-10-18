import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import React from "react"
import { LivePlayer } from "./live-player"

describe("LivePlayer Component", () => {
    it("renders the live stream header and active stream title", () => {
        render(<LivePlayer />)
        expect(screen.getByText("بث مباشر الحرم المكي الشريف")).toBeInTheDocument()
        expect(screen.getByText("مباشر الآن 24/7")).toBeInTheDocument()
        expect(screen.getByText("الحرم المكي الشريف (مكة المكرمة)")).toBeInTheDocument()
    })

    it("renders iframe with the active official Makkah video ID", () => {
        render(<LivePlayer />)
        const iframe = screen.getByTitle("الحرم المكي الشريف (مكة المكرمة)")
        expect(iframe).toBeInTheDocument()
        expect(iframe.getAttribute("src")).toContain("Hr7uPQSmHzM")
    })

    it("switches stream when alternative channel button is clicked", () => {
        render(<LivePlayer />)
        const altButton = screen.getByText("المسجد النبوي الشريف (المدينة المنورة)")
        fireEvent.click(altButton)

        const iframe = screen.getByTitle("المسجد النبوي الشريف (المدينة المنورة)")
        expect(iframe).toBeInTheDocument()
        expect(iframe.getAttribute("src")).toContain("lQBg27EEjNE")
    })

    it("renders back button and triggers onBack callback", () => {
        const onBackMock = vi.fn()
        render(<LivePlayer onBack={onBackMock} />)

        const backButton = screen.getByText("العودة إلى المكتبة")
        expect(backButton).toBeInTheDocument()
        fireEvent.click(backButton)
        expect(onBackMock).toHaveBeenCalledTimes(1)
    })
})
