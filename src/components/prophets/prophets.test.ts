import { describe, it, expect } from "vitest"
import { prophetsData, PROPHET_CATEGORIES } from "./prophets-data"

describe("Prophets Data and Module Integrity", () => {
  it("has a valid collection of prophets", () => {
    expect(prophetsData.length).toBeGreaterThanOrEqual(15)
  })

  it("ensures every prophet has unique id and order", () => {
    const ids = prophetsData.map((p) => p.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)

    const orders = prophetsData.map((p) => p.order)
    const uniqueOrders = new Set(orders)
    expect(uniqueOrders.size).toBe(orders.length)
  })

  it("ensures all prophets have required fields with non-empty content", () => {
    prophetsData.forEach((p) => {
      expect(p.name).toBeTruthy()
      expect(p.title).toBeTruthy()
      expect(p.brief.length).toBeGreaterThan(15)
      expect(p.milestones.length).toBeGreaterThanOrEqual(2)
      expect(p.lessons.length).toBeGreaterThanOrEqual(1)
      expect(p.miracles.length).toBeGreaterThanOrEqual(1)
      expect(p.keyVerses.length).toBeGreaterThanOrEqual(1)
      expect(p.color).toBeTruthy()
      expect(p.gradient).toBeTruthy()
    })
  })

  it("contains all Ulul-Azm (أولو العزم) prophets", () => {
    const ululAzm = prophetsData.filter((p) => p.category === "ulul-azm" || p.category === "final")
    const names = ululAzm.map((p) => p.name)
    expect(names.some((n) => n.includes("نوح"))).toBe(true)
    expect(names.some((n) => n.includes("إبراهيم"))).toBe(true)
    expect(names.some((n) => n.includes("موسى"))).toBe(true)
    expect(names.some((n) => n.includes("عيسى"))).toBe(true)
    expect(names.some((n) => n.includes("محمد"))).toBe(true)
  })

  it("verifies all category definitions", () => {
    expect(PROPHET_CATEGORIES.length).toBe(6)
    expect(PROPHET_CATEGORIES.find((c) => c.id === "all")).toBeDefined()
  })

  it("ensures all prophets have heritage sources and authentic hadiths", () => {
    prophetsData.forEach((p) => {
      expect(p.heritageSources.length).toBeGreaterThanOrEqual(2)
      expect(p.hadiths.length).toBeGreaterThanOrEqual(1)
      p.hadiths.forEach((h) => {
        expect(h.text.length).toBeGreaterThan(10)
        expect(h.source.length).toBeGreaterThan(3)
      })
    })
  })
})
