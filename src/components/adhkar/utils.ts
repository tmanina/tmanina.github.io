// Helper functions for adhkar tracking and progress

import { type RemainingMap, type ProgressData, type AdhkarItem } from "./types"
import { dispatchAdhkarToast } from "./toast-events"

const PROGRESS_STORAGE_KEY = "tmanina_progress"

export function getInitialRemaining(adhkarData: AdhkarItem[], prefix: string): RemainingMap {
    const initial: RemainingMap = {}
    adhkarData.forEach((dhikr, index) => {
        initial[`${prefix}-${index}`] = dhikr.repeat
    })
    return initial
}

export function incrementDailyDhikr(step: number) {
    if (typeof window === "undefined") return

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dateKey = today.toISOString().slice(0, 10)

    let data: ProgressData = { history: {} }

    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY)
    if (raw) {
        try {
            const parsed = JSON.parse(raw)
            if (parsed && typeof parsed === "object" && parsed.history) {
                data = parsed as ProgressData
            }
        } catch {
            // ignore
        }
    }

    const prev = data.history[dateKey] ?? 0
    data.history[dateKey] = prev + step
    data.lastDate = dateKey

    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(data))
    window.dispatchEvent(new Event("tmanina-progress-updated"))
}

export async function copyDhikr(zekr: string) {
    try {
        if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(zekr)
            dispatchAdhkarToast("تم نسخ الذكر ✅", "success")
        } else {
            const dummy = document.createElement("textarea")
            dummy.value = zekr
            document.body.appendChild(dummy)
            dummy.select()
            document.execCommand("copy")
            document.body.removeChild(dummy)
            dispatchAdhkarToast("تم نسخ الذكر إلى الحافظة ✅", "success")
        }
    } catch (error) {
        console.error("Copy failed", error)
        dispatchAdhkarToast("تعذّر نسخ الذكر، حاول مرة أخرى.", "error")
    }
}
