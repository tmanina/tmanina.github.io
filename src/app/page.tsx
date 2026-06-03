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
import { SharePage } from "@/components/share-page"
import { MediaPage } from "@/components/media-page"
import { MiniRadioPlayer } from "@/components/mini-radio-player"
import { InstallPrompt } from "@/components/install-prompt"
import { SplashScreen } from "@/components/splash-screen"
import { UpdateNotification } from "@/components/update-notification"
import { useRouter, useSearchParams } from "next/navigation"

export default function Home() {
  const [showSplash, setShowSplash] = React.useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("view") || "home"
  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  // 2-day temporary "new" badge for المكتبة button
  const [showLibraryBadge, setShowLibraryBadge] = React.useState(false)
  React.useEffect(() => {
    const key = 'libraryNewBadgeTimestamp'
    const stored = localStorage.getItem(key)
    const now = Date.now()
    if (!stored) {
      localStorage.setItem(key, now.toString())
      setShowLibraryBadge(true)
      return
    }
    const saved = parseInt(stored, 10)
    const diffDays = (now - saved) / (1000 * 60 * 60 * 24)
    if (diffDays < 2) {
      setShowLibraryBadge(true)
    } else {
      setShowLibraryBadge(false)
      localStorage.removeItem(key)
    }
  }, [])

  // Helper to change tab
  const setActiveTab = (tab: string) => {
    // If going to home, clear params to keep URL clean
    if (tab === "home") {
      router.push("/")
    } else {
      router.push(`?view=${tab}`)
    }
  }

  // آيات عشوائية
  const randomAyahs = [
    { ayah: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", source: "(الرعد: 28)" },
    { ayah: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا", source: "(الطلاق: 2)" },
    { ayah: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", source: "(الشرح: 6)" },
    { ayah: "فَاذْكُرُونِي أَذْكُرْكُمْ", source: "(البقرة: 152)" },
    { ayah: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ", source: "(الحديد: 4)" }
  ]

  const [currentAyah] = React.useState(() => {
    const randomIndex = Math.floor(Math.random() * randomAyahs.length)
    return randomAyahs[randomIndex]
  })

  // نصوص عشوائية
  const [showAIFirst] = React.useState(() => Math.random() > 0.5)

  // Safety timeout to ensure splash screen doesn't get stuck
  React.useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setShowSplash(false)
    }, 2000) // 2 seconds max
    return () => clearTimeout(safetyTimer)
  }, [])

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (dropdownOpen && !target.closest('.dropdown')) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [dropdownOpen])

  // Auto-update service worker
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        // Check for updates every 60 seconds
        setInterval(() => {
          registration.update()
        }, 60000)

        // Reload page when new service worker takes control
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('New version available, reloading...')
          window.location.reload()
        })
      })
    }
  }, [])



  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />
  }

  return (
    <div className="min-vh-100 d-flex flex-column bg-body-tertiary">
      <Header />
      <UpdateNotification />

      <main className="flex-grow-1">
        <div className="container pt-4 pb-5" style={{
          paddingBottom: '180px',
          zIndex: activeTab === "media" && searchParams.get("id") === "quran" ? 12000 : 100,
          position: 'relative'
        }}>
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
              border-top: 2px solid var(--bs-border-color);
              background: rgba(var(--bs-body-bg-rgb), 0.95) !important;
              backdrop-filter: blur(20px) saturate(180%);
              -webkit-backdrop-filter: blur(20px) saturate(180%);
              box-shadow: 0 -5px 25px rgba(0, 0, 0, 0.15) !important;
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
                background: var(--bs-body-bg) !important;
                backdrop-filter: none;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
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
                margin-bottom: 0.75rem;
                z-index: 10000 !important;
                position: absolute !important;
                left: 0 !important;
                right: auto !important;
                min-width: 180px;
                max-height: 300px;
                overflow-y: auto;
              }

              :global(.dropdown) {
                position: static !important;
              }

              :global(.dropdown-menu.show) {
                display: block;
              }
            }
            
            /* Active state when dropdown is open */
            :global(.dropdown.show .nav-link) {
              background-color: var(--bs-primary);
              color: white !important;
            }

            /* Mobile navigation labels */
            @media (max-width: 991px) {
              .nav-label {
                font-size: 0.65rem;
                margin-top: 2px;
              }

              .main-tabs .nav-link {
                padding: 0.5rem 0.25rem !important;
              }

              /* Hide dropdown arrow on mobile */
              .dropdown-toggle-mobile::after {
                display: none;
              }
            }

            /* Show dropdown toggle arrow on desktop */
            @media (min-width: 992px) {
              .dropdown-toggle-mobile::after {
                display: inline-block;
                margin-left: 0.255em;
                vertical-align: 0.255em;
                content: "";
                border-top: 0.3em solid;
                border-right: 0.3em solid transparent;
                border-bottom: 0;
                border-left: 0.3em solid transparent;
              }
            }

            /* New badge for library button */
            .library-new-badge {
              position: absolute;
              top: 0.5rem;
              right: 0.5rem;
              background: #ff4757;
              color: white;
              font-size: 0.7rem;
              font-weight: 600;
              padding: 0.2rem 0.5rem;
              border-radius: 0.4rem;
              z-index: 10;
            }
          `}</style>

          <ul className="nav nav-pills nav-fill bg-body shadow-sm p-2 gap-1 flex-nowrap main-tabs mb-4" id="mainTabs" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link rounded-pill d-flex flex-column flex-sm-row align-items-center justify-content-center gap-1 gap-sm-2 ${activeTab === "home" ? "active" : ""}`}
                onClick={() => setActiveTab("home")}
                type="button"
              >
                <i className="fas fa-home"></i>
                <span className="nav-label">الرئيسية</span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link rounded-pill d-flex flex-column flex-sm-row align-items-center justify-content-center gap-1 gap-sm-2 ${activeTab === "adhkar-list" ? "active" : ""}`}
                onClick={() => setActiveTab("adhkar-list")}
                data-tab="adhkar-list"
                type="button"
              >
                <i className="fas fa-book-open"></i>
                <span className="nav-label">الأذكار</span>
              </button>
            </li>

            <li className="nav-item" role="presentation">
              <button
                className={`nav-link rounded-pill d-flex flex-column flex-sm-row align-items-center justify-content-center gap-1 gap-sm-2 ${activeTab === "prayer-times" ? "active" : ""}`}
                onClick={() => setActiveTab("prayer-times")}
                type="button"
              >
                <i className="fas fa-clock"></i>
                <span className="nav-label">الصلاة</span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link rounded-pill d-flex flex-column flex-sm-row align-items-center justify-content-center gap-1 gap-sm-2 ${activeTab === "calendar" ? "active" : ""}`}
                onClick={() => setActiveTab("calendar")}
                type="button"
              >
                <i className="fas fa-calendar-alt"></i>
                <span className="nav-label">التقويم</span>
              </button>
            </li>

            {/* Share Tab */}
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link rounded-pill d-flex flex-column flex-sm-row align-items-center justify-content-center gap-1 gap-sm-2 ${activeTab === "share" ? "active" : ""}`}
                onClick={() => setActiveTab("share")}
                type="button"
              >
                <i className="fas fa-share-nodes"></i>
                <span className="nav-label">نشر</span>
              </button>
            </li>

            {/* Dropdown for other items */}
            <li className="nav-item dropdown" role="presentation">
              <button
                className={`nav-link rounded-pill d-flex flex-column flex-sm-row align-items-center justify-content-center gap-1 gap-sm-2 dropdown-toggle-mobile ${dropdownOpen ? 'show' : ''}`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                type="button"
                aria-expanded={dropdownOpen}
              >
                <i className="fas fa-bars"></i>
                <span className="nav-label">المزيد</span>
              </button>
              <ul className={`dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-4 p-2 ${dropdownOpen ? 'show' : ''}`}>
                <li>
                  <button
                    className={`dropdown-item rounded-3 d-flex align-items-center gap-2 py-2 mb-1 ${activeTab === "dashboard" ? "active" : ""}`}
                    onClick={() => {
                      setActiveTab("dashboard")
                      setDropdownOpen(false)
                    }}
                  >
                    <i className="fas fa-chart-pie w-25 text-center"></i>
                    <span>لوحة النشاط</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item rounded-3 d-flex align-items-center gap-2 py-2 mb-1`}
                    onClick={() => {
                      setDropdownOpen(false)
                      // Show install instructions
                      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
                      const isAndroid = /Android/.test(navigator.userAgent)

                      if (isIOS) {
                        alert('📱 لتثبيت التطبيق على iPhone/iPad:\n\n1. اضغط على زر المشاركة ⬆️ في شريط الأدوات\n2. اختر "إضافة إلى الشاشة الرئيسية"\n3. اضغط "إضافة"')
                      } else if (isAndroid) {
                        alert('📱 لتثبيت التطبيق على Android:\n\n1. اضغط على القائمة ⋮ في المتصفح\n2. اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"\n3. اضغط "تثبيت"')
                      } else {
                        alert('💻 لتثبيت التطبيق:\n\n1. ابحث عن أيقونة التثبيت في شريط العنوان\n2. أو افتح قائمة المتصفح واختر "تثبيت التطبيق"\n\nملاحظة: يعمل التثبيت على متصفحات Chrome وEdge وSafari الحديثة')
                      }
                    }}
                  >
                    <i className="fas fa-download w-25 text-center"></i>
                    <span>تثبيت التطبيق</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item rounded-3 d-flex align-items-center gap-2 py-2 ${activeTab === "about" ? "active" : ""}`}
                    onClick={() => {
                      setActiveTab("about")
                      setDropdownOpen(false)
                    }}
                  >
                    <i className="fas fa-info-circle w-25 text-center"></i>
                    <span>عن التطبيق</span>
                  </button>
                </li>
              </ul>
            </li>
          </ul>

          {/* Persistent Mini Radio Player - stays playing across all tabs */}
          <div className="mb-4">
            <MiniRadioPlayer />
          </div>

          <div className="tab-content">
            {activeTab === "home" && (
              <div className="animate__animated animate__fadeIn">
                <div className="row g-4">
                  <div className="col-12">
                    <div className="card border-0 shadow-lg rounded-4 overflow-hidden home-hero-card">
                      <div className="home-hero-gradient p-3 p-md-4 text-white">
                        <div className="text-center">
                          <h1 className="h3 h-md-2 mb-3 fw-bold">
                            مرحباً بك في تطبيق طمأنينة
                          </h1>

                          <div className="my-3 py-2 px-3 rounded-3" style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                          }}>
                            <p className="h5 mb-1 fw-bold" style={{ lineHeight: '1.6' }}>
                              {currentAyah.ayah}
                            </p>
                            <p className="mb-0 small opacity-75">
                              {currentAyah.source}
                            </p>
                          </div>

                          <p className="mb-0 opacity-90">
                            {showAIFirst ? (
                              "مع مساعد طمأنينة الذكي للرد على جميع أسئلتك الدينية"
                            ) : (
                              "تقرّب إلى الله بالأذكار والعبادات، في مكان واحد"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="col-12">
                    <div className="row g-3 g-md-4">
                      {/* ورد الصباح */}
                      <div className="col-6 col-md-3">
                        <button
                          className="btn btn-lg w-100 h-100 p-4 rounded-4 border-0 shadow-sm bg-body-secondary position-relative overflow-hidden nav-card-btn"
                          onClick={() => {
                            // Navigate to adhkar list with morning selected
                            router.push('?view=adhkar-list&id=morning')
                          }}
                          type="button"
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
                            // Navigate to adhkar list with evening selected
                            router.push('?view=adhkar-list&id=evening')
                          }}
                          type="button"
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
                          onClick={() => setActiveTab("tasbih")}
                          type="button"
                        >
                          <div className="text-center">
                            <span className="d-block mb-3" style={{ fontSize: '3rem' }}>📿</span>
                            <h5 className="fw-bold mb-0">تسبيح</h5>
                          </div>
                        </button>
                      </div>

                      {/* مكتبة الوسائط */}
                      <div className="col-6 col-md-3">
                        <button
                          className="btn btn-lg w-100 h-100 p-4 rounded-4 border-0 shadow-sm bg-body-secondary position-relative overflow-hidden nav-card-btn"
                          onClick={() => setActiveTab("media")}
                          type="button"
                        >
                          {showLibraryBadge && (<span className="library-new-badge">جديد</span>)}
                          <div className="text-center">
                            <i className="fas fa-photo-video fs-1 gradient-text mb-3 d-block"></i>
                            <h5 className="fw-bold mb-0">المكتبة</h5>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tasbih Circle Preview */}
                  <div className="col-12">
                    <TasbihCircle />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "adhkar-list" && (
              <div className="animate__animated animate__fadeIn">
                <AdhkarList />
              </div>
            )}

            {activeTab === "tasbih" && (
              <div className="animate__animated animate__fadeIn">
                <div className="row justify-content-center">
                  <div className="col-12 col-lg-8">
                    <DhikrCounter />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "prayer-times" && (
              <div className="animate__animated animate__fadeIn">
                <PrayerTimes country="EG" city="Cairo" />
              </div>
            )}

            {activeTab === "calendar" && (
              <div className="animate__animated animate__fadeIn">
                <IslamicCalendar />
              </div>
            )}

            {activeTab === "share" && (
              <div className="animate__animated animate__fadeIn">
                <SharePage />
              </div>
            )}

            {activeTab === "dashboard" && (
              <div className="animate__animated animate__fadeIn">
                <Dashboard />
              </div>
            )}

            {activeTab === "about" && (
              <div className="animate__animated animate__fadeIn">
                <About />
              </div>
            )}

            {activeTab === "media" && (
              <div className="animate__animated animate__fadeIn">
                <MediaPage />
              </div>
            )}
          </div>
        </div>
      </main>

      <FloatingChat />
      <InstallPrompt />
    </div>
  )
}
