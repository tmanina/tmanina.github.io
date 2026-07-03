import { describe, it, expect, vi, beforeEach } from "vitest"
import { getInitialRemaining, incrementDailyDhikr } from "./utils"
import type { AdhkarItem } from "./types"

// Mock toast-events to avoid dispatching real DOM events during tests
vi.mock("./toast-events", () => ({
  dispatchAdhkarToast: vi.fn(),
}))

describe("getInitialRemaining", () => {
  const mockAdhkar: AdhkarItem[] = [
    { zekr: "ذكر 1", repeat: 3, bless: "بركة 1" },
    { zekr: "ذكر 2", repeat: 10, bless: "بركة 2" },
    { zekr: "ذكر 3", repeat: 1, bless: "بركة 3" },
  ]

  it("creates remaining map with correct prefix", () => {
    const result = getInitialRemaining(mockAdhkar, "morning")
    expect(result["morning-0"]).toBe(3)
    expect(result["morning-1"]).toBe(10)
    expect(result["morning-2"]).toBe(1)
  })

  it("uses different prefix correctly", () => {
    const result = getInitialRemaining(mockAdhkar, "evening")
    expect(result["evening-0"]).toBe(3)
    expect(result["evening-2"]).toBe(1)
  })

  it("handles empty array", () => {
    const result = getInitialRemaining([], "test")
    expect(Object.keys(result).length).toBe(0)
  })

  it("handles single item", () => {
    const single: AdhkarItem[] = [{ zekr: "تسبيح", repeat: 33, bless: "" }]
    const result = getInitialRemaining(single, "prayer")
    expect(result["prayer-0"]).toBe(33)
  })
})

describe("incrementDailyDhikr", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("creates progress entry if none exists", () => {
    incrementDailyDhikr(1)
    const raw = localStorage.getItem("tmanina_progress")
    expect(raw).toBeTruthy()
    const data = JSON.parse(raw!)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dateKey = today.toISOString().slice(0, 10)
    expect(data.history[dateKey]).toBe(1)
  })

  it("increments existing count", () => {
    incrementDailyDhikr(5)
    incrementDailyDhikr(3)
    const raw = localStorage.getItem("tmanina_progress")
    const data = JSON.parse(raw!)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dateKey = today.toISOString().slice(0, 10)
    expect(data.history[dateKey]).toBe(8)
  })

  it("dispatches progress-updated event", () => {
    const handler = vi.fn()
    window.addEventListener("tmanina-progress-updated", handler)
    incrementDailyDhikr(1)
    expect(handler).toHaveBeenCalled()
    window.removeEventListener("tmanina-progress-updated", handler)
  })

  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem("tmanina_progress", "invalid-json")
    incrementDailyDhikr(1)
    const raw = localStorage.getItem("tmanina_progress")
    const data = JSON.parse(raw!)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dateKey = today.toISOString().slice(0, 10)
    expect(data.history[dateKey]).toBe(1)
  })
})
