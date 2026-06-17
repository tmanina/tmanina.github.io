"use client"

import * as React from "react"
import { TOTAL_PAGES } from "@/components/quran-reader/utils"

type PlanKey = "seven" | "thirty" | "ramadan"

const PLAN_STORAGE_KEY = "quran_completion_plan"

const plans: Array<{ key: PlanKey; label: string; days: number; icon: string }> = [
  { key: "seven", label: "7 أيام", days: 7, icon: "fa-bolt" },
  { key: "thirty", label: "30 يوم", days: 30, icon: "fa-calendar-days" },
  { key: "ramadan", label: "رمضان", days: 30, icon: "fa-moon" },
]

function getStoredPlan(): PlanKey {
  if (typeof window === "undefined") return "thirty"

  try {
    const value = window.localStorage.getItem(PLAN_STORAGE_KEY)
    return plans.some((plan) => plan.key === value) ? (value as PlanKey) : "thirty"
  } catch {
    return "thirty"
  }
}

function getLastReadPage() {
  if (typeof window === "undefined") return 1

  try {
    const raw = window.localStorage.getItem("quran_last_read")
    const page = raw ? Number.parseInt(raw, 10) : 1
    return Number.isFinite(page) ? Math.min(Math.max(page, 1), TOTAL_PAGES) : 1
  } catch {
    return 1
  }
}

export function QuranCompletionPlan() {
  const [selectedPlan, setSelectedPlan] = React.useState<PlanKey>(() => getStoredPlan())
  const [lastPage, setLastPage] = React.useState(1)

  React.useEffect(() => {
    const refresh = () => setLastPage(getLastReadPage())
    refresh()
    window.addEventListener("storage", refresh)
    return () => window.removeEventListener("storage", refresh)
  }, [])

  const plan = plans.find((item) => item.key === selectedPlan) || plans[1]
  const remainingPages = Math.max(TOTAL_PAGES - lastPage + 1, 0)
  const pagesPerDay = Math.max(Math.ceil(remainingPages / plan.days), 1)
  const todayTarget = Math.min(lastPage + pagesPerDay - 1, TOTAL_PAGES)
  const progress = Math.min(Math.round((lastPage / TOTAL_PAGES) * 100), 100)

  const handlePlanChange = (planKey: PlanKey) => {
    setSelectedPlan(planKey)
    try {
      window.localStorage.setItem(PLAN_STORAGE_KEY, planKey)
    } catch {
      // ignore storage failures
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="mb-1 text-base font-bold">خطة ختم القرآن</h3>
          <p className="mb-0 text-sm text-muted-foreground">آخر صفحة: {lastPage} من {TOTAL_PAGES}</p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
          <i className="fas fa-quran" />
        </div>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        {plans.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => handlePlanChange(item.key)}
            className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${selectedPlan === item.key
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-border bg-background hover:bg-accent"
              }`}
          >
            <i className={`fas ${item.icon} mb-1 block`} />
            {item.label}
          </button>
        ))}
      </div>

      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">ورد اليوم</span>
        <span className="font-bold">من {lastPage} إلى {todayTarget}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 mb-0 text-xs text-muted-foreground">
        {pagesPerDay} صفحة يوميًا تقريبًا لإتمام الخطة.
      </p>
    </section>
  )
}
