"use client"

import * as React from "react"

type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha"

interface PrayerInfo {
  name: string
  time: string
  key: PrayerKey
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

const prayerIcons: Record<PrayerKey, string> = {
  fajr: "fa-cloud-moon",
  dhuhr: "fa-sun",
  asr: "fa-cloud-sun",
  maghrib: "fa-cloud-moon",
  isha: "fa-moon",
}

const prayerIconColors: Record<PrayerKey, string> = {
  fajr: "#6366f1",
  dhuhr: "#f59e0b",
  asr: "#f97316",
  maghrib: "#ef4444",
  isha: "#8b5cf6",
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
  return { name: prayerLabels[next[0]], time: next[1], key: next[0] }
}

function getRemainingText(prayer: PrayerInfo, now: Date) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  let remaining = parsePrayerMinutes(prayer.time) - currentMinutes
  if (remaining < 0) remaining += 24 * 60
  const hours = Math.floor(remaining / 60)
  const minutes = remaining % 60
  if (hours > 0) return { hours, minutes, text: `${hours} س ${minutes} د` }
  return { hours: 0, minutes, text: `${minutes} دقيقة` }
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
  const remaining = getRemainingText(nextPrayer, now)
  const allPrayers = Object.entries(prayers) as Array<[PrayerKey, string]>
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  return (
    <section className="prayer-widget-card">
      <style jsx>{`
        .prayer-widget-card {
          border-radius: 1rem;
          overflow: hidden;
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .dark .prayer-widget-card {
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .prayer-top {
          background: var(--hero-gradient);
          padding: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .prayer-top-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .prayer-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          flex-shrink: 0;
        }
        .prayer-top-text h3 {
          margin: 0;
          font-size: 0.8rem;
          font-weight: 600;
          color: rgba(255,255,255,0.75);
          letter-spacing: 0.02em;
        }
        .prayer-top-text .prayer-name {
          margin: 0;
          font-size: 1.6rem;
          font-weight: 800;
          color: white;
          line-height: 1.2;
        }
        .prayer-top-right {
          text-align: left;
        }
        .prayer-time-big {
          font-size: 2rem;
          font-weight: 800;
          color: white;
          font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
          line-height: 1;
          direction: ltr;
        }
        .prayer-countdown {
          margin-top: 0.4rem;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.25rem 0.65rem;
          border-radius: 20px;
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(8px);
          font-size: 0.72rem;
          font-weight: 700;
          color: white;
        }
        .countdown-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4ade80;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }
        .prayer-city {
          padding: 0.3rem 1.25rem 0.6rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.72rem;
          color: hsl(var(--muted-foreground));
        }
        .prayer-city i {
          font-size: 0.65rem;
          color: hsl(var(--primary));
        }
        .prayer-times-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0;
          border-top: 1px solid hsl(var(--border));
        }
        .prayer-time-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.2rem;
          padding: 0.65rem 0.25rem;
          border-left: 1px solid hsl(var(--border));
          transition: background 0.2s;
        }
        .prayer-time-item:last-child {
          border-left: none;
        }
        .prayer-time-item.is-next {
          background: hsl(var(--primary) / 0.06);
        }
        .dark .prayer-time-item.is-next {
          background: hsl(var(--primary) / 0.1);
        }
        .prayer-time-emoji {
          font-size: 0.9rem;
          line-height: 1;
        }
        .prayer-time-label {
          font-size: 0.65rem;
          font-weight: 600;
          color: hsl(var(--muted-foreground));
        }
        .prayer-time-item.is-next .prayer-time-label {
          color: hsl(var(--primary));
          font-weight: 700;
        }
        .prayer-time-value {
          font-size: 0.72rem;
          font-weight: 700;
          color: hsl(var(--foreground));
          direction: ltr;
        }
        .prayer-time-item.is-next .prayer-time-value {
          color: hsl(var(--primary));
        }
      `}</style>

      <div className="prayer-top">
        <div className="prayer-top-left">
          <div className="prayer-icon-wrap">
            <i className={`fas ${prayerIcons[nextPrayer.key]}`} style={{ color: prayerIconColors[nextPrayer.key] }} />
          </div>
          <div className="prayer-top-text">
            <h3>الصلاة القادمة</h3>
            <p className="prayer-name">{nextPrayer.name}</p>
          </div>
        </div>
        <div className="prayer-top-right">
          <div className="prayer-time-big">{nextPrayer.time}</div>
          <div className="prayer-countdown">
            <span className="countdown-dot" />
            بعد {remaining.text}
          </div>
        </div>
      </div>

      <div className="prayer-city">
        <i className="fas fa-map-marker-alt" />
        {city.name} {loading ? "• جاري التحديث..." : ""}
      </div>

      <div className="prayer-times-row">
        {allPrayers.map(([key, time]) => (
          <div key={key} className={`prayer-time-item ${key === nextPrayer.key ? "is-next" : ""}`}>
            <span className="prayer-time-emoji"><i className={`fas ${prayerIcons[key]}`} style={{ color: prayerIconColors[key] }} /></span>
            <span className="prayer-time-label">{prayerLabels[key]}</span>
            <span className="prayer-time-value">{time}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
