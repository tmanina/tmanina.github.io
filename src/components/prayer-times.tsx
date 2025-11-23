"use client"

import * as React from "react"

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

interface PrayerTimesProps {
  country: string
  city: string
}

// نستخدم أسماء مختلفة داخليًا لتفادي تحذير "unused props"
export function PrayerTimes({ country: _country, city: _city }: PrayerTimesProps) {
  const [currentTime, setCurrentTime] = React.useState(new Date())

  // قراءة المحافظة المحفوظة من localStorage أو استخدام الافتراضية
  const [selectedCity, setSelectedCity] = React.useState<City>(() => {
    if (typeof window !== 'undefined') {
      const savedCity = localStorage.getItem('selectedPrayerCity')
      if (savedCity && savedCity in egyptCities) {
        return savedCity as City
      }
    }
    return "new-valley" // القيمة الافتراضية
  })

  const [prayerTimesData, setPrayerTimesData] = React.useState<PrayerTimesData | null>(null)
  const [qiblaDirection, setQiblaDirection] = React.useState<number>(0)
  const [loading, setLoading] = React.useState(true)
  const [isClient, setIsClient] = React.useState(false)

  // حفظ المحافظة المختارة في localStorage عند تغييرها
  const handleCityChange = (newCity: City) => {
    setSelectedCity(newCity)
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedPrayerCity', newCity)
    }
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
          )}&country=Egypt&method=5`
        )
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
        }

        // Fetch Qibla Direction
        const qiblaResponse = await fetch(
          `https://api.aladhan.com/v1/qibla/${cityInfo.latitude}/${cityInfo.longitude}`
        )
        const qiblaData = await qiblaResponse.json()

        if (qiblaData.code === 200 && qiblaData.data) {
          setQiblaDirection(Math.round(qiblaData.data.direction))
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
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedCity])

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
    <div className="row justify-content-center">
      <div className="col-12 col-xl-10">
        <div className="row g-4">
          {/* Current Time Card */}
          <div className="col-12">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden card-hover">
              <div className="gradient-bg text-white p-4">
                <div className="row align-items-center">
                  <div className="col-md-4 text-center text-md-start mb-3 mb-md-0">
                    <h2 className="h3 mb-2 d-flex align-items-center justify-content-center justify-content-md-start gap-2">
                      <i className="fas fa-mosque"></i>
                      <span>مواقيت الصلاة</span>
                    </h2>
                    <p className="mb-0 d-flex align-items-center justify-content-center justify-content-md-start gap-2">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>{cityData.name}, مصر</span>
                    </p>
                    {loading && (
                      <p className="mb-0 mt-2 small">
                        <i className="fas fa-spinner fa-spin me-1"></i>
                        <span>جاري التحديث...</span>
                      </p>
                    )}
                  </div>
                  <div className="col-md-4 text-center mb-3 mb-md-0">
                    {/* City Selector */}
                    <select
                      className="form-select form-select-lg bg-opacity-25 text-gray border-white border-2 fw-bold"
                      value={selectedCity}
                      onChange={(e) => handleCityChange(e.target.value as City)}
                      style={{ backdropFilter: "blur(10px)" }}
                    >
                      <option value="new-valley" className="text-dark">الوادي الجديد</option>
                      <option value="cairo" className="text-dark">القاهرة</option>
                      <option value="giza" className="text-dark">الجيزة</option>
                      <option value="alexandria" className="text-dark">الإسكندرية</option>
                      <option value="port-said" className="text-dark">بورسعيد</option>
                      <option value="suez" className="text-dark">السويس</option>
                      <option value="ismailia" className="text-dark">الإسماعيلية</option>
                      <option value="damietta" className="text-dark">دمياط</option>
                      <option value="damanhur" className="text-dark">البحيرة</option>
                      <option value="tanta" className="text-dark">الغربية</option>
                      <option value="mansoura" className="text-dark">الدقهلية</option>
                      <option value="zagazig" className="text-dark">الشرقية</option>
                      <option value="shebin" className="text-dark">المنوفية</option>
                      <option value="banha" className="text-dark">القليوبية</option>
                      <option value="kafr-el-sheikh" className="text-dark">كفر الشيخ</option>
                      <option value="fayoum" className="text-dark">الفيوم</option>
                      <option value="beni-suef" className="text-dark">بني سويف</option>
                      <option value="minya" className="text-dark">المنيا</option>
                      <option value="assiut" className="text-dark">أسيوط</option>
                      <option value="sohag" className="text-dark">سوهاج</option>
                      <option value="qena" className="text-dark">قنا</option>
                      <option value="luxor" className="text-dark">الأقصر</option>
                      <option value="aswan" className="text-dark">أسوان</option>
                      <option value="hurghada" className="text-dark">البحر الأحمر</option>
                      <option value="matrouh" className="text-dark">مطروح</option>
                      <option value="north-sinai" className="text-dark">شمال سيناء</option>
                      <option value="south-sinai" className="text-dark">جنوب سيناء</option>
                    </select>
                  </div>
                  <div className="col-md-4 text-center text-md-end">
                    {isClient ? (
                      <>
                        <div className="display-4 fw-bold font-monospace">
                          {currentTime.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: true,
                          })}
                        </div>
                        <p className="mb-0 small">
                          {currentTime.toLocaleDateString("ar-SA-u-ca-gregory", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </>
                    ) : (
                      <div className="display-4 fw-bold font-monospace">00:00:00</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Prayer with Countdown */}
          <div className="col-12">
            <div className="card border-0 shadow-lg rounded-4 card-hover bg-body">
              <div className="card-body p-4">
                <div className="row align-items-center">
                  <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
                    <p className="text-body-secondary mb-2">الأذان القادم</p>
                    <h3 className="h2 fw-bold mb-2" style={{ color: nextPrayer.color }}>
                      {nextPrayer.name}
                    </h3>
                    <div
                      className="display-4 fw-bold text-white p-3 rounded-3 d-inline-block font-monospace"
                      style={{ background: nextPrayer.gradient }}
                    >
                      {nextPrayer.time}
                    </div>
                  </div>
                  <div className="col-md-6 text-center text-md-end">
                    <p className="text-body-secondary mb-2">الوقت المتبقي</p>
                    {isClient ? (
                      <div className="d-flex justify-content-center justify-content-md-end gap-2">
                        <div className="text-center">
                          <div
                            className="display-4 fw-bold text-white rounded-3 d-flex align-items-center justify-content-center font-monospace"
                            style={{ background: nextPrayer.gradient, width: "80px", height: "80px" }}
                          >
                            {String(timeRemaining.hours).padStart(2, "0")}
                          </div>
                          <small className="text-body-secondary">ساعة</small>
                        </div>
                        <div className="display-4 fw-bold" style={{ color: nextPrayer.color }}>
                          :
                        </div>
                        <div className="text-center">
                          <div
                            className="display-4 fw-bold text-white rounded-3 d-flex align-items-center justify-content-center font-monospace"
                            style={{ background: nextPrayer.gradient, width: "80px", height: "80px" }}
                          >
                            {String(timeRemaining.minutes).padStart(2, "0")}
                          </div>
                          <small className="text-body-secondary">دقيقة</small>
                        </div>
                        <div className="display-4 fw-bold" style={{ color: nextPrayer.color }}>
                          :
                        </div>
                        <div className="text-center">
                          <div
                            className="display-4 fw-bold text-white rounded-3 d-flex align-items-center justify-content-center font-monospace"
                            style={{ background: nextPrayer.gradient, width: "80px", height: "80px" }}
                          >
                            {String(timeRemaining.seconds).padStart(2, "0")}
                          </div>
                          <small className="text-body-secondary">ثانية</small>
                        </div>
                      </div>
                    ) : (
                      <div className="h3">--:--:--</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* All Prayer Times */}
          <div className="col-12">
            <div className="row g-3">
              {prayerTimes.map((prayer, index) => (
                <div key={prayer.name} className="col-12 col-sm-6 col-lg-4">
                  <div
                    className={`card border-0 shadow card-hover h-100 bg-body ${index === nextPrayerIndex ? "border-3 border-success" : ""
                      }`}
                    style={
                      index === nextPrayerIndex
                        ? { borderColor: prayer.color, borderWidth: "3px", borderStyle: "solid" }
                        : {}
                    }
                  >
                    <div className="p-1" style={{ background: prayer.gradient }}></div>
                    <div className="card-body p-4 text-center">
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
                      <h4 className="h5 fw-bold mb-2">{prayer.name}</h4>
                      <div className="display-6 fw-bold font-monospace">
                        {prayer.time}
                      </div>
                      {index === nextPrayerIndex && (
                        <div className="mt-3">
                          <span
                            className="badge rounded-pill px-3 py-2"
                            style={{ background: prayer.gradient }}
                          >
                            <i className="fas fa-bell me-1"></i>
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
          <div className="col-12">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="card border-0 shadow card-hover h-100 bg-body">
                  <div className="card-body p-4">
                    <h5 className="d-flex align-items-center gap-2 mb-3">
                      <i className="fas fa-calendar-alt text-teal-600"></i>
                      <span>التاريخ الهجري</span>
                    </h5>
                    {isClient ? (
                      <p className="h4 mb-0">
                        {new Date().toLocaleDateString("ar-SA-u-ca-islamic", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    ) : (
                      <p className="h4 mb-0">...</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card border-0 shadow card-hover h-100 bg-body">
                  <div className="card-body p-4">
                    <h5 className="d-flex align-items-center gap-2 mb-3">
                      <i className="fas fa-compass text-teal-600"></i>
                      <span>اتجاه القبلة</span>
                    </h5>
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-circle bg-body-secondary d-flex align-items-center justify-content-center"
                        style={{ width: "60px", height: "60px" }}
                      >
                        <i
                          className="fas fa-location-arrow text-teal-600 fs-3"
                          style={{
                            transform: `rotate(${qiblaDirection - 45}deg)`, // -45 because icon points NE by default
                            transition: 'transform 1s ease-out'
                          }}
                        ></i>
                      </div>
                      <div>
                        <p className="h4 mb-0 fw-bold">{qiblaDirection}°</p>
                        <p className="text-body-secondary small mb-0">من الشمال</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
