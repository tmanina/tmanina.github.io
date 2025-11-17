"use client"

import * as React from "react"

// نفس المفتاح المستخدم في MorningEvening و Dashboard
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

// الأذكار المتاحة للاختيار
const DHIKR_OPTIONS: DhikrOption[] = [
  {
    id: "subhanallah",
    text: "سُبْحَانَ اللَّهِ",
    label: "تسبيحة",
    defaultTarget: 33,
  },
  {
    id: "alhamdulillah",
    text: "الْحَمْدُ لِلَّهِ",
    label: "تحميدة",
    defaultTarget: 33,
  },
  {
    id: "allahuakbar",
    text: "اللَّهُ أَكْبَرُ",
    label: "تكبيرة",
    defaultTarget: 33,
  },
  {
    id: "tahlil",
    text: "لَا إِلَهَ إِلَّا اللَّهُ",
    label: "تهليلة",
    defaultTarget: 100,
  },
  {
    id: "salat",
    text: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ",
    label: "صلاة على النبي ﷺ",
    defaultTarget: 10,
  },
  {
    id: "sbhan_bihamdih",
    text: "سبحان الله وبحمده , سبحان الله العظيم",
    label: "سبحان الله وبحمده",
    defaultTarget: 100,
  },
  {
    id: "la_elah_wa7dah",
    text: "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير",
    label: "دعاء",
    defaultTarget: 10,
  },
  {
    id: "shahada",
    text: "أشهد أن لا إله إلا الله وأشهد أن محمداً رسول الله",
    label: "شهادة",
    defaultTarget: 5,
  },
  {
    id: "astaghfirullah",
    text: "أستغفر الله",
    label: "استغفار",
    defaultTarget: 100,
  },
  {
    id: "la_hawla",
    text: "لا حول ولا قوة إلا بالله",
    label: "دعاء",
    defaultTarget: 100,
  },
  {
    id: "dhun_nun",
    text: "لا إله إلا أنت سبحانك إني كنت من الظالمين",
    label: "دعاء",
    defaultTarget: 100,
  },
]


// زيادة عدد الأذكار في هذا اليوم وتخزينه في localStorage
function incrementDailyDhikr(step: number) {
  if (typeof window === "undefined") return

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dateKey = today.toISOString().slice(0, 10) // YYYY-MM-DD

  let data: ProgressData = { history: {} }

  const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === "object" && parsed.history) {
        data = parsed as ProgressData
      }
    } catch {
      // ignore parse error
    }
  }

  const prev = data.history[dateKey] ?? 0
  data.history[dateKey] = prev + step
  data.lastDate = dateKey

  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(data))

  // إشعار الـ Dashboard عشان يحدث نفسه
  window.dispatchEvent(new Event("tmanina-progress-updated"))
}

export function DhikrCounter() {
  const [selectedId, setSelectedId] = React.useState<string>(DHIKR_OPTIONS[0].id)
  const selectedDhikr = React.useMemo(
    () => DHIKR_OPTIONS.find((d) => d.id === selectedId) ?? DHIKR_OPTIONS[0],
    [selectedId]
  )

  const [target, setTarget] = React.useState<number>(selectedDhikr.defaultTarget)
  const [count, setCount] = React.useState<number>(0)
  const [totals, setTotals] = React.useState<Record<string, number>>({})
  const remaining = Math.max(target - count, 0)
  const totalForCurrent = totals[selectedId] ?? 0
  const progress = target > 0 ? Math.min((count / target) * 100, 100) : 0

  // عند تغيير الذكر المختار: نرجع العداد للصفر ونضبط الهدف الافتراضي
  React.useEffect(() => {
    setTarget(selectedDhikr.defaultTarget)
    setCount(0)
  }, [selectedDhikr])

  const handleChangeDhikr = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedId(event.target.value)
  }

  const handleTasbeehClick = () => {
    if (count >= target) {
      // وصلنا للهدف، ما نزودش أكثر
      return
    }

    // زيادة التقدم في localStorage (يُستخدم في Dashboard)
    incrementDailyDhikr(1)

    // تحديث عداد هذا الذكر
    setCount((prev) => Math.min(prev + 1, target))

    // إجمالي هذا الذكر (لا يعتمد على الهدف)
    setTotals((prev) => ({
      ...prev,
      [selectedId]: (prev[selectedId] ?? 0) + 1,
    }))
  }

  const handleResetCurrent = () => {
    setCount(0)
    // ممكن تسيب الـ total كما هو (إحصائية تراكمية)
  }

  const handleQuickTargetChange = (value: number) => {
    setTarget(value)
    if (count > value) {
      setCount(value)
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-8">
        <div className="card border-0 shadow-lg rounded-4 overflow-hidden card-hover">
          {/* الهيدر */}
          <div className="gradient-bg text-white p-4">
            <h2 className="h3 text-center mb-0 d-flex align-items-center justify-content-center gap-2">
              <i className="fas fa-hands-praying"></i>
              <span>سبحة إلكترونية</span>
            </h2>
          </div>

          {/* المحتوى */}
          <div className="card-body p-4 p-md-5 d-flex flex-column align-items-center gap-4">
            {/* اختيار الذكر */}
            <div className="w-100" style={{ maxWidth: "480px" }}>
              <label className="form-label small text-body-secondary mb-1">
                اختر الذكر
              </label>
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

            {/* نص الذكر + معلومات صغيرة */}
            <div
              className="w-100 text-center p-3 rounded-4 bg-body-secondary bg-opacity-25"
              style={{ maxWidth: "480px" }}
            >
              <h3 className="h4 mb-2">{selectedDhikr.text}</h3>
              <p className="small text-body-secondary mb-2">
                {selectedDhikr.label}
              </p>
              <div className="d-flex justify-content-between small text-body-secondary mt-1">
                <div>
                  المتبقي: <span>{remaining}</span>
                </div>
                <div>
                  إجمالي التسبيح: <span>{totalForCurrent}</span>
                </div>
              </div>
            </div>

            {/* العداد الدائري */}
            <div className="d-flex justify-content-center">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center shadow-lg bg-body-secondary position-relative"
                style={{
                  width: "220px",
                  height: "220px",
                  border: "8px solid var(--bs-body-bg)",
                }}
              >
                <span className="display-4 fw-bold gradient-text font-monospace">
                  {count}
                </span>
                <span className="position-absolute bottom-0 start-50 translate-middle-x small text-body-secondary mb-2">
                  الهدف: {target}
                </span>
              </div>
            </div>

            {/* شريط التقدم */}
            <div className="w-100" style={{ maxWidth: "480px" }}>
              <div className="d-flex justify-content-between small text-body-secondary mb-2">
                <span>0</span>
                <span>{target}</span>
              </div>
              <div className="progress" style={{ height: "10px" }}>
                <div
                  className="progress-bar gradient-bg"
                  role="progressbar"
                  style={{ width: `${progress}%` }}
                  aria-valuenow={count}
                  aria-valuemin={0}
                  aria-valuemax={target}
                ></div>
              </div>
            </div>

            {/* أزرار اختيار هدف سريع */}
            <div className="d-flex justify-content-center gap-2 flex-wrap">
              {[33, 99, 100].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleQuickTargetChange(num)}
                  className={`btn btn-sm rounded-pill px-3 ${
                    target === num
                      ? "gradient-bg text-white"
                      : "btn-outline-primary"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* زر التسبيح + إعادة التعيين */}
            <div
              className="w-100 d-flex flex-column gap-2"
              style={{ maxWidth: "480px" }}
            >
              <button
                type="button"
                onClick={handleTasbeehClick}
                className="btn btn-lg w-100 gradient-bg text-white rounded-pill py-3 shadow d-flex align-items-center justify-content-center gap-2"
                style={{ fontSize: "1.5rem" }}
              >
                <i className="fas fa-hand-point-up"></i>
                <span>اضغط للتسبيح</span>
              </button>

              <div className="d-flex justify-content-between align-items-center small">
                <button
                  type="button"
                  onClick={handleResetCurrent}
                  className="btn btn-link text-body-secondary text-decoration-none p-0"
                >
                  <i className="fas fa-rotate-right me-1"></i>
                  إعادة تعيين عداد هذا الذكر
                </button>

                {count >= target && (
                  <span className="badge bg-success-subtle text-success-emphasis d-flex align-items-center gap-1">
                    <i className="fas fa-check-circle"></i>
                    اكتمل الهدف
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
