"use client"

import * as React from "react"
import { Header } from "@/components/header"
import { FloatingChat } from "@/components/floating-chat"
import { DhikrCounter } from "@/components/dhikr-counter"
import { IslamicCalendar } from "@/components/islamic-calendar"
import { Dashboard } from "@/components/dashboard"
import { PrayerTimes } from "@/components/prayer-times"
import { TasbihCircle } from "@/components/tasbih-circle"
import { About } from "@/components/about"
import { AdhkarList } from "@/components/adhkar-list"

export default function Home() {
  const [showSplash, setShowSplash] = React.useState(true)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  if (showSplash) {
    return (
      <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark d-flex flex-column align-items-center justify-content-center z-3" style={{ zIndex: 9999 }}>
        <div className="text-center animate__animated animate__fadeIn">
          <div className="mb-4">
            <i className="fas fa-mosque text-white" style={{ fontSize: "4rem" }}></i>
          </div>
          <h1 className="display-1 fw-bold text-white mb-2" style={{ fontFamily: 'var(--font-arabic)' }}>طمأنينة</h1>
          <p className="text-white-50 fs-4"> رفيقك في رحلة التقرب إلى الله

          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-vh-100 d-flex flex-column bg-body-tertiary">
      <Header />

      <main className="flex-grow-1">
        <div className="container py-4">
          {/* Navigation Pills */}
          <style jsx>{`
            .main-tabs {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              z-index: 9999;
              margin-bottom: 0 !important;
              border-radius: 0 !important;
              border-top: 1px solid var(--bs-border-color);
            }
            
            @media (min-width: 992px) {
              .main-tabs {
                position: sticky;
                top: 0;
                bottom: auto;
                border-top: none;
                border-radius: 1rem !important;
                margin-bottom: 1.5rem !important;
                z-index: 10;
              }
              
              .container {
                position: relative;
                z-index: 100;
              }
            }
            
            /* Dropdown opens upward on mobile */
            @media (max-width: 991px) {
              .main-tabs {
                overflow: visible !important;
              }
              
              :global(.dropdown-menu) {
                bottom: 100% !important;
                top: auto !important;
                transform: none !important;
                margin-bottom: 0.5rem;
                z-index: 10000 !important;
                position: absolute !important;
              }
            }
            
            /* Active state when dropdown is open */
            :global(.dropdown.show .nav-link) {
              background-color: var(--bs-primary);
              color: white !important;
            }
          `}</style>

          <ul className="nav nav-pills nav-fill bg-body shadow-sm p-2 gap-1 flex-nowrap main-tabs mb-4" id="mainTabs" role="tablist">
            <li className="nav-item" role="presentation">
              <button className="nav-link active" id="home-tab" data-bs-toggle="pill" data-bs-target="#home" type="button" role="tab">
                <i className="fas fa-home ms-2"></i>
                <span className="d-none d-sm-inline">الرئيسية</span>
              </button>
            </li>

            <li className="nav-item" role="presentation">
              <button className="nav-link" id="prayer-tab" data-bs-toggle="pill" data-bs-target="#prayer" type="button" role="tab">
                <i className="fas fa-mosque ms-2"></i>
                <span className="d-none d-sm-inline">مواقيت الصلاة</span>
              </button>
            </li>

            <li className="nav-item d-none" role="presentation">
              <button className="nav-link" id="adhkar-tab" data-bs-toggle="pill" data-bs-target="#adhkar" type="button" role="tab">
                تسبيح
              </button>
            </li>

            <li className="nav-item" role="presentation">
              <button className="nav-link" id="adhkar-list-tab" data-bs-toggle="pill" data-bs-target="#adhkar-list" type="button" role="tab">
                <span className="ms-2" style={{ fontSize: '1.2em' }}>🤲</span>
                <span className="d-none d-sm-inline">الاذكار</span>
              </button>
            </li>

            <li className="nav-item" role="presentation">
              <button className="nav-link" id="calendar-tab" data-bs-toggle="pill" type="button" data-bs-target="#calendar" role="tab">
                <i className="fas fa-calendar ms-2"></i>
                <span className="d-none d-sm-inline">التقويم</span>
              </button>
            </li>

            <li className="nav-item d-none" role="presentation">
              <button className="nav-link" id="dashboard-tab" data-bs-toggle="pill" type="button" data-bs-target="#dashboard" role="tab">
                لوحة التحكم
              </button>
            </li>

            <li className="nav-item d-none" role="presentation">
              <button className="nav-link" id="about-tab" data-bs-toggle="pill" data-bs-target="#about" type="button" role="tab">
                عن التطبيق
              </button>
            </li>

            <li className="nav-item dropdown" role="presentation">


              <button className="nav-link dropdown-toggle" id="other-dropdown" data-bs-toggle="dropdown" aria-expanded="false" type="button">
                <i className="fas fa-ellipsis-h ms-2"></i>
                <span className="d-none d-sm-inline">أخرى</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="other-dropdown">
                <li>
                  <button className="dropdown-item" type="button" onClick={(e) => {
                    e.preventDefault()
                    const dropdown = document.getElementById('other-dropdown')
                    const btn = document.getElementById('dashboard-tab') as HTMLButtonElement
                    if (btn) {
                      btn.click()
                      // Close dropdown
                      if (dropdown) {
                        const bsDropdown = (window as any).bootstrap?.Dropdown?.getInstance(dropdown)
                        if (bsDropdown) bsDropdown.hide()
                      }
                      // Scroll to top
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }
                  }}>
                    <i className="fas fa-chart-line ms-2"></i>
                    لوحة التحكم
                  </button>
                </li>
                <li>
                  <button className="dropdown-item" type="button" onClick={(e) => {
                    e.preventDefault()
                    const dropdown = document.getElementById('other-dropdown')
                    const btn = document.getElementById('about-tab') as HTMLButtonElement
                    if (btn) {
                      btn.click()
                      // Close dropdown
                      if (dropdown) {
                        const bsDropdown = (window as any).bootstrap?.Dropdown?.getInstance(dropdown)
                        if (bsDropdown) bsDropdown.hide()
                      }
                      // Scroll to top
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }
                  }}>
                    <i className="fas fa-info-circle ms-2"></i>
                    عن التطبيق
                  </button>
                </li>
              </ul>
            </li>
          </ul>

          {/* Tabs content */}
          <div className="tab-content" id="mainTabsContent">
            {/* Home tab */}
            <div className="tab-pane fade show active" id="home" role="tabpanel">
              <div className="row g-4">
                <div className="col-12">
                  <div className="card border-0 shadow-lg rounded-4 overflow-hidden home-hero-card">
                    <div className="home-hero-gradient p-4 p-md-5 text-white">
                      <h1 className="h3 h-md-2 mb-2 fw-bold">
                        مرحباً بك في تطبيق طمأنينة
                      </h1>
                      <p className="mb-0 mb-md-1">
                        تقرّب إلى الله بالأذكار والعبادات، في مكان واحد
                        .
                        <br></br>
                        مع مساعد طمأنينة الذكي للرد علي جميع اسئلتك الدينية.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons - 4 buttons */}
                <div className="col-12">
                  <div className="row g-3 g-md-4">
                    {/* ورد الصباح */}
                    <div className="col-6 col-md-3">
                      <button
                        className="btn btn-lg w-100 h-100 p-4 rounded-4 border-0 shadow-sm bg-body-secondary position-relative overflow-hidden nav-card-btn"
                        onClick={() => {
                          // First activate adhkar-list tab
                          const adhkarListTab = document.getElementById('adhkar-list-tab') as HTMLButtonElement
                          if (adhkarListTab) adhkarListTab.click()

                          // Then activate morning sub-tab after a short delay
                          setTimeout(() => {
                            const morningTab = document.querySelector('a[href="#adhkar-morning"]') as HTMLElement
                            if (morningTab) {
                              morningTab.click()
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }
                          }, 100)
                        }}
                        type="button"
                        style={{ transition: 'all 0.3s ease' }}
                      >
                        <div className="text-center">
                          <i className="fas fa-sun fs-1 gradient-text mb-3 d-block"></i>
                          <h5 className="fw-bold mb-0">ورد الصباح</h5>
                        </div>
                      </button>
                    </div>

                    {/* ورد المساء */}
                    <div className="col-6 col-md-3">
                      <button
                        className="btn btn-lg w-100 h-100 p-4 rounded-4 border-0 shadow-sm bg-body-secondary position-relative overflow-hidden nav-card-btn"
                        onClick={() => {
                          // First activate adhkar-list tab
                          const adhkarListTab = document.getElementById('adhkar-list-tab') as HTMLButtonElement
                          if (adhkarListTab) adhkarListTab.click()

                          // Then activate evening sub-tab after a short delay
                          setTimeout(() => {
                            const eveningTab = document.querySelector('a[href="#adhkar-evening"]') as HTMLElement
                            if (eveningTab) {
                              eveningTab.click()
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }
                          }, 100)
                        }}
                        type="button"
                        style={{ transition: 'all 0.3s ease' }}
                      >
                        <div className="text-center">
                          <i className="fas fa-moon fs-1 gradient-text mb-3 d-block"></i>
                          <h5 className="fw-bold mb-0">ورد المساء</h5>
                        </div>
                      </button>
                    </div>

                    {/* تسبيح */}
                    <div className="col-6 col-md-3">
                      <button
                        className="btn btn-lg w-100 h-100 p-4 rounded-4 border-0 shadow-sm bg-body-secondary position-relative overflow-hidden nav-card-btn"
                        onClick={() => {
                          const adhkarTab = document.getElementById('adhkar-tab') as HTMLButtonElement
                          if (adhkarTab) {
                            adhkarTab.click()
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }
                        }}
                        type="button"
                        style={{ transition: 'all 0.3s ease' }}
                      >
                        <div className="text-center">
                          <span className="d-block mb-3" style={{ fontSize: '3rem' }}>📿</span>
                          <h5 className="fw-bold mb-0">تسبيح</h5>
                        </div>
                      </button>
                    </div>

                    {/* قريباً - Soon */}
                    <div className="col-6 col-md-3">
                      <button
                        className="btn btn-lg w-100 h-100 p-4 rounded-4 border-0 shadow-sm bg-body-secondary position-relative overflow-hidden nav-card-btn disabled"
                        type="button"
                        style={{ transition: 'all 0.3s ease', opacity: 0.7, cursor: 'default' }}
                      >
                        <div className="text-center">
                          <i className="fas fa-hourglass-half fs-1 text-secondary mb-3 d-block"></i>
                          <h5 className="fw-bold mb-0 text-secondary">قريباً</h5>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tasbih Circle */}
                <div className="col-12">
                  <TasbihCircle />
                </div>
              </div>
            </div>

            {/* Prayer times */}
            <div className="tab-pane fade" id="prayer" role="tabpanel">
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-3 p-md-4">
                  <PrayerTimes country="EG" city="Cairo" />
                </div>
              </div>
            </div>

            {/* Dhikr counter */}
            <div className="tab-pane fade" id="adhkar" role="tabpanel">
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-3 p-md-4">
                  <DhikrCounter />
                </div>
              </div>
            </div>

            {/* Adhkar List - الأذكار */}
            <div className="tab-pane fade" id="adhkar-list" role="tabpanel">
              <AdhkarList />
            </div>

            {/* Islamic calendar */}
            <div className="tab-pane fade" id="calendar" role="tabpanel">
              <IslamicCalendar />
            </div>

            {/* Full dashboard */}
            <div className="tab-pane fade" id="dashboard" role="tabpanel">
              <Dashboard />
            </div>

            {/* About - عن التطبيق */}
            <div className="tab-pane fade" id="about" role="tabpanel">
              <About />
            </div>
          </div>
        </div>
      </main>

      <FloatingChat />
    </div>
  )
}
