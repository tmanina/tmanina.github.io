"use client"

import * as React from "react"
import { Sun, Moon, Bell } from "lucide-react"

type AdhkarPeriod = "morning" | "evening" | "sleep" | null

export function Header() {
  const [isDark, setIsDark] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const [adhkarNotification, setAdhkarNotification] = React.useState<AdhkarPeriod>(null)
  const [showNotification, setShowNotification] = React.useState(false)
  const [notificationDropdownOpen, setNotificationDropdownOpen] = React.useState(false)
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, transform: "none" })
  const notificationButtonRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    const theme = localStorage.getItem("theme")
    if (theme === "dark") {
      document.documentElement.setAttribute("data-bs-theme", "dark")
      setIsDark(true)
    } else {
      // Default to light if no theme is saved or if saved theme is light
      document.documentElement.setAttribute("data-bs-theme", "light")
      setIsDark(false)
    }

    // Handle scroll effect
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close notification dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (notificationDropdownOpen && !target.closest('.dropdown')) {
        setNotificationDropdownOpen(false)
      }
    }

    if (notificationDropdownOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [notificationDropdownOpen])

  // Check time for adhkar notification
  React.useEffect(() => {
    const checkAdhkarTime = () => {
      const now = new Date()
      const hour = now.getHours()
      const today = now.toDateString()

      // Get last completion from localStorage
      const lastMorningRead = localStorage.getItem("lastMorningAdhkarRead")
      const lastEveningRead = localStorage.getItem("lastEveningAdhkarRead")
      const lastSleepRead = localStorage.getItem("lastSleepAdhkarRead")

      // Morning: 6 AM - 12 PM
      if (hour >= 6 && hour < 12) {
        // Only show if not read today
        if (lastMorningRead !== today) {
          setAdhkarNotification("morning")
          setShowNotification(true)
        } else {
          setAdhkarNotification(null)
          setShowNotification(false)
        }
      }
      // Evening: 3 PM - 7 PM (15:00 - 19:00)
      else if (hour >= 15 && hour < 19) {
        // Only show if not read today
        if (lastEveningRead !== today) {
          setAdhkarNotification("evening")
          setShowNotification(true)
        } else {
          setAdhkarNotification(null)
          setShowNotification(false)
        }
      }
      // Sleep: 11 PM - 2 AM (23:00 - 02:00)
      else if (hour >= 23 || hour < 2) {
        // Only show if not read today
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
    // Check every minute
    const interval = setInterval(checkAdhkarTime, 60000)
    return () => clearInterval(interval)
  }, [])

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark"
    document.documentElement.setAttribute("data-bs-theme", newTheme)
    localStorage.setItem("theme", newTheme)
    setIsDark(!isDark)
  }

  const handleNotificationClick = () => {
    if (!adhkarNotification) return

    // Navigate to adhkar list
    const adhkarListButton = document.querySelector('[data-tab="adhkar-list"]') as HTMLElement
    if (adhkarListButton) {
      adhkarListButton.click()
    }

    // Click appropriate adhkar card
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

    // Hide the notification
    setShowNotification(false)
  }

  const getNotificationText = () => {
    if (adhkarNotification === "morning") return "لا تنسَ أذكار الصباح"
    if (adhkarNotification === "evening") return "لا تنسَ أذكار المساء"
    if (adhkarNotification === "sleep") return "لا تنسَ أذكار النوم"
    return ""
  }

  const getNotificationIcon = () => {
    if (adhkarNotification === "morning") return "fa-sun"
    if (adhkarNotification === "evening") return "fa-moon"
    if (adhkarNotification === "sleep") return "fa-bed"
    return "fa-bell"
  }

  const getNotificationColor = () => {
    if (adhkarNotification === "morning") return "#f59e0b"
    if (adhkarNotification === "evening") return "#8b5cf6"
    if (adhkarNotification === "sleep") return "#6366f1"
    return "#6c757d"
  }

  const getNotificationTime = () => {
    if (adhkarNotification === "morning") return "وقت الصباح"
    if (adhkarNotification === "evening") return "وقت المساء"
    if (adhkarNotification === "sleep") return "وقت النوم"
    return ""
  }

  return (
    <header
      className={`navbar navbar-expand-lg ${isDark ? "navbar-dark bg-dark" : "navbar-light bg-white"
        } sticky-top transition-all duration-300 ${scrolled ? "shadow-lg backdrop-blur-md" : "shadow-sm"
        }`}
      style={{
        ...(scrolled && {
          backgroundColor: isDark
            ? "rgba(33, 37, 41, 0.9)"
            : "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
        }),
      }}
    >
      <div className="container-fluid">
        <a className="navbar-brand d-flex align-items-center animate-fade-in" href="#">
          {/* Logo with gradient background */}
          <div className="rounded-3 gradient-bg p-3 me-2 shadow-gold hover:shadow-gold-lg transition-all duration-300 hover:scale-110">
            <i className="fas fa-mosque text-white fs-4"></i>
          </div>

          <div>
            <h1 className="h3 mb-0 fw-bold gradient-text animate-fade-in-down">
              طمأنينة
            </h1>
            <p className="small text-muted mb-0 d-none d-sm-block animate-fade-in-up">
              رفيقك الروحاني
            </p>
          </div>
        </a>

        <div className="d-flex align-items-center gap-2">
          {/* Theme Toggle */}
          <button
            className={`btn rounded-circle p-2 position-relative overflow-hidden transition-all duration-300 ${isDark
              ? "btn-outline-light hover:bg-white/10"
              : "btn-outline-dark hover:bg-black/5"
              }`}
            onClick={toggleTheme}
            aria-label={isDark ? "تبديل إلى الوضع النهاري" : "تبديل إلى الوضع الليلي"}
            style={{
              width: "42px",
              height: "42px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div className="position-relative">
              {isDark ? (
                <Sun className="lucide-icon" size={20} />
              ) : (
                <Moon className="lucide-icon" size={20} />
              )}
            </div>
          </button>

          {/* Smart Adhkar Notifications Button with Dropdown */}
          <div className="notification-dropdown-wrapper">
            <button
              ref={notificationButtonRef}
              className={`btn rounded-circle p-2 position-relative transition-all duration-300 ${isDark
                ? "btn-outline-light hover:bg-white/10"
                : "btn-outline-dark hover:bg-black/5"
                }`}
              type="button"
              onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
              aria-expanded={notificationDropdownOpen}
              aria-label="الإشعارات"
              style={{
                width: "42px",
                height: "42px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bell className="lucide-icon" size={20} />
              {/* Smart Notification Badge - Shows (1) */}
              {showNotification && adhkarNotification && (
                <span
                  className="position-absolute top-0 start-0 translate-middle badge rounded-pill"
                  style={{
                    backgroundColor: getNotificationColor(),
                    fontSize: "0.65rem",
                    padding: "0.25rem 0.4rem",
                  }}
                >
                  1
                  <span className="visually-hidden">{getNotificationText()}</span>
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {showNotification && adhkarNotification && notificationDropdownOpen && (
              <div className="notification-dropdown-menu">
                <button
                  className="notification-dropdown-item"
                  onClick={() => {
                    handleNotificationClick()
                    setNotificationDropdownOpen(false)
                  }}
                  type="button"
                >
                  <div
                    className="notification-icon-circle"
                    style={{
                      backgroundColor: getNotificationColor(),
                    }}
                  >
                    <i className={`fas ${getNotificationIcon()} text-white`}></i>
                  </div>
                  <div className="notification-text">
                    <div className="notification-title">
                      {getNotificationText()}
                    </div>
                    <div className="notification-time">
                      {getNotificationTime()}
                    </div>
                  </div>
                  <i className="fas fa-chevron-left notification-arrow"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .lucide-icon {
          transition: transform 0.3s ease;
        }

        button:hover .lucide-icon {
          transform: scale(1.1) rotate(5deg);
        }

        .cursor-pointer {
          cursor: pointer;
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-fade-in-down {
          animation: fadeInDown 0.5s ease-out;
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Notification Dropdown Wrapper */
        .notification-dropdown-wrapper {
          position: relative;
        }

        /* Notification Dropdown Menu */
        .notification-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          width: 320px;
          background: ${isDark ? 'rgba(33, 37, 41, 0.98)' : 'rgba(255, 255, 255, 0.98)'};
          border-radius: 0.75rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
          z-index: 10000;
          overflow: hidden;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Notification Dropdown Item */
        .notification-dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          color: ${isDark ? '#fff' : '#000'};
        }

        .notification-dropdown-item:hover {
          background: ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
        }

        .notification-dropdown-item:active {
          background: ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'};
        }

        /* Notification Icon Circle */
        .notification-icon-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* Notification Text */
        .notification-text {
          flex: 1;
          text-align: right;
          min-width: 0;
        }

        .notification-title {
          font-size: 0.95rem;
          font-weight: 600;
          margin-bottom: 4px;
          color: ${isDark ? '#fff' : '#000'};
        }

        .notification-time {
          font-size: 0.8rem;
          color: ${isDark ? '#9ca3af' : '#6b7280'};
        }

        /* Notification Arrow */
        .notification-arrow {
          font-size: 0.8rem;
          color: ${isDark ? '#9ca3af' : '#6b7280'};
          flex-shrink: 0;
        }

        /* Mobile Responsive */
        @media (max-width: 576px) {
          .notification-dropdown-menu {
            width: min(320px, 90vw);
          }
        }

        /* Ensure header doesn't clip dropdown */
        header {
          overflow: visible !important;
        }

        header .container-fluid {
          overflow: visible !important;
        }
      `}</style>
    </header>
  )
}
