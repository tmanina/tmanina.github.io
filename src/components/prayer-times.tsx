"use client"

import * as React from "react"
import { FloatingToast } from "@/components/floating-toast"
import type { ToastVariant } from "@/components/floating-toast"

type City = "cairo" | "giza" | "alexandria" | "port-said" | "suez" | "ismailia" | "damietta" |
  "damanhur" | "tanta" | "mansoura" | "zagazig" | "shebin" | "banha" | "kafr-el-sheikh" |
  "fayoum" | "beni-suef" | "minya" | "assiut" | "sohag" | "qena" | "luxor" | "aswan" |
  "hurghada" | "new-valley" | "matrouh" | "north-sinai" | "south-sinai"

interface CityInfo {
  name: string
  englishName: string
  latitude: number
  longitude: number
}

interface PrayerTimesData {
  fajr: string
  sunrise: string
  dhuhr: string
  asr: string
  maghrib: string
  isha: string
}

const PRAYER_CITY_STORAGE_KEY = "selectedPrayerCity"
const DEFAULT_CITY: City = "cairo"

const egyptCities: Record<City, CityInfo> = {
  cairo: { name: "القاهرة", englishName: "Cairo", latitude: 30.0444, longitude: 31.2357 },
  giza: { name: "الجيزة", englishName: "Giza", latitude: 30.0131, longitude: 31.2089 },
  alexandria: { name: "الإسكندرية", englishName: "Alexandria", latitude: 31.2001, longitude: 29.9187 },
  "port-said": { name: "بورسعيد", englishName: "Port Said", latitude: 31.2653, longitude: 32.3019 },
  suez: { name: "السويس", englishName: "Suez", latitude: 29.9668, longitude: 32.5498 },
  ismailia: { name: "الإسماعيلية", englishName: "Ismailia", latitude: 30.5833, longitude: 32.2722 },
  damietta: { name: "دمياط", englishName: "Damietta", latitude: 31.4175, longitude: 31.8144 },
  damanhur: { name: "البحيرة", englishName: "Damanhur", latitude: 31.0341, longitude: 30.4682 },
  tanta: { name: "الغربية", englishName: "Tanta", latitude: 30.7865, longitude: 31.0004 },
  mansoura: { name: "الدقهلية", englishName: "Mansoura", latitude: 31.0409, longitude: 31.3785 },
  zagazig: { name: "الشرقية", englishName: "Zagazig", latitude: 30.5877, longitude: 31.5021 },
  shebin: { name: "المنوفية", englishName: "Shebin El Kom", latitude: 30.5594, longitude: 31.0118 },
  banha: { name: "القليوبية", englishName: "Banha", latitude: 30.4659, longitude: 31.1784 },
  "kafr-el-sheikh": { name: "كفر الشيخ", englishName: "Kafr El Sheikh", latitude: 31.1107, longitude: 30.9388 },
  fayoum: { name: "الفيوم", englishName: "Fayoum", latitude: 29.3084, longitude: 30.8428 },
  "beni-suef": { name: "بني سويف", englishName: "Beni Suef", latitude: 29.0661, longitude: 31.0994 },
  minya: { name: "المنيا", englishName: "Minya", latitude: 28.0871, longitude: 30.7618 },
  assiut: { name: "أسيوط", englishName: "Assiut", latitude: 27.1783, longitude: 31.1859 },
  sohag: { name: "سوهاج", englishName: "Sohag", latitude: 26.5569, longitude: 31.6948 },
  qena: { name: "قنا", englishName: "Qena", latitude: 26.1551, longitude: 32.7160 },
  luxor: { name: "الأقصر", englishName: "Luxor", latitude: 25.6872, longitude: 32.6396 },
  aswan: { name: "أسوان", englishName: "Aswan", latitude: 24.0889, longitude: 32.8998 },
  hurghada: { name: "البحر الأحمر", englishName: "Hurghada", latitude: 27.2579, longitude: 33.8116 },
  "new-valley": { name: "الوادي الجديد", englishName: "Al Wadi al Jadid", latitude: 25.4514, longitude: 30.5461 },
  matrouh: { name: "مطروح", englishName: "Marsa Matrouh", latitude: 31.3543, longitude: 27.2373 },
  "north-sinai": { name: "شمال سيناء", englishName: "Arish", latitude: 31.1312, longitude: 33.7989 },
  "south-sinai": { name: "جنوب سيناء", englishName: "Sharm El Sheikh", latitude: 27.9158, longitude: 34.3300 },
}

const cityOptions = Object.entries(egyptCities) as Array<[City, CityInfo]>

interface PrayerTimesProps {
  country: string
  city: string
}

const normalizeCity = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "-")

const resolveCity = (city: string): City => {
  const normalizedCity = normalizeCity(city)
  const cityEntry = cityOptions.find(([cityKey, cityInfo]) => {
    return cityKey === normalizedCity || normalizeCity(cityInfo.englishName) === normalizedCity
  })

  return cityEntry?.[0] ?? DEFAULT_CITY
}

const resolveApiCountry = (country: string) => {
  return country.trim().toUpperCase() === "EG" ? "Egypt" : country
}

const getStoredCity = (): City | null => {
  if (typeof window === "undefined") return null

  try {
    const savedCity = window.localStorage.getItem(PRAYER_CITY_STORAGE_KEY)
    if (savedCity && savedCity in egyptCities) {
      return savedCity as City
    }
  } catch {
    return null
  }

  return null
}

const saveCity = (city: City) => {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(PRAYER_CITY_STORAGE_KEY, city)
  } catch {
    // localStorage may be unavailable in private browsing or restricted contexts.
  }
}

const getDistanceInKm = (
  first: Pick<CityInfo, "latitude" | "longitude">,
  second: Pick<CityInfo, "latitude" | "longitude">
) => {
  const earthRadiusKm = 6371
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const latitudeDiff = toRadians(second.latitude - first.latitude)
  const longitudeDiff = toRadians(second.longitude - first.longitude)
  const firstLatitude = toRadians(first.latitude)
  const secondLatitude = toRadians(second.latitude)

  const distance =
    Math.sin(latitudeDiff / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDiff / 2) ** 2

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(distance), Math.sqrt(1 - distance))
}

const findNearestCity = (latitude: number, longitude: number): City => {
  return cityOptions.reduce<{ city: City; distance: number }>(
    (nearest, [cityKey, cityInfo]) => {
      const distance = getDistanceInKm(
        { latitude, longitude },
        { latitude: cityInfo.latitude, longitude: cityInfo.longitude }
      )

      return distance < nearest.distance ? { city: cityKey, distance } : nearest
    },
    { city: DEFAULT_CITY, distance: Number.POSITIVE_INFINITY }
  ).city
}

export function PrayerTimes({ country, city }: PrayerTimesProps) {
  const [currentTime, setCurrentTime] = React.useState(new Date())

  // قراءة المحافظة المحفوظة من localStorage أو استخدام الافتراضية
  const [selectedCity, setSelectedCity] = React.useState<City>(() => {
    return getStoredCity() ?? resolveCity(city)
  })

  const [prayerTimesData, setPrayerTimesData] = React.useState<PrayerTimesData | null>(null)
  const [qiblaDirection, setQiblaDirection] = React.useState<number>(0)
  const [loading, setLoading] = React.useState(true)
  const [detectingLocation, setDetectingLocation] = React.useState(false)
  const [isClient, setIsClient] = React.useState(false)
  const [toast, setToast] = React.useState<{ message: string; variant: ToastVariant } | null>(null)
  const apiCountry = React.useMemo(() => resolveApiCountry(country), [country])

  const showToast = React.useCallback((message: string, variant: ToastVariant = "info") => {
    setToast({ message, variant })
  }, [])

  // حفظ المحافظة المختارة في localStorage عند تغييرها
  const handleCityChange = (newCity: City) => {
    setSelectedCity(newCity)
    saveCity(newCity)
  }

  const handleUseCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      showToast("متصفحك لا يدعم تحديد الموقع. اختر المحافظة يدويًا.", "warning")
      return
    }

    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearestCity = findNearestCity(position.coords.latitude, position.coords.longitude)
        handleCityChange(nearestCity)
        showToast(`تم اختيار أقرب محافظة: ${egyptCities[nearestCity].name}`, "success")
        setDetectingLocation(false)
      },
      () => {
        showToast("تعذر تحديد موقعك. يمكنك اختيار المحافظة من القائمة.", "warning")
        setDetectingLocation(false)
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 1000 * 60 * 30 }
    )
  }

  // Fetch prayer times and Qibla from API
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const cityInfo = egyptCities[selectedCity]

        // Fetch Prayer Times
        const prayerResponse = await fetch(
          `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(
            cityInfo.englishName
          )}&country=${encodeURIComponent(apiCountry)}&method=5`
        )
        if (!prayerResponse.ok) {
          throw new Error("Prayer times request failed")
        }

        const prayerData = await prayerResponse.json()

        if (prayerData.code === 200 && prayerData.data.timings) {
          const timings = prayerData.data.timings
          setPrayerTimesData({
            fajr: timings.Fajr,
            sunrise: timings.Sunrise,
            dhuhr: timings.Dhuhr,
            asr: timings.Asr,
            maghrib: timings.Maghrib,
            isha: timings.Isha,
          })
        } else {
          throw new Error("Prayer times response was malformed")
        }

        // Fetch Qibla Direction
        const qiblaResponse = await fetch(
          `https://api.aladhan.com/v1/qibla/${cityInfo.latitude}/${cityInfo.longitude}`
        )
        if (!qiblaResponse.ok) {
          throw new Error("Qibla request failed")
        }

        const qiblaData = await qiblaResponse.json()

        if (qiblaData.code === 200 && qiblaData.data) {
          setQiblaDirection(Math.round(qiblaData.data.direction))
        } else {
          throw new Error("Qibla response was malformed")
        }

      } catch (error) {
        console.error("Error fetching data:", error)
        // Fallback to static times if API fails
        setPrayerTimesData({
          fajr: "04:45",
          sunrise: "06:15",
          dhuhr: "12:05",
          asr: "15:25",
          maghrib: "17:55",
          isha: "19:15",
        })
        setQiblaDirection(136) // Default approx direction
        showToast("تعذر تحديث مواقيت الصلاة الآن. تم عرض أوقات تقريبية مؤقتة.", "warning")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [apiCountry, selectedCity, showToast])

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    setIsClient(true)
    return () => clearInterval(timer)
  }, [])

  const cityData = egyptCities[selectedCity]

  const defaultPrayerTimes: PrayerTimesData = {
    fajr: "00:00",
    sunrise: "00:00",
    dhuhr: "00:00",
    asr: "00:00",
    maghrib: "00:00",
    isha: "00:00",
  }

  const times = prayerTimesData || defaultPrayerTimes

  const prayerTimes = [
    {
      name: "الفجر",
      time: times.fajr,
      icon: "fa-star-and-crescent", // Fajr - dawn with stars
      color: "#4c1d95",
      gradient: "linear-gradient(135deg, #1e1b4b, #4c1d95)", // ليل يقترب للصبح - بنفسجي داكن
    },
    {
      name: "الشروق",
      time: times.sunrise,
      icon: "fa-sun", // Sunrise - sun rising
      color: "#f97316",
      gradient: "linear-gradient(135deg, #f97316, #fb923c)", // برتقالي - شروق الشمس
    },
    {
      name: "الظهر",
      time: times.dhuhr,
      icon: "fa-sun", // Dhuhr - noon sun at peak
      color: "#fbbf24",
      gradient: "linear-gradient(135deg, #fbbf24, #fcd34d)", // أصفر ذهبي - شمس الظهيرة
    },
    {
      name: "العصر",
      time: times.asr,
      icon: "fa-cloud-sun", // Asr - afternoon sun with clouds
      color: "#ea580c",
      gradient: "linear-gradient(135deg, #ea580c, #f97316)", // برتقالي داكن - يقارب الغروب
    },
    {
      name: "المغرب",
      time: times.maghrib,
      icon: "fa-cloud-moon", // Maghrib - sunset with moon appearing
      color: "#dc2626",
      gradient: "linear-gradient(135deg, #dc2626, #f97316)", // أحمر-برتقالي - غروب
    },
    {
      name: "العشاء",
      time: times.isha,
      icon: "fa-moon", // Isha - night moon
      color: "#312e81",
      gradient: "linear-gradient(135deg, #1e3a8a, #312e81)", // أزرق داكن - ليلاً
    },
  ]

  const currentHour = currentTime.getHours()
  const currentMinute = currentTime.getMinutes()
  const currentSeconds = currentTime.getSeconds()

  // Determine next prayer
  const getCurrentPrayerIndex = () => {
    const currentTimeMinutes = currentHour * 60 + currentMinute

    for (let i = 0; i < prayerTimes.length; i++) {
      const [hour, minute] = prayerTimes[i].time.split(":").map(Number)
      const prayerTimeMinutes = hour * 60 + minute
      if (currentTimeMinutes < prayerTimeMinutes) {
        return i
      }
    }
    return 0 // Next day's Fajr
  }

  const nextPrayerIndex = getCurrentPrayerIndex()
  const nextPrayer = prayerTimes[nextPrayerIndex]

  // Calculate time remaining until next prayer
  const getTimeRemaining = () => {
    const [prayerHour, prayerMinute] = nextPrayer.time.split(":").map(Number)
    let totalMinutesRemaining = prayerHour * 60 + prayerMinute - (currentHour * 60 + currentMinute)

    // If negative, it's tomorrow's Fajr
    if (totalMinutesRemaining < 0) {
      totalMinutesRemaining += 24 * 60
    }

    const hours = Math.floor(totalMinutesRemaining / 60)
    const minutes = totalMinutesRemaining % 60
    const seconds = 60 - currentSeconds

    return { hours, minutes, seconds }
  }

  const timeRemaining = getTimeRemaining()

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-5xl">
        <div className="flex flex-col gap-4">
          {/* Current Time Card */}
          <div>
            <div className="shadow-lg rounded-xl overflow-hidden card-hover bg-card border border-border">
              <div className="bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-4 text-foreground dark:from-background dark:via-background dark:to-background">
                <div className="md:flex items-center">
                  <div className="md:w-1/3 text-center md:text-right mb-3 md:mb-0">
                    <h2 className="mb-2 flex items-center justify-center gap-2 text-2xl font-extrabold leading-tight tracking-normal md:justify-start">
                      <i className="fas fa-mosque text-amber-600 dark:text-amber-400"></i>
                      <span>مواقيت الصلاة</span>
                    </h2>
                    <p className="mb-0 flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground md:justify-start">
                      <i className="fas fa-map-marker-alt text-emerald-600 dark:text-emerald-400"></i>
                      <span>{cityData.name}, مصر</span>
                    </p>
                    {loading && (
                      <p className="mb-0 mt-2 text-sm font-medium text-muted-foreground">
                        <i className="fas fa-spinner fa-spin ms-1 text-amber-600 dark:text-amber-400"></i>
                        <span>جاري التحديث...</span>
                      </p>
                    )}
                  </div>
                  <div className="md:w-1/3 text-center mb-3 md:mb-0">
                    {/* City Selector */}
                    <div className="flex flex-col gap-2">
                      <select
                        className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-bold text-foreground shadow-sm outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-500/25"
                        value={selectedCity}
                        onChange={(e) => handleCityChange(e.target.value as City)}
                        aria-label="اختيار محافظة مواقيت الصلاة"
                      >
                        {cityOptions.map(([cityKey, cityInfo]) => (
                          <option key={cityKey} value={cityKey} className="bg-background text-foreground">
                            {cityInfo.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={detectingLocation}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-emerald-700/25 bg-emerald-700 px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <i className={`fas ${detectingLocation ? "fa-spinner fa-spin" : "fa-location-crosshairs"}`}></i>
                        <span>{detectingLocation ? "جاري تحديد الموقع..." : "استخدم موقعي بإذن"}</span>
                      </button>
                    </div>
                  </div>
                  <div className="md:w-1/3 text-center md:text-left">
                    {isClient ? (
                      <>
                        <div className="font-mono text-4xl font-extrabold leading-none text-foreground">
                          {currentTime.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: true,
                          })}
                        </div>
                        <p className="mb-0 mt-2 text-sm font-semibold text-muted-foreground">
                          {currentTime.toLocaleDateString("ar-SA-u-ca-gregory", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </>
                    ) : (
                      <div className="font-mono text-4xl font-extrabold leading-none text-foreground">00:00:00</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Prayer with Countdown */}
          <div>
            <div className="shadow-lg rounded-xl card-hover bg-card border border-border">
              <div className="p-4">
                <div className="md:flex items-center">
                  <div className="md:w-1/2 text-center md:text-right mb-3 md:mb-0">
                    <p className="text-muted-foreground mb-2">الأذان القادم</p>
                    <h3 className="text-2xl font-bold mb-2" style={{ color: nextPrayer.color }}>
                      {nextPrayer.name}
                    </h3>
                    <div
                      className="text-4xl font-bold text-white p-3 rounded-lg inline-block font-mono"
                      style={{ background: nextPrayer.gradient }}
                    >
                      {nextPrayer.time}
                    </div>
                  </div>
                  <div className="md:w-1/2 text-center md:text-left">
                    <p className="text-muted-foreground mb-2">الوقت المتبقي</p>
                    {isClient ? (
                      <div className="flex justify-center md:justify-end gap-2">
                        <div className="text-center">
                          <div
                            className="text-4xl font-bold text-white rounded-lg flex items-center justify-center font-mono"
                            style={{ background: nextPrayer.gradient, width: "80px", height: "80px" }}
                          >
                            {String(timeRemaining.hours).padStart(2, "0")}
                          </div>
                          <small className="text-muted-foreground">ساعة</small>
                        </div>
                        <div className="text-4xl font-bold" style={{ color: nextPrayer.color }}>
                          :
                        </div>
                        <div className="text-center">
                          <div
                            className="text-4xl font-bold text-white rounded-lg flex items-center justify-center font-mono"
                            style={{ background: nextPrayer.gradient, width: "80px", height: "80px" }}
                          >
                            {String(timeRemaining.minutes).padStart(2, "0")}
                          </div>
                          <small className="text-muted-foreground">دقيقة</small>
                        </div>
                        <div className="text-4xl font-bold" style={{ color: nextPrayer.color }}>
                          :
                        </div>
                        <div className="text-center">
                          <div
                            className="text-4xl font-bold text-white rounded-lg flex items-center justify-center font-mono"
                            style={{ background: nextPrayer.gradient, width: "80px", height: "80px" }}
                          >
                            {String(timeRemaining.seconds).padStart(2, "0")}
                          </div>
                          <small className="text-muted-foreground">ثانية</small>
                        </div>
                      </div>
                    ) : (
                      <div className="text-2xl">--:--:--</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* All Prayer Times */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {prayerTimes.map((prayer, index) => (
                <div key={prayer.name}>
                  <div
                    className={`shadow card-hover h-full bg-card border rounded-xl overflow-hidden ${index === nextPrayerIndex ? "" : "border-border"
                      }`}
                    style={
                      index === nextPrayerIndex
                        ? { borderColor: prayer.color, borderWidth: "3px", borderStyle: "solid" }
                        : {}
                    }
                  >
                    <div className="p-1" style={{ background: prayer.gradient }}></div>
                    <div className="p-4 text-center">
                      <div className="mb-3">
                        <i
                          className={`fas ${prayer.icon}`}
                          style={{
                            background: prayer.gradient,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            fontSize: '4rem'
                          }}
                        ></i>
                      </div>
                      <h4 className="text-base font-bold mb-2">{prayer.name}</h4>
                      <div className="text-2xl font-bold font-mono">
                        {prayer.time}
                      </div>
                      {index === nextPrayerIndex && (
                        <div className="mt-3">
                          <span
                            className="inline-flex items-center rounded-full px-3 py-2 text-xs font-semibold text-white"
                            style={{ background: prayer.gradient }}
                          >
                            <i className="fas fa-bell ms-1"></i>
                            الصلاة القادمة
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="shadow card-hover h-full bg-card border border-border rounded-xl">
                  <div className="p-4">
                    <h5 className="flex items-center gap-2 mb-3 font-semibold">
                      <i className="fas fa-calendar-alt" style={{ color: 'var(--primary-gold)' }}></i>
                      <span>التاريخ الهجري</span>
                    </h5>
                    {isClient ? (
                      <p className="text-lg mb-0">
                        {new Date().toLocaleDateString("ar-SA-u-ca-islamic", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    ) : (
                      <p className="text-lg mb-0">...</p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <div className="shadow card-hover h-full bg-card border border-border rounded-xl">
                  <div className="p-4">
                    <h5 className="flex items-center gap-2 mb-3 font-semibold">
                      <i className="fas fa-compass" style={{ color: 'var(--primary-gold)' }}></i>
                      <span>اتجاه القبلة</span>
                    </h5>
                    <div className="flex items-center gap-3">
                      <div
                        className="rounded-full bg-muted flex items-center justify-center"
                        style={{ width: "60px", height: "60px" }}
                      >
                        <i
                          className="fas fa-location-arrow text-2xl"
                          style={{
                            color: 'var(--primary-gold)',
                            transform: `rotate(${qiblaDirection - 45}deg)`,
                            transition: 'transform 1s ease-out'
                          }}
                        ></i>
                      </div>
                      <div>
                        <p className="text-lg mb-0 font-bold">{qiblaDirection}°</p>
                        <p className="text-muted-foreground text-sm mb-0">من الشمال</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <FloatingToast
        message={toast?.message || ""}
        variant={toast?.variant || "info"}
        isVisible={toast !== null}
        onClose={() => setToast(null)}
      />
    </div>
  )
}
