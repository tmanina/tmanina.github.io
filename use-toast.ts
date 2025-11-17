"use client"

import * as React from "react"

type ToastVariant = "success" | "danger" | "warning" | "info"

interface ToastOptions {
  message: string
  variant?: ToastVariant
}

/**
 * هوك بسيط لعرض Toast عبر alert أو console (ممكن تطوّره لاحقاً لواجهة Bootstrap حقيقية)
 */
export function useToast() {
  const showToast = React.useCallback((options: ToastOptions) => {
    const { message, variant = "info" } = options

    // هنا تقدر لاحقاً تربطه بـ Toast UI حقيقي في الصفحة
    // حالياً هنستخدم console + alert كتصرف مبدئي:
    console.log(`[${variant.toUpperCase()}]`, message)
    if (typeof window !== "undefined") {
      // مؤقتاً - عشان تشوف النتيجة
      // تقدر تشيل الـ alert لما تعمل UI للـ toast
      // eslint-disable-next-line no-alert
      alert(message)
    }
  }, [])

  // نرجّع نفس الفنكشن باسمين:
  // toast → للاستخدام الحالي
  // showToast → للي يحب يكتبها صريحة
  return {
    toast: showToast,
    showToast,
  }
}
