"use client"

import React from "react"
import { Button } from "@/components/ui/button"

type CalendarCell = {
  key: string
  isEmpty: boolean
  day?: number
  hijri?: string
  isToday?: boolean
}

const WEEK_DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]

export function IslamicCalendar() {
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date())

  const changeMonth = (amount: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      next.setMonth(next.getMonth() + amount)
      return next
    })
  }

  const calendarGrid: CalendarCell[] = React.useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const today = new Date()

    const firstDayOfMonth = new Date(year, month, 1).getDay() // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const items: CalendarCell[] = []

    // leading empty cells
    for (let i = 0; i < firstDayOfMonth; i++) {
      items.push({ key: `empty-${i}`, isEmpty: true })
    }

    // real days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const isToday = date.toDateString() === today.toDateString()

      const hijri = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
        day: "numeric",
      }).format(date)

      items.push({
        key: `day-${day}`,
        isEmpty: false,
        day,
        hijri,
        isToday,
      })
    }

    return items
  }, [currentDate])

  const gregorianMonthYear = new Intl.DateTimeFormat("ar-EG", {
    month: "long",
    year: "numeric",
  }).format(currentDate)

  const hijriMonthYear = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
    month: "long",
    year: "numeric",
  }).format(currentDate)

  const today = new Date()
  const todayHijriFull = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(today)
  const todayGregorianFull = new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(today)

  return (
    <div className="islamic-calendar shadow-sm">
      <div className="pt-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          {/* Prev month */}
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-8 h-8"
            onClick={() => changeMonth(-1)}
            aria-label="الشهر السابق"
          >
            <i className="fas fa-chevron-right" />
          </Button>

          {/* Today summary */}            <div className="mt-3 p-2 rounded-lg bg-muted/50 flex flex-col md:flex-row md:items-center justify-between gap-2 text-sm">
            <div className="font-semibold text-primary">
              تاريخ اليوم (ميلادي): <span className="text-foreground">{todayGregorianFull}</span>
            </div>
            <br></br>
            <div className="font-semibold text-emerald-600">
              تاريخ اليوم (هجري): <span className="text-foreground">{todayHijriFull}</span>
            </div>
          </div>
          <div className="text-center flex-1">
            <div className="font-bold text-lg text-primary">
              {gregorianMonthYear}
            </div>
            <div className="text-xs text-muted-foreground">{hijriMonthYear}</div>
          </div>
          {/* Next month */}
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-8 h-8"
            onClick={() => changeMonth(1)}
            aria-label="الشهر التالي"
          >
            <i className="fas fa-chevron-left" />
          </Button>
        </div>
      </div>

      <div className="pt-2 pb-3">
        {/* Week days row */}
        <div className="calendar-grid mb-2 text-muted-foreground text-center font-semibold" style={{ fontSize: '0.75rem' }}>
          {WEEK_DAYS.map((day) => (
            <div key={day} className="py-1" style={{ fontSize: 'clamp(0.65rem, 2vw, 0.85rem)' }}>
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="calendar-grid">
          {calendarGrid.map((cell) => {
            if (cell.isEmpty) {
              return <div key={cell.key} className="calendar-day-empty" />
            }

            const baseClass =
              "calendar-day border rounded-lg text-center py-2 px-1 relative"
            const todayClass = cell.isToday ? " day-today" : " bg-muted/30"

            return (
              <button
                key={cell.key}
                type="button"
                className={baseClass + todayClass}
              >
                <div className="font-bold">{cell.day}</div>
                <div className={`text-xs ${cell.isToday ? "text-white" : "text-muted-foreground"}`}>
                  {cell.hijri}
                </div>
                {cell.isToday && (
                  <span className="today-badge rounded-full bg-white text-primary top-0 start-1/2 -translate-x-1/2 absolute px-2 py-0.5 text-xs font-medium">

                  </span>
                )}
              </button>
            )
          })}
        </div>


      </div>
    </div>
  )
}

export default IslamicCalendar
