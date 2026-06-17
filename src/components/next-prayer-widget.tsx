"use client"

import * as React from "react"

type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha"

interface PrayerInfo {
  name: string
  time: string
}

const PRAYER_CITY_STORAGE_KEY = "selectedPrayerCity"
const cityNames: Record<string, { name: string; englishName: string }> = {
  cairo: { name: "القاهرة", englishName: "Cairo" },
  giza: { name: "الجيزة", englishName: "Giza" },
  alexandria: { name: "الإسكندرية", englishName: "Alexandria" },
  "port-said": { name: "بورسعيد", englishName: "Port Said" },
  suez: { name: "السويس", englishName: "Suez" },
  ismailia: { name: "الإسماعيلية", englishName: "Ismailia" },
  damietta: { name: "دمياط", englishName: "Damietta" },
  damanhur: { name: "البحيرة", englishName: "Damanhur" },
  tanta: { name: "الغربية", englishName: "Tanta" },
  mansoura: { name: "الدقهلية", englishName: "Mansoura" },
  zagazig: { name: "الشرقية", englishName: "Zagazig" },
  shebin: { name: "المنوفية", englishName: "Shebin El Kom" },
  banha: { name: "القليوبية", englishName: "Banha" },
  "kafr-el-sheikh": { name: "كفر الشيخ", englishName: "Kafr El Sheikh" },
  fayoum: { name: "الفيوم", englishName: "Fayoum" },
  "beni-suef": { name: "بني سويف", englishName: "Beni Suef" },
  minya: { name: "المنيا", englishName: "Minya" },
  assiut: { name: "أسيوط", englishName: "Assiut" },
  sohag: { name: "سوهاج", englishName: "Sohag" },
  qena: { name: "قنا", englishName: "Qena" },
  luxor: { name: "الأقصر", englishName: "Luxor" },
  aswan: { name: "أسوان", englishName: "Aswan" },
  hurghada: { name: "البحر الأحمر", englishName: "Hurghada" },
  "new-valley": { name: "الوادي الجديد", englishName: "Al Wadi al Jadid" },
  matrouh: { name: "مطروح", englishName: "Marsa Matrouh" },
  "north-sinai": { name: "شمال سيناء", englishName: "Arish" },
  "south-sinai": { name: "جنوب سيناء", englishName: "Sharm El Sheikh" },
}

const prayerLabels: Record<PrayerKey, string> = {
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
}

function parsePrayerMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

function getStoredCity() {
  if (typeof window === "undefined") return cityNames.cairo

  try {
    const value = window.localStorage.getItem(PRAYER_CITY_STORAGE_KEY) || "cairo"
    return cityNames[value] || cityNames.cairo
  } catch {
    return cityNames.cairo
  }
}

function getNextPrayer(prayers: Record<PrayerKey, string>, now: Date): PrayerInfo {
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const ordered = Object.entries(prayers) as Array<[PrayerKey, string]>
  const next = ordered.find(([, time]) => currentMinutes < parsePrayerMinutes(time)) || ordered[0]
  return { name: prayerLabels[next[0]], time: next[1] }
}

function getRemainingText(prayer: PrayerInfo, now: Date) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  let remaining = parsePrayerMinutes(prayer.time) - currentMinutes
  if (remaining < 0) remaining += 24 * 60
  const hours = Math.floor(remaining / 60)
  const minutes = remaining % 60
  return hours > 0 ? `${hours} س ${minutes} د` : `${minutes} د`
}

export function NextPrayerWidget() {
  const [now, setNow] = React.useState(new Date())
  const [city, setCity] = React.useState(() => getStoredCity())
  const [prayers, setPrayers] = React.useState<Record<PrayerKey, string>>({
    fajr: "04:45",
    dhuhr: "12:05",
    asr: "15:25",
    maghrib: "17:55",
    isha: "19:15",
  })
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  React.useEffect(() => {
    const selectedCity = getStoredCity()
    setCity(selectedCity)

    const loadTimings = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(selectedCity.englishName)}&country=Egypt&method=5`
        )
        if (!response.ok) throw new Error("Prayer widget request failed")
        const data = await response.json()
        const timings = data?.data?.timings
        if (!timings) throw new Error("Prayer widget response malformed")

        setPrayers({
          fajr: timings.Fajr,
          dhuhr: timings.Dhuhr,
          asr: timings.Asr,
          maghrib: timings.Maghrib,
          isha: timings.Isha,
        })
      } catch {
        // Keep static fallback values.
      } finally {
        setLoading(false)
      }
    }

    loadTimings()
  }, [])

  const nextPrayer = getNextPrayer(prayers, now)

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-sm text-muted-foreground">الصلاة القادمة</p>
          <h3 className="mb-1 text-2xl font-bold gradient-text">{nextPrayer.name}</h3>
          <p className="mb-0 text-xs text-muted-foreground">{city.name} {loading ? "• تحديث..." : ""}</p>
        </div>
        <div className="text-left">
          <div className="font-mono text-3xl font-bold">{nextPrayer.time}</div>
          <div className="mt-1 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-600">
            بعد {getRemainingText(nextPrayer, now)}
          </div>
        </div>
      </div>
    </section>
  )
}
