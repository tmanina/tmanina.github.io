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
  adhkarRead: number
  surahsCompleted: number
}

type ProgressData = {
  history: Record<string, number>
  lastDate?: string
}

type WidgetId =
  | "row1"
  | "row2"
  | "streak_achievements"
  | "weekly_report"
  | "summary"

const WIDGETS: { id: WidgetId; label: string; icon: string }[] = [
  { id: "row1", label: "البطاقات الأساسية", icon: "fa-chart-simple" },
  { id: "row2", label: "إحصائيات إضافية", icon: "fa-chart-line" },
  { id: "streak_achievements", label: "إنجازات الاستمرار", icon: "fa-fire" },
  { id: "weekly_report", label: "التقرير الأسبوعي", icon: "fa-chart-bar" },
  { id: "summary", label: "ملخص الحالة", icon: "fa-list-check" },
]

const WIDGET_STORAGE_KEY = "tmanina_dashboard_widgets"
const DEFAULT_WIDGETS: WidgetId[] = ["row1", "row2", "streak_achievements", "weekly_report", "summary"]
const PROGRESS_STORAGE_KEY = "tmanina_progress"
const COMPLETED_SURAHS_KEY = "completed-surahs"
const STREAK_MILESTONES = [3, 7, 14, 30]

function getNextStreakTarget(streak: number) {
  return STREAK_MILESTONES.find((target) => streak < target) || null
}

function loadWidgetPrefs(): Set<WidgetId> {
  if (typeof window === "undefined") return new Set(DEFAULT_WIDGETS)
  try {
    const raw = localStorage.getItem(WIDGET_STORAGE_KEY)
    if (!raw) return new Set(DEFAULT_WIDGETS)
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set(DEFAULT_WIDGETS)
    return new Set(parsed as WidgetId[])
  } catch {
    return new Set(DEFAULT_WIDGETS)
  }
}

function saveWidgetPrefs(enabled: Set<WidgetId>) {
  localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify([...enabled]))
}

function loadProgressFromStorage(): { stats: Stats; weekData: { day: string; value: number }[] } {
  if (typeof window === "undefined") {
    return {
      stats: { todayDhikr: 0, weeklyDhikr: 0, monthlyDhikr: 0, streak: 0, adhkarRead: 0, surahsCompleted: 0 },
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
    } catch { /* ignore */ }
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
  const monthPrefix = todayKey.slice(0, 7)
  let monthlyDhikr = 0
  for (const [dateStr, val] of Object.entries(history)) {
    if (dateStr.startsWith(monthPrefix)) {
      monthlyDhikr += val
    }
  }

  // streak: أيام متتالية
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

  // الأذكار المقرؤة اليوم (صباح، مساء، نوم)
  const todayStr = today.toDateString()
  const adhkarKeys = ["lastMorningAdhkarRead", "lastEveningAdhkarRead", "lastSleepAdhkarRead"]
  const adhkarRead = adhkarKeys.filter((k) => window.localStorage.getItem(k) === todayStr).length

  // السور المختومة
  let surahsCompleted = 0
  try {
    const rawSurahs = window.localStorage.getItem(COMPLETED_SURAHS_KEY)
    if (rawSurahs) {
      const parsed = JSON.parse(rawSurahs)
      surahsCompleted = Array.isArray(parsed) ? parsed.length : 0
    }
  } catch { /* ignore */ }

  const stats: Stats = {
    todayDhikr,
    weeklyDhikr,
    monthlyDhikr,
    streak,
    adhkarRead,
    surahsCompleted,
  }

  return { stats, weekData }
}

export function Dashboard({ compact = false }: DashboardProps) {
  const [stats, setStats] = React.useState<Stats>({
    todayDhikr: 0,
    weeklyDhikr: 0,
    monthlyDhikr: 0,
    streak: 0,
    adhkarRead: 0,
    surahsCompleted: 0,
  })

  const [weekData, setWeekData] = React.useState<{ day: string; value: number }[]>([])

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const refresh = () => {
      const { stats, weekData } = loadProgressFromStorage()
      setStats(stats)
      setWeekData(weekData)
    }

    refresh()

    const handler = () => refresh()
    window.addEventListener("tmanina-progress-updated", handler)
    window.addEventListener("storage", handler)

    return () => {
      window.removeEventListener("tmanina-progress-updated", handler)
      window.removeEventListener("storage", handler)
    }
  }, [])

  const maxValue = weekData.length ? Math.max(...weekData.map((d) => d.value), 1) : 1
  const nextStreakTarget = getNextStreakTarget(stats.streak)

  // ====== نسخة compact (تُستخدم في الصفحة الرئيسية) ======
  if (compact) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="shadow card-hover h-full bg-card border border-border rounded-xl overflow-hidden">
          <div className="gradient-bg" style={{ height: "4px" }}></div>
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">أذكار اليوم</p>
                <h3 className="text-lg mb-0 font-bold gradient-text">{stats.todayDhikr}</h3>
              </div>
              <i className="fas fa-calendar-day text-4xl text-muted-foreground"></i>
            </div>
          </div>
        </div>

        <div className="shadow card-hover h-full bg-card border border-border rounded-xl overflow-hidden">
          <div style={{ height: "4px", background: "linear-gradient(to right, #3b82f6, #06b6d4)" }}></div>
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">هذا الأسبوع</p>
                <h3 className="text-lg mb-0 font-bold text-emerald-600 dark:text-emerald-400">{stats.weeklyDhikr}</h3>
              </div>
              <i className="fas fa-calendar-week text-4xl text-muted-foreground"></i>
            </div>
          </div>
        </div>

        <div className="shadow card-hover h-full bg-card border border-border rounded-xl overflow-hidden">
          <div style={{ height: "4px", background: "linear-gradient(to right, #a855f7, #ec4899)" }}></div>
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">هذا الشهر</p>
                <h3 className="text-lg mb-0 font-bold text-purple-600 dark:text-purple-400">{stats.monthlyDhikr}</h3>
              </div>
              <i className="fas fa-calendar-alt text-4xl text-muted-foreground"></i>
            </div>
          </div>
        </div>

        <div className="shadow card-hover h-full bg-card border border-border rounded-xl overflow-hidden">
          <div style={{ height: "4px", background: "linear-gradient(to right, #f59e0b, #f97316)" }}></div>
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">متتالية</p>
                <h3 className="text-lg mb-0 font-bold text-amber-600 dark:text-amber-400">{stats.streak} يوم</h3>
              </div>
              <i className="fas fa-fire text-4xl text-muted-foreground"></i>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ========== النسخة الكاملة المطوّرة ==========
  const [enabledWidgets, setEnabledWidgets] = React.useState<Set<WidgetId>>(new Set(DEFAULT_WIDGETS))
  const [showSettings, setShowSettings] = React.useState(false)

  React.useEffect(() => {
    setEnabledWidgets(loadWidgetPrefs())
  }, [])

  const toggleWidget = (id: WidgetId) => {
    setEnabledWidgets((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      saveWidgetPrefs(next)
      return next
    })
  }

  const isVisible = (id: WidgetId) => enabledWidgets.has(id)

  return (
    <div className="flex flex-col gap-6">
      {/* عنوان الصفحة + زر الإعدادات */}
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <h2 className="text-2xl font-bold gradient-text mb-1">لوحة النشاط</h2>
          <p className="text-muted-foreground text-lg">إحصائيات عبادتك اليومية والأسبوعية</p>
        </div>
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="self-start rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="تخصيص"
        >
          <i className={`fas fa-cog ${showSettings ? "text-primary" : ""} text-xl`} />
        </button>
      </div>

      {/* لوحة الإعدادات */}
      {showSettings && (
        <div className="shadow-lg bg-card border border-border rounded-xl p-4">
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
            <i className="fas fa-sliders-h text-primary" />
            تخصيص الأقسام الظاهرة
          </h4>
          <div className="flex flex-col gap-2">
            {WIDGETS.map((w) => (
              <label
                key={w.id}
                className="flex items-center justify-between gap-3 cursor-pointer rounded-lg p-2 hover:bg-muted/50 transition-colors"
              >
                <span className="flex items-center gap-2 text-sm">
                  <i className={`fas ${w.icon} text-muted-foreground`} />
                  {w.label}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isVisible(w.id)}
                  onClick={() => toggleWidget(w.id)}
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${isVisible(w.id) ? "bg-emerald-500" : "bg-muted"}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${isVisible(w.id) ? "translate-x-4" : "translate-x-0"}`}
                  />
                </button>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* === الصف الأول: البطاقات الأساسية === */}
      {isVisible("row1") && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* الأذكار المقرؤة */}
        <div className="shadow-lg card-hover bg-card rounded-xl overflow-hidden">
          <div style={{ height: "4px", background: "linear-gradient(to right, #10b981, #059669)" }}></div>
          <div className="p-3 text-center">
            <div className="rounded-full bg-muted inline-flex items-center justify-center mb-2"
              style={{ width: "50px", height: "50px" }}
            >
              <i className="fas fa-book-open text-emerald-600 dark:text-emerald-400 text-xl"></i>
            </div>
            <h6 className="text-xs text-muted-foreground mb-1">الأذكار المقرؤة</h6>
            <h3 className="text-2xl mb-0 font-bold text-emerald-600 dark:text-emerald-400">
              {stats.adhkarRead}
            </h3>
            <p className="text-xs text-muted-foreground mb-0">من 3 أذكار</p>
          </div>
        </div>

        {/* السور المختومة */}
        <div className="shadow-lg card-hover bg-card rounded-xl overflow-hidden">
          <div style={{ height: "4px", background: "linear-gradient(to right, #8b5cf6, #6d28d9)" }}></div>
          <div className="p-3 text-center">
            <div className="rounded-full bg-muted inline-flex items-center justify-center mb-2"
              style={{ width: "50px", height: "50px" }}
            >
              <i className="fas fa-quran text-purple-600 dark:text-purple-400 text-xl"></i>
            </div>
            <h6 className="text-xs text-muted-foreground mb-1">السور المختومة</h6>
            <h3 className="text-2xl mb-0 font-bold text-purple-600 dark:text-purple-400">
              {stats.surahsCompleted}
            </h3>
            <p className="text-xs text-muted-foreground mb-0">من 114 سورة</p>
          </div>
        </div>

        {/* أيام متتالية */}
        <div className="shadow-lg card-hover bg-card rounded-xl overflow-hidden">
          <div style={{ height: "4px", background: "linear-gradient(to right, #f59e0b, #f97316)" }}></div>
          <div className="p-3 text-center">
            <div className="rounded-full bg-muted inline-flex items-center justify-center mb-2"
              style={{ width: "50px", height: "50px" }}
            >
              <i className="fas fa-fire text-amber-500 text-xl"></i>
            </div>
            <h6 className="text-xs text-muted-foreground mb-1">أيام متتالية</h6>
            <h3 className="text-2xl mb-0 font-bold text-amber-600 dark:text-amber-400">{stats.streak}</h3>
            <p className="text-xs text-muted-foreground mb-0">يوم</p>
          </div>
        </div>

        {/* أذكار اليوم */}
        <div className="shadow-lg card-hover bg-card rounded-xl overflow-hidden">
          <div className="gradient-bg" style={{ height: "4px" }}></div>
          <div className="p-3 text-center">
            <div className="rounded-full bg-muted inline-flex items-center justify-center mb-2"
              style={{ width: "50px", height: "50px" }}
            >
              <i className="fas fa-calendar-day text-primary text-xl"></i>
            </div>
            <h6 className="text-xs text-muted-foreground mb-1">أذكار اليوم</h6>
            <h3 className="text-2xl mb-0 font-bold gradient-text">{stats.todayDhikr}</h3>
            <p className="text-xs text-muted-foreground mb-0">تسبيحة</p>
          </div>
        </div>
      </div>
      )}

      {/* === الصف الثاني: إحصائيات إضافية === */}
      {isVisible("row2") && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* هذا الأسبوع */}
        <div className="shadow-lg card-hover bg-card rounded-xl overflow-hidden">
          <div className="p-4 text-center">
            <div className="rounded-full bg-muted inline-flex items-center justify-center mb-3"
              style={{ width: "60px", height: "60px" }}
            >
              <i className="fas fa-calendar-week text-primary text-2xl"></i>
            </div>
            <h6 className="text-sm text-muted-foreground mb-1">إجمالي هذا الأسبوع</h6>
            <h3 className="text-3xl mb-0 font-bold text-primary">{stats.weeklyDhikr}</h3>
            <p className="text-xs text-muted-foreground mb-0">تسبيحة</p>
          </div>
        </div>

        {/* هذا الشهر */}
        <div className="shadow-lg card-hover bg-card rounded-xl overflow-hidden">
          <div className="p-4 text-center">
            <div className="rounded-full bg-muted inline-flex items-center justify-center mb-3"
              style={{ width: "60px", height: "60px" }}
            >
              <i className="fas fa-calendar-alt text-2xl text-purple-600 dark:text-purple-400"></i>
            </div>
            <h6 className="text-sm text-muted-foreground mb-1">إجمالي هذا الشهر</h6>
            <h3 className="text-3xl mb-0 font-bold text-purple-600 dark:text-purple-400">
              {stats.monthlyDhikr}
            </h3>
            <p className="text-xs text-muted-foreground mb-0">تسبيحة</p>
          </div>
        </div>

        {/* المعدل اليومي */}
        <div className="shadow-lg card-hover bg-card rounded-xl overflow-hidden">
          <div className="p-4 text-center">
            <div className="rounded-full bg-muted inline-flex items-center justify-center mb-3"
              style={{ width: "60px", height: "60px" }}
            >
              <i className="fas fa-chart-line text-2xl text-cyan-600 dark:text-cyan-400"></i>
            </div>
            <h6 className="text-sm text-muted-foreground mb-1">المعدل اليومي</h6>
            <h3 className="text-3xl mb-0 font-bold text-cyan-600 dark:text-cyan-400">
              {stats.weeklyDhikr > 0 ? Math.round(stats.weeklyDhikr / Math.max(stats.streak, 1)) : 0}
            </h3>
            <p className="text-xs text-muted-foreground mb-0">تسبيحة/يوم</p>
          </div>
        </div>
      </div>
      )}

      {/* === إنجازات الاستمرار === */}
      {isVisible("streak_achievements") && (
      <div className="shadow-lg card-hover bg-card rounded-xl overflow-hidden">
        <div className="p-4 md:p-5">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-bold gradient-text mb-1 flex items-center gap-2">
                <i className="fas fa-fire" />
                إنجازات الاستمرار
              </h3>
              <p className="mb-0 text-sm text-muted-foreground">
                {stats.streak > 0
                  ? `أنت مستمر منذ ${stats.streak} يوم.`
                  : "ابدأ اليوم ليظهر تقدمك المتتالي هنا."}
              </p>
            </div>
            <div className="rounded-full bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-600 dark:text-amber-400">
              {nextStreakTarget
                ? `الهدف القادم: ${nextStreakTarget} أيام`
                : "حققت كل أهداف الاستمرار"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {STREAK_MILESTONES.map((target) => {
              const achieved = stats.streak >= target
              const progress = Math.min((stats.streak / target) * 100, 100)

              return (
                <div
                  key={target}
                  className={`rounded-xl border p-3 transition-colors ${achieved
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-border bg-muted/40"
                    }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`text-sm font-bold ${achieved ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                      {target} أيام
                    </span>
                    <i className={`fas ${achieved ? "fa-check-circle text-emerald-500" : "fa-circle text-muted-foreground"} text-sm`} />
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-background">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        background: achieved
                          ? "linear-gradient(to right, #10b981, #059669)"
                          : "linear-gradient(to right, #f59e0b, #f97316)",
                      }}
                    />
                  </div>
                  <p className="mt-2 mb-0 text-xs text-muted-foreground">
                    {achieved ? "مكتمل" : `باقي ${target - stats.streak} يوم`}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      )}

      {/* === التقرير الأسبوعي === */}
      {isVisible("weekly_report") && (
      <div className="w-full">
        <div className="shadow-lg card-hover bg-card rounded-xl overflow-hidden">
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold gradient-text flex items-center gap-2">
                <i className="fas fa-chart-bar"></i>
                التقرير الأسبوعي
              </h3>
              <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                إجمالي: {stats.weeklyDhikr} تسبيحة
              </span>
            </div>

            <div
              className="flex items-end justify-around gap-2"
              style={{ height: "250px" }}
            >
              {weekData.map((item) => (
                <div
                  key={item.day}
                  className="flex flex-col items-center gap-2 flex-1"
                >
                  <div
                    className="w-full rounded-t-lg relative group cursor-pointer transition-all duration-300 hover:opacity-80"
                    style={{
                      height: `${Math.max((item.value / maxValue) * 100, 5)}%`,
                      background: item.value > 0
                        ? "linear-gradient(to top, #14b8a6, #06b6d4)"
                        : "linear-gradient(to top, #e5e7eb, #d1d5db)",
                      minHeight: "20px",
                      transition: "all 0.3s",
                    }}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.value}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.day}</span>
                </div>
              ))}
              {weekData.length === 0 && (
                <div className="text-center w-full text-muted-foreground text-xs">
                  لا يوجد نشاط مسجل بعد
                </div>
              )}
            </div>

            {/* شريط التقدم الأسبوعي */}
            <div className="mt-6">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>تقدم الأسبوع</span>
                <span>{Math.min(Math.round((stats.weeklyDhikr / 100) * 100), 100)}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((stats.weeklyDhikr / 100) * 100, 100)}%`,
                    background: "linear-gradient(to right, #14b8a6, #06b6d4)",
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                الهدف: 100 تسبيحة أسبوعياً
              </p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* === ملخص الحالة === */}
      {isVisible("summary") && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="shadow-lg card-hover bg-card rounded-xl overflow-hidden p-4">
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
            <i className="fas fa-check-circle text-emerald-500" />
            إنجازات اليوم
          </h4>
          <ul className="space-y-2 mb-0 list-none">
            <li className="flex items-center gap-2 text-sm">
              <i className={`fas ${stats.adhkarRead > 0 ? "fa-check-circle text-emerald-500" : "fa-circle text-muted-foreground"} text-xs`} />
              <span className={stats.adhkarRead > 0 ? "" : "text-muted-foreground"}>
                قراءة الأذكار ({stats.adhkarRead}/3)
              </span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <i className={`fas ${stats.todayDhikr > 0 ? "fa-check-circle text-emerald-500" : "fa-circle text-muted-foreground"} text-xs`} />
              <span className={stats.todayDhikr > 0 ? "" : "text-muted-foreground"}>
                التسبيح ({stats.todayDhikr} تسبيحة)
              </span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <i className={`fas ${stats.streak > 0 ? "fa-check-circle text-emerald-500" : "fa-circle text-muted-foreground"} text-xs`} />
              <span className={stats.streak > 0 ? "" : "text-muted-foreground"}>
                استمرار {stats.streak > 0 ? `${stats.streak} يوم متتالي` : "لم تبدأ بعد"}
              </span>
            </li>
          </ul>
        </div>

        <div className="shadow-lg card-hover bg-card rounded-xl overflow-hidden p-4">
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
            <i className="fas fa-trophy text-amber-500" />
            السور المختومة
          </h4>
          <div className="text-center py-2">
            <div className="text-4xl font-bold" style={{ color: "#8b5cf6" }}>
              {stats.surahsCompleted}
            </div>
            <p className="text-sm text-muted-foreground mb-3">من 114 سورة</p>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((stats.surahsCompleted / 114) * 100, 100)}%`,
                  background: "linear-gradient(to right, #8b5cf6, #6d28d9)",
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.surahsCompleted >= 114
                ? "🎉 ماشاء الله! ختمت القرآن كاملاً"
                : `${114 - stats.surahsCompleted} سورة متبقية`}
            </p>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
