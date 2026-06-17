"use client"

import * as React from "react"
import { FloatingToast } from "@/components/floating-toast"
import type { ToastVariant } from "@/components/floating-toast"

interface ReminderSettings {
  enabled: boolean
  morning: string
  evening: string
}

const REMINDER_STORAGE_KEY = "adhkar_reminder_settings"
const defaultSettings: ReminderSettings = {
  enabled: false,
  morning: "07:00",
  evening: "18:00",
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
    }
  } catch {
    return defaultSettings
  }
}

function saveSettings(settings: ReminderSettings) {
  try {
    window.localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore storage failures
  }
}

function getDelayUntil(time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  const now = new Date()
  const target = new Date(now)
  target.setHours(hours || 0, minutes || 0, 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)
  return target.getTime() - now.getTime()
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

  React.useEffect(() => {
    saveSettings(settings)
  }, [settings])

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

      timers.push(window.setTimeout(run, getDelayUntil(time)))
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
      setSettings((prev) => ({ ...prev, enabled: true }))
      setToast({ message: "تم تفعيل تذكير الأذكار.", variant: "success" })
    } else {
      setToast({ message: "لم يتم منح إذن التنبيهات.", variant: "warning" })
    }
  }

  const updateTime = (key: "morning" | "evening", value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const toggleEnabled = () => {
    if (permission !== "granted") {
      requestPermission()
      return
    }

    setSettings((prev) => ({ ...prev, enabled: !prev.enabled }))
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="mb-1 text-base font-bold">تذكير الأذكار</h3>
          <p className="mb-0 text-sm text-muted-foreground">
            {settings.enabled ? "التذكير مفعل بإذن المتصفح" : "فعّل التذكير لأذكار الصباح والمساء"}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleEnabled}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${settings.enabled
            ? "bg-emerald-500 text-white"
            : "bg-muted text-foreground hover:bg-accent"
            }`}
        >
          {settings.enabled ? "مفعل" : "تفعيل"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">الصباح</span>
          <input
            type="time"
            value={settings.morning}
            onChange={(event) => updateTime("morning", event.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">المساء</span>
          <input
            type="time"
            value={settings.evening}
            onChange={(event) => updateTime("evening", event.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3"
          />
        </label>
      </div>

      {permission === "unsupported" && (
        <p className="mt-2 mb-0 text-xs text-amber-600">التنبيهات غير مدعومة في هذا المتصفح.</p>
      )}

      <FloatingToast
        message={toast?.message || ""}
        variant={toast?.variant || "info"}
        isVisible={toast !== null}
        onClose={() => setToast(null)}
      />
    </section>
  )
}
