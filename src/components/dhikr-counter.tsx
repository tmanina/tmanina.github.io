"use client"

import * as React from "react"

// نفس المفتاح المستخدم في Dashboard وغيره
const PROGRESS_STORAGE_KEY = "tmanina_progress"

type ProgressData = {
  history: Record<string, number>
  lastDate?: string
}

type DhikrOption = {
  id: string
  text: string
  label: string
  defaultTarget: number
}

const DHIKR_OPTIONS: DhikrOption[] = [
  { id: "subhanallah", text: "سُبْحَانَ اللَّهِ", label: "تسبيحة", defaultTarget: 33 },
  { id: "alhamdulillah", text: "الْحَمْدُ لِلَّهِ", label: "تحميدة", defaultTarget: 33 },
  { id: "allahuakbar", text: "اللَّهُ أَكْبَرُ", label: "تكبيرة", defaultTarget: 33 },
  { id: "tahlil", text: "لَا إِلَهَ إِلَّا اللَّهُ", label: "تهليلة", defaultTarget: 100 },
  { id: "salat", text: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ", label: "صلاة على النبي ﷺ", defaultTarget: 10 },
  { id: "sbhan_bihamdih", text: "سبحان الله وبحمده , سبحان الله العظيم", label: "سبحان الله وبحمده", defaultTarget: 100 },
  { id: "la_elah_wa7dah", text: " لا إلهَ إلاَّ اللَّه وحْدهُ لاَ شَرِيكَ لهُ، لَهُ المُلْكُ، ولَهُ الحمْدُ، وَهُو عَلَى كُلِّ شَيءٍ قَدِيرٌ", label: "دعاء", defaultTarget: 10 },
  { id: "shahada", text: "أشهد أن لا إله إلا الله وأشهد أن محمدًا رسول الله", label: "شهادة", defaultTarget: 5 },
  { id: "astaghfirullah", text: "أستغفر الله", label: "استغفار", defaultTarget: 100 },
  { id: "la_hawla", text: "لا حول ولا قوة إلا بالله", label: "دعاء", defaultTarget: 100 },
  { id: "dhun_nun", text: "لا إله إلا أنت سبحانك إني كنت من الظالمين", label: "دعاء", defaultTarget: 100 },
]

// حفظ في localStorage للتقدم اليومي
function incrementDailyDhikr(step: number) {
  if (typeof window === "undefined") return

  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  let data: ProgressData = { history: {} }

  const raw = localStorage.getItem(PROGRESS_STORAGE_KEY)
  if (raw) {
    try {
      data = JSON.parse(raw)
    } catch { }
  }

  data.history[today] = (data.history[today] ?? 0) + step
  data.lastDate = today

  localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(data))
  window.dispatchEvent(new Event("tmanina-progress-updated"))
}

export function DhikrCounter() {
  const [selectedId, setSelectedId] = React.useState(DHIKR_OPTIONS[0].id)
  const selectedDhikr = DHIKR_OPTIONS.find((d) => d.id === selectedId)!

  const [target, setTarget] = React.useState(selectedDhikr.defaultTarget)
  const [count, setCount] = React.useState(0)
  const [totals, setTotals] = React.useState<Record<string, number>>({})
  const [hasVibrated, setHasVibrated] = React.useState(false)
  const [isPressed, setIsPressed] = React.useState(false)
  const [vibrationEnabled, setVibrationEnabled] = React.useState(true)

  const isInfinite = target === Number.MAX_SAFE_INTEGER
  const remaining = isInfinite ? "∞" : target - count
  const totalForCurrent = totals[selectedId] ?? 0
  const progress = isInfinite ? 100 : Math.min((count / target) * 100, 100)

  // Load vibration preference from localStorage
  React.useEffect(() => {
    const savedPref = localStorage.getItem('vibrationEnabled')
    if (savedPref !== null) {
      setVibrationEnabled(savedPref === 'true')
    }
  }, [])

  const toggleVibration = () => {
    const newValue = !vibrationEnabled
    setVibrationEnabled(newValue)
    localStorage.setItem('vibrationEnabled', String(newValue))
  }

  // إعادة الضبط عند تغيير الذكر
  React.useEffect(() => {
    setTarget(selectedDhikr.defaultTarget)
    setCount(0)
    setHasVibrated(false)
  }, [selectedDhikr])

  // تبديل الذكر
  const handleChangeDhikr = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedId(e.target.value)
  }

  // وظيفة التسبيح
  const handleTasbeehTap = () => {
    // أنيميشن محسّنة
    setIsPressed(true)
    setTimeout(() => setIsPressed(false), 200)

    if (count >= target) return

    // Vibration on each tap (if enabled)
    if (vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(40)
    }

    incrementDailyDhikr(1)

    setCount((prev) => {
      const newValue = prev + 1

      // اهتزاز عند اكتمال الهدف لأول مرة (if enabled)
      if (newValue === target && !hasVibrated) {
        if (vibrationEnabled && navigator.vibrate) navigator.vibrate(200)
        setHasVibrated(true)
      }

      return newValue
    })

    setTotals((prev) => ({
      ...prev,
      [selectedId]: (prev[selectedId] ?? 0) + 1,
    }))
  }

  const handleQuickTargetChange = (num: number) => {
    setTarget(num)
    if (count > num) setCount(num)
  }

  const handleResetCurrent = () => {
    setCount(0)
    setHasVibrated(false)
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-4xl">
        <div className="shadow-lg rounded-xl overflow-hidden card-hover bg-card border border-border text-card-foreground">

          {/* الهيدر */}
          <div className="gradient-bg p-4 text-center text-white">
            <h3 className="mb-0 flex items-center justify-center gap-2">
              <i className="fas fa-hands-praying"></i>
              <span>سبحة إلكترونية</span>
            </h3>
          </div>

          {/* المحتوى */}
          <div className="p-4 md:p-5 flex flex-col items-center gap-4">

            {/* اختيار الذكر */}
            <div className="w-full" style={{ maxWidth: "480px" }}>
              <label className="text-sm text-muted-foreground mb-1 block">اختر الذكر</label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={selectedId}
                onChange={handleChangeDhikr}
              >
                {DHIKR_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.text} — {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* الذكر + المعلومات */}
            <div className="w-full text-center p-3 rounded-xl bg-muted text-foreground" style={{ maxWidth: "480px" }}>
              <h3 className="text-lg font-semibold mb-2 text-foreground">{selectedDhikr.text}</h3>
              <p className="text-sm text-muted-foreground">{selectedDhikr.label}</p>

              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <div>المتبقي: {remaining}</div>
                <div>إجمالي التسبيح: {totalForCurrent}</div>

                {/* Vibration Toggle - Icon Only */}
                <button
                  type="button"
                  onClick={toggleVibration}
                  className="rounded-full p-0 inline-flex items-center justify-center transition-all"
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: 'transparent',
                    border: `2px solid ${vibrationEnabled ? '#d4a574' : '#9ca3af'}`,
                    color: vibrationEnabled ? '#d4a574' : '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = vibrationEnabled ? '#d4a574' : '#9ca3af'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = vibrationEnabled ? '#d4a574' : '#9ca3af'
                  }}
                  title={vibrationEnabled ? "تعطيل الاهتزاز" : "تفعيل الاهتزاز"}
                  aria-label={vibrationEnabled ? "تعطيل الاهتزاز" : "تفعيل الاهتزاز"}
                >
                  <i
                    className={`fas ${vibrationEnabled ? 'fa-mobile-screen-button' : 'fa-mobile-screen'}`}
                    style={{ fontSize: '0.85rem' }}
                  ></i>
                </button>
              </div>
            </div>

            {/* الدائرة التفاعلية */}
            <div className="flex justify-center">
              <div
                onClick={handleTasbeehTap}
                className={`rounded-full flex items-center justify-center shadow-lg bg-muted relative ${isPressed ? "animate-shake-tap" : ""
                  } text-foreground`}
                style={{
                  width: "220px",
                  height: "220px",
                  border: "8px solid hsl(var(--card))",
                  cursor: "pointer",
                  userSelect: "none",
                  touchAction: "manipulation",
                }}
              >
                <span className="text-5xl font-bold gradient-text font-mono">{count}</span>
                <span className="absolute bottom-0 start-1/2 -translate-x-1/2 text-xs text-muted-foreground mb-2">
                  الهدف: {isInfinite ? <i className="fas fa-infinity"></i> : target}
                </span>
              </div>
            </div>

            {/* شريط التقدم */}
            <div className="w-full" style={{ maxWidth: "480px" }}>
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>0</span>
                <span>{isInfinite ? <i className="fas fa-infinity"></i> : target}</span>
              </div>

              <div className="w-full bg-muted-foreground/20 rounded-full" style={{ height: "10px" }}>
                <div
                  className="gradient-bg rounded-full h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* أهداف جاهزة */}
            <div className="flex justify-center gap-2 flex-wrap">
              {[33, 99, 100].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleQuickTargetChange(num)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${target === num ? "gradient-bg text-white" : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                    }`}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleQuickTargetChange(Number.MAX_SAFE_INTEGER)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${target === Number.MAX_SAFE_INTEGER ? "gradient-bg text-white" : "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                title="عداد مفتوح"
              >
                <i className="fas fa-infinity"></i>
              </button>
            </div>

            {/* إعادة تعيين */}
            <button
              type="button"
              onClick={handleResetCurrent}
              className="rounded-full flex items-center justify-center card-hover border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-all"
              style={{ width: '50px', height: '50px' }}
              title="إعادة تعيين"
            >
              <i className="fas fa-rotate-right" style={{ fontSize: '1.5rem' }}></i>
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}
