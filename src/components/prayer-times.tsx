"use client"

import * as React from "react"

type City = 'cairo' | 'assiut' | 'new-valley'

interface CityInfo {
  name: string
  englishName: string
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
  'cairo': { name: 'القاهرة', englishName: 'Cairo' },
  'assiut': { name: 'أسيوط', englishName: 'Assiut' },
  'new-valley': { name: 'الوادي الجديد', englishName: 'Al Wadi al Jadid' }
}

export function PrayerTimes() {
  const [currentTime, setCurrentTime] = React.useState(new Date())
  const [selectedCity, setSelectedCity] = React.useState<City>('cairo')
  const [prayerTimesData, setPrayerTimesData] = React.useState<PrayerTimesData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [isClient, setIsClient] = React.useState(false)

  // Fetch prayer times from API
  React.useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        setLoading(true)
        const cityInfo = egyptCities[selectedCity]
        const response = await fetch(
          `https://api.aladhan.com/v1/timingsByCity?city=${cityInfo.englishName}&country=Egypt&method=5`
        )
        const data = await response.json()
        
        if (data.code === 200 && data.data.timings) {
          const timings = data.data.timings
          setPrayerTimesData({
            fajr: timings.Fajr,
            sunrise: timings.Sunrise,
            dhuhr: timings.Dhuhr,
            asr: timings.Asr,
            maghrib: timings.Maghrib,
            isha: timings.Isha
          })
        }
      } catch (error) {
        console.error('Error fetching prayer times:', error)
        // Fallback to static times if API fails
        setPrayerTimesData({
          fajr: '04:45',
          sunrise: '06:15',
          dhuhr: '12:05',
          asr: '15:25',
          maghrib: '17:55',
          isha: '19:15'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPrayerTimes()
  }, [selectedCity])

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    setIsClient(true)
    return () => clearInterval(timer)
  }, [])

  const cityData = egyptCities[selectedCity]

  // Default prayer times while loading
  const defaultPrayerTimes = {
    fajr: '00:00',
    sunrise: '00:00',
    dhuhr: '00:00',
    asr: '00:00',
    maghrib: '00:00',
    isha: '00:00'
  }

  const times = prayerTimesData || defaultPrayerTimes

  const prayerTimes = [
    { name: "الفجر", time: times.fajr, icon: "fa-cloud-moon", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)" },
    { name: "الشروق", time: times.sunrise, icon: "fa-sun", color: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b, #f97316)" },
    { name: "الظهر", time: times.dhuhr, icon: "fa-sun", color: "#eab308", gradient: "linear-gradient(135deg, #eab308, #facc15)" },
    { name: "العصر", time: times.asr, icon: "fa-cloud-sun", color: "#f97316", gradient: "linear-gradient(135deg, #f97316, #fb923c)" },
    { name: "المغرب", time: times.maghrib, icon: "fa-sunset", color: "#ec4899", gradient: "linear-gradient(135deg, #ec4899, #f472b6)" },
    { name: "العشاء", time: times.isha, icon: "fa-moon", color: "#8b5cf6", gradient: "linear-gradient(135deg, #8b5cf6, #a78bfa)" },
  ]

  const currentHour = currentTime.getHours()
  const currentMinute = currentTime.getMinutes()
  const currentSeconds = currentTime.getSeconds()
  
  // Determine next prayer
  const getCurrentPrayerIndex = () => {
    const currentTimeMinutes = currentHour * 60 + currentMinute
    
    for (let i = 0; i < prayerTimes.length; i++) {
      const [hour, minute] = prayerTimes[i].time.split(':').map(Number)
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
    const [prayerHour, prayerMinute] = nextPrayer.time.split(':').map(Number)
    let totalMinutesRemaining = (prayerHour * 60 + prayerMinute) - (currentHour * 60 + currentMinute)
    
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
                      onChange={(e) => setSelectedCity(e.target.value as City)}
                      style={{backdropFilter: 'blur(10px)'}}
                    >
                      <option value="cairo" className="text-dark">القاهرة</option>
                      <option value="assiut" className="text-dark">أسيوط</option>
                      <option value="new-valley" className="text-dark">الوادي الجديد</option>
                    </select>
                  </div>
                  <div className="col-md-4 text-center text-md-end">
                    {isClient ? (
                      <>
                        <div className="display-4 fw-bold font-monospace">
                          {currentTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <p className="mb-0 small">
                          {currentTime.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                      </>
                    ) : <div className="display-4 fw-bold font-monospace">00:00:00</div>}
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
                    <h3 className="h2 fw-bold mb-2" style={{color: nextPrayer.color}}>
                      {nextPrayer.name}
                    </h3>
                    <div 
                      className="display-4 fw-bold text-white p-3 rounded-3 d-inline-block font-monospace"
                      style={{background: nextPrayer.gradient}}
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
                            style={{background: nextPrayer.gradient, width: '80px', height: '80px'}}
                          >
                            {String(timeRemaining.hours).padStart(2, '0')}
                          </div>
                          <small className="text-body-secondary">ساعة</small>
                        </div>
                        <div className="display-4 fw-bold" style={{color: nextPrayer.color}}>:</div>
                        <div className="text-center">
                          <div 
                            className="display-4 fw-bold text-white rounded-3 d-flex align-items-center justify-content-center font-monospace"
                            style={{background: nextPrayer.gradient, width: '80px', height: '80px'}}
                          >
                            {String(timeRemaining.minutes).padStart(2, '0')}
                          </div>
                          <small className="text-body-secondary">دقيقة</small>
                        </div>
                        <div className="display-4 fw-bold" style={{color: nextPrayer.color}}>:</div>
                        <div className="text-center">
                          <div 
                            className="display-4 fw-bold text-white rounded-3 d-flex align-items-center justify-content-center font-monospace"
                            style={{background: nextPrayer.gradient, width: '80px', height: '80px'}}
                          >
                            {String(timeRemaining.seconds).padStart(2, '0')}
                          </div>
                          <small className="text-body-secondary">ثانية</small>
                        </div>
                      </div>
                    ) : <div className="h3">--:--:--</div>}
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
                    className={`card border-0 shadow card-hover h-100 bg-body ${index === nextPrayerIndex ? 'border-3 border-success' : ''}`}
                    style={index === nextPrayerIndex ? {borderColor: prayer.color, borderWidth: '3px', borderStyle: 'solid'} : {}}
                  >
                    <div 
                      className="p-1" 
                      style={{background: prayer.gradient}}
                    ></div>
                    <div className="card-body p-4 text-center">
                      <div 
                        className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                        style={{
                          width: '70px',
                          height: '70px',
                          background: prayer.gradient,
                        }}
                      >
                        <i className={`fas ${prayer.icon} text-white fs-2`}></i>
                      </div>
                      <h4 className="h5 fw-bold mb-2">{prayer.name}</h4>
                      <div 
                        className="display-6 fw-bold font-monospace"
                        style={{color: prayer.color}}
                      >
                        {prayer.time}
                      </div>
                      {index === nextPrayerIndex && (
                        <div className="mt-3">
                          <span className="badge rounded-pill px-3 py-2" style={{background: prayer.gradient}}>
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
                        {new Date().toLocaleDateString('ar-SA-u-ca-islamic', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </p>
                    ) : <p className="h4 mb-0">...</p>}
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
                        style={{width: '60px', height: '60px'}}
                      >
                        <i className="fas fa-location-arrow text-teal-600 fs-3"></i>
                      </div>
                      <div>
                        <p className="h4 mb-0 fw-bold">45°</p>
                        <p className="text-body-secondary small mb-0">شمال شرق</p>
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