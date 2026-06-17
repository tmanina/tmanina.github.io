"use client"

import * as React from "react"
import { Sun, Moon, Bell, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type AdhkarPeriod = "morning" | "evening" | "sleep" | null

export function Header() {
  const [isDark, setIsDark] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const [adhkarNotification, setAdhkarNotification] = React.useState<AdhkarPeriod>(null)
  const [showNotification, setShowNotification] = React.useState(false)
  const [notificationDropdownOpen, setNotificationDropdownOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    const theme = localStorage.getItem("theme")
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
      setIsDark(true)
    } else {
      document.documentElement.classList.remove("dark")
      setIsDark(false)
    }

    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute("content", theme === "dark" ? "#0d1515" : "#2b5a4b")
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  React.useEffect(() => {
    if (!notificationDropdownOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setNotificationDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [notificationDropdownOpen])

  React.useEffect(() => {
    if (!notificationDropdownOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNotificationDropdownOpen(false)
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [notificationDropdownOpen])

  React.useEffect(() => {
    const checkAdhkarTime = () => {
      const now = new Date()
      const hour = now.getHours()
      const today = now.toDateString()

      const lastMorningRead = localStorage.getItem("lastMorningAdhkarRead")
      const lastEveningRead = localStorage.getItem("lastEveningAdhkarRead")
      const lastSleepRead = localStorage.getItem("lastSleepAdhkarRead")

      if (hour >= 6 && hour < 12) {
        if (lastMorningRead !== today) {
          setAdhkarNotification("morning")
          setShowNotification(true)
        } else {
          setAdhkarNotification(null)
          setShowNotification(false)
        }
      } else if (hour >= 15 && hour < 19) {
        if (lastEveningRead !== today) {
          setAdhkarNotification("evening")
          setShowNotification(true)
        } else {
          setAdhkarNotification(null)
          setShowNotification(false)
        }
      } else if (hour >= 23 || hour < 2) {
        if (lastSleepRead !== today) {
          setAdhkarNotification("sleep")
          setShowNotification(true)
        } else {
          setAdhkarNotification(null)
          setShowNotification(false)
        }
      } else {
        setAdhkarNotification(null)
        setShowNotification(false)
      }
    }

    checkAdhkarTime()
    const interval = setInterval(checkAdhkarTime, 60000)
    return () => clearInterval(interval)
  }, [])

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark"
    document.documentElement.classList.toggle("dark", newTheme === "dark")
    localStorage.setItem("theme", newTheme)
    setIsDark(!isDark)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute("content", newTheme === "dark" ? "#0d1515" : "#2b5a4b")
    }
  }

  const handleNotificationClick = () => {
    if (!adhkarNotification) return

    const adhkarListButton = document.querySelector('[data-tab="adhkar-list"]') as HTMLElement
    if (adhkarListButton) {
      adhkarListButton.click()
    }

    setTimeout(() => {
      let cardClass = ".adhkar-card-morning"
      if (adhkarNotification === "evening") {
        cardClass = ".adhkar-card-evening"
      } else if (adhkarNotification === "sleep") {
        cardClass = ".adhkar-card-sleep"
      }
      const card = document.querySelector(cardClass) as HTMLElement
      if (card) {
        card.click()
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }, 150)

    setShowNotification(false)
  }

  const notificationConfig = {
    morning: { text: "لا تنسَ أذكار الصباح", icon: Sun, color: "#f59e0b", time: "وقت الصباح" },
    evening: { text: "لا تنسَ أذكار المساء", icon: Moon, color: "#8b5cf6", time: "وقت المساء" },
    sleep: { text: "لا تنسَ أذكار النوم", icon: Moon, color: "#6366f1", time: "وقت النوم" },
  } as const

  const notif = adhkarNotification ? notificationConfig[adhkarNotification] : null
  const NotifIcon = notif?.icon

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 bg-background",
        scrolled ? "shadow-sm" : ""
      )}
      style={{
        borderBottom: scrolled ? "1px solid hsl(var(--border))" : "1px solid transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
      }}
    >
      <div className="flex items-center justify-between h-14 px-4 max-w-5xl mx-auto">
        <a href="#" className="flex items-center gap-2.5 no-underline" aria-label="طمأنينة - الرئيسية">
          <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 shadow-md shadow-gold-500/20">
            <Heart className="size-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold leading-none bg-gradient-to-l from-gold-600 to-gold-400 bg-clip-text text-transparent">
              طمأنينة
            </h1>
            <span className="text-[0.6rem] text-muted-foreground leading-tight hidden sm:block">
              رفيقك الروحاني
            </span>
          </div>
        </a>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground active:scale-90 size-9"
            aria-label={isDark ? "تبديل إلى الوضع النهاري" : "تبديل إلى الوضع الليلي"}
          >
            {isDark ? (
              <Sun className="size-[18px]" />
            ) : (
              <Moon className="size-[18px]" />
            )}
          </Button>

          <div className="relative">
            <Button
              ref={buttonRef}
              variant="ghost"
              size="icon"
              onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
              className="text-muted-foreground hover:text-foreground active:scale-90 size-9"
              aria-expanded={notificationDropdownOpen}
              aria-label="الإشعارات"
            >
              <Bell className="size-[18px]" />
              {showNotification && adhkarNotification && (
                <span
                  className="absolute -top-0.5 -right-0.5 size-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{
                    backgroundColor: notificationConfig[adhkarNotification].color,
                    boxShadow: "0 0 0 2px hsl(var(--background))",
                  }}
                >
                  1
                </span>
              )}
            </Button>

            {showNotification && adhkarNotification && notificationDropdownOpen && (
              <div
                ref={dropdownRef}
                className="absolute top-full left-0 mt-2 w-[320px] max-w-[90vw] rounded-xl shadow-2xl overflow-hidden animate-fade-in-up bg-card"
                style={{ border: "1px solid hsl(var(--border))" }}
                role="menu"
              >
                <Button
                  variant="ghost"
                  onClick={() => {
                    handleNotificationClick()
                    setNotificationDropdownOpen(false)
                  }}
                  className="w-full justify-start gap-3 px-4 py-3 text-right h-auto text-card-foreground hover:bg-muted"
                  role="menuitem"
                >
                  <div
                    className="flex items-center justify-center size-10 rounded-full shrink-0"
                    style={{ backgroundColor: notificationConfig[adhkarNotification].color }}
                  >
                    {NotifIcon && <NotifIcon className="size-5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-card-foreground">
                      {notificationConfig[adhkarNotification].text}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {notificationConfig[adhkarNotification].time}
                    </div>
                  </div>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
