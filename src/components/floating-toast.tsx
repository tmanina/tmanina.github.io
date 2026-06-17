"use client"

import * as React from "react"
import { X, AlertCircle, CheckCircle2, Radio, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastVariant = "error" | "success" | "warning" | "info" | "loading"

interface FloatingToastProps {
  message: string
  variant?: ToastVariant
  isVisible: boolean
  onClose: () => void
  autoCloseMs?: number
  action?: {
    label: string
    onClick: () => void
  }
}

const variantConfig: Record<ToastVariant, { icon: React.ElementType; bg: string; border: string; text: string }> = {
  error: {
    icon: AlertCircle,
    bg: "bg-red-500/10 dark:bg-red-500/20",
    border: "border-red-500/30 dark:border-red-500/40",
    text: "text-red-600 dark:text-red-400",
  },
  success: {
    icon: CheckCircle2,
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    border: "border-emerald-500/30 dark:border-emerald-500/40",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    icon: AlertCircle,
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    border: "border-amber-500/30 dark:border-amber-500/40",
    text: "text-amber-600 dark:text-amber-400",
  },
  info: {
    icon: Radio,
    bg: "bg-sky-500/10 dark:bg-sky-500/20",
    border: "border-sky-500/30 dark:border-sky-500/40",
    text: "text-sky-600 dark:text-sky-400",
  },
  loading: {
    icon: Loader2,
    bg: "bg-sky-500/10 dark:bg-sky-500/20",
    border: "border-sky-500/30 dark:border-sky-500/40",
    text: "text-sky-600 dark:text-sky-400",
  },
}

export function FloatingToast({
  message,
  variant = "info",
  isVisible,
  onClose,
  autoCloseMs = 5000,
  action,
}: FloatingToastProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  // Use a ref for onClose to avoid resetting the timer on re-renders
  const onCloseRef = React.useRef(onClose)

  React.useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  React.useEffect(() => {
    if (!isVisible || autoCloseMs <= 0) return
    const timer = setTimeout(() => onCloseRef.current(), autoCloseMs)
    return () => clearTimeout(timer)
  }, [isVisible, autoCloseMs])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-4 z-[9999] mx-auto w-[calc(100vw-2rem)] max-w-md",
        "animate-fade-in-down"
      )}
      role="alert"
      aria-live="assertive"
    >
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl",
          "bg-white/90 dark:bg-neutral-900/90",
          config.bg,
          config.border
        )}
        style={{
          boxShadow:
            "0 12px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <div
          className={cn(
            "flex items-center justify-center size-9 rounded-full shrink-0",
            config.bg
          )}
        >
          <Icon
            className={cn(
              "size-5",
              variant === "loading" && "animate-spin",
              config.text
            )}
          />
        </div>

        <p className={cn("flex-1 text-sm font-medium leading-snug whitespace-pre-wrap", config.text)}>
          {message}
        </p>

        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className={cn(
              "shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors",
              "bg-foreground/10 hover:bg-foreground/20 text-foreground"
            )}
          >
            {action.label}
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="shrink-0 flex items-center justify-center size-7 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-muted-foreground"
          aria-label="إغلاق"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
