import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { PrayerTimes } from "./prayer-times"
import { NextPrayerWidget } from "./next-prayer-widget"
import { getEgyptDateKey } from "@/lib/prayer-timings"

const timingsResponse = {
  code: 200,
  data: {
    meta: { timezone: "Africa/Cairo" },
    timings: {
      Fajr: "05:30", Sunrise: "06:56", Dhuhr: "12:41",
      Asr: "15:59", Maghrib: "18:26", Isha: "19:43",
    },
  },
}

const response = (body: unknown, ok = true) => ({ ok, json: async () => body }) as Response

describe("prayer time display", () => {
  it("keeps valid prayer times when the separate Qibla request fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) =>
      String(input).includes("/qibla/") ? response({}, false) : response(timingsResponse),
    )

    render(<PrayerTimes country="EG" city="Cairo" />)
    expect((await screen.findAllByText("05:30")).length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText("04:45")).not.toBeInTheDocument()
    expect(screen.getByText("--")).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/timings/${getEgyptDateKey(new Date())}?latitude=30.0444&longitude=31.2357&method=5`),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it("does not present fixed times when the prayer API fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) =>
      String(input).includes("/qibla/")
        ? response({ code: 200, data: { direction: 136 } })
        : response({}, false),
    )

    render(<PrayerTimes country="EG" city="Cairo" />)
    expect(await screen.findByRole("button", { name: "إعادة تحميل المواقيت" })).toBeInTheDocument()
    expect(screen.queryByText("04:45")).not.toBeInTheDocument()
    expect(screen.getByText("غير متاح")).toBeInTheDocument()
  })

  it("retries the home widget without showing made-up fallback times", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(response({}, false))
      .mockResolvedValueOnce(response(timingsResponse))

    render(<NextPrayerWidget />)
    const retry = await screen.findByRole("button", { name: "إعادة المحاولة" })
    expect(screen.getByText("المواقيت غير متاحة")).toBeInTheDocument()
    expect(screen.queryByText("04:45")).not.toBeInTheDocument()

    fireEvent.click(retry)
    expect((await screen.findAllByText("05:30")).length).toBeGreaterThanOrEqual(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("uses Kharga coordinates for New Valley in both prayer displays", async () => {
    localStorage.setItem("selectedPrayerCity", "new-valley")
    const khargaResponse = {
      ...timingsResponse,
      data: { ...timingsResponse.data, timings: { ...timingsResponse.data.timings, Dhuhr: "12:44" } },
    }
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) =>
      String(input).includes("/qibla/")
        ? response({ code: 200, data: { direction: 136 } })
        : response(khargaResponse),
    )

    render(<><PrayerTimes country="EG" city="Cairo" /><NextPrayerWidget /></>)
    expect((await screen.findAllByText("12:44")).length).toBeGreaterThanOrEqual(2)
    const timingUrls = fetchMock.mock.calls
      .map(([input]) => String(input))
      .filter((url) => url.includes("/timings/"))
    expect(timingUrls).toHaveLength(2)
    expect(timingUrls.every((url) => url.includes("latitude=25.4514&longitude=30.5461&method=5"))).toBe(true)
  })

  it.each([
    ["north-sinai", "latitude=31.1312&longitude=33.7989"],
    ["assiut", "latitude=27.1783&longitude=31.1859"],
  ])("uses the selected city's coordinates for %s", async (city, coordinates) => {
    localStorage.setItem("selectedPrayerCity", city)
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(response(timingsResponse))
    render(<NextPrayerWidget />)
    expect((await screen.findAllByText("05:30")).length).toBeGreaterThanOrEqual(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain(coordinates)
  })

  it("falls back to Cairo for an invalid stored city", async () => {
    localStorage.setItem("selectedPrayerCity", "toString")
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(response(timingsResponse))
    render(<NextPrayerWidget />)
    expect((await screen.findAllByText("05:30")).length).toBeGreaterThanOrEqual(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain("latitude=30.0444&longitude=31.2357")
  })
})
