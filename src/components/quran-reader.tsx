"use client"

import { useRouter, useSearchParams } from "next/navigation"

import * as React from "react"

interface Verse {
    id: number
    verse_key: string
    text_uthmani: string
}

interface QuranReaderProps {
    onBack: () => void
}

export function QuranReader({ onBack }: QuranReaderProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Initialize from URL or default to 1
    const initialPage = parseInt(searchParams.get("page") || "1")
    const [currentPage, setCurrentPage] = React.useState(initialPage)

    const [verses, setVerses] = React.useState<Verse[]>([])
    const [loading, setLoading] = React.useState(true)
    const [jumpPage, setJumpPage] = React.useState("")
    const [fontSize, setFontSize] = React.useState(1.45)
    const [showSurahDropdown, setShowSurahDropdown] = React.useState(false)
    const totalPages = 604

    // Sync URL when page changes
    const updatePage = (newPage: number) => {
        setCurrentPage(newPage)
        const currentParams = new URLSearchParams(searchParams.toString())
        currentParams.set("page", newPage.toString())
        router.push(`?${currentParams.toString()}`)
    }

    // Fetch page verses
    React.useEffect(() => {
        const fetchPage = async () => {
            setLoading(true)
            try {
                const response = await fetch(
                    `https://api.quran.com/api/v4/quran/verses/uthmani?page_number=${currentPage}`
                )
                const data = await response.json()
                if (data.verses) {
                    setVerses(data.verses)
                }
            } catch (error) {
                console.error("Error fetching page:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchPage()
    }, [currentPage])

    // Convert to Eastern Arabic numerals
    const toArabicNumeral = (num: number) => {
        const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
        return num.toString().split('').map(d => arabicNumerals[parseInt(d)]).join('')
    }

    // Format verse number with ornamental brackets
    const formatVerseNumber = (verseKey: string) => {
        const verseNum = verseKey.split(':')[1]
        return `﴿${toArabicNumeral(parseInt(verseNum))}﴾`
    }

    // Complete surah names
    const surahNames: Record<number, string> = {
        1: 'الفَاتِحَة', 2: 'البَقَرَة', 3: 'آل عِمرَان', 4: 'النِّسَاء', 5: 'المَائِدَة',
        6: 'الأَنعَام', 7: 'الأَعرَاف', 8: 'الأَنفَال', 9: 'التَّوبَة', 10: 'يُونُس',
        11: 'هُود', 12: 'يُوسُف', 13: 'الرَّعد', 14: 'إبراهِيم', 15: 'الحِجر',
        16: 'النَّحل', 17: 'الإسرَاء', 18: 'الكَهف', 19: 'مَريَم', 20: 'طه',
        21: 'الأَنبيَاء', 22: 'الحَج', 23: 'المُؤمِنُون', 24: 'النُّور', 25: 'الفُرقَان',
        26: 'الشُّعَرَاء', 27: 'النَّمل', 28: 'القَصَص', 29: 'العَنكَبُوت', 30: 'الرُّوم',
        31: 'لُقمَان', 32: 'السَّجدَة', 33: 'الأَحزَاب', 34: 'سَبَأ', 35: 'فَاطِر',
        36: 'يس', 37: 'الصَّافَّات', 38: 'ص', 39: 'الزُّمَر', 40: 'غَافِر',
        41: 'فُصِّلَت', 42: 'الشُّورَى', 43: 'الزُّخرُف', 44: 'الدُّخَان', 45: 'الجَاثِيَة',
        46: 'الأَحقَاف', 47: 'مُحَمَّد', 48: 'الفَتح', 49: 'الحُجُرَات', 50: 'ق',
        51: 'الذَّارِيَات', 52: 'الطُّور', 53: 'النَّجم', 54: 'القَمَر', 55: 'الرَّحمَن',
        56: 'الوَاقِعَة', 57: 'الحَدِيد', 58: 'المُجَادَلَة', 59: 'الحَشر', 60: 'المُمتَحنَة',
        61: 'الصَّف', 62: 'الجُمُعَة', 63: 'المُنَافِقُون', 64: 'التَّغَابُن', 65: 'الطَّلَاق',
        66: 'التَّحرِيم', 67: 'المُلك', 68: 'القَلَم', 69: 'الحَاقَّة', 70: 'المَعَارِج',
        71: 'نُوح', 72: 'الجِن', 73: 'المُزَّمِّل', 74: 'المُدَّثِّر', 75: 'القِيَامَة',
        76: 'الإِنسَان', 77: 'المُرسَلَات', 78: 'النَّبَأ', 79: 'النَّازِعَات', 80: 'عَبَس',
        81: 'التَّكوِير', 82: 'الانفِطَار', 83: 'المُطَفِّفِين', 84: 'الانشِقَاق', 85: 'البُرُوج',
        86: 'الطَّارِق', 87: 'الأَعلَى', 88: 'الغَاشِيَة', 89: 'الفَجر', 90: 'البَلَد',
        91: 'الشَّمس', 92: 'اللَّيل', 93: 'الضُّحَى', 94: 'الشَّرح', 95: 'التِّين',
        96: 'العَلَق', 97: 'القَدر', 98: 'البَيِّنَة', 99: 'الزَّلزَلَة', 100: 'العَادِيَات',
        101: 'القَارِعَة', 102: 'التَّكَاثُر', 103: 'العَصر', 104: 'الهُمَزَة', 105: 'الفِيل',
        106: 'قُرَيش', 107: 'المَاعُون', 108: 'الكَوثَر', 109: 'الكَافِرُون', 110: 'النَّصر',
        111: 'المَسَد', 112: 'الإِخلَاص', 113: 'الفَلَق', 114: 'النَّاس'
    }

    // Medina Mushaf surah starting pages (approximate)
    const surahPages: Record<number, number> = {
        1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187, 10: 208,
        11: 221, 12: 235, 13: 249, 14: 255, 15: 262, 16: 267, 17: 282, 18: 293, 19: 305, 20: 312,
        21: 322, 22: 332, 23: 342, 24: 350, 25: 359, 26: 367, 27: 377, 28: 385, 29: 396, 30: 404,
        31: 411, 32: 415, 33: 418, 34: 428, 35: 434, 36: 440, 37: 446, 38: 453, 39: 458, 40: 467,
        41: 477, 42: 483, 43: 489, 44: 496, 45: 499, 46: 502, 47: 507, 48: 511, 49: 515, 50: 518,
        51: 520, 52: 523, 53: 526, 54: 528, 55: 531, 56: 534, 57: 537, 58: 542, 59: 545, 60: 549,
        61: 551, 62: 553, 63: 554, 64: 556, 65: 558, 66: 560, 67: 562, 68: 564, 69: 566, 70: 568,
        71: 570, 72: 572, 73: 574, 74: 575, 75: 577, 76: 578, 77: 580, 78: 582, 79: 583, 80: 585,
        81: 586, 82: 587, 83: 587, 84: 589, 85: 590, 86: 591, 87: 591, 88: 592, 89: 593, 90: 594,
        91: 595, 92: 595, 93: 596, 94: 596, 95: 597, 96: 597, 97: 598, 98: 598, 99: 599, 100: 599,
        101: 600, 102: 600, 103: 601, 104: 601, 105: 601, 106: 602, 107: 602, 108: 602, 109: 603, 110: 603,
        111: 603, 112: 604, 113: 604, 114: 604
    }

    // Juz start pages
    const juzStartPages: Record<number, number> = {
        1: 1, 2: 22, 3: 42, 4: 62, 5: 82, 6: 102, 7: 121, 8: 142, 9: 162, 10: 182,
        11: 201, 12: 222, 13: 242, 14: 262, 15: 282, 16: 302, 17: 322, 18: 342, 19: 362, 20: 382,
        21: 402, 22: 422, 23: 442, 24: 462, 25: 482, 26: 502, 27: 522, 28: 542, 29: 562, 30: 582
    }

    // Get current Juz number based on page
    const getJuzNumber = (page: number) => {
        for (let i = 30; i >= 1; i--) {
            if (page >= juzStartPages[i]) {
                return i
            }
        }
        return 1
    }

    // Get surah info from verse key
    const getSurahInfo = (verseKey: string) => {
        const surahNum = parseInt(verseKey.split(':')[0])
        return { number: surahNum, name: surahNames[surahNum] || `سورة ${toArabicNumeral(surahNum)}` }
    }

    // Check if verse is first in surah (to show header)
    const isFirstVerseOfSurah = (verseKey: string) => {
        const verseNum = parseInt(verseKey.split(':')[1])
        return verseNum === 1
    }

    // Surahs that don't start with Basmala
    const noBasmala = [1, 9]

    // Handle swipe gestures
    const touchStartX = React.useRef(0)
    const touchEndX = React.useRef(0)
    const touchStartY = React.useRef(0)
    const touchEndY = React.useRef(0)

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
        touchStartY.current = e.touches[0].clientY
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        touchEndX.current = e.changedTouches[0].clientX
        touchEndY.current = e.changedTouches[0].clientY
        handleSwipe()
    }

    const handleSwipe = () => {
        const swipeThreshold = 50
        const diffX = touchStartX.current - touchEndX.current
        const diffY = touchStartY.current - touchEndY.current

        // If vertical scroll is dominant, don't change page
        if (Math.abs(diffY) > Math.abs(diffX)) return

        if (Math.abs(diffX) > swipeThreshold) {
            // In RTL:
            // Swipe Right (diffX < 0) -> Next Page
            // Swipe Left (diffX > 0) -> Previous Page
            if (diffX < 0 && currentPage < totalPages) {
                updatePage(currentPage + 1)
            } else if (diffX > 0 && currentPage > 1) {
                updatePage(currentPage - 1)
            }
        }
    }

    const handleJumpToPage = () => {
        const page = parseInt(jumpPage)
        if (page >= 1 && page <= totalPages) {
            updatePage(page)
            setJumpPage("")
        }
    }

    const increaseFontSize = () => {
        setFontSize(prev => Math.min(prev + 0.2, 3.0))
    }

    const decreaseFontSize = () => {
        setFontSize(prev => Math.max(prev - 0.2, 0.8))
    }

    const handleSurahSelect = (surahNum: number) => {
        const pageNum = surahPages[surahNum]
        if (pageNum) {
            updatePage(pageNum)
        }
        setShowSurahDropdown(false)
    }

    const surahInfo = verses.length > 0 ? getSurahInfo(verses[0].verse_key) : null

    return (
        <div className="mushaf-professional animate__animated animate__fadeIn">
            <style jsx>{`
                .mushaf-professional {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #e8dcc8 0%, #d4c4a8 100%);
                    padding: 1.5rem;
                }

                .mushaf-container {
                    max-width: 800px;
                    margin: 0 auto;
                }

                .top-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .mushaf-frame {
                    background: white;
                    border-radius: 1rem;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    position: relative;
                }

                .decorative-border {
                    background: linear-gradient(135deg, #4a5887 0%, #6b7ca3 50%, #4a5887 100%);
                    padding: 1.5rem;
                    position: relative;
                    overflow: hidden;
                }

                .decorative-border::before {
                    content: '';
                    position: absolute;
                    inset: 0.5rem;
                    border: 3px solid #d4af37;
                    border-radius: 0.5rem;
                    pointer-events: none;
                }

                .decorative-border::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background-image: 
                        repeating-linear-gradient(0deg, transparent, transparent 15px, rgba(212, 175, 55, 0.1) 15px, rgba(212, 175, 55, 0.1) 16px),
                        repeating-linear-gradient(90deg, transparent, transparent 15px, rgba(212, 175, 55, 0.1) 15px, rgba(212, 175, 55, 0.1) 16px);
                    pointer-events: none;
                }

                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: white;
                    font-size: 0.9rem;
                    margin-bottom: 1rem;
                    position: relative;
                    z-index: 1;
                    gap: 0.5rem;
                    flex-wrap: nowrap;
                }

                .page-info {
                    white-space: nowrap;
                }

                .font-controls {
                    display: flex;
                    gap: 0.3rem;
                    align-items: center;
                }

                .font-btn {
                    background: white;
                    color: #4a5887;
                    border: 2px solid #d4af37;
                    padding: 0.25rem 0.6rem;
                    border-radius: 0.3rem;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.3s;
                    font-size: 0.85rem;
                    white-space: nowrap;
                }

                .font-btn:hover {
                    background: #d4af37;
                    color: white;
                }

                .surah-selector {
                    position: relative;
                    flex-shrink: 0;
                }

                .surah-btn {
                    background: white;
                    color: #4a5887;
                    border: 2px solid #d4af37;
                    padding: 0.35rem 0.7rem;
                    border-radius: 0.3rem;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    transition: all 0.3s;
                    white-space: nowrap;
                    font-family: 'Traditional Arabic', 'Amiri', serif;
                }

                .surah-btn:hover {
                    background: #d4af37;
                    color: white;
                }

                .surah-btn i {
                    font-size: 0.7rem;
                }

                .surah-dropdown {
                    position: absolute;
                    top: calc(100% + 0.5rem);
                    left: 50%;
                    transform: translateX(-50%);
                    background: white;
                    border: 2px solid #d4af37;
                    border-radius: 0.5rem;
                    max-height: 350px;
                    overflow-y: auto;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                    z-index: 2000;
                    min-width: 220px;
                }

                .surah-dropdown-item {
                    padding: 0.7rem 1.2rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-bottom: 1px solid #f0f0f0;
                    text-align: right;
                    font-family: 'Traditional Arabic', 'Amiri', serif;
                    font-size: 0.95rem;
                    color: #2c3e50;
                }

                .surah-dropdown-item:hover {
                    background: linear-gradient(90deg, transparent, #f8f5e8, transparent);
                    color: #4a5887;
                }

                .surah-dropdown-item:last-child {
                    border-bottom: none;
                }

                .first-surah-header {
                    text-align: center;
                    font-family: 'Traditional Arabic', 'Amiri', 'Scheherazade', serif;
                    margin: 1.5rem auto 1rem;
                    padding: 1rem 2rem;
                    position: relative;
                    display: block;
                    background: linear-gradient(135deg, #f8f5e8 0%, #ffffff 50%, #f8f5e8 100%);
                    border: 2px solid #d4af37;
                    border-radius: 8px;
                    box-shadow: 
                        0 2px 8px rgba(212, 175, 55, 0.2),
                        inset 0 1px 0 rgba(255, 255, 255, 0.5);
                }

                .first-surah-header::before,
                .first-surah-header::after {
                    content: '۞';
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    font-size: 1.5rem;
                    color: #d4af37;
                }

                .first-surah-header::before {
                    left: 1rem;
                }

                .first-surah-header::after {
                    right: 1rem;
                }

                .surah-name {
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: #4a5887;
                    letter-spacing: 0.5px;
                }

                .surah-header {
                    display: none;
                }

                .page-content {
                    background: #fefdf8;
                    padding: 2.5rem 2rem 3rem;
                    min-height: 780px;
                    position: relative;
                    border: 2px solid #c9a961;
                }

                .page-content::before,
                .page-content::after {
                    content: '';
                    position: absolute;
                    left: 1rem;
                    right: 1rem;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, #c9a961, transparent);
                }

                .page-content::before {
                    top: 1rem;
                }

                .page-content::after {
                    bottom: 1.5rem;
                }

                .verses-container {
                    font-family: 'Traditional Arabic', 'Amiri', 'Scheherazade', 'Nassim', serif;
                    line-height: 1.9;
                    color: #1a1a1a;
                    text-align: justify;
                    direction: rtl;
                    text-justify: inter-word;
                    min-height: 720px;
                    padding-bottom: 1rem;
                    margin: 0;
                }

                .basmala {
                    display: block;
                    text-align: center;
                    font-family: 'Traditional Arabic', 'Amiri', 'Scheherazade', serif;
                    font-size: 1.3rem;
                    color: #4a5887;
                    margin: 1rem 0 1.5rem;
                    font-weight: 600;
                    line-height: 2;
                }

                .verse {
                    display: inline;
                }

                .verse-number {
                    display: inline-block;
                    color: #4a5887;
                    font-size: 1.1rem;
                    margin: 0 0.15rem;
                    font-weight: 600;
                    vertical-align: middle;
                }

                .page-number-bottom {
                    display: none;
                }

                .loading-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    color: #4a5887;
                }

                .navigation-controls {
                    background: linear-gradient(135deg, #4a5887 0%, #6b7ca3 100%);
                    padding: 1rem;
                    border-radius: 0 0 1rem 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: relative;
                    z-index: 1;
                }

                .nav-btn {
                    background: white;
                    color: #4a5887;
                    border: 2px solid #d4af37;
                    padding: 0.6rem 1.2rem;
                    border-radius: 0.5rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.95rem;
                }

                .nav-btn:hover:not(:disabled) {
                    background: #d4af37;
                    color: white;
                    transform: translateY(-2px);
                }

                .nav-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                .page-indicator {
                    color: white;
                    font-weight: bold;
                    font-size: 1.1rem;
                }

                @media (max-width: 768px) {
                    .mushaf-professional {
                        padding: 0.5rem;
                    }

                    .decorative-border {
                        padding: 0.8rem;
                    }

                    .page-header {
                        font-size: 0.75rem;
                        gap: 0.3rem;
                        padding: 0;
                        margin-bottom: 0.8rem;
                    }

                    .page-info {
                        font-size: 0.75rem;
                    }

                    .font-btn {
                        padding: 0.2rem 0.4rem;
                        font-size: 0.75rem;
                    }

                    .surah-btn {
                        padding: 0.25rem 0.5rem;
                        font-size: 0.75rem;
                        gap: 0.2rem;
                    }

                    .surah-btn i {
                        font-size: 0.6rem;
                    }

                    .surah-dropdown {
                        min-width: 180px;
                        max-height: 250px;
                        font-size: 0.85rem;
                    }

                    .page-content {
                        padding: 1.5rem 1rem;
                        min-height: 620px;
                    }

                    .verses-container {
                        line-height: 1.9;
                        min-height: 550px;
                        padding-bottom: 0.5rem;
                    }

                    .verse-number {
                        font-size: 1rem;
                    }

                    .surah-title {
                        font-size: 1.2rem;
                    }

                    .basmala {
                        font-size: 1.3rem;
                    }

                    .top-controls {
                        flex-direction: column;
                        gap: 0.5rem;
                        margin-bottom: 0.5rem;
                    }

                    .navigation-controls {
                        display: none;
                    }

                    .nav-btn {
                        padding: 0.5rem 1rem;
                        font-size: 0.85rem;
                    }
                }

                .jump-controls {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }

                .jump-input {
                    width: 70px;
                    padding: 0.4rem 0.6rem;
                    border: 2px solid #d4af37;
                    border-radius: 0.5rem;
                    text-align: center;
                    font-weight: bold;
                    background: white;
                }

                .jump-btn {
                    background: white;
                    color: #4a5887;
                    border: 2px solid #d4af37;
                    padding: 0.4rem 0.8rem;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .jump-btn:hover:not(:disabled) {
                    background: #d4af37;
                    color: white;
                }

                .jump-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
            `}</style>

            <div className="mushaf-container">
                {/* Top Controls */}
                <div className="top-controls">
                    <button
                        className="btn btn-light rounded-pill"
                        onClick={onBack}
                        type="button"
                    >
                        <i className="fas fa-arrow-right me-2"></i>
                        رجوع للمكتبة
                    </button>

                    <div className="jump-controls">
                        <span style={{ color: '#4a5887', fontWeight: 'bold' }}>الانتقال:</span>
                        <input
                            type="number"
                            className="jump-input"
                            placeholder="صفحة"
                            value={jumpPage}
                            onChange={(e) => setJumpPage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleJumpToPage()}
                            min="1"
                            max="604"
                        />
                        <button
                            className="jump-btn"
                            onClick={handleJumpToPage}
                            disabled={!jumpPage}
                        >
                            <i className="fas fa-arrow-left"></i>
                        </button>
                    </div>
                </div>

                {/* Main Mushaf Frame */}
                <div className="mushaf-frame">
                    {/* Decorative Border */}
                    <div className="decorative-border">
                        {/* Page Header */}
                        <div className="page-header">
                            <div className="page-info">صفحة {toArabicNumeral(currentPage)}</div>
                            <div className="font-controls">
                                <button className="font-btn" onClick={decreaseFontSize} title="تصغير الخط">
                                    A-
                                </button>
                                <button className="font-btn" onClick={increaseFontSize} title="تكبير الخط">
                                    A+
                                </button>
                            </div>
                            <div className="surah-selector">
                                <button
                                    className="surah-btn"
                                    onClick={() => setShowSurahDropdown(!showSurahDropdown)}
                                    type="button"
                                >
                                    {surahInfo ? surahInfo.name : 'سورة'}
                                    <i className="fas fa-chevron-down"></i>
                                </button>
                                {showSurahDropdown && (
                                    <div className="surah-dropdown">
                                        {Object.entries(surahNames).map(([num, name]) => (
                                            <div
                                                key={num}
                                                className="surah-dropdown-item"
                                                onClick={() => handleSurahSelect(parseInt(num))}
                                            >
                                                {toArabicNumeral(parseInt(num))}. {name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="page-info">الجزء {toArabicNumeral(getJuzNumber(currentPage))}</div>
                        </div>

                        {/* Page Content */}
                        <div
                            className="page-content"
                            onTouchStart={handleTouchStart}
                            onTouchEnd={handleTouchEnd}
                        >
                            {loading ? (
                                <div className="loading-state">
                                    <div className="spinner-border" role="status">
                                        <span className="visually-hidden">جاري التحميل...</span>
                                    </div>
                                    <div className="mt-3">جاري تحميل الصفحة...</div>
                                </div>
                            ) : (
                                <div className="verses-container" style={{ fontSize: `${fontSize}rem` }}>
                                    {verses.map((verse, index) => {
                                        const isFirstVerse = isFirstVerseOfSurah(verse.verse_key)
                                        const surahInfo = isFirstVerse ? getSurahInfo(verse.verse_key) : null

                                        return (
                                            <React.Fragment key={verse.id}>
                                                {isFirstVerse && surahInfo && (
                                                    <>
                                                        <div className="first-surah-header">
                                                            <span className="surah-name">سُورَةُ {surahInfo.name}</span>
                                                        </div>
                                                        {!noBasmala.includes(surahInfo.number) && (
                                                            <div className="basmala">
                                                                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                                <span className="verse">
                                                    {verse.text_uthmani}
                                                </span>
                                                <span className="verse-number">
                                                    {formatVerseNumber(verse.verse_key)}
                                                </span>
                                                {index < verses.length - 1 && ' '}
                                            </React.Fragment>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Navigation Controls */}
                    <div className="navigation-controls">
                        <button
                            className="nav-btn"
                            onClick={() => updatePage(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <i className="fas fa-chevron-right"></i>
                            الصفحة السابقة
                        </button>

                        <div className="page-indicator">
                            {toArabicNumeral(currentPage)} من {toArabicNumeral(totalPages)}
                        </div>

                        <button
                            className="nav-btn"
                            onClick={() => updatePage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            الصفحة التالية
                            <i className="fas fa-chevron-left"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
