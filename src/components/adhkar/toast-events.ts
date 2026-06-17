import * as React from "react"
import type { ToastVariant } from "@/components/floating-toast"

export interface AdhkarToastEvent {
  message: string
  variant: ToastVariant
}

const ADHKAR_TOAST_EVENT = "adhkar-toast"

/**
 * Dispatches a custom DOM event that React components can listen for
 * to show toast notifications from non-React utility functions.
 */
export function dispatchAdhkarToast(message: string, variant: ToastVariant = "success") {
  if (typeof window === "undefined") return

  window.dispatchEvent(
    new CustomEvent<AdhkarToastEvent>(ADHKAR_TOAST_EVENT, {
      detail: { message, variant },
    })
  )
}

/**
 * Hook to use in React components to listen for adhkar toast events.
 * Returns the current toast state and an onClose handler.
 */
export function useAdhkarToastListener() {
  const [toast, setToast] = React.useState<AdhkarToastEvent | null>(null)

  const handleClose = React.useCallback(() => setToast(null), [])

  React.useEffect(() => {
    const handler = (e: Event) => {
      const event = e as CustomEvent<AdhkarToastEvent>
      setToast(event.detail)
    }

    window.addEventListener(ADHKAR_TOAST_EVENT, handler)
    return () => window.removeEventListener(ADHKAR_TOAST_EVENT, handler)
  }, [])

  return { toast, handleClose }
}
