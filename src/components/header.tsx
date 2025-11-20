"use client"

import * as React from "react"

export function Header() {
  const [isDark, setIsDark] = React.useState(true)

  React.useEffect(() => {
    const theme = localStorage.getItem("theme")
    if (theme === "light") {
      document.documentElement.setAttribute("data-bs-theme", "light")
      setIsDark(false)
    } else {
      // Default to dark if no theme is saved or if saved theme is dark
      document.documentElement.setAttribute("data-bs-theme", "dark")
      setIsDark(true)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark"
    document.documentElement.setAttribute("data-bs-theme", newTheme)
    localStorage.setItem("theme", newTheme)
    setIsDark(!isDark)
  }

  return (
    <header className={`navbar navbar-expand-lg ${isDark ? 'navbar-dark bg-dark' : 'navbar-light bg-white'} shadow-sm sticky-top`}>
      <div className="container-fluid">
        <a className="navbar-brand d-flex align-items-center" href="#">
          <div className="rounded-3 gradient-bg p-3 me-2 shadow">
            <i className="fas fa-mosque text-white fs-4"></i>
          </div>
          <div>
            <h1 className="h3 mb-0 fw-bold gradient-text">طمأنينة</h1>
            <p className="small text-muted mb-0 d-none d-sm-block">رفيقك الروحاني</p>
          </div>
        </a>
        <div className="d-flex align-items-center">
          <button className="btn btn-light rounded-circle p-2 me-2" onClick={toggleTheme}>
            <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
          <button className="btn btn-light rounded-circle p-2 me-2">
            <i className="fas fa-bell"></i>
          </button>
          <button className="btn btn-light rounded-circle p-2">
            <i className="fas fa-user-circle"></i>
          </button>
        </div>
      </div>
    </header>
  )
}
