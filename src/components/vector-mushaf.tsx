"use client"

import React from "react"
import ReactDOM from "react-dom"
import { useRouter, useSearchParams } from "next/navigation"
import "./VectorMushaf.css"

interface VectorMushafProps {
    onBack: () => void
}

const TOTAL_PAGES = 604
const LAST_PAGE_KEY = "mushaf-last-page"
const PRELOAD_RANGE = 2

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

const arabicNum = (num: number) => {
    const d = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"]
    return String(num).split("").map(c => d[parseInt(c)]).join("")
}

const formatPage = (p: number) => String(p).padStart(3, "0")

export function VectorMushaf({ onBack }: VectorMushafProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [mounted, setMounted] = React.useState(false)

    const getInitialPage = () => {
        const pageParam = searchParams.get("page")
        if (pageParam) return Math.min(Math.max(1, parseInt(pageParam) || 1), TOTAL_PAGES)
        try {
            const saved = localStorage.getItem(LAST_PAGE_KEY)
            if (saved) return Math.min(Math.max(1, parseInt(saved) || 1), TOTAL_PAGES)
        } catch { /* */ }
        return 1
    }

    const [currentPage, setCurrentPage] = React.useState(getInitialPage)
    const [isNightMode, setIsNightMode] = React.useState(false)
    const [showSurahList, setShowSurahList] = React.useState(false)
    const [showControls, setShowControls] = React.useState(true)
    const [touchStart, setTouchStart] = React.useState<{ x: number; y: number } | null>(null)

    // Animation state
    const [animating, setAnimating] = React.useState(false)
    const [animDir, setAnimDir] = React.useState<"forward" | "backward" | null>(null)
    const [prevPageImg, setPrevPageImg] = React.useState<number | null>(null)
    const [loadedPages, setLoadedPages] = React.useState<Set<number>>(new Set([getInitialPage()]))
    const [imgError, setImgError] = React.useState(false)

    const ANIM_DURATION = 280

    const savePage = (p: number) => {
        try { localStorage.setItem(LAST_PAGE_KEY, String(p)) } catch { /* */ }
    }

    const goToPage = React.useCallback((page: number, dir?: "forward" | "backward") => {
        const target = Math.min(Math.max(1, page), TOTAL_PAGES)
        if (target === currentPage || animating) return

        const direction = dir || (target > currentPage ? "forward" : "backward")
        setAnimDir(direction)
        setPrevPageImg(currentPage)
        setAnimating(true)

        // Preload new image
        setLoadedPages(prev => new Set(prev).add(target))

        setTimeout(() => {
            setCurrentPage(target)
            setImgError(false)
            savePage(target)
            router.replace(`?view=media&id=mushaf&page=${target}`, { scroll: false })

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setAnimating(false)
                    setAnimDir(null)
                    setPrevPageImg(null)
                })
            })
        }, ANIM_DURATION)
    }, [currentPage, animating, router])

    const nextPage = () => goToPage(currentPage + 1, "forward")
    const prevPage = () => goToPage(currentPage - 1, "backward")

    // Preload adjacent pages
    React.useEffect(() => {
        const toLoad = new Set(loadedPages)
        for (let i = 1; i <= PRELOAD_RANGE; i++) {
            if (currentPage + i <= TOTAL_PAGES) toLoad.add(currentPage + i)
            if (currentPage - i >= 1) toLoad.add(currentPage - i)
        }
        if (toLoad.size > loadedPages.size) {
            setLoadedPages(toLoad)
        }
    }, [currentPage, loadedPages])

    // Mount
    React.useEffect(() => {
        setMounted(true)
        document.body.classList.add('vector-mushaf-active')
        if (window.innerWidth < 768) setShowControls(false)
        return () => {
            document.body.classList.remove('vector-mushaf-active')
            setMounted(false)
        }
    }, [])

    // Keyboard
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

    // Touch handling
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart) return
        const dx = touchStart.x - e.changedTouches[0].clientX
        const dy = Math.abs(touchStart.y - e.changedTouches[0].clientY)
        if (Math.abs(dx) > 40 && dy < Math.abs(dx) * 0.6) {
            // RTL: swipe right = forward (next), swipe left = back (prev)
            if (dx > 0) prevPage()
            else nextPage()
        }
        setTouchStart(null)
    }

    // Edge tap zones for mobile: tap left/right thirds
    const handlePageTap = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('.surah-list-overlay')) return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const third = rect.width / 3
        // RTL: tap right = forward, tap left = back
        if (x < third) prevPage()
        else if (x > rect.width - third) nextPage()
        else setShowControls(prev => !prev)
    }

    const selectSurah = (page: number) => {
        goToPage(page)
        setShowSurahList(false)
    }

    if (!mounted) return null

    const animClass = animDir === "forward" ? "slide-forward" : animDir === "backward" ? "slide-backward" : ""

    const content = (
        <div
            className={`vector-mushaf ${isNightMode ? "night" : ""} ${showControls ? "controls-visible" : "controls-hidden"} ${animClass}`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Header */}
            <header className="mushaf-header">
                <button className="back-btn" onClick={onBack} aria-label="رجوع">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                    </svg>
                </button>
                <h1 className="header-title">المصحف الشريف</h1>
                <div className="header-controls">
                    <button className="control-btn" onClick={() => setIsNightMode(!isNightMode)} title="الوضع الليلي">
                        {isNightMode ? "☀️" : "🌙"}
                    </button>
                    <button className="control-btn surah-list-btn" onClick={(e) => { e.stopPropagation(); setShowSurahList(!showSurahList) }} title="فهرس السور">
                        📚
                    </button>
                </div>
            </header>

            {/* Surah List */}
            {showSurahList && (
                <div className="surah-list-overlay" onClick={(e) => e.stopPropagation()}>
                    <div className="surah-list-header">
                        <h2>فهرس السور</h2>
                        <button className="close-surah-list" onClick={() => setShowSurahList(false)}>✕</button>
                    </div>
                    <div className="surah-list-content">
                        {surahData.map((surah) => (
                            <div key={surah.number} className="surah-item" onClick={() => selectSurah(surah.page)}>
                                <span className="surah-number">{arabicNum(surah.number)}</span>
                                <span className="surah-name">{surah.name}</span>
                                <span className="surah-page">ص {arabicNum(surah.page)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Page Display */}
            <main className="mushaf-content" onClick={handlePageTap}>
                <div className="page-container">
                    {/* Outgoing page during animation */}
                    {animating && prevPageImg !== null && (
                        <div className="page-frame page-out">
                            <img
                                src={`/mushaf/pages/${formatPage(prevPageImg)}.svg`}
                                alt=""
                                className={isNightMode ? "night-svg" : ""}
                                draggable={false}
                            />
                        </div>
                    )}
                    {/* Current / incoming page */}
                    <div className={`page-frame ${animating ? "page-in" : "page-current"}`}>
                        {!loadedPages.has(currentPage) && !animating && (
                            <div className="page-loading">
                                <div className="loading-spinner" />
                            </div>
                        )}
                        <img
                            key={animating ? `new-${currentPage}` : `cur-${currentPage}`}
                            src={`/mushaf/pages/${formatPage(currentPage)}.svg`}
                            alt={`صفحة ${currentPage}`}
                            className={isNightMode ? "night-svg" : ""}
                            draggable={false}
                            onError={() => setImgError(true)}
                            onLoad={() => { setLoadedPages(prev => new Set(prev).add(currentPage)); setImgError(false) }}
                        />
                    </div>
                </div>

                {/* Edge tap hints (mobile) */}
                <div className="tap-zone tap-prev" onClick={(e) => { e.stopPropagation(); prevPage() }} />
                <div className="tap-zone tap-next" onClick={(e) => { e.stopPropagation(); nextPage() }} />
            </main>

            {/* Bottom Navigation */}
            <nav className="page-navigation">
                <button className="nav-btn next" onClick={nextPage} disabled={currentPage >= TOTAL_PAGES} aria-label="الصفحة التالية">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                    </svg>
                </button>
                <div className="page-info">
                    <input
                        type="number"
                        className="page-input"
                        value={currentPage}
                        min={1}
                        max={TOTAL_PAGES}
                        onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                        aria-label="رقم الصفحة"
                    />
                    <span className="page-total">/ {TOTAL_PAGES}</span>
                </div>
                <button className="nav-btn prev" onClick={prevPage} disabled={currentPage <= 1} aria-label="الصفحة السابقة">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
                    </svg>
                </button>
            </nav>

            {/* Page number badge */}
            <div className="page-number-badge">{arabicNum(currentPage)}</div>
        </div>
    )

    return ReactDOM.createPortal(content, document.body)
}
