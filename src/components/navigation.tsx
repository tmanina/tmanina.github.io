"use client"

import * as React from "react"

type NavItem = {
  id: string
  label: string
  icon: string
  tabButtonId: string // يطابق id بتاع زر التاب في page.tsx
}

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "الرئيسية", icon: "fa-home", tabButtonId: "home-tab" },
  { id: "prayer", label: "مواقيت الصلاة", icon: "fa-mosque", tabButtonId: "prayer-tab" },
  { id: "adhkar", label: "الأذكار", icon: "fa-pray", tabButtonId: "adhkar-tab" },
  { id: "morning", label: "الصباح والمساء", icon: "fa-sun", tabButtonId: "morning-tab" },
  { id: "calendar", label: "التقويم", icon: "fa-calendar", tabButtonId: "calendar-tab" },
  { id: "dashboard", label: "لوحة التحكم", icon: "fa-chart-line", tabButtonId: "dashboard-tab" },
]

export function Navigation() {
  const [activeId, setActiveId] = React.useState<string>("home")

  const handleClick = (item: NavItem) => {
    setActiveId(item.id)

    if (typeof document !== "undefined") {
      const btn = document.getElementById(item.tabButtonId) as HTMLButtonElement | null

      if (btn) {
        // نخلي Bootstrap يغيّر التاب
        btn.click()

        // نطلع فوق شوية عشان المحتوى يكون واضح
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    }
  }

  return (
    // Bottom nav للموبايل / التابلت فقط
    <nav
      className="d-md-none position-fixed bottom-0 start-0 end-0 bg-body border-top shadow-lg"
      style={{ zIndex: 9999 }}
    >
      <div className="d-flex justify-content-around text-center py-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleClick(item)}
            className="btn btn-link flex-fill text-decoration-none p-0"
          >
            <div
              className={`d-flex flex-column align-items-center small ${
                activeId === item.id ? "text-primary" : "text-secondary"
              }`}
            >
              <i className={`fas ${item.icon} mb-1`}></i>
              <span className="text-nowrap">{item.label}</span>
            </div>
          </button>
        ))}
      </div>
    </nav>
  )
}
