"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { DhikrCounter } from "@/components/dhikr-counter"
import { TasbihCircle } from "@/components/tasbih-circle"
import { AdhkarList } from "@/components/adhkar-list"
import { RadioProvider } from "@/contexts/radio-context"
import { useRouter, useSearchParams } from "next/navigation"

const IslamicCalendar = dynamic(() => import("@/components/islamic-calendar").then(m => m.IslamicCalendar), { loading: () => <div className="w-8 h-8 border-4 border-border border-t-emerald-500 rounded-full animate-spin mx-auto mt-10" /> })
const Dashboard = dynamic(() => import("@/components/dashboard").then(m => m.Dashboard), { loading: L })
const PrayerTimes = dynamic(() => import("@/components/prayer-times").then(m => m.PrayerTimes), { loading: L })
const About = dynamic(() => import("@/components/about").then(m => m.About), { loading: L })
const SharePage = dynamic(() => import("@/components/share-page").then(m => m.SharePage), { loading: L })
const MediaPage = dynamic(() => import("@/components/media-page").then(m => m.MediaPage), { loading: L })
const MiniRadioPlayer = dynamic(() => import("@/components/mini-radio-player").then(m => m.MiniRadioPlayer), { loading: L })
const QuranCompletionPlan = dynamic(() => import("@/components/quran-completion-plan").then(m => m.QuranCompletionPlan), { loading: L })
const AdhkarReminders = dynamic(() => import("@/components/adhkar-reminders").then(m => m.AdhkarReminders), { loading: L })
const NextPrayerWidget = dynamic(() => import("@/components/next-prayer-widget").then(m => m.NextPrayerWidget), { loading: L })
const InstallPrompt = dynamic(() => import("@/components/install-prompt").then(m => m.InstallPrompt), { loading: () => null })
const SplashScreen = dynamic(() => import("@/components/splash-screen").then(m => m.SplashScreen), { loading: () => null })
const FloatingChat = dynamic(() => import("@/components/floating-chat").then(m => m.FloatingChat), { loading: () => null })
const UpdateNotification = dynamic(() => import("@/components/update-notification").then(m => m.UpdateNotification), { loading: () => null })

function L() {
  return <div className="w-8 h-8 border-4 border-border border-t-emerald-500 rounded-full animate-spin mx-auto mt-10" />
}

export function HomeClient() {
  const [showSplash, setShowSplash] = React.useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("view") || "home"
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

  const setActiveTab = (tab: string) => {
    if (tab === "home") {
      router.push("/")
    } else {
      router.push(`?view=${tab}`)
    }
  }

  const randomAyahs = React.useMemo(() => [
    { ayah: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", source: "(الرعد: 28)" },
    { ayah: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا", source: "(الطلاق: 2)" },
    { ayah: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", source: "(الشرح: 6)" },
    { ayah: "فَاذْكُرُونِي أَذْكُرْكُمْ", source: "(البقرة: 152)" },
    { ayah: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ", source: "(الحديد: 4)" }
  ], [])

  const [currentAyah, setCurrentAyah] = React.useState(randomAyahs[0])
  const [showAIFirst, setShowAIFirst] = React.useState(false)

  React.useEffect(() => {
    setCurrentAyah(randomAyahs[Math.floor(Math.random() * randomAyahs.length)])
    setShowAIFirst(Math.random() > 0.5)
  }, [randomAyahs])

  React.useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setShowSplash(false)
    }, 2000)
    return () => clearTimeout(safetyTimer)
  }, [])

  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        setInterval(() => {
          registration.update()
        }, 60000)
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <UpdateNotification />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto pt-4 px-4" style={{
          paddingBottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))',
          zIndex: activeTab === "media" && searchParams.get("id") === "quran" ? 12000 : undefined,
          position: activeTab === "media" && searchParams.get("id") === "quran" ? 'relative' : undefined
        }}>
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

          <RadioProvider>
          <div className="mb-4">
            <MiniRadioPlayer />
          </div>

          <div className="tab-content">
            {activeTab === "home" && (
              <div className="animate-fade-in home-shell">
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="home-hero-card overflow-hidden rounded-xl shadow-lg">
                      <div className="home-hero-gradient p-4 text-white md:p-5">
                        <div className="text-center">
                          <h1 className="mb-3 text-2xl font-extrabold leading-tight md:text-3xl">
                            مرحباً بك في تطبيق طمأنينة
                          </h1>

                          <div className="home-ayah-panel my-3 rounded-lg px-3 py-3">
                            <p className="mb-1 text-lg font-bold md:text-xl" style={{ lineHeight: '1.7' }}>
                              {currentAyah.ayah}
                            </p>
                            <p className="mb-0 text-xs font-semibold opacity-80">
                              {currentAyah.source}
                            </p>
                          </div>

                          <p className="mb-0 text-sm font-semibold opacity-95 md:text-base">
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

                  <div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                      <button
                        className="home-action-card nav-card-btn"
                        onClick={() => router.push('?view=adhkar-list&id=morning')}
                        type="button"
                      >
                        <div className="text-center">
                          <i className="fas fa-sun home-action-icon mb-3 block"></i>
                          <h5 className="mb-0 font-bold">ورد الصباح</h5>
                        </div>
                      </button>

                      <button
                        className="home-action-card nav-card-btn"
                        onClick={() => router.push('?view=adhkar-list&id=evening')}
                        type="button"
                      >
                        <div className="text-center">
                          <i className="fas fa-moon home-action-icon mb-3 block"></i>
                          <h5 className="mb-0 font-bold">ورد المساء</h5>
                        </div>
                      </button>

                      <button
                        className="home-action-card nav-card-btn"
                        onClick={() => setActiveTab("tasbih")}
                        type="button"
                      >
                        <div className="text-center">
                          <span className="home-action-emoji mb-3 block">📿</span>
                          <h5 className="mb-0 font-bold">تسبيح</h5>
                        </div>
                      </button>

                      <button
                        className="home-action-card nav-card-btn"
                        onClick={() => setActiveTab("media")}
                        type="button"
                      >
                        {showLibraryBadge && (<span className="library-new-badge">جديد</span>)}
                        <div className="text-center">
                          <i className="fas fa-photo-video home-action-icon mb-3 block"></i>
                          <h5 className="mb-0 font-bold">المكتبة</h5>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                    <NextPrayerWidget />
                    <QuranCompletionPlan />
                    <AdhkarReminders />
                  </div>

                  <div>
                    <TasbihCircle />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "adhkar-list" && (
              <div className="animate-fade-in">
                <AdhkarList />
              </div>
            )}

            {activeTab === "tasbih" && (
              <div className="animate-fade-in">
                <div className="flex justify-center">
                  <div className="w-full max-w-4xl">
                    <DhikrCounter />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "prayer-times" && (
              <div className="animate-fade-in">
                <PrayerTimes country="EG" city="Cairo" />
              </div>
            )}

            {activeTab === "calendar" && (
              <div className="animate-fade-in">
                <IslamicCalendar />
              </div>
            )}

            {activeTab === "share" && (
              <div className="animate-fade-in">
                <SharePage />
              </div>
            )}

            {activeTab === "dashboard" && (
              <div className="animate-fade-in">
                <Dashboard />
              </div>
            )}

            {activeTab === "about" && (
              <div className="animate-fade-in">
                <About />
              </div>
            )}

            {activeTab === "media" && (
              <div className="animate-fade-in">
                <MediaPage />
              </div>
            )}
          </div>
          </RadioProvider>
        </div>
      </main>

      <FloatingChat />
      <InstallPrompt />
    </div>
  )
}
