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
    <div className="row justify-content-center">
      <div className="col-12 col-lg-8">
        <div className="card border-0 shadow-lg rounded-4 overflow-hidden card-hover">

          {/* الهيدر */}
          <div className="gradient-bg text-white p-4 text-center">
            <h3 className="mb-0 d-flex align-items-center justify-content-center gap-2">
              <i className="fas fa-hands-praying"></i>
              <span>سبحة إلكترونية</span>
            </h3>
          </div>

          {/* المحتوى */}
          <div className="card-body p-4 p-md-5 d-flex flex-column align-items-center gap-4">

            {/* اختيار الذكر */}
            <div className="w-100" style={{ maxWidth: "480px" }}>
              <label className="form-label small text-body-secondary mb-1">اختر الذكر</label>
              <select
                className="form-select rounded-3"
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
            <div className="w-100 text-center p-3 rounded-4 bg-body-secondary bg-opacity-25" style={{ maxWidth: "480px" }}>
              <h3 className="h4 mb-2">{selectedDhikr.text}</h3>
              <p className="small text-body-secondary">{selectedDhikr.label}</p>

              <div className="d-flex justify-content-between align-items-center small text-body-secondary">
                <div>المتبقي: {remaining}</div>
                <div>إجمالي التسبيح: {totalForCurrent}</div>

                {/* Vibration Toggle - Icon Only */}
                <button
                  type="button"
                  onClick={toggleVibration}
                  className="btn btn-sm rounded-circle p-0"
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: 'transparent',
                    border: `2px solid ${vibrationEnabled ? 'var(--bs-primary)' : 'var(--bs-secondary)'}`,
                    color: vibrationEnabled ? 'var(--bs-primary)' : 'var(--bs-secondary)',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = vibrationEnabled ? 'var(--bs-primary)' : 'var(--bs-secondary)'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = vibrationEnabled ? 'var(--bs-primary)' : 'var(--bs-secondary)'
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
            <div className="d-flex justify-content-center">
              <style jsx>{`
                @keyframes shake-tap {
                  0%, 100% { transform: scale(1); }
                  25% { transform: scale(0.92) rotate(-2deg); }
                  50% { transform: scale(0.88) rotate(2deg); }
                  75% { transform: scale(0.92) rotate(-1deg); }
                }
                
                .tap-shake {
                  animation: shake-tap 0.3s ease-out;
                }
              `}</style>

              <div
                onClick={handleTasbeehTap}
                className={`rounded-circle d-flex align-items-center justify-content-center shadow-lg bg-body-secondary position-relative ${isPressed ? "tap-shake" : ""
                  }`}
                style={{
                  width: "220px",
                  height: "220px",
                  border: "8px solid var(--bs-body-bg)",
                  cursor: "pointer",
                  userSelect: "none",
                  touchAction: "manipulation",
                }}
              >
                <span className="display-4 fw-bold gradient-text font-monospace">{count}</span>
                <span className="position-absolute bottom-0 start-50 translate-middle-x small text-body-secondary mb-2">
                  الهدف: {isInfinite ? <i className="fas fa-infinity"></i> : target}
                </span>
              </div>
            </div>

            {/* شريط التقدم */}
            <div className="w-100" style={{ maxWidth: "480px" }}>
              <div className="d-flex justify-content-between small text-body-secondary mb-2">
                <span>0</span>
                <span>{isInfinite ? <i className="fas fa-infinity"></i> : target}</span>
              </div>

              <div className="progress" style={{ height: "10px" }}>
                <div
                  className="progress-bar gradient-bg"
                  role="progressbar"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* أهداف جاهزة */}
            <div className="d-flex justify-content-center gap-2 flex-wrap">
              {[33, 99, 100].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleQuickTargetChange(num)}
                  className={`btn btn-sm rounded-pill px-3 ${target === num ? "gradient-bg text-white" : "btn-outline-primary"
                    }`}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleQuickTargetChange(Number.MAX_SAFE_INTEGER)}
                className={`btn btn-sm rounded-pill px-3 ${target === Number.MAX_SAFE_INTEGER ? "gradient-bg text-white" : "btn-outline-primary"
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
              className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center card-hover"
              style={{ width: '50px', height: '50px', transition: 'all 0.3s ease' }}
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
