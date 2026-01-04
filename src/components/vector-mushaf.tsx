"use client"

import React from "react"
import ReactDOM from "react-dom"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import "./VectorMushaf.css"

interface VectorMushafProps {
    onBack: () => void
}

const TOTAL_PAGES = 604

export function VectorMushaf({ onBack }: VectorMushafProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [mounted, setMounted] = React.useState(false)

    // Get current page from URL or default to 1
    const [currentPage, setCurrentPage] = React.useState(() => {
        const pageParam = searchParams.get("page")
        return pageParam ? Math.min(Math.max(1, parseInt(pageParam) || 1), TOTAL_PAGES) : 1
    })

    const [isNightMode, setIsNightMode] = React.useState(false)
    const [showSurahList, setShowSurahList] = React.useState(false)
    const [touchStart, setTouchStart] = React.useState<number | null>(null)

    // Surah data with starting pages
    const surahData: { number: number; name: string; page: number }[] = [
        { number: 1, name: 'الفاتحة', page: 1 }, { number: 2, name: 'البقرة', page: 2 },
        { number: 3, name: 'آل عمران', page: 50 }, { number: 4, name: 'النساء', page: 77 },
        { number: 5, name: 'المائدة', page: 106 }, { number: 6, name: 'الأنعام', page: 128 },
        { number: 7, name: 'الأعراف', page: 151 }, { number: 8, name: 'الأنفال', page: 177 },
        { number: 9, name: 'التوبة', page: 187 }, { number: 10, name: 'يونس', page: 208 },
        { number: 11, name: 'هود', page: 221 }, { number: 12, name: 'يوسف', page: 235 },
        { number: 13, name: 'الرعد', page: 249 }, { number: 14, name: 'إبراهيم', page: 255 },
        { number: 15, name: 'الحجر', page: 262 }, { number: 16, name: 'النحل', page: 267 },
        { number: 17, name: 'الإسراء', page: 282 }, { number: 18, name: 'الكهف', page: 293 },
        { number: 19, name: 'مريم', page: 305 }, { number: 20, name: 'طه', page: 312 },
        { number: 21, name: 'الأنبياء', page: 322 }, { number: 22, name: 'الحج', page: 332 },
        { number: 23, name: 'المؤمنون', page: 342 }, { number: 24, name: 'النور', page: 350 },
        { number: 25, name: 'الفرقان', page: 359 }, { number: 26, name: 'الشعراء', page: 367 },
        { number: 27, name: 'النمل', page: 377 }, { number: 28, name: 'القصص', page: 385 },
        { number: 29, name: 'العنكبوت', page: 396 }, { number: 30, name: 'الروم', page: 404 },
        { number: 31, name: 'لقمان', page: 411 }, { number: 32, name: 'السجدة', page: 415 },
        { number: 33, name: 'الأحزاب', page: 418 }, { number: 34, name: 'سبأ', page: 428 },
        { number: 35, name: 'فاطر', page: 434 }, { number: 36, name: 'يس', page: 440 },
        { number: 37, name: 'الصافات', page: 446 }, { number: 38, name: 'ص', page: 453 },
        { number: 39, name: 'الزمر', page: 458 }, { number: 40, name: 'غافر', page: 467 },
        { number: 41, name: 'فصلت', page: 477 }, { number: 42, name: 'الشورى', page: 483 },
        { number: 43, name: 'الزخرف', page: 489 }, { number: 44, name: 'الدخان', page: 496 },
        { number: 45, name: 'الجاثية', page: 499 }, { number: 46, name: 'الأحقاف', page: 502 },
        { number: 47, name: 'محمد', page: 507 }, { number: 48, name: 'الفتح', page: 511 },
        { number: 49, name: 'الحجرات', page: 515 }, { number: 50, name: 'ق', page: 518 },
        { number: 51, name: 'الذاريات', page: 520 }, { number: 52, name: 'الطور', page: 523 },
        { number: 53, name: 'النجم', page: 526 }, { number: 54, name: 'القمر', page: 528 },
        { number: 55, name: 'الرحمن', page: 531 }, { number: 56, name: 'الواقعة', page: 534 },
        { number: 57, name: 'الحديد', page: 537 }, { number: 58, name: 'المجادلة', page: 542 },
        { number: 59, name: 'الحشر', page: 545 }, { number: 60, name: 'الممتحنة', page: 549 },
        { number: 61, name: 'الصف', page: 551 }, { number: 62, name: 'الجمعة', page: 553 },
        { number: 63, name: 'المنافقون', page: 554 }, { number: 64, name: 'التغابن', page: 556 },
        { number: 65, name: 'الطلاق', page: 558 }, { number: 66, name: 'التحريم', page: 560 },
        { number: 67, name: 'الملك', page: 562 }, { number: 68, name: 'القلم', page: 564 },
        { number: 69, name: 'الحاقة', page: 566 }, { number: 70, name: 'المعارج', page: 568 },
        { number: 71, name: 'نوح', page: 570 }, { number: 72, name: 'الجن', page: 572 },
        { number: 73, name: 'المزمل', page: 574 }, { number: 74, name: 'المدثر', page: 575 },
        { number: 75, name: 'القيامة', page: 577 }, { number: 76, name: 'الإنسان', page: 578 },
        { number: 77, name: 'المرسلات', page: 580 }, { number: 78, name: 'النبأ', page: 582 },
        { number: 79, name: 'النازعات', page: 583 }, { number: 80, name: 'عبس', page: 585 },
        { number: 81, name: 'التكوير', page: 586 }, { number: 82, name: 'الانفطار', page: 587 },
        { number: 83, name: 'المطففين', page: 587 }, { number: 84, name: 'الانشقاق', page: 589 },
        { number: 85, name: 'البروج', page: 590 }, { number: 86, name: 'الطارق', page: 591 },
        { number: 87, name: 'الأعلى', page: 591 }, { number: 88, name: 'الغاشية', page: 592 },
        { number: 89, name: 'الفجر', page: 593 }, { number: 90, name: 'البلد', page: 594 },
        { number: 91, name: 'الشمس', page: 595 }, { number: 92, name: 'الليل', page: 595 },
        { number: 93, name: 'الضحى', page: 596 }, { number: 94, name: 'الشرح', page: 596 },
        { number: 95, name: 'التين', page: 597 }, { number: 96, name: 'العلق', page: 597 },
        { number: 97, name: 'القدر', page: 598 }, { number: 98, name: 'البينة', page: 598 },
        { number: 99, name: 'الزلزلة', page: 599 }, { number: 100, name: 'العاديات', page: 599 },
        { number: 101, name: 'القارعة', page: 600 }, { number: 102, name: 'التكاثر', page: 600 },
        { number: 103, name: 'العصر', page: 601 }, { number: 104, name: 'الهمزة', page: 601 },
        { number: 105, name: 'الفيل', page: 601 }, { number: 106, name: 'قريش', page: 602 },
        { number: 107, name: 'الماعون', page: 602 }, { number: 108, name: 'الكوثر', page: 602 },
        { number: 109, name: 'الكافرون', page: 603 }, { number: 110, name: 'النصر', page: 603 },
        { number: 111, name: 'المسد', page: 603 }, { number: 112, name: 'الإخلاص', page: 604 },
        { number: 113, name: 'الفلق', page: 604 }, { number: 114, name: 'الناس', page: 604 }
    ]

    const handleSurahSelect = (page: number) => {
        goToPage(page)
        setShowSurahList(false)
    }
    const [showControls, setShowControls] = React.useState(true)

    // Handle mounting for Portal and body class
    React.useEffect(() => {
        setMounted(true)
        document.body.classList.add('vector-mushaf-active')

        // Auto-hide controls on mobile mount
        if (window.innerWidth < 768) {
            setShowControls(false)
        }
        return () => {
            setMounted(false)
            document.body.classList.remove('vector-mushaf-active')
        }
    }, [])

    // Update URL when page changes
    const goToPage = React.useCallback((page: number) => {
        const newPage = Math.min(Math.max(1, page), TOTAL_PAGES)
        setCurrentPage(newPage)
        router.replace(`?view=media&id=mushaf&page=${newPage}`, { scroll: false })
    }, [router])

    // Page navigation
    const nextPage = () => goToPage(currentPage + 1)
    const prevPage = () => goToPage(currentPage - 1)

    // Touch/swipe handling
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.touches[0].clientX)
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStart === null) return
        const diff = touchStart - e.changedTouches[0].clientX
        if (Math.abs(diff) > 50) {
            // Arabic reading: swipe left = prev page (go back), swipe right = next page (go forward)
            if (diff > 0) prevPage()
            else nextPage()
        }
        setTouchStart(null)
    }

    // Keyboard navigation
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") nextPage()
            else if (e.key === "ArrowRight") prevPage()
            else if (e.key === "Escape") {
                if (showSurahList) setShowSurahList(false)
                else onBack()
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [currentPage, showSurahList, onBack])

    // Toggle controls on tap (only if not swiping)
    const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
        // Prevent triggering when clicking buttons
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
            return
        }
        setShowControls(prev => !prev)
    }

    // Format page number with leading zeros
    const formatPageNumber = (page: number) => String(page).padStart(3, "0")

    // Arabic numerals
    const toArabicNumeral = (num: number) => {
        const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"]
        return String(num).split("").map(d => arabicNumerals[parseInt(d)]).join("")
    }

    if (!mounted) return null

    const content = (
        <div
            className={`vector-mushaf ${isNightMode ? "night" : ""} ${showControls ? "controls-visible" : "controls-hidden"}`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={handleTap}
        >
            {/* Header */}
            <header className="mushaf-header">
                <button className="back-btn" onClick={onBack}>
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                    </svg>
                </button>

                <h1 className="header-title">المصحف الشريف</h1>

                <div className="header-controls">
                    <button
                        className="control-btn"
                        onClick={() => setIsNightMode(!isNightMode)}
                        title="الوضع الليلي"
                    >
                        {isNightMode ? "☀️" : "🌙"}
                    </button>
                    <button
                        className="control-btn surah-list-btn"
                        onClick={(e) => { e.stopPropagation(); setShowSurahList(!showSurahList) }}
                        title="فهرس السور"
                    >
                        📚
                    </button>
                </div>
            </header>

            {/* Surah List Dropdown */}
            {showSurahList && (
                <div className="surah-list-overlay" onClick={(e) => e.stopPropagation()}>
                    <div className="surah-list-header">
                        <h2>فهرس السور</h2>
                        <button className="close-surah-list" onClick={() => setShowSurahList(false)}>✕</button>
                    </div>
                    <div className="surah-list-content">
                        {surahData.map((surah) => (
                            <div
                                key={surah.number}
                                className="surah-item"
                                onClick={() => handleSurahSelect(surah.page)}
                            >
                                <span className="surah-number">{toArabicNumeral(surah.number)}</span>
                                <span className="surah-name">{surah.name}</span>
                                <span className="surah-page">ص {toArabicNumeral(surah.page)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Page Display */}
            <main className="mushaf-content">
                <div className="page-container">
                    <div className="page-frame">
                        <Image
                            src={`/mushaf/pages/${formatPageNumber(currentPage)}.svg`}
                            alt={`صفحة ${currentPage}`}
                            fill
                            style={{ objectFit: "contain" }}
                            priority={currentPage <= 3}
                            className={isNightMode ? "invert-image" : ""}
                        />
                    </div>
                </div>
            </main>

            {/* Navigation Controls */}
            <nav className="page-navigation">
                <button
                    className="nav-btn prev"
                    onClick={prevPage}
                    disabled={currentPage <= 1}
                >
                    ❯
                </button>

                <div className="page-info">
                    <input
                        type="number"
                        className="page-input"
                        value={currentPage}
                        min={1}
                        max={TOTAL_PAGES}
                        onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                    />
                    <span className="page-total">/ {TOTAL_PAGES}</span>
                </div>

                <button
                    className="nav-btn next"
                    onClick={nextPage}
                    disabled={currentPage >= TOTAL_PAGES}
                >
                    ❮
                </button>
            </nav>

            {/* Page Number Display */}
            <div className="page-number-badge">
                {toArabicNumeral(currentPage)}
            </div>
        </div>
    )

    return ReactDOM.createPortal(content, document.body)
}
