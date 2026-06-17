"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { AdhkarDisplay } from "./adhkar/adhkar-display"
import { morningAdhkarConfig } from "./adhkar/morning-adhkar-data"
import { eveningAdhkarConfig } from "./adhkar/evening-adhkar-data"
import { prayerAdhkarConfig } from "./adhkar/prayer-adhkar-data"
import { sleepAdhkarConfig } from "./adhkar/sleep-adhkar-data"
import { useRouter, useSearchParams } from "next/navigation"

export function AdhkarList() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const selectedAdhkar = searchParams.get("id")
    const [startTime, setStartTime] = React.useState<number | null>(null)

    const handleCardClick = (adhkarType: string) => {
        router.push(`?view=adhkar-list&id=${adhkarType}`)
        setStartTime(Date.now())
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleBackToCards = () => {
        router.push('?view=adhkar-list')
        setStartTime(null)
    }

    // Track time spent on adhkar page
    React.useEffect(() => {
        if (!selectedAdhkar) {
            setStartTime(null)
            return
        }

        // If we have a selected adhkar but no start time (e.g. direct link), set it
        if (!startTime) {
            setStartTime(Date.now())
        }

        const checkTimer = setInterval(() => {
            if (!startTime) return

            const elapsedTime = Date.now() - startTime
            const oneMinute = 60 * 1000 // 60 seconds

            if (elapsedTime >= oneMinute) {
                // Mark as read
                const today = new Date().toDateString()

                if (selectedAdhkar === 'morning') {
                    localStorage.setItem('lastMorningAdhkarRead', today)
                } else if (selectedAdhkar === 'evening') {
                    localStorage.setItem('lastEveningAdhkarRead', today)
                }

                // Clear interval after marking
                clearInterval(checkTimer)
            }
        }, 1000) // Check every second

        return () => clearInterval(checkTimer)
    }, [selectedAdhkar, startTime])

    return (
        <div className="py-4">

            {/* Header */}
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold gradient-text mb-2">الأذكار اليومية</h2>
                <p className="text-muted-foreground text-lg">تقرّب إلى الله بذكره في كل وقت</p>
            </div>

            {/* Show cards or adhkar content */}
            {!selectedAdhkar ? (
                /* Adhkar Cards */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" role="tablist">
                    {/* اذكار الصباح */}
                    <div>
                        <div className="group transition-all duration-300 ease-out border-0 overflow-hidden h-full shadow-md bg-card rounded-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]" onClick={() => handleCardClick('morning')} style={{ cursor: 'pointer' }}>
                            <div className="text-center p-10 max-md:p-8 bg-gradient-to-br from-amber-300 to-amber-500 border-0">
                                <div className="w-20 h-20 max-md:w-[70px] max-md:h-[70px] bg-white/25 rounded-full flex items-center justify-center text-3xl max-md:text-2xl mx-auto mb-5 backdrop-blur-md shadow-md">
                                    <i className="fas fa-sun"></i>
                                </div>
                                <h3 className="text-white text-2xl max-md:text-xl font-bold m-0 shadow-[0_2px_4px_rgba(0,0,0,0.15)]">اذكار الصباح</h3>
                                <p className="text-white/95 text-sm mt-2 font-medium mb-4">أذكار الصباح والحماية</p>
                                <button className="bg-white border-0 rounded-full px-5 py-3 font-semibold text-base shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg text-amber-500" type="button">
                                    <i className="fas fa-book-open ms-2"></i>
                                    عرض الأذكار
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* اذكار المساء */}
                    <div>
                        <div className="group transition-all duration-300 ease-out border-0 overflow-hidden h-full shadow-md bg-card rounded-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]" onClick={() => handleCardClick('evening')} style={{ cursor: 'pointer' }}>
                            <div className="text-center p-10 max-md:p-8 bg-gradient-to-br from-purple-400 to-purple-600 border-0">
                                <div className="w-20 h-20 max-md:w-[70px] max-md:h-[70px] bg-white/25 rounded-full flex items-center justify-center text-3xl max-md:text-2xl mx-auto mb-5 backdrop-blur-md shadow-md">
                                    <i className="fas fa-moon"></i>
                                </div>
                                <h3 className="text-white text-2xl max-md:text-xl font-bold m-0 shadow-[0_2px_4px_rgba(0,0,0,0.15)]">اذكار المساء</h3>
                                <p className="text-white/95 text-sm mt-2 font-medium mb-4">أذكار المساء والسكينة</p>
                                <button className="bg-white border-0 rounded-full px-5 py-3 font-semibold text-base shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg text-purple-600" type="button">
                                    <i className="fas fa-book-open ms-2"></i>
                                    عرض الأذكار
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* اذكار ما بعد الصلاة */}
                    <div>
                        <div className="group transition-all duration-300 ease-out border-0 overflow-hidden h-full shadow-md bg-card rounded-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]" onClick={() => handleCardClick('prayer')} style={{ cursor: 'pointer' }}>
                            <div className="text-center p-10 max-md:p-8 bg-gradient-to-br from-emerald-400 to-emerald-600 border-0">
                                <div className="w-20 h-20 max-md:w-[70px] max-md:h-[70px] bg-white/25 rounded-full flex items-center justify-center text-3xl max-md:text-2xl mx-auto mb-5 backdrop-blur-md shadow-md">
                                    <i className="fas fa-mosque"></i>
                                </div>
                                <h3 className="text-white text-2xl max-md:text-xl font-bold m-0 shadow-[0_2px_4px_rgba(0,0,0,0.15)]">اذكار بعد الصلاة</h3>
                                <p className="text-white/95 text-sm mt-2 font-medium mb-4">أذكار وتسبيح بعد الصلاة</p>
                                <button className="bg-white border-0 rounded-full px-5 py-3 font-semibold text-base shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg text-emerald-600" type="button">
                                    <i className="fas fa-book-open ms-2"></i>
                                    عرض الأذكار
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* اذكار النوم */}
                    <div>
                        <div className="group transition-all duration-300 ease-out border-0 overflow-hidden h-full shadow-md bg-card rounded-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]" onClick={() => handleCardClick('sleep')} style={{ cursor: 'pointer' }}>
                            <div className="text-center p-10 max-md:p-8 bg-gradient-to-br from-indigo-400 to-indigo-600 border-0">
                                <div className="w-20 h-20 max-md:w-[70px] max-md:h-[70px] bg-white/25 rounded-full flex items-center justify-center text-3xl max-md:text-2xl mx-auto mb-5 backdrop-blur-md shadow-md">
                                    <i className="fas fa-bed"></i>
                                </div>
                                <h3 className="text-white text-2xl max-md:text-xl font-bold m-0 shadow-[0_2px_4px_rgba(0,0,0,0.15)]">اذكار النوم</h3>
                                <p className="text-white/95 text-sm mt-2 font-medium mb-4">أذكار قبل النوم والراحة</p>
                                <button className="bg-white border-0 rounded-full px-5 py-3 font-semibold text-base shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg text-indigo-600" type="button">
                                    <i className="fas fa-book-open ms-2"></i>
                                    عرض الأذكار
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Adhkar Content with Back Button */
                <div>                        <Button
                            onClick={handleBackToCards}
                            variant="outline"
                            className="rounded-full mb-4"
                        >
                            <i className="fas fa-arrow-right ms-2"></i>
                            رجوع للأذكار
                        </Button>

                    {selectedAdhkar === 'morning' && <AdhkarDisplay config={morningAdhkarConfig} prefix="morning-adhkar" />}
                    {selectedAdhkar === 'evening' && <AdhkarDisplay config={eveningAdhkarConfig} prefix="evening-adhkar" />}
                    {selectedAdhkar === 'prayer' && <AdhkarDisplay config={prayerAdhkarConfig} prefix="prayer-adhkar" />}
                    {selectedAdhkar === 'sleep' && <AdhkarDisplay config={sleepAdhkarConfig} prefix="sleep-adhkar" />}
                </div>
            )}
        </div>
    )
}
