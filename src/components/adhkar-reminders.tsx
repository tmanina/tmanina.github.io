"use client"

import * as React from "react"
import { FloatingToast } from "@/components/floating-toast"
import type { ToastVariant } from "@/components/floating-toast"

interface ReminderSettings {
  enabled: boolean
  morning: string
  evening: string
  lastChecked: number
}

const REMINDER_STORAGE_KEY = "adhkar_reminder_settings"
const defaultSettings: ReminderSettings = {
  enabled: false,
  morning: "07:00",
  evening: "18:00",
  lastChecked: 0,
}

function loadSettings(): ReminderSettings {
  if (typeof window === "undefined") return defaultSettings

  try {
    const raw = window.localStorage.getItem(REMINDER_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return {
      enabled: Boolean(parsed?.enabled),
      morning: typeof parsed?.morning === "string" ? parsed.morning : defaultSettings.morning,
      evening: typeof parsed?.evening === "string" ? parsed.evening : defaultSettings.evening,
      lastChecked: typeof parsed?.lastChecked === "number" ? parsed.lastChecked : 0,
    }
  } catch {
    return defaultSettings
  }
}

function saveSettings(settings: ReminderSettings) {
  try {
    window.localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore
  }
}

function scheduleViaSW(settings: ReminderSettings) {
  if (!navigator.serviceWorker?.controller) return
  navigator.serviceWorker.controller.postMessage({
    type: settings.enabled ? "SCHEDULE_ADHKAR" : "CANCEL_ADHKAR",
    morning: settings.morning,
    evening: settings.evening,
    enabled: settings.enabled,
  })
}

function checkMissedViaSW(settings: ReminderSettings) {
  if (!navigator.serviceWorker?.controller) return
  navigator.serviceWorker.controller.postMessage({
    type: "CHECK_MISSED_ADHKAR",
    morning: settings.morning,
    evening: settings.evening,
    enabled: settings.enabled,
  })
}

function showReminder(title: string, body: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return
  new Notification(title, {
    body,
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
  })
}

export function AdhkarReminders() {
  const [settings, setSettings] = React.useState<ReminderSettings>(() => loadSettings())
  const [permission, setPermission] = React.useState<NotificationPermission | "unsupported">("default")
  const [toast, setToast] = React.useState<{ message: string; variant: ToastVariant } | null>(null)

  React.useEffect(() => {
    setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission)
  }, [])

  // Save + schedule via SW whenever settings change
  React.useEffect(() => {
    saveSettings(settings)
    scheduleViaSW(settings)
  }, [settings])

  // Check missed notifications on app open
  React.useEffect(() => {
    if (!settings.enabled || permission !== "granted") return
    const now = Date.now()
    // Only check once per hour
    if (now - settings.lastChecked < 60 * 60 * 1000) return
    checkMissedViaSW(settings)
    setSettings(prev => ({ ...prev, lastChecked: now }))
  }, [permission, settings.enabled])

  // Client-side fallback timers (work while page is open)
  React.useEffect(() => {
    if (!settings.enabled || permission !== "granted") return

    const timers: number[] = []
    const schedule = (kind: "morning" | "evening") => {
      const title = kind === "morning" ? "حان وقت أذكار الصباح" : "حان وقت أذكار المساء"
      const body = "افتح طمأنينة واقرأ وردك اليومي."
      const time = settings[kind]

      const run = () => {
        showReminder(title, body)
        timers.push(window.setTimeout(run, 24 * 60 * 60 * 1000))
      }

      const [hours, minutes] = time.split(":").map(Number)
      const now = new Date()
      const target = new Date(now)
      target.setHours(hours || 0, minutes || 0, 0, 0)
      if (target <= now) target.setDate(target.getDate() + 1)
      const delay = target.getTime() - now.getTime()

      timers.push(window.setTimeout(run, delay))
    }

    schedule("morning")
    schedule("evening")

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [permission, settings])

  const requestPermission = async () => {
    if (typeof Notification === "undefined") {
      setPermission("unsupported")
      setToast({ message: "متصفحك لا يدعم التنبيهات.", variant: "warning" })
      return
    }

    const result = await Notification.requestPermission()
    setPermission(result)

    if (result === "granted") {
      const newSettings = { ...settings, enabled: true, lastChecked: Date.now() }
      setSettings(newSettings)
      scheduleViaSW(newSettings)
      setToast({ message: "تم تفعيل تذكير الأذكار.", variant: "success" })
    } else {
      setToast({ message: "لم يتم منح إذن التنبيهات.", variant: "warning" })
    }
  }

  const toggleEnabled = () => {
    if (permission !== "granted") {
      requestPermission()
      return
    }
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }))
  }

  const updateTime = (key: "morning" | "evening", value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <section className="adhkar-card">
      <style jsx>{`
        .adhkar-card {
          border-radius: 1rem;
          overflow: hidden;
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .dark .adhkar-card {
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .adhkar-header {
          background: var(--hero-gradient);
          padding: 0.85rem 1.1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .adhkar-header-left {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .adhkar-icon-wrap {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.95rem;
          flex-shrink: 0;
        }
        .adhkar-header-text h3 {
          margin: 0;
          font-size: 0.88rem;
          font-weight: 700;
          color: white;
        }
        .adhkar-header-text p {
          margin: 0;
          font-size: 0.68rem;
          color: rgba(255,255,255,0.7);
        }
        .adhkar-toggle-btn {
          width: 44px;
          height: 24px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          transition: background 0.3s ease;
          background: rgba(255,255,255,0.25);
          backdrop-filter: blur(8px);
          position: relative;
          flex-shrink: 0;
        }
        .adhkar-toggle-btn.active {
          background: rgba(255,255,255,0.95);
        }
        .adhkar-toggle-knob {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .adhkar-toggle-btn:not(.active) .adhkar-toggle-knob {
          background: rgba(255,255,255,0.7);
        }
        .adhkar-toggle-btn.active .adhkar-toggle-knob {
          transform: translateX(20px);
          background: hsl(var(--primary));
        }
        .adhkar-body {
          padding: 0.75rem 1.1rem 0.85rem;
        }
        .adhkar-times {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }
        .adhkar-time-card {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 0.65rem;
          border-radius: 0.65rem;
          border: 1.5px solid hsl(var(--border));
          background: hsl(var(--background));
          transition: border-color 0.2s;
        }
        .adhkar-time-card:focus-within {
          border-color: hsl(var(--primary));
        }
        .adhkar-time-emoji {
          font-size: 1.05rem;
          flex-shrink: 0;
          line-height: 1;
        }
        .adhkar-time-info {
          flex: 1;
          min-width: 0;
        }
        .adhkar-time-label {
          font-size: 0.62rem;
          font-weight: 600;
          color: hsl(var(--muted-foreground));
          margin-bottom: 0.1rem;
          line-height: 1;
        }
        .adhkar-time-input {
          width: 100%;
          border: none;
          background: transparent;
          font-size: 0.82rem;
          font-weight: 700;
          color: hsl(var(--foreground));
          font-family: inherit;
          padding: 0;
          outline: none;
          direction: ltr;
          cursor: pointer;
          line-height: 1.2;
        }
        .adhkar-time-input::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 0.4;
          transform: scale(0.8);
        }
        .adhkar-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          margin-bottom: 0.5rem;
          font-size: 0.65rem;
          color: hsl(var(--muted-foreground));
        }
        .adhkar-status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: hsl(var(--muted-foreground));
        }
        .adhkar-status.active {
          color: hsl(var(--primary));
        }
        .adhkar-status.active .adhkar-status-dot {
          background: hsl(var(--primary));
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .adhkar-unsupported {
          margin-top: 0.4rem;
          font-size: 0.65rem;
          color: hsl(var(--destructive));
          text-align: center;
        }
        @media (max-width: 360px) {
          .adhkar-time-card { padding: 0.45rem 0.55rem; }
          .adhkar-time-input { font-size: 0.78rem; }
        }
      `}</style>

      <div className="adhkar-header">
        <div className="adhkar-header-left">
          <div className="adhkar-icon-wrap">
            <i className="fas fa-bell" />
          </div>
          <div className="adhkar-header-text">
            <h3>تذكير الأذكار</h3>
            <p>{settings.enabled ? "مفعل — إشعارات يومية" : "فعّل التذكير لأذكار الصباح والمساء"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleEnabled}
          className={`adhkar-toggle-btn ${settings.enabled ? "active" : ""}`}
          aria-label={settings.enabled ? "تعطيل التذكير" : "تفعيل التذكير"}
        >
          <span className="adhkar-toggle-knob" />
        </button>
      </div>

      <div className="adhkar-body">
        <div className={`adhkar-status ${settings.enabled ? "active" : ""}`}>
          <span className="adhkar-status-dot" />
          {settings.enabled ? "التذكير مفعل" : "التذكير معطّل"}
        </div>

        <div className="adhkar-times">
          <div className="adhkar-time-card">
            <span className="adhkar-time-emoji">☀️</span>
            <div className="adhkar-time-info">
              <div className="adhkar-time-label">الصباح</div>
              <input
                type="time"
                value={settings.morning}
                onChange={(e) => updateTime("morning", e.target.value)}
                className="adhkar-time-input"
              />
            </div>
          </div>
          <div className="adhkar-time-card">
            <span className="adhkar-time-emoji">🌙</span>
            <div className="adhkar-time-info">
              <div className="adhkar-time-label">المساء</div>
              <input
                type="time"
                value={settings.evening}
                onChange={(e) => updateTime("evening", e.target.value)}
                className="adhkar-time-input"
              />
            </div>
          </div>
        </div>

        {permission === "unsupported" && (
          <p className="adhkar-unsupported">متصفحك لا يدعم التنبيهات</p>
        )}
      </div>

      <FloatingToast
        message={toast?.message || ""}
        variant={toast?.variant || "info"}
        isVisible={toast !== null}
        onClose={() => setToast(null)}
      />
    </section>
  )
}
