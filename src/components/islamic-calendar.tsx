"use client"

import React from "react"

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
    <div className="islamic-calendar card border-0 shadow-sm">
      <div className="card-header bg-transparent border-0 pt-3 pb-2">
        <div className="d-flex align-items-center justify-content-between gap-2">
          {/* Prev month */}
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm rounded-circle d-flex align-items-center justify-content-center"
            onClick={() => changeMonth(-1)}
            aria-label="الشهر السابق"
          >
            <i className="bi bi-chevron-right" />
          </button>

          {/* Month titles */}
          {/* <div className="text-center flex-grow-1">
            <div className="fw-bold fs-5 text-primary-emphasis">
              {gregorianMonthYear}
            </div>
            <div className="small text-muted">{hijriMonthYear}</div>
          </div> */}
{/* Today summary */}
        <div className="mt-3 p-2 rounded-3 bg-body-tertiary d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 small">
          <div className="fw-semibold text-primary-emphasis">
            تاريخ اليوم (ميلادي): <span className="text-body">{todayGregorianFull}</span>
          </div>
          <br></br>
          <div className="fw-semibold text-success-emphasis">
            تاريخ اليوم (هجري): <span className="text-body">{todayHijriFull}</span>
          </div>
        </div>
        <div className="text-center flex-grow-1">
            <div className="fw-bold fs-5 text-primary-emphasis">
              {gregorianMonthYear}
            </div>
            <div className="small text-muted">{hijriMonthYear}</div>
          </div>
          {/* Next month */}
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm rounded-circle d-flex align-items-center justify-content-center"
            onClick={() => changeMonth(1)}
            aria-label="الشهر التالي"
          >
            <i className="bi bi-chevron-left" />
          </button>
        </div>
      </div>

      <div className="card-body pt-2 pb-3">
        {/* Week days row */}
        <div className="calendar-grid mb-2 small text-muted text-center fw-semibold">
          {WEEK_DAYS.map((day) => (
            <div key={day} className="py-1">
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
              "calendar-day border rounded-3 text-center py-2 px-1 position-relative"
            const todayClass = cell.isToday ? " day-today" : " bg-body-tertiary-subtle"

            return (
              <button
                key={cell.key}
                type="button"
                className={baseClass + todayClass}
              >
                <div className="fw-bold">{cell.day}</div>
                <div className={`small ${cell.isToday ? "text-light" : "text-muted"}`}>
                  {cell.hijri}
                </div>
                {cell.isToday && (
                  <span className="today-badge badge rounded-pill bg-light text-primary-emphasis position-absolute top-0 start-50 translate-middle-x">
                    
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
