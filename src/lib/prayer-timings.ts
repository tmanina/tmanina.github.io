export interface PrayerTimings {
  fajr: string
  sunrise: string
  dhuhr: string
  asr: string
  maghrib: string
  isha: string
}

const egyptDateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Cairo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

const egyptTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Cairo",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
})

function dateParts(formatter: Intl.DateTimeFormat, date: Date) {
  return Object.fromEntries(formatter.formatToParts(date).map(({ type, value }) => [type, value]))
}

export function getEgyptDateKey(date: Date) {
  const { day, month, year } = dateParts(egyptDateFormatter, date)
  return `${day}-${month}-${year}`
}

export function getEgyptClock(date: Date) {
  const { hour, minute, second } = dateParts(egyptTimeFormatter, date)
  return { hour: Number(hour), minute: Number(minute), second: Number(second) }
}

export function getPrayerTimingsUrl(dateKey: string, location: { latitude: number; longitude: number }) {
  return `https://api.aladhan.com/v1/timings/${dateKey}?latitude=${location.latitude}&longitude=${location.longitude}&method=5`
}

export function parsePrayerTimings(response: unknown): PrayerTimings | null {
  if (!response || typeof response !== "object") return null
  const payload = response as { code?: unknown; data?: { timings?: Record<string, unknown>; meta?: { timezone?: unknown } } }
  if (payload.code !== 200 || payload.data?.meta?.timezone !== "Africa/Cairo" || !payload.data.timings) return null

  const timings = payload.data.timings
  const keys = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] as const
  if (!keys.every((key) => typeof timings[key] === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(timings[key] as string))) {
    return null
  }

  return {
    fajr: timings.Fajr as string,
    sunrise: timings.Sunrise as string,
    dhuhr: timings.Dhuhr as string,
    asr: timings.Asr as string,
    maghrib: timings.Maghrib as string,
    isha: timings.Isha as string,
  }
}
