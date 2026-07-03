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
    <section className="quran-plan-card">
      <style jsx>{`
        .quran-plan-card {
          border-radius: 1rem;
          overflow: hidden;
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .dark .quran-plan-card {
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .plan-header {
          background: var(--hero-gradient);
          padding: 1.1rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .plan-header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .plan-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.1rem;
          flex-shrink: 0;
        }
        .plan-header-text h3 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 700;
          color: white;
        }
        .plan-header-text p {
          margin: 0;
          font-size: 0.72rem;
          color: rgba(255,255,255,0.7);
        }
        .plan-progress-ring {
          position: relative;
          width: 48px;
          height: 48px;
        }
        .plan-progress-ring svg {
          transform: rotate(-90deg);
        }
        .progress-bg {
          fill: none;
          stroke: rgba(255,255,255,0.2);
          stroke-width: 4;
        }
        .progress-fill {
          fill: none;
          stroke: white;
          stroke-width: 4;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.6s ease;
        }
        .progress-text {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6rem;
          font-weight: 800;
          color: white;
        }
        .plan-body {
          padding: 0.85rem 1.25rem 1rem;
        }
        .plan-tabs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          margin-bottom: 0.85rem;
        }
        .plan-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 0.55rem 0.25rem;
          border-radius: 0.75rem;
          border: 1.5px solid hsl(var(--border));
          background: hsl(var(--background));
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .plan-tab:hover {
          border-color: hsl(var(--primary) / 0.4);
          background: hsl(var(--primary) / 0.04);
        }
        .plan-tab.active {
          border-color: hsl(var(--primary));
          background: hsl(var(--primary) / 0.08);
        }
        .dark .plan-tab.active {
          background: hsl(var(--primary) / 0.12);
        }
        .plan-tab-icon {
          font-size: 0.85rem;
          color: hsl(var(--muted-foreground));
          transition: color 0.2s;
        }
        .plan-tab.active .plan-tab-icon {
          color: hsl(var(--primary));
        }
        .plan-tab-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: hsl(var(--foreground));
          transition: color 0.2s;
        }
        .plan-tab.active .plan-tab-label {
          color: hsl(var(--primary));
        }
        .plan-stats {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.6rem;
        }
        .plan-stat-label {
          font-size: 0.78rem;
          color: hsl(var(--muted-foreground));
        }
        .plan-stat-value {
          font-size: 0.82rem;
          font-weight: 800;
          color: hsl(var(--foreground));
        }
        .plan-progress-bar {
          height: 8px;
          border-radius: 10px;
          background: hsl(var(--muted));
          overflow: hidden;
          position: relative;
        }
        .plan-progress-fill {
          height: 100%;
          border-radius: 10px;
          background: var(--primary-gradient);
          transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
          position: relative;
        }
        .plan-progress-fill::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          animation: shimmer-bar 2s infinite;
        }
        @keyframes shimmer-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .plan-footer {
          margin-top: 0.5rem;
          font-size: 0.7rem;
          color: hsl(var(--muted-foreground));
          text-align: center;
        }
        .plan-footer strong {
          color: hsl(var(--primary));
        }
      `}</style>

      <div className="plan-header">
        <div className="plan-header-left">
          <div className="plan-icon-wrap">
            <i className="fas fa-book-open" />
          </div>
          <div className="plan-header-text">
            <h3>خطة ختم القرآن</h3>
            <p>صفحة {lastPage} من {TOTAL_PAGES}</p>
          </div>
        </div>
        <div className="plan-progress-ring">
          <svg width="48" height="48" viewBox="0 0 48 48">
            <circle className="progress-bg" cx="24" cy="24" r="20" />
            <circle
              className="progress-fill"
              cx="24" cy="24" r="20"
              strokeDasharray={125.66}
              strokeDashoffset={125.66 - (125.66 * progress) / 100}
            />
          </svg>
          <span className="progress-text">{progress}%</span>
        </div>
      </div>

      <div className="plan-body">
        <div className="plan-tabs">
          {plans.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => handlePlanChange(item.key)}
              className={`plan-tab ${selectedPlan === item.key ? "active" : ""}`}
            >
              <i className={`fas ${item.icon} plan-tab-icon`} />
              <span className="plan-tab-label">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="plan-stats">
          <span className="plan-stat-label">ورد اليوم</span>
          <span className="plan-stat-value">{lastPage} → {todayTarget}</span>
        </div>

        <div className="plan-progress-bar">
          <div className="plan-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <p className="plan-footer">
          <strong>{pagesPerDay}</strong> صفحة يوميًا • {plan.days} يوم لإتمام الخطة
        </p>
      </div>
    </section>
  )
}
