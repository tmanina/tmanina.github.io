"use client"

import * as React from "react"

interface DashboardProps {
  compact?: boolean
}

type Stats = {
  todayDhikr: number
  weeklyDhikr: number
  monthlyDhikr: number
  streak: number
}

type ProgressData = {
  history: Record<string, number>
  lastDate?: string
}

const PROGRESS_STORAGE_KEY = "tmanina_progress"

function loadProgressFromStorage(): { stats: Stats; weekData: { day: string; value: number }[] } {
  if (typeof window === "undefined") {
    return {
      stats: { todayDhikr: 0, weeklyDhikr: 0, monthlyDhikr: 0, streak: 0 },
      weekData: [],
    }
  }

  let history: Record<string, number> = {}

  const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as ProgressData
      if (parsed && parsed.history && typeof parsed.history === "object") {
        history = parsed.history
      }
    } catch {
      // ignore invalid
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayKey = today.toISOString().slice(0, 10)
  const todayDhikr = history[todayKey] ?? 0

  // آخر 7 أيام
  let weeklyDhikr = 0
  const weekData: { day: string; value: number }[] = []
  const weekdayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const value = history[key] ?? 0
    weeklyDhikr += value
    const dayName = weekdayNames[d.getDay()]
    weekData.push({ day: dayName, value })
  }

  // هذا الشهر
  const monthPrefix = todayKey.slice(0, 7) // YYYY-MM
  let monthlyDhikr = 0
  for (const [dateStr, val] of Object.entries(history)) {
    if (dateStr.startsWith(monthPrefix)) {
      monthlyDhikr += val
    }
  }

  // streak: أيام متتالية (من اليوم رجوعًا) فيها ذكر > 0
  let streak = 0
  while (true) {
    const d = new Date(today)
    d.setDate(today.getDate() - streak)
    const key = d.toISOString().slice(0, 10)
    const val = history[key] ?? 0
    if (val > 0) {
      streak++
    } else {
      break
    }
  }

  const stats: Stats = {
    todayDhikr,
    weeklyDhikr,
    monthlyDhikr,
    streak,
  }

  return { stats, weekData }
}

export function Dashboard({ compact = false }: DashboardProps) {
  const [stats, setStats] = React.useState<Stats>({
    todayDhikr: 0,
    weeklyDhikr: 0,
    monthlyDhikr: 0,
    streak: 0,
  })

  const [weekData, setWeekData] = React.useState<{ day: string; value: number }[]>([])

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const refresh = () => {
      const { stats, weekData } = loadProgressFromStorage()
      setStats(stats)
      setWeekData(weekData)
    }

    // أول تحميل
    refresh()

    // التحديث عند تغيير localStorage من نفس الصفحة
    const handler = () => refresh()
    window.addEventListener("tmanina-progress-updated", handler)
    // ولو حابب من تبويب تاني
    window.addEventListener("storage", handler)

    return () => {
      window.removeEventListener("tmanina-progress-updated", handler)
      window.removeEventListener("storage", handler)
    }
  }, [])

  const maxValue = weekData.length ? Math.max(...weekData.map((d) => d.value), 1) : 1

  // ====== نسخة compact (تُستخدم في الصفحة الرئيسية) ======
  if (compact) {
    return (
      <div className="row g-3">
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow card-hover h-100 bg-body">
            <div className="gradient-bg" style={{ height: "4px" }}></div>
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="small text-body-secondary mb-1">أذكار اليوم</p>
                  <h3 className="h4 mb-0 fw-bold gradient-text">{stats.todayDhikr}</h3>
                </div>
                <i className="fas fa-calendar-day fs-1 text-body-secondary"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow card-hover h-100 bg-body">
            <div style={{ height: "4px", background: "linear-gradient(to right, #3b82f6, #06b6d4)" }}></div>
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="small text-body-secondary mb-1">هذا الأسبوع</p>
                  <h3 className="h4 mb-0 fw-bold text-primary">{stats.weeklyDhikr}</h3>
                </div>
                <i className="fas fa-calendar-week fs-1 text-body-secondary"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow card-hover h-100 bg-body">
            <div style={{ height: "4px", background: "linear-gradient(to right, #a855f7, #ec4899)" }}></div>
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="small text-body-secondary mb-1">هذا الشهر</p>
                  <h3 className="h4 mb-0 fw-bold" style={{ color: "#a855f7" }}>
                    {stats.monthlyDhikr}
                  </h3>
                </div>
                <i className="fas fa-calendar-alt fs-1 text-body-secondary"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow card-hover h-100 bg-body">
            <div style={{ height: "4px", background: "linear-gradient(to right, #f59e0b, #f97316)" }}></div>
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="small text-body-secondary mb-1">متتالية</p>
                  <h3 className="h4 mb-0 fw-bold text-warning">{stats.streak} يوم</h3>
                </div>
                <i className="fas fa-fire fs-1 text-body-secondary"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ====== النسخة الكاملة ======
  return (
    <div className="row g-4">
      <div className="col-12">
        <div className="row g-3">
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-lg card-hover bg-body">
              <div className="gradient-bg" style={{ height: "4px" }}></div>
              <div className="card-body text-center p-3">
                <div
                  className="rounded-circle bg-body-secondary d-inline-flex align-items-center justify-content-center mb-2"
                  style={{ width: "50px", height: "50px" }}
                >
                  <i className="fas fa-calendar-day text-primary fs-4"></i>
                </div>
                <h6 className="small text-body-secondary mb-1">أذكار اليوم</h6>
                <h3 className="h2 mb-0 fw-bold gradient-text">{stats.todayDhikr}</h3>
                <p className="small text-body-secondary mb-0">تسبيحة</p>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-lg card-hover bg-body">
              <div style={{ height: "4px", background: "linear-gradient(to right, #3b82f6, #06b6d4)" }}></div>
              <div className="card-body text-center p-3">
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center mb-2 bg-body-secondary"
                  style={{ width: "50px", height: "50px" }}
                >
                  <i className="fas fa-calendar-week text-primary fs-4"></i>
                </div>
                <h6 className="small text-body-secondary mb-1">هذا الأسبوع</h6>
                <h3 className="h2 mb-0 fw-bold text-primary">{stats.weeklyDhikr}</h3>
                <p className="small text-body-secondary mb-0">تسبيحة</p>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-lg card-hover bg-body">
              <div style={{ height: "4px", background: "linear-gradient(to right, #a855f7, #ec4899)" }}></div>
              <div className="card-body text-center p-3">
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center mb-2 bg-body-secondary"
                  style={{ width: "50px", height: "50px" }}
                >
                  <i className="fas fa-calendar-alt fs-4" style={{ color: "#a855f7" }}></i>
                </div>
                <h6 className="small text-body-secondary mb-1">هذا الشهر</h6>
                <h3 className="h2 mb-0 fw-bold" style={{ color: "#a855f7" }}>
                  {stats.monthlyDhikr}
                </h3>
                <p className="small text-body-secondary mb-0">تسبيحة</p>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-lg card-hover bg-body">
              <div style={{ height: "4px", background: "linear-gradient(to right, #f59e0b, #f97316)" }}></div>
              <div className="card-body text-center p-3">
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center mb-2 bg-body-secondary"
                  style={{ width: "50px", height: "50px" }}
                >
                  <i className="fas fa-fire text-warning fs-4"></i>
                </div>
                <h6 className="small text-body-secondary mb-1">أيام متتالية</h6>
                <h3 className="h2 mb-0 fw-bold text-warning">{stats.streak}</h3>
                <p className="small text-body-secondary mb-0">يوم</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* مخطط النشاط الأسبوعي */}
      <div className="col-12">
        <div className="card border-0 shadow-lg card-hover bg-body">
          <div className="card-body p-4">
            <h3 className="h5 gradient-text d-flex align-items-center gap-2 mb-4">
              <i className="fas fa-chart-bar"></i>
              نشاطك الأسبوعي
            </h3>
            <div
              className="d-flex align-items-end justify-content-around gap-2"
              style={{ height: "250px" }}
            >
              {weekData.map((item) => (
                <div
                  key={item.day}
                  className="d-flex flex-column align-items-center gap-2 flex-fill"
                >
                  <div
                    className="w-100 rounded-top position-relative"
                    style={{
                      height: `${(item.value / maxValue) * 100}%`,
                      background: "linear-gradient(to top, #14b8a6, #06b6d4)",
                      minHeight: "20px",
                      transition: "all 0.3s",
                      cursor: "pointer",
                    }}
                    title={`${item.value}`}
                  >
                    <span className="position-absolute top-0 start-50 translate-middle badge bg-dark small">
                      {item.value}
                    </span>
                  </div>
                  <span className="small text-body-secondary">{item.day}</span>
                </div>
              ))}
              {weekData.length === 0 && (
                <div className="text-center w-100 text-body-secondary small">
                  لا يوجد نشاط مسجل بعد
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
