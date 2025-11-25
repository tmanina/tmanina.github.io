"use client"

import * as React from "react"
import { AudioQuran } from "./audio-quran"
import { HadithLibrary } from "./hadith-library"
import { RuqyahPlayer } from "./ruqyah-player"
import { QuranReader } from "./quran-reader"
import { RadioPlayer } from "./radio-player"
import { useRouter, useSearchParams } from "next/navigation"

export function MediaPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const activeSection = searchParams.get("id")
    // 2-day temporary "new" badge state
    const [showNewBadge, setShowNewBadge] = React.useState(false)
    React.useEffect(() => {
        const key = 'mediaPageNewBadgeTimestamp'
        const stored = localStorage.getItem(key)
        const now = Date.now()
        if (!stored) {
            localStorage.setItem(key, now.toString())
            setShowNewBadge(true)
            return
        }
        const saved = parseInt(stored, 10)
        const diffDays = (now - saved) / (1000 * 60 * 60 * 24)
        if (diffDays < 2) {
            setShowNewBadge(true)
        } else {
            setShowNewBadge(false)
            localStorage.removeItem(key)
        }
    }, [])

    const handleSectionChange = (section: string | null) => {
        if (section) {
            router.push(`?view=media&id=${section}`)
        } else {
            router.push('?view=media')
        }
    }

    return (
        <div className="media-page">
            <style jsx>{`
                .media-page {
                    padding: 1rem 0;
                }
                
                .media-card {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border: none;
                    overflow: hidden;
                    height: 100%;
                    cursor: pointer;
                }
                
                .media-card:not(.disabled):hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
                }
                
                .media-card.disabled {
                    cursor: not-allowed;
                    opacity: 0.6;
                }
                
                .media-card .card-header {
                    padding: 2.5rem 2rem;
                    border: none;
                }
                .card-header { position: relative; }
                .new-badge {
                    position: absolute;
                    top: 0.5rem;
                    right: 0.5rem;
                    background: #ff4757;
                    color: white;
                    font-size: 0.85rem;
                    font-weight: 600;
                    padding: 0.25rem 0.6rem;
                    border-radius: 0.5rem;
                    z-index: 10;
                }
                
                .media-card-ruqyah .card-header {
                    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                }
                
                .media-card-audio .card-header {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                }
                
                .media-card-hadiths .card-header {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                }
                
                .media-card-quran .card-header {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                }
                
                .media-card-video .card-header {
                    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
                }
                
                .media-icon {
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
                
                .media-title {
                    color: white;
                    font-size: 1.6rem;
                    font-weight: 700;
                    margin: 0;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
                }
                
                .media-subtitle {
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
                
                .view-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
                }
                
                .media-card-ruqyah .view-btn {
                    color: #7c3aed;
                }
                
                .media-card-audio .view-btn {
                    color: #059669;
                }
                
                .media-card-hadiths .view-btn {
                    color: #d97706;
                }
                
                .media-card-quran .view-btn {
                    color: #059669;
                }
                
                .media-card-video .view-btn {
                    color: #4b5563;
                    opacity: 0.7;
                }
                
                .media-card-radio .card-header {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                }
                
                .media-card-radio .view-btn {
                    color: #2563eb;
                }
                
                .coming-soon-badge {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: rgba(255, 255, 255, 0.9);
                    color: #6b7280;
                    padding: 0.4rem 1rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                
                @media (max-width: 768px) {
                    .media-card .card-header {
                        padding: 2rem 1.5rem;
                    }
                    
                    .media-icon {
                        width: 70px;
                        height: 70px;
                        font-size: 2rem;
                    }
                    
                    .media-title {
                        font-size: 1.4rem;
                    }
                }
            `}</style>

            {!activeSection ? (
                <>
                    {/* Header */}
                    <div className="text-center mb-5 animate__animated animate__fadeIn">
                        <h2 className="h2 fw-bold gradient-text mb-2">المكتبة الإسلامية</h2>
                        <p className="text-body-secondary fs-5">محتوى إسلامي متنوع لإثراء معرفتك</p>
                    </div>

                    {/* Media Cards */}
                    <div className="row g-4 animate__animated animate__fadeInUp">
                        {/* رقية شرعية */}
                        <div className="col-12 col-md-6 col-xl-3">
                            <div
                                className="card media-card media-card-ruqyah shadow"
                                onClick={() => handleSectionChange('ruqyah')}
                            >
                                <div className="card-header text-center">
                                    {showNewBadge && (<span className="new-badge">جديد</span>)}
                                    <div className="media-icon">
                                        <i className="fas fa-book-medical"></i>
                                    </div>
                                    <h3 className="media-title">رقية شرعية</h3>
                                    <p className="media-subtitle mb-4">آيات وأدعية الرقية الشرعية</p>
                                    <button className="btn view-btn" type="button">
                                        <i className="fas fa-folder-open me-2"></i>
                                        عرض المحتوى
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* صوتيات */}
                        <div className="col-12 col-md-6 col-xl-3">
                            <div
                                className="card media-card media-card-audio shadow"
                                onClick={() => handleSectionChange('audio')}
                            >
                                <div className="card-header text-center">
                                    {showNewBadge && (<span className="new-badge">جديد</span>)}
                                    <div className="media-icon">
                                        <i className="fas fa-headphones"></i>
                                    </div>
                                    <h3 className="media-title">قرآن كريم - صوتي</h3>
                                    <p className="media-subtitle mb-4">استمع للقرآن بأصوات القراء</p>
                                    <button className="btn view-btn" type="button">
                                        <i className="fas fa-play me-2"></i>
                                        استماع الآن
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* أحاديث */}
                        <div className="col-12 col-md-6 col-xl-3">
                            <div
                                className="card media-card media-card-hadiths shadow"
                                onClick={() => handleSectionChange('hadiths')}
                            >
                                <div className="card-header text-center">
                                    {showNewBadge && (<span className="new-badge">جديد</span>)}
                                    <div className="media-icon">
                                        <i className="fas fa-book-quran"></i>
                                    </div>
                                    <h3 className="media-title">أحاديث</h3>
                                    <p className="media-subtitle mb-4">أحاديث نبوية شريفة</p>
                                    <button className="btn view-btn" type="button">
                                        <i className="fas fa-folder-open me-2"></i>
                                        عرض المحتوى
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* القرآن الكريم */}
                        <div className="col-12 col-md-6 col-xl-3">
                            <div
                                className="card media-card media-card-quran shadow"
                                onClick={() => handleSectionChange('quran')}
                            >
                                <div className="card-header text-center">
                                    {showNewBadge && (<span className="new-badge">جديد</span>)}
                                    <div className="media-icon">
                                        <i className="fas fa-quran"></i>
                                    </div>
                                    <h3 className="media-title">القرآن الكريم</h3>
                                    <p className="media-subtitle mb-4">المصحف الشريف كاملاً</p>
                                    <button className="btn view-btn" type="button">
                                        <i className="fas fa-folder-open me-2"></i>
                                        عرض المحتوى
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* راديو */}
                        <div className="col-12 col-md-6 col-xl-3">
                            <div
                                className="card media-card media-card-radio shadow"
                                onClick={() => handleSectionChange('radio')}
                            >
                                <div className="card-header text-center">
                                    {showNewBadge && (<span className="new-badge">جديد</span>)}
                                    <div className="media-icon">
                                        <i className="fas fa-broadcast-tower"></i>
                                    </div>
                                    <h3 className="media-title">راديو</h3>
                                    <p className="media-subtitle mb-4">إذاعات القرآن الكريم مباشرة</p>
                                    <button className="btn view-btn" type="button">
                                        <i className="fas fa-play me-2"></i>
                                        استماع الآن
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* فيديو - قريباً */}
                        <div className="col-12 col-md-6 col-xl-3">
                            <div className="card media-card media-card-video shadow disabled">
                                <div className="card-header text-center position-relative">
                                    {showNewBadge && (<span className="new-badge">جديد</span>)}
                                    <span className="coming-soon-badge">قريباً</span>
                                    <div className="media-icon">
                                        <i className="fas fa-video"></i>
                                    </div>
                                    <h3 className="media-title">فيديو</h3>
                                    <p className="media-subtitle mb-4">مقاطع فيديو إسلامية</p>
                                    <button className="btn view-btn" type="button" disabled>
                                        <i className="fas fa-folder me-2"></i>
                                        قريباً
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                /* Sub-views */
                <div className="animate__animated animate__fadeIn">
                    {/* Back Button */}
                    <button
                        className="btn btn-outline-primary rounded-pill mb-4"
                        onClick={() => handleSectionChange(null)}
                        type="button"
                    >
                        <i className="fas fa-arrow-right me-2"></i>
                        رجوع للمكتبة
                    </button>

                    {activeSection === 'hadiths' && (
                        <HadithLibrary onBack={() => handleSectionChange(null)} />
                    )}

                    {activeSection === 'ruqyah' && (
                        <RuqyahPlayer onBack={() => handleSectionChange(null)} />
                    )}

                    {activeSection === 'audio' && (
                        <AudioQuran onBack={() => handleSectionChange(null)} />
                    )}

                    {activeSection === 'quran' && (
                        <QuranReader onBack={() => handleSectionChange(null)} />
                    )}

                    {activeSection === 'radio' && (
                        <RadioPlayer onBack={() => handleSectionChange(null)} />
                    )}

                </div>
            )}
        </div>
    )
}
