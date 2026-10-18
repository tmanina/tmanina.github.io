import { describe, expect, it } from "vitest"
import { getEgyptClock, getEgyptDateKey, parsePrayerTimings } from "./prayer-timings"

const apiResponse = {
  code: 200,
  data: {
    meta: { timezone: "Africa/Cairo" },
    timings: {
      Fajr: "05:30", Sunrise: "06:56", Dhuhr: "12:41",
      Asr: "15:59", Maghrib: "18:26", Isha: "19:43",
    },
  },
}

describe("Egyptian prayer timing helpers", () => {
  it("uses Cairo's local date and clock across midnight", () => {
    const instant = new Date("2026-10-13T21:30:00Z")
    expect(getEgyptDateKey(instant)).toBe("14-10-2026")
    expect(getEgyptClock(instant)).toEqual({ hour: 0, minute: 30, second: 0 })
  })

  it("accepts valid API times and rejects missing or malformed times", () => {
    expect(parsePrayerTimings(apiResponse)?.fajr).toBe("05:30")
    expect(parsePrayerTimings({ ...apiResponse, data: { ...apiResponse.data, timings: { ...apiResponse.data.timings, Fajr: "25:99" } } })).toBeNull()
    expect(parsePrayerTimings({ ...apiResponse, data: { ...apiResponse.data, meta: { timezone: "Asia/Riyadh" } } })).toBeNull()
    expect(parsePrayerTimings({ code: 500 })).toBeNull()
  })
})
