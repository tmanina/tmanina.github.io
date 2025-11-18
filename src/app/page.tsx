"use client"

import { Header } from "@/components/header"
import { FloatingChat } from "@/components/floating-chat"
import { DhikrCounter } from "@/components/dhikr-counter"
import { MorningEvening } from "@/components/morning-evening"
import { IslamicCalendar } from "@/components/islamic-calendar"
import { Dashboard } from "@/components/dashboard"
import { PrayerTimes } from "@/components/prayer-times"

export default function Home() {
  return (
    <div className="min-vh-100 d-flex flex-column bg-body-tertiary">
      <Header />

      <main className="flex-grow-1">
        <div className="container py-4">

          {/* Tabs bar – تظهر فقط على الديسكتوب */}
          <div className="main-tabs-wrapper mb-4 d-none d-md-block">
            <ul
              className="nav nav-pills nav-fill bg-body rounded-4 shadow-sm p-2 gap-1 flex-nowrap main-tabs"
              id="mainTabs"
              role="tablist"
            >
              <li className="nav-item" role="presentation">
                <button
                  className="nav-link active"
                  id="home-tab"
                  data-bs-toggle="pill"
                  data-bs-target="#home"
                  type="button"
                  role="tab"
                >
                  <i className="fas fa-home ms-2"></i>
                  <span className="d-none d-sm-inline">الرئيسية</span>
                </button>
              </li>

              <li className="nav-item" role="presentation">
                <button
                  className="nav-link"
                  id="prayer-tab"
                  data-bs-toggle="pill"
                  data-bs-target="#prayer"
                  type="button"
                  role="tab"
                >
                  <i className="fas fa-mosque ms-2"></i>
                  <span className="d-none d-sm-inline">مواقيت الصلاة</span>
                </button>
              </li>

              <li className="nav-item" role="presentation">
                <button
                  className="nav-link"
                  id="adhkar-tab"
                  data-bs-toggle="pill"
                  data-bs-target="#adhkar"
                  type="button"
                  role="tab"
                >
                  <i className="fas fa-pray ms-2"></i>
                  <span className="d-none d-sm-inline">الأذكار</span>
                </button>
              </li>

              <li className="nav-item" role="presentation">
                <button
                  className="nav-link"
                  id="morning-tab"
                  data-bs-toggle="pill"
                  data-bs-target="#morning"
                  type="button"
                  role="tab"
                >
                  <i className="fas fa-sun ms-2"></i>
                  <span className="d-none d-sm-inline">الصباح والمساء</span>
                </button>
              </li>

              <li className="nav-item" role="presentation">
                <button
                  className="nav-link"
                  id="calendar-tab"
                  data-bs-toggle="pill"
                  data-bs-target="#calendar"
                  type="button"
                  role="tab"
                >
                  <i className="fas fa-calendar ms-2"></i>
                  <span className="d-none d-sm-inline">التقويم</span>
                </button>
              </li>

              <li className="nav-item" role="presentation">
                <button
                  className="nav-link"
                  id="dashboard-tab"
                  data-bs-toggle="pill"
                  data-bs-target="#dashboard"
                  type="button"
                  role="tab"
                >
                  <i className="fas fa-chart-line ms-2"></i>
                  <span className="d-none d-sm-inline">لوحة التحكم</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Tabs content */}
          <div className="tab-content" id="mainTabsContent">
            {/* Home tab */}
            <div className="tab-pane fade show active" id="home" role="tabpanel">
              <div className="row g-4">
                <div className="col-12">
                  <div className="card border-0 shadow-lg rounded-4 overflow-hidden home-hero-card">
                    <div className="home-hero-gradient p-4 p-md-5 text-white">
                      <h1 className="h3 h-md-2 mb-2 fw-bold">
                        مرحباً بك في طمانينة
                      </h1>
                      <p className="mb-0 mb-md-1">
                        تقرّب إلى الله بالأذكار والعبادات، في مكان واحد منظم وجميل.
                      </p>
                    </div>

                    <div className="card-body p-3 p-md-4">
                      <div className="row g-3 g-md-4">
                        <div className="col-6 col-md-3">
                          <div className="text-center p-3 rounded-3 bg-body-secondary feature-card">
                            <i className="fas fa-pray fs-2 gradient-text mb-2"></i>
                            <p className="small fw-semibold mb-0">أذكار يومية</p>
                            <p className="text-muted extra-small mb-0 mt-1">
                              سهولة الوصول لأذكارك المفضلة
                            </p>
                          </div>
                        </div>

                        <div className="col-6 col-md-3">
                          <div className="text-center p-3 rounded-3 bg-body-secondary feature-card">
                            <i className="fas fa-calendar-alt fs-2 gradient-text mb-2"></i>
                            <p className="small fw-semibold mb-0">التقويم الهجري</p>
                            <p className="text-muted extra-small mb-0 mt-1">
                              عرض متزامن للهجري والميلادي
                            </p>
                          </div>
                        </div>

                        <div className="col-6 col-md-3">
                          <div className="text-center p-3 rounded-3 bg-body-secondary feature-card">
                            <i className="fas fa-clock fs-2 gradient-text mb-2"></i>
                            <p className="small fw-semibold mb-0">مواقيت الصلاة</p>
                            <p className="text-muted extra-small mb-0 mt-1">
                              مواعيد دقيقة حسب مدينتك
                            </p>
                          </div>
                        </div>

                        <div className="col-6 col-md-3">
                          <div className="text-center p-3 rounded-3 bg-body-secondary feature-card">
                            <i className="fas fa-chart-line fs-2 gradient-text mb-2"></i>
                            <p className="small fw-semibold mb-0">تتبع النشاط</p>
                            <p className="text-muted extra-small mb-0 mt-1">
                              سجّل الأذكار وتابع تقدّمك
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compact dashboard on home */}
                <div className="col-12">
                  <Dashboard compact />
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

            {/* Morning & evening adhkar */}
            <div className="tab-pane fade" id="morning" role="tabpanel">
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-3 p-md-4">
                  <MorningEvening />
                </div>
              </div>
            </div>

            {/* Islamic calendar */}
            <div className="tab-pane fade" id="calendar" role="tabpanel">
              <IslamicCalendar />
            </div>

            {/* Full dashboard */}
            <div className="tab-pane fade" id="dashboard" role="tabpanel">
              <Dashboard />
            </div>
          </div>
        </div>
      </main>

      <FloatingChat />
    </div>
  )
}
