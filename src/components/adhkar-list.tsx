"use client"

import * as React from "react"
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
        <div className="adhkar-page">
            <style jsx>{`
                .adhkar-page {
                    padding: 1rem 0;
                }
                
                .adhkar-card {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border: none;
                    overflow: hidden;
                    height: 100%;
                }
                
                .adhkar-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
                }
                
                .adhkar-card .card-header {
                    padding: 2.5rem 2rem;
                    border: none;
                }
                
                .adhkar-card-morning .card-header {
                    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                }
                
                .adhkar-card-evening .card-header {
                    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                }
                
                .adhkar-card-prayer .card-header {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                }
                
                .adhkar-card-sleep .card-header {
                    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                }
                
                .adhkar-icon {
                    width: 80px;
                    height: 80px;
                    background: rgba(255, 255, 255, 0.25);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2.2rem;
                    margin: 0 auto 1.2rem;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }
                
                .adhkar-title {
                    color: white;
                    font-size: 1.6rem;
                    font-weight: 700;
                    margin: 0;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
                }
                
                .adhkar-subtitle {
                    color: rgba(255, 255, 255, 0.95);
                    font-size: 0.95rem;
                    margin-top: 0.6rem;
                    font-weight: 500;
                }
                
                .view-btn {
                    background: white;
                    color: inherit;
                    border: none;
                    padding: 0.85rem 2.2rem;
                    border-radius: 50px;
                    font-weight: 600;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
                }
                
                .view-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
                }
                
                .adhkar-card-morning .view-btn {
                    color: #f59e0b;
                }
                
                .adhkar-card-evening .view-btn {
                    color: #7c3aed;
                }
                
                .adhkar-card-prayer .view-btn {
                    color: #059669;
                }
                
                .adhkar-card-sleep .view-btn {
                    color: #4f46e5;
                }
                
                @media (max-width: 768px) {
                    .adhkar-card .card-header {
                        padding: 2rem 1.5rem;
                    }
                    
                    .adhkar-icon {
                        width: 70px;
                        height: 70px;
                        font-size: 2rem;
                    }
                    
                    .adhkar-title {
                        font-size: 1.4rem;
                    }
                }
            `}</style>

            {/* Header */}
            <div className="text-center mb-5">
                <h2 className="h2 fw-bold gradient-text mb-2">الأذكار اليومية</h2>
                <p className="text-body-secondary fs-5">تقرّب إلى الله بذكره في كل وقت</p>
            </div>

            {/* Show cards or adhkar content */}
            {!selectedAdhkar ? (
                /* Adhkar Cards */
                <div className="row g-4" role="tablist">
                    {/* اذكار الصباح */}
                    <div className="col-12 col-md-6 col-xl-3">
                        <div className="card adhkar-card adhkar-card-morning shadow" onClick={() => handleCardClick('morning')} style={{ cursor: 'pointer' }}>
                            <div className="card-header text-center">
                                <div className="adhkar-icon">
                                    <i className="fas fa-sun"></i>
                                </div>
                                <h3 className="adhkar-title">اذكار الصباح</h3>
                                <p className="adhkar-subtitle mb-4">أذكار الصباح والحماية</p>
                                <button className="btn view-btn" type="button">
                                    <i className="fas fa-book-open me-2"></i>
                                    عرض الأذكار
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* اذكار المساء */}
                    <div className="col-12 col-md-6 col-xl-3">
                        <div className="card adhkar-card adhkar-card-evening shadow" onClick={() => handleCardClick('evening')} style={{ cursor: 'pointer' }}>
                            <div className="card-header text-center">
                                <div className="adhkar-icon">
                                    <i className="fas fa-moon"></i>
                                </div>
                                <h3 className="adhkar-title">اذكار المساء</h3>
                                <p className="adhkar-subtitle mb-4">أذكار المساء والسكينة</p>
                                <button className="btn view-btn" type="button">
                                    <i className="fas fa-book-open me-2"></i>
                                    عرض الأذكار
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* اذكار ما بعد الصلاة */}
                    <div className="col-12 col-md-6 col-xl-3">
                        <div className="card adhkar-card adhkar-card-prayer shadow" onClick={() => handleCardClick('prayer')} style={{ cursor: 'pointer' }}>
                            <div className="card-header text-center">
                                <div className="adhkar-icon">
                                    <i className="fas fa-mosque"></i>
                                </div>
                                <h3 className="adhkar-title">اذكار بعد الصلاة</h3>
                                <p className="adhkar-subtitle mb-4">أذكار وتسبيح بعد الصلاة</p>
                                <button className="btn view-btn" type="button">
                                    <i className="fas fa-book-open me-2"></i>
                                    عرض الأذكار
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* اذكار النوم */}
                    <div className="col-12 col-md-6 col-xl-3">
                        <div className="card adhkar-card adhkar-card-sleep shadow" onClick={() => handleCardClick('sleep')} style={{ cursor: 'pointer' }}>
                            <div className="card-header text-center">
                                <div className="adhkar-icon">
                                    <i className="fas fa-bed"></i>
                                </div>
                                <h3 className="adhkar-title">اذكار النوم</h3>
                                <p className="adhkar-subtitle mb-4">أذكار قبل النوم والراحة</p>
                                <button className="btn view-btn" type="button">
                                    <i className="fas fa-book-open me-2"></i>
                                    عرض الأذكار
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Adhkar Content with Back Button */
                <div>
                    <button
                        className="btn btn-outline-primary rounded-pill mb-4"
                        onClick={handleBackToCards}
                        type="button"
                    >
                        <i className="fas fa-arrow-right me-2"></i>
                        رجوع للأذكار
                    </button>

                    {selectedAdhkar === 'morning' && <AdhkarDisplay config={morningAdhkarConfig} prefix="morning-adhkar" />}
                    {selectedAdhkar === 'evening' && <AdhkarDisplay config={eveningAdhkarConfig} prefix="evening-adhkar" />}
                    {selectedAdhkar === 'prayer' && <AdhkarDisplay config={prayerAdhkarConfig} prefix="prayer-adhkar" />}
                    {selectedAdhkar === 'sleep' && <AdhkarDisplay config={sleepAdhkarConfig} prefix="sleep-adhkar" />}
                </div>
            )}
        </div>
    )
}
