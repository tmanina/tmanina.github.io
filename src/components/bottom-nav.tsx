"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Home,
  BookOpen,
  Clock,
  Calendar,
  Share2,
  MoreHorizontal,
  LayoutDashboard,
  Download,
  Info,
} from "lucide-react"
import { FloatingToast } from "@/components/floating-toast"
import type { ToastVariant } from "@/components/floating-toast"

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
}

const MAIN_ITEMS: NavItem[] = [
  { id: "home", label: "الرئيسية", icon: Home },
  { id: "adhkar-list", label: "الأذكار", icon: BookOpen },
  { id: "prayer-times", label: "الصلاة", icon: Clock },
  { id: "calendar", label: "التقويم", icon: Calendar },
  { id: "share", label: "نشر", icon: Share2 },
]

const MORE_ITEMS: NavItem[] = [
  { id: "dashboard", label: "لوحة النشاط", icon: LayoutDashboard },
  { id: "install", label: "تثبيت التطبيق", icon: Download },
  { id: "about", label: "عن التطبيق", icon: Info },
]

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform?: string }>
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const [moreOpen, setMoreOpen] = React.useState(false)
  const [toastMsg, setToastMsg] = React.useState<string>("")
  const [toastVariant, setToastVariant] = React.useState<ToastVariant>("info")
  const [toastVisible, setToastVisible] = React.useState(false)
  const [deferredInstallPrompt, setDeferredInstallPrompt] = React.useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = React.useState(false)

  const showToast = (message: string, variant: ToastVariant = "info") => {
    setToastMsg(message)
    setToastVariant(variant)
    setToastVisible(true)
  }

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator && window.navigator.standalone === true)

    setIsInstalled(standalone)

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredInstallPrompt(event as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredInstallPrompt(null)
      showToast("تم تثبيت التطبيق بنجاح.", "success")
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isInstalled) {
      showToast("التطبيق مثبت بالفعل على جهازك.", "success")
      return
    }

    if (deferredInstallPrompt) {
      try {
        await deferredInstallPrompt.prompt()
        const choice = await deferredInstallPrompt.userChoice
        setDeferredInstallPrompt(null)

        if (choice.outcome === "accepted") {
          showToast("جاري تثبيت التطبيق على جهازك.", "success")
        } else {
          showToast("تم إلغاء تثبيت التطبيق.", "info")
        }
      } catch {
        showToast("تعذر فتح نافذة التثبيت الآن. جرّب من قائمة المتصفح.", "warning")
      }
      return
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)
    if (isIOS) {
      showToast("على iPhone/iPad لا يسمح Safari بالتثبيت التلقائي:\n1. اضغط زر المشاركة ⬆️\n2. اختر إضافة إلى الشاشة الرئيسية\n3. اضغط إضافة", "info")
    } else if (isAndroid) {
      showToast("إذا لم تظهر نافذة التثبيت، افتح قائمة Chrome ⋮ ثم اختر تثبيت التطبيق أو إضافة إلى الشاشة الرئيسية.", "info")
    } else {
      showToast("إذا لم تظهر نافذة التثبيت، استخدم أيقونة التثبيت في شريط العنوان أو قائمة المتصفح.", "info")
    }
  }

  const handleMoreClick = async (id: string) => {
    setMoreOpen(false)
    if (id === "install") {
      await handleInstallClick()
      return
    }
    onTabChange(id)
  }

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-[9999] bg-background/95 backdrop-blur-xl saturate-180 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0.375rem)",
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
          borderTop: "1px solid hsl(var(--border))",
        }}
        role="navigation"
        aria-label="التنقل الرئيسي"
      >
        <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
          {MAIN_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <Button
                key={item.id}
                variant="ghost"
                {...(item.id === "adhkar-list" ? { "data-tab": "adhkar-list" } : {})}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "relative flex-col gap-0.5 min-w-0 flex-1 h-full rounded-xl",
                  isActive
                    ? "text-gold-600 dark:text-gold-400"
                    : "text-muted-foreground hover:text-foreground active:scale-95"
                )}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
              >
                {isActive && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-gold-400 to-gold-600" />
                )}
                <Icon className={cn("size-5", isActive ? "drop-shadow-sm" : "")} />
                <span className={cn(
                  "text-[0.6rem] font-medium leading-tight",
                  isActive ? "font-semibold" : ""
                )}>
                  {item.label}
                </span>
              </Button>
            )
          })}

          <Button
            variant="ghost"
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              "relative flex-col gap-0.5 min-w-0 flex-1 h-full rounded-xl",
              moreOpen
                ? "text-gold-600 dark:text-gold-400"
                : "text-muted-foreground hover:text-foreground active:scale-95"
            )}
            aria-expanded={moreOpen}
            aria-haspopup="true"
            aria-label="المزيد"
          >
            {moreOpen && (
              <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-gold-400 to-gold-600" />
            )}
            <MoreHorizontal className="size-5" />
            <span className="text-[0.6rem] font-medium leading-tight">المزيد</span>
          </Button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="z-[10000] rounded-t-2xl border-t bg-background px-4 pb-4 pt-3 shadow-2xl"
          style={{
            paddingBottom: "calc(max(env(safe-area-inset-bottom, 0px), 0.375rem) + 1rem)",
          }}
          aria-label="قائمة المزيد"
        >
          <div
            className="mx-auto mb-4 h-1.5 w-12 rounded-full"
            style={{ backgroundColor: "hsl(var(--muted-foreground) / 0.3)" }}
          />
          <SheetHeader className="mb-3 px-2 text-right">
            <SheetTitle className="text-sm font-semibold text-muted-foreground">
              المزيد
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-1">
            {MORE_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => handleMoreClick(item.id)}
                  className={cn(
                    "w-full justify-start gap-3 rounded-xl px-4 py-3 text-right h-auto",
                    isActive
                      ? "bg-gold-500/10 text-gold-700 dark:text-gold-300 font-medium"
                      : "text-foreground hover:bg-muted active:scale-[0.98]"
                  )}
                >
                  <Icon className={cn("size-5 shrink-0", isActive ? "text-gold-500" : "text-muted-foreground")} />
                  <span>{item.label}</span>
                </Button>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>

      <FloatingToast
        message={toastMsg}
        variant={toastVariant}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
        autoCloseMs={12000}
      />
    </>
  )
}
