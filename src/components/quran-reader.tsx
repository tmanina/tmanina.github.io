"use client"

import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import "./QuranReader.css"

interface Word {
    id: number
    position: number
    text: string
    text_uthmani: string
    text_imlaei: string
    code_v1: string
    code_v2: string
    v1_page?: number
    v2_page?: number
    line_number: number
    char_type_name: string
}

interface Verse {
    id: number
    verse_key: string
    verse_number: number
    text_uthmani: string
    words?: Word[]
}

interface Line {
    lineNumber: number
    words: Word[]
}

// Virtual Page Constants
const BASE_W = 900
const BASE_H = 1350

// QCF Font Loading Utilities
const pad3 = (n: number) => String(n).padStart(3, "0")
const QCF_DIR = "/fonts/qcf/mushaf-woff2"
const qcfPageUrl = (page: number) => `${QCF_DIR}/QCF_P${pad3(page)}.woff2`
const QCF_BSML_URL = `${QCF_DIR}/QCF_BSML.woff2`
const qcfFamily = (page: number) => `QCF_P${pad3(page)}`

// Virtual Page + Scale Hook
// Creates a fixed-size virtual page (900×1350) and scales it to fit any screen
function useMushafScale() {
    const stageRef = React.useRef<HTMLDivElement>(null)
    const [scale, setScale] = React.useState(1)

    React.useLayoutEffect(() => {
        const compute = () => {
            const el = stageRef.current
            if (!el) return

            // Get stable measurements
            let availW = el.clientWidth
            let availH = el.clientHeight

            // Fallback if zero reading (happens on mobile during first render)
            if (availW < 50 || availH < 50) {
                availW = window.innerWidth
                availH = window.innerHeight
            }

            // Subtract actual padding from stage (children center inside padding box)
            const cs = getComputedStyle(el)
            const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0)
            const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0)

            availW = Math.max(0, availW - padX)
            availH = Math.max(0, availH - padY)

            const sW = availW / BASE_W
            const sH = availH / BASE_H

            // Fit-to-page (show full page)
            const s = Math.min(sW, sH)

            // Allow scaling up (remove Math.min(1, s))
            setScale(Math.max(0.1, s))
        }

        // Multiple calls for stability
        compute()
        requestAnimationFrame(compute)
        setTimeout(compute, 60)

        // Recalculate after fonts load
        if ((document as any).fonts?.ready) {
            (document as any).fonts.ready.then(compute).catch(() => { })
        }

        const ro = new ResizeObserver(compute)
        if (stageRef.current) {
            ro.observe(stageRef.current)
        }

        window.addEventListener("orientationchange", compute)
        window.addEventListener("resize", compute)

        // iOS visual viewport support
        window.visualViewport?.addEventListener("resize", compute)

        return () => {
            ro.disconnect()
            window.removeEventListener("orientationchange", compute)
            window.removeEventListener("resize", compute)
            window.visualViewport?.removeEventListener("resize", compute)
        }
    }, [])

    return { stageRef, scale }
}

// Helper to clean text from unwanted characters
// Removes asterisks and problematic waqf/tajweed marks that may render as * on some devices
const cleanText = (text: string) => {
    if (!text) return ""
    // Remove literal asterisks and Unicode characters that might render poorly:
    // U+06D6-U+06ED are waqf/tajweed marks - many don't render correctly on all devices
    // Keeping only essential diacritics (harakat) that are required for reading
    return text
        .replace(/\*/g, "")
        .replace(/[\u06D6-\u06ED]/g, "") // Remove all waqf marks: ۖۗۘۙۚۛۜ۝۞ۣ۟۠ۡۢۤۥۦۧۨ۩۪ۭ
}

// MushafLine Component - Supports both text_uthmani and code_v1 (glyph) modes
const MushafLine = React.memo(function MushafLine({
    words,
    surahHeader,
    basmala = false,
    isCentered = false,
    fontFamily,
}: {
    words: Word[];
    lineNumber: number;
    surahHeader?: { name: string; showBasmalaInline?: boolean };
    basmala?: boolean;
    isCentered?: boolean;
    fontFamily?: string;
}) {
    // TEMPORARILY DISABLED: QCF glyph mode
    // The QCF font files load successfully but don't render the PUA glyphs.
    // This is likely due to a version mismatch between font files and API glyph codes.
    // Using text_uthmani with KFGQPC font as a reliable fallback.
    const glyphMode = false; // Disabled until font compatibility is resolved

    // Original glyph detection:
    // const hasV1 = Boolean(words?.[0]?.code_v1);
    // const hasV2 = Boolean(words?.[0]?.code_v2);
    // const glyphMode = hasV1 || hasV2;

    // Debug: log first word's glyph data (disabled with glyphMode)
    // if (words?.[0] && glyphMode) {
    //     console.log('[QCF Debug] Word sample:', {
    //         v1: words[0].code_v1?.substring(0, 20),
    //         v2: words[0].code_v2?.substring(0, 20),
    //     });
    // }

    // Inline style for font-family (bypasses CSS variable issues)
    const fontStyle = glyphMode && fontFamily
        ? { fontFamily: `"${fontFamily}", serif` }
        : undefined;

    // Basmala line (standalone)
    if (basmala) {
        return (
            <div className="line-outer" dir="rtl">
                <div className="line-inner centered basmala-inner">﷽</div>
            </div>
        );
    }

    // Surah header line (in empty lines)
    if (surahHeader) {
        return (
            <div className="line-outer surah-header-line" dir="rtl">
                <div className="surah-title">سُورَةُ {surahHeader.name}</div>
                {surahHeader.showBasmalaInline ? (
                    <div className="surah-basmala-inline">﷽</div>
                ) : null}
            </div>
        );
    }

    // Empty line placeholder
    if (words.length === 0) {
        return (
            <div className="line-outer" dir="rtl">
                <div className={`line-inner ${glyphMode ? "glyph" : ""}`} />
            </div>
        );
    }

    // Text line - use code_v1 if available, otherwise text_uthmani
    return (
        <div className="line-outer" dir="rtl">
            <div
                className={`line-inner ${glyphMode ? "glyph" : isCentered ? "centered" : "justified"}`}
                style={fontStyle}
            >
                {words.map((word, idx) => (
                    <React.Fragment key={`${word.id}-${idx}`}>
                        <span
                            className={`mushaf-word ${word.char_type_name === "end" ? "verse-number-ornament" : ""}`}
                        >
                            {glyphMode
                                ? (word.code_v1 || word.code_v2)
                                : word.char_type_name === "end"
                                    ? `\u2068﴾${cleanText(word.text_uthmani)}﴿\u2069`
                                    : cleanText(word.text_uthmani)}
                        </span>
                        {!glyphMode && idx < words.length - 1 ? " " : null}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
});

interface QuranReaderProps {
    onBack: () => void
}

export function QuranReader({ onBack }: QuranReaderProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const initialPage = parseInt(searchParams.get("page") || "1")
    const [currentPage, setCurrentPage] = React.useState(initialPage)
    const [verses, setVerses] = React.useState<Verse[]>([])
    const [lines, setLines] = React.useState<Line[]>([]) // 15 lines for Madina Mushaf
    const [loading, setLoading] = React.useState(true)

    // Virtual Page + Scale hook
    const { stageRef, scale } = useMushafScale()
    const [showMenu, setShowMenu] = React.useState(false)
    const [showSurahList, setShowSurahList] = React.useState(false)
    const [showBookmarks, setShowBookmarks] = React.useState(false)
    const [isMobile, setIsMobile] = React.useState(false)
    const [nightMode, setNightMode] = React.useState(false)
    const [fullscreen, setFullscreen] = React.useState(false)
    const [jumpPage, setJumpPage] = React.useState("")
    const totalPages = 604

    // Page cache for faster navigation
    const pageCache = React.useRef(new Map<number, { verses: Verse[]; lines: Line[] }>())

    // Bookmark and highlighting state - persisted in localStorage
    const [bookmarks, setBookmarks] = React.useState<number[]>([])
    const [highlights, setHighlights] = React.useState<string[]>([]) // verse_key format: "surah:verse"
    const [lastReadPage, setLastReadPage] = React.useState<number>(1)

    // Pre-cache progress state
    const [precacheStatus, setPrecacheStatus] = React.useState<{
        downloading: boolean
        current: number
        total: number
        complete: boolean
        message: string
    }>({
        downloading: false,
        current: 0,
        total: 604,
        complete: false,
        message: ''
    })

    // QCF Font Loading State
    const [pageFontFamily, setPageFontFamily] = React.useState<string>("KFGQPC")
    const loadedFonts = React.useRef(new Set<string>())

    const ensureFont = React.useCallback(async (family: string, url: string) => {
        if (typeof window === "undefined") return

        // Check if already loaded via our style tag
        const styleId = `font-${family}`
        if (document.getElementById(styleId)) {
            return
        }

        // Inject @font-face via style tag (more reliable than FontFace API)
        const style = document.createElement("style")
        style.id = styleId
        style.textContent = `
            @font-face {
                font-family: "${family}";
                src: url("${url}") format("woff2");
                font-display: swap;
            }
        `
        document.head.appendChild(style)
        console.log(`[QCF] Injected font: ${family} from ${url}`)

        // Wait for font to be ready
        try {
            await document.fonts.load(`48px "${family}"`)
            console.log(`[QCF] Font loaded: ${family}`)
        } catch (e) {
            console.warn(`[QCF] Font load wait failed for ${family}:`, e)
        }
    }, [])

    // Load QCF page font when page changes
    React.useEffect(() => {
        let cancelled = false

        const loadPageFont = async () => {
            console.log(`[QCF Effect] Starting font load for page ${currentPage}`)
            try {
                // 1) Load Basmala font (optional but nice)
                await ensureFont("QCF_BSML", QCF_BSML_URL)

                // 2) Load current page font
                const fam = qcfFamily(currentPage)
                await ensureFont(fam, qcfPageUrl(currentPage))
                if (!cancelled) setPageFontFamily(fam)

                // 3) Prefetch prev/next page fonts (fire and forget)
                if (currentPage > 1) {
                    ensureFont(qcfFamily(currentPage - 1), qcfPageUrl(currentPage - 1)).catch(() => { })
                }
                if (currentPage < totalPages) {
                    ensureFont(qcfFamily(currentPage + 1), qcfPageUrl(currentPage + 1)).catch(() => { })
                }
            } catch (e) {
                console.error("QCF font load failed:", e)
                if (!cancelled) setPageFontFamily("KFGQPC")
            }
        }

        loadPageFont()
        return () => { cancelled = true }
    }, [currentPage, totalPages, ensureFont])

    // Load saved data from localStorage on mount
    React.useEffect(() => {
        try {
            const savedBookmarks = localStorage.getItem('quran_bookmarks')
            const savedHighlights = localStorage.getItem('quran_highlights')
            const savedLastRead = localStorage.getItem('quran_last_read')
            const savedNightMode = localStorage.getItem('quran_night_mode')

            if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks))
            if (savedHighlights) setHighlights(JSON.parse(savedHighlights))
            if (savedLastRead) setLastReadPage(parseInt(savedLastRead))
            if (savedNightMode) setNightMode(savedNightMode === 'true')
        } catch (e) {
            console.error('Error loading saved data:', e)
        }
    }, [])

    // Virtual Page approach: no font calculation needed - scaling handles everything
    // Just sync isMobile for header styling
    React.useEffect(() => {
        const syncIsMobile = () => setIsMobile(window.innerWidth <= 768)
        syncIsMobile()
        window.addEventListener('resize', syncIsMobile)
        return () => window.removeEventListener('resize', syncIsMobile)
    }, [])

    // Save data to localStorage when changed
    React.useEffect(() => {
        localStorage.setItem('quran_bookmarks', JSON.stringify(bookmarks))
    }, [bookmarks])

    React.useEffect(() => {
        localStorage.setItem('quran_highlights', JSON.stringify(highlights))
    }, [highlights])

    React.useEffect(() => {
        localStorage.setItem('quran_last_read', currentPage.toString())
    }, [currentPage])

    React.useEffect(() => {
        localStorage.setItem('quran_night_mode', nightMode.toString())
    }, [nightMode])

    // Pre-cache all Quran pages on first visit
    React.useEffect(() => {
        // Check if we should trigger pre-cache
        const hasPreCached = localStorage.getItem('quran_precached')

        if (!hasPreCached && 'serviceWorker' in navigator) {
            // Listen for progress messages
            const handleMessage = (event: MessageEvent) => {
                if (event.data?.type === 'QURAN_PRECACHE_PROGRESS') {
                    setPrecacheStatus({
                        downloading: event.data.status === 'downloading' || event.data.status === 'starting',
                        current: event.data.current || 0,
                        total: event.data.total || 604,
                        complete: event.data.status === 'complete',
                        message: event.data.message || ''
                    })

                    if (event.data.status === 'complete') {
                        localStorage.setItem('quran_precached', 'true')
                    }
                }
            }

            navigator.serviceWorker.addEventListener('message', handleMessage)

            // Trigger pre-cache after a short delay
            const timer = setTimeout(() => {
                navigator.serviceWorker.ready.then(registration => {
                    if (registration.active) {
                        setPrecacheStatus(prev => ({ ...prev, downloading: true, message: 'جاري التحضير...' }))
                        registration.active.postMessage({ type: 'PRECACHE_QURAN' })
                    }
                })
            }, 2000) // Wait 2 seconds before starting

            return () => {
                clearTimeout(timer)
                navigator.serviceWorker.removeEventListener('message', handleMessage)
            }
        } else if (hasPreCached) {
            setPrecacheStatus(prev => ({ ...prev, complete: true }))
        }
    }, [])

    // Bookmark functions
    const toggleBookmark = (page: number) => {
        setBookmarks(prev =>
            prev.includes(page)
                ? prev.filter(p => p !== page)
                : [...prev, page].sort((a, b) => a - b)
        )
    }

    const isPageBookmarked = (page: number) => bookmarks.includes(page)

    // Highlight functions
    const toggleHighlight = (verseKey: string) => {
        setHighlights(prev =>
            prev.includes(verseKey)
                ? prev.filter(v => v !== verseKey)
                : [...prev, verseKey]
        )
    }

    const isVerseHighlighted = (verseKey: string) => highlights.includes(verseKey)

    const menuRef = React.useRef<HTMLDivElement>(null)
    const contentRef = React.useRef<HTMLDivElement>(null)

    // Touch handling for swipe navigation
    const touchStartX = React.useRef(0)
    const touchStartY = React.useRef(0)
    const isScrolling = React.useRef(false)

    const updatePage = React.useCallback((newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return
        setCurrentPage(newPage)

        const params = new URLSearchParams(searchParams.toString())
        params.set("page", String(newPage))
        router.replace(`?${params.toString()}`, { scroll: false })

        if (contentRef.current) {
            contentRef.current.scrollTop = 0
        }
    }, [router, searchParams, totalPages])

    // Fetch page data with word-level line information
    React.useEffect(() => {
        const ac = new AbortController();

        // Helper to process API response and create lines
        const processPageData = (data: { verses: Verse[] }): { verses: Verse[]; lines: Line[] } => {
            const lineMap = new Map<number, Word[]>();

            data.verses.forEach((verse: Verse) => {
                if (verse.words) {
                    verse.words.forEach((word: Word) => {
                        const lineNum = word.line_number;
                        if (!lineMap.has(lineNum)) {
                            lineMap.set(lineNum, []);
                        }
                        lineMap.get(lineNum)!.push(word);
                    });
                }
            });

            const lineNumbers = Array.from(lineMap.keys()).sort((a, b) => a - b);
            const minLine = lineNumbers.length > 0 ? Math.min(lineNumbers[0], 1) : 1;
            const maxLine = 15;

            const sortedLines = Array.from({ length: maxLine - minLine + 1 }, (_, i) => {
                const lineNum = minLine + i;
                return {
                    lineNumber: lineNum,
                    words: lineMap.get(lineNum) || []
                };
            });

            return { verses: data.verses, lines: sortedLines };
        };

        // Fetch a single page (uses cache if available)
        const fetchPageData = async (page: number, signal?: AbortSignal): Promise<{ verses: Verse[]; lines: Line[] } | null> => {
            // Check cache first
            if (pageCache.current.has(page)) {
                return pageCache.current.get(page)!;
            }

            try {
                const response = await fetch(
                    `https://api.quran.com/api/v4/verses/by_page/${page}?words=true&word_fields=text_uthmani,text_imlaei,code_v1,code_v2,v1_page,v2_page&per_page=50`,
                    { signal }
                );
                const data = await response.json();

                if (data.verses) {
                    const processed = processPageData(data);
                    pageCache.current.set(page, processed);
                    return processed;
                }
            } catch (e) {
                if ((e as Error).name !== 'AbortError') {
                    console.error('Error fetching page:', e);
                }
            }
            return null;
        };

        (async () => {
            setLoading(true);
            try {
                const pageData = await fetchPageData(currentPage, ac.signal);

                if (pageData) {
                    setVerses(pageData.verses);
                    setLines(pageData.lines);

                    // Prefetch neighbors (don't await, fire and forget)
                    if (currentPage > 1) {
                        fetchPageData(currentPage - 1).catch(() => { });
                    }
                    if (currentPage < totalPages) {
                        fetchPageData(currentPage + 1).catch(() => { });
                    }
                }
            } catch (e) {
                if ((e as Error).name !== 'AbortError') {
                    console.error('Error in page fetch:', e);
                }
            } finally {
                setLoading(false);
            }
        })();

        return () => ac.abort();
    }, [currentPage, totalPages])

    // Keyboard navigation
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' && currentPage > 1) {
                updatePage(currentPage - 1)
            } else if (e.key === 'ArrowLeft' && currentPage < totalPages) {
                updatePage(currentPage + 1)
            } else if (e.key === 'Escape' && fullscreen) {
                setFullscreen(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [currentPage, fullscreen])

    // Arabic numeral conversion
    const toArabicNumeral = (num: number) => {
        const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
        return num.toString().split('').map(d => arabicNumerals[parseInt(d)]).join('')
    }

    const formatVerseNumber = (verseKey: string) => {
        const verseNum = verseKey.split(':')[1]
        return ` ﴿${toArabicNumeral(parseInt(verseNum))}﴾ `
    }

    // Surah data
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

    const juzStartPages: Record<number, number> = {
        1: 1, 2: 22, 3: 42, 4: 62, 5: 82, 6: 102, 7: 121, 8: 142, 9: 162, 10: 182,
        11: 201, 12: 222, 13: 242, 14: 262, 15: 282, 16: 302, 17: 322, 18: 342, 19: 362, 20: 382,
        21: 402, 22: 422, 23: 442, 24: 462, 25: 482, 26: 502, 27: 522, 28: 542, 29: 562, 30: 582
    }

    const getJuzNumber = (page: number) => {
        for (let i = 30; i >= 1; i--) {
            if (page >= juzStartPages[i]) return i
        }
        return 1
    }

    // Approximate hizb + quarter info based on page position
    const getHizbInfo = (page: number) => {
        const totalHizb = 60
        const pagesPerHizb = totalPages / totalHizb // ~10.06
        const hizbFloat = (page - 1) / pagesPerHizb
        const hizbNumber = Math.floor(hizbFloat) + 1
        const progress = hizbFloat % 1

        let fractionLabel = 'ربع الحزب'
        if (progress >= 0.75) fractionLabel = 'نهاية الحزب'
        else if (progress >= 0.5) fractionLabel = '٣/٤ الحزب'
        else if (progress >= 0.25) fractionLabel = 'نصف الحزب'

        return { hizbNumber, fractionLabel }
    }

    const getSurahInfo = (verseKey: string) => {
        const surahNum = parseInt(verseKey.split(':')[0])
        return { number: surahNum, name: surahNames[surahNum] || `سورة ${toArabicNumeral(surahNum)}` }
    }

    const isFirstVerseOfSurah = (verseKey: string) => parseInt(verseKey.split(':')[1]) === 1

    // Find all surahs that start in the middle of the page (not at the beginning)
    const getSurahStartsInPage = (): { surahNum: number; surahName: string; lineNumber: number }[] => {
        if (verses.length <= 1) return []

        const surahStarts: { surahNum: number; surahName: string; lineNumber: number }[] = []

        // Skip first verse (already handled by main surah header)
        for (let i = 1; i < verses.length; i++) {
            const verse = verses[i]
            if (isFirstVerseOfSurah(verse.verse_key)) {
                const surahNum = parseInt(verse.verse_key.split(':')[0])
                // Find the line number from words - this is where the first verse text appears
                const verseLineNum = verse.words?.[0]?.line_number || 1

                // Check if the previous line is empty (available for header)
                // If so, use the previous line for the surah header
                const prevLineNum = verseLineNum - 1
                const prevLineHasWords = lines.find(l => l.lineNumber === prevLineNum)?.words?.length ?? 0

                // If previous line is empty and exists, use it for header
                const headerLineNum = (prevLineNum >= 1 && prevLineHasWords === 0)
                    ? prevLineNum
                    : verseLineNum

                surahStarts.push({
                    surahNum,
                    surahName: surahNames[surahNum] || `سورة ${toArabicNumeral(surahNum)}`,
                    lineNumber: headerLineNum
                })
            }
        }

        return surahStarts

    }

    const noBasmala = [1, 9]

    type LineDeco =
        | { kind: "surah"; name: string; showBasmalaInline: boolean }
        | { kind: "basmala" };

    const lineDecos = React.useMemo(() => {
        const m = new Map<number, LineDeco>();
        if (!verses.length || !lines.length) return m;

        const isEmpty = (ln: number) => {
            const l = lines.find((x) => x.lineNumber === ln);
            return !l || l.words.length === 0;
        };

        const addSurahStart = (verse: Verse) => {
            if (!verse.words?.length) return;

            const [surahNum, ayahNum] = verse.verse_key.split(":").map(Number);
            if (ayahNum !== 1) return;

            const showBasmala = !noBasmala.includes(surahNum);
            const name = surahNames[surahNum] || `سورة ${toArabicNumeral(surahNum)}`;

            const textLine = verse.words[0].line_number;

            // Best scenario: two empty lines before text (title + basmala)
            if (showBasmala && isEmpty(textLine - 2) && isEmpty(textLine - 1)) {
                m.set(textLine - 2, { kind: "surah", name, showBasmalaInline: false });
                m.set(textLine - 1, { kind: "basmala" });
                return;
            }

            // Medium scenario: only one empty line (compact)
            if (showBasmala && isEmpty(textLine - 1)) {
                m.set(textLine - 1, { kind: "surah", name, showBasmalaInline: true });
                return;
            }

            // No basmala (Fatiha/Tawbah): title only
            if (!showBasmala && isEmpty(textLine - 1)) {
                m.set(textLine - 1, { kind: "surah", name, showBasmalaInline: false });
            }
        };

        verses.forEach(addSurahStart);
        return m;
    }, [verses, lines]);

    // Check if page should show Basmalah (start of new surah, not Al-Fatiha or At-Tawbah)
    const shouldShowBasmala = () => {
        if (!verses.length) return false
        const [surah, ayah] = verses[0].verse_key.split(':').map(Number)
        if (ayah !== 1) return false
        return !noBasmala.includes(surah)
    }

    // Calculate line offset for pages with Basmala (Basmala takes 1 line from the 15)
    const getPageOffsetLines = () => {
        if (!verses.length) return 0
        const [surah, ayah] = verses[0].verse_key.split(':').map(Number)
        // If page starts with verse 1 and has Basmala, offset by 1
        if (ayah === 1 && !noBasmala.includes(surah)) {
            return 1
        }
        return 0
    }

    // Touch handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
        touchStartY.current = e.touches[0].clientY
        isScrolling.current = false
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        const diffY = Math.abs(e.touches[0].clientY - touchStartY.current)
        const diffX = Math.abs(e.touches[0].clientX - touchStartX.current)
        if (diffY > diffX) {
            isScrolling.current = true
        }
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (isScrolling.current) return
        const diffX = touchStartX.current - e.changedTouches[0].clientX
        if (Math.abs(diffX) > 80) {
            if (diffX < 0 && currentPage < totalPages) updatePage(currentPage + 1)
            else if (diffX > 0 && currentPage > 1) updatePage(currentPage - 1)
        }
    }

    const handleJumpToPage = () => {
        const page = parseInt(jumpPage)
        if (page >= 1 && page <= totalPages) {
            updatePage(page)
            setJumpPage("")
            setShowMenu(false)
        }
    }

    const handleSurahSelect = (surahNum: number) => {
        const pageNum = surahPages[surahNum]
        if (pageNum) updatePage(pageNum)
        setShowSurahList(false)
        setShowMenu(false)
    }

    // Close menu on outside click
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false)
                setShowSurahList(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const surahInfo = verses.length > 0 ? getSurahInfo(verses[0].verse_key) : null
    const hizbInfo = getHizbInfo(currentPage)

    return (
        <div className={`mushaf-reader ${nightMode ? 'night' : ''} ${fullscreen ? 'fullscreen' : ''} ${isMobile ? 'mobile' : ''}`}>
            {/* Header */}
            <header className="mushaf-header" ref={menuRef}>
                <button className="header-btn" onClick={onBack} type="button" title="رجوع">
                    <i className="fas fa-arrow-right"></i>
                </button>

                <div className="header-center">
                    <span
                        className="surah-name"
                        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); setShowSurahList(false); }}
                    >
                        {surahInfo ? surahInfo.name : 'القرآن الكريم'}
                    </span>
                    <span className="page-info">
                        الجزء {toArabicNumeral(getJuzNumber(currentPage))} • صفحة {toArabicNumeral(currentPage)}
                    </span>
                </div>

                <div className="header-actions">
                    <button
                        className={`header-btn ${isPageBookmarked(currentPage) ? 'active' : ''}`}
                        onClick={() => toggleBookmark(currentPage)}
                        type="button"
                        title={isPageBookmarked(currentPage) ? "إزالة العلامة" : "إضافة علامة"}
                    >
                        <i className={`fas ${isPageBookmarked(currentPage) ? 'fa-bookmark' : 'fa-bookmark'}`} style={{ color: isPageBookmarked(currentPage) ? '#ffd700' : undefined }}></i>
                    </button>
                    <button
                        className={`header-btn ${showBookmarks ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setShowBookmarks(!showBookmarks); setShowMenu(false); setShowSurahList(false); }}
                        type="button"
                        title="العلامات المرجعية"
                    >
                        <i className="fas fa-list"></i>
                    </button>
                    <button
                        className={`header-btn ${nightMode ? 'active' : ''}`}
                        onClick={() => setNightMode(!nightMode)}
                        type="button"
                        title="الوضع الليلي"
                    >
                        <i className={`fas ${nightMode ? 'fa-sun' : 'fa-moon'}`}></i>
                    </button>
                    <button
                        className={`header-btn ${showMenu ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); setShowSurahList(false); setShowBookmarks(false); }}
                        type="button"
                        title="الإعدادات"
                    >
                        <i className="fas fa-cog"></i>
                    </button>
                </div>

                {/* Settings Dropdown */}
                {showMenu && !showSurahList && (
                    <div className="settings-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div className="menu-section">
                            <div className="menu-label">الانتقال إلى صفحة</div>
                            <div className="menu-row">
                                <input
                                    type="number"
                                    className="page-input"
                                    placeholder="رقم الصفحة"
                                    value={jumpPage}
                                    onChange={(e) => setJumpPage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleJumpToPage()}
                                    min="1"
                                    max="604"
                                />
                                <button className="go-btn" onClick={handleJumpToPage} type="button">
                                    انتقال
                                </button>
                            </div>
                        </div>

                        <div className="menu-section">
                            <button
                                className="surah-list-btn"
                                onClick={(e) => { e.stopPropagation(); setShowSurahList(true); }}
                                type="button"
                            >
                                <span>اختر سورة</span>
                                <i className="fas fa-chevron-left"></i>
                            </button>
                        </div>
                    </div>
                )}

                {/* Surah List */}
                {showSurahList && (
                    <div className="surah-list" onClick={(e) => e.stopPropagation()}>
                        <div className="surah-list-header">
                            <button
                                className="back-btn"
                                onClick={(e) => { e.stopPropagation(); setShowSurahList(false); }}
                                type="button"
                            >
                                <i className="fas fa-arrow-right"></i>
                                <span>رجوع</span>
                            </button>
                        </div>
                        {Object.entries(surahNames).map(([num, name]) => (
                            <div
                                key={num}
                                className="surah-item"
                                onClick={() => handleSurahSelect(parseInt(num))}
                            >
                                <span>{name}</span>
                                <span className="surah-num">{num}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Bookmarks Panel */}
                {showBookmarks && (
                    <div className="bookmarks-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="bookmarks-header">
                            <h3 className="bookmarks-title">العلامات المرجعية</h3>
                            <button
                                className="back-btn"
                                onClick={(e) => { e.stopPropagation(); setShowBookmarks(false); }}
                                type="button"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="bookmarks-list">
                            {bookmarks.length === 0 ? (
                                <div className="empty-bookmarks">
                                    لا توجد علامات مرجعية
                                    <br />
                                    اضغط على أيقونة العلامة لإضافة صفحة
                                </div>
                            ) : (
                                bookmarks.map((page) => (
                                    <div
                                        key={page}
                                        className="bookmark-item"
                                        onClick={() => { updatePage(page); setShowBookmarks(false); }}
                                    >
                                        <span>صفحة <span className="bookmark-page">{toArabicNumeral(page)}</span></span>
                                        <button
                                            className="bookmark-delete"
                                            onClick={(e) => { e.stopPropagation(); toggleBookmark(page); }}
                                            type="button"
                                            title="حذف"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* Mushaf Stage - Virtual Page + Scale Container */}
            <main
                className="mushaf-stage"
                ref={stageRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Canvas Wrap - scales everything via --scale CSS variable */}
                <div
                    className="canvas-wrap"
                    style={{
                        ["--scale" as any]: scale,
                        ["--page-font" as any]: pageFontFamily,
                    }}
                >
                    <div className="mushaf-canvas">
                        {loading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <p>جاري التحميل...</p>
                            </div>
                        ) : (
                            <>
                                {/* Top Meta: Juz + Surah name */}
                                <div className="top-meta">
                                    <span className="meta-right">الجزء {toArabicNumeral(getJuzNumber(currentPage))}</span>
                                    <span className="meta-left">{surahInfo?.name || 'القرآن الكريم'}</span>
                                </div>

                                {/* Text Area - 15 Lines */}
                                <div className="text-area">
                                    {lines.map((line) => {
                                        const deco = lineDecos.get(line.lineNumber);

                                        if (deco?.kind === "basmala") {
                                            return (
                                                <MushafLine
                                                    key={line.lineNumber}
                                                    words={[]}
                                                    lineNumber={line.lineNumber}
                                                    basmala
                                                    fontFamily={pageFontFamily}
                                                />
                                            );
                                        }

                                        if (deco?.kind === "surah") {
                                            return (
                                                <MushafLine
                                                    key={line.lineNumber}
                                                    words={[]}
                                                    lineNumber={line.lineNumber}
                                                    surahHeader={{ name: deco.name, showBasmalaInline: deco.showBasmalaInline }}
                                                    fontFamily={pageFontFamily}
                                                />
                                            );
                                        }

                                        return (
                                            <MushafLine
                                                key={line.lineNumber}
                                                words={line.words}
                                                lineNumber={line.lineNumber}
                                                fontFamily={pageFontFamily}
                                            />
                                        );
                                    })}
                                </div>

                                {/* Bottom Meta: Page number */}
                                <div className="bottom-meta">
                                    <span className="page-pill">{toArabicNumeral(currentPage)}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>

            {/* Download Progress Bar */}
            {
                precacheStatus.downloading && !precacheStatus.complete && (
                    <div className="download-progress">
                        <div className="download-progress-header">
                            <i className="fas fa-download"></i>
                            <span>جاري تحميل القرآن للقراءة بدون إنترنت</span>
                        </div>
                        <div className="download-progress-bar">
                            <div
                                className="download-progress-fill"
                                style={{ width: `${(precacheStatus.current / precacheStatus.total) * 100}%` }}
                            ></div>
                        </div>
                        <div className="download-progress-text">
                            {precacheStatus.message || `${precacheStatus.current} / ${precacheStatus.total}`}
                        </div>
                    </div>
                )
            }

            {/* Footer Navigation */}
            <footer className="mushaf-footer">
                <button
                    className="nav-btn"
                    onClick={() => updatePage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    type="button"
                >
                    التالية
                    <i className="fas fa-chevron-left"></i>
                </button>

                <div className="footer-info">
                    <span>الجزء {toArabicNumeral(getJuzNumber(currentPage))}</span>
                    {' • '}
                    {toArabicNumeral(currentPage)} / {toArabicNumeral(totalPages)}
                </div>

                <button
                    className="nav-btn"
                    onClick={() => updatePage(currentPage - 1)}
                    disabled={currentPage === 1}
                    type="button"
                >
                    <i className="fas fa-chevron-right"></i>
                    السابقة
                </button>
            </footer>

            {/* Fullscreen Toggle */}
            <button
                className="fullscreen-toggle"
                onClick={() => setFullscreen(!fullscreen)}
                type="button"
                title={fullscreen ? "إنهاء ملء الشاشة" : "ملء الشاشة"}
            >
                <i className={`fas ${fullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
            </button>
        </div>
    )
}
