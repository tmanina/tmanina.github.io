"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { LineDeco } from "./types"
import { TOTAL_PAGES, toArabicNumeral, getJuzNumber, getSurahInfo, surahNames } from "./utils"
import { useQcfFonts } from "./hooks/use-qcf-fonts"
import { useMushafScale } from "./hooks/use-mushaf-scale"
import { usePageData, useQuranPrecache } from "./hooks/use-page-data"
import { QuranHeader } from "./quran-header"
import MushafLine from "./mushaf-line"
import "../QuranReader.css"

interface QuranReaderProps {
  onBack: () => void
}

/**
 * The main QuranReader component - a slim orchestrator that delegates to:
 *  - usePageData hook for fetching Quran page data
 *  - useMushafScale hook for virtual page responsive scaling
 *  - useQcfFonts hook for page-specific font loading
 *  - useQuranPrecache hook for offline pre-caching
 *  - QuranHeader component for header/controls
 *  - MushafLine component for verse line rendering
 */
export function QuranReader({ onBack }: QuranReaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialPage = parseInt(searchParams.get("page") || "1")
  const [currentPage, setCurrentPage] = React.useState(initialPage)

  // Sub-hooks
  const { verses, lines, loading } = usePageData(currentPage)
  const { stageRef, scale } = useMushafScale()
  const pageFontFamily = useQcfFonts(currentPage)
  const precacheStatus = useQuranPrecache()

  // Local state
  const [nightMode, setNightMode] = React.useState(false)
  const [fullscreen, setFullscreen] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)
  const [bookmarks, setBookmarks] = React.useState<number[]>([])
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Touch refs
  const touchStartX = React.useRef(0)
  const touchStartY = React.useRef(0)
  const isScrolling = React.useRef(false)

  // Load/save localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("quran_bookmarks")
      const savedNight = localStorage.getItem("quran_night_mode")
      if (saved) setBookmarks(JSON.parse(saved))
      if (savedNight) setNightMode(savedNight === "true")
    } catch (e) { console.error("Error loading saved data:", e) }
  }, [])

  React.useEffect(() => { localStorage.setItem("quran_bookmarks", JSON.stringify(bookmarks)) }, [bookmarks])
  React.useEffect(() => { localStorage.setItem("quran_last_read", currentPage.toString()) }, [currentPage])
  React.useEffect(() => { localStorage.setItem("quran_night_mode", nightMode.toString()) }, [nightMode])

  React.useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768)
    fn()
    window.addEventListener("resize", fn)
    return () => window.removeEventListener("resize", fn)
  }, [])

  const toggleBookmark = (page: number) => {
    setBookmarks((prev) =>
      prev.includes(page) ? prev.filter((p) => p !== page) : [...prev, page].sort((a, b) => a - b)
    )
  }

  const updatePage = React.useCallback(
    (newPage: number) => {
      if (newPage < 1 || newPage > TOTAL_PAGES) return
      setCurrentPage(newPage)
      const params = new URLSearchParams(searchParams.toString())
      params.set("page", String(newPage))
      router.replace(`?${params.toString()}`, { scroll: false })
      if (contentRef.current) contentRef.current.scrollTop = 0
    },
    [router, searchParams]
  )

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && currentPage > 1) updatePage(currentPage - 1)
      else if (e.key === "ArrowLeft" && currentPage < TOTAL_PAGES) updatePage(currentPage + 1)
      else if (e.key === "Escape" && fullscreen) setFullscreen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentPage, fullscreen, updatePage])

  // Touch swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isScrolling.current = false
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current)
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current)
    if (dy > dx) isScrolling.current = true
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isScrolling.current) return
    const diffX = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diffX) > 80) {
      if (diffX < 0 && currentPage < TOTAL_PAGES) updatePage(currentPage + 1)
      else if (diffX > 0 && currentPage > 1) updatePage(currentPage - 1)
    }
  }

  const surahInfo = verses.length > 0 ? getSurahInfo(verses[0].verse_key) : null

  // Compute line decorations (surah headers + basmala placements)
  const lineDecos = React.useMemo(() => {
    const m = new Map<number, LineDeco>()
    if (!verses.length || !lines.length) return m

    const isEmpty = (ln: number) => {
      const l = lines.find((x) => x.lineNumber === ln)
      return !l || l.words.length === 0
    }

    const noBasmalaSurahs = [1, 9]

    verses.forEach((verse) => {
      if (!verse.words?.length) return
      const [surahNum, ayahNum] = verse.verse_key.split(":").map(Number)
      if (ayahNum !== 1) return

      const showBasmala = !noBasmalaSurahs.includes(surahNum)
      const name = surahNames[surahNum] || `سورة ${toArabicNumeral(surahNum)}`
      const textLine = verse.words[0].line_number

      if (showBasmala && isEmpty(textLine - 2) && isEmpty(textLine - 1)) {
        m.set(textLine - 2, { kind: "surah", name, showBasmalaInline: false })
        m.set(textLine - 1, { kind: "basmala" })
        return
      }
      if (showBasmala && isEmpty(textLine - 1)) {
        m.set(textLine - 1, { kind: "surah", name, showBasmalaInline: true })
        return
      }
      if (!showBasmala && isEmpty(textLine - 1)) {
        m.set(textLine - 1, { kind: "surah", name, showBasmalaInline: false })
      }
    })
    return m
  }, [verses, lines])

  return (
    <div className={`mushaf-reader ${nightMode ? "night" : ""} ${fullscreen ? "fullscreen" : ""} ${isMobile ? "mobile" : ""}`}>
      <QuranHeader
        currentPage={currentPage}
        totalPages={TOTAL_PAGES}
        verses={verses}
        bookmarks={bookmarks}
        nightMode={nightMode}
        onBack={onBack}
        onToggleBookmark={toggleBookmark}
        onUpdatePage={updatePage}
        onToggleNightMode={() => setNightMode(!nightMode)}
      />

      <main
        className="mushaf-stage"
        ref={stageRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="canvas-wrap" style={{ "--scale": scale, "--page-font": pageFontFamily } as React.CSSProperties}>
          <div className="mushaf-canvas">
            {loading ? (
              <div className="loading-container">
                <div className="spinner" />
                <p>جاري التحميل...</p>
              </div>
            ) : (
              <>
                <div className="top-meta">
                  <span className="meta-right">الجزء {toArabicNumeral(getJuzNumber(currentPage))}</span>
                  <span className="meta-left">{surahInfo?.name || "القرآن الكريم"}</span>
                </div>
                <div className="text-area">
                  {lines.map((line) => {
                    const deco = lineDecos.get(line.lineNumber)
                    if (deco?.kind === "basmala") {
                      return <MushafLine key={line.lineNumber} words={[]} lineNumber={line.lineNumber} basmala fontFamily={pageFontFamily} />
                    }
                    if (deco?.kind === "surah") {
                      return <MushafLine key={line.lineNumber} words={[]} lineNumber={line.lineNumber} surahHeader={{ name: deco.name, showBasmalaInline: deco.showBasmalaInline }} fontFamily={pageFontFamily} />
                    }
                    return <MushafLine key={line.lineNumber} words={line.words} lineNumber={line.lineNumber} fontFamily={pageFontFamily} />
                  })}
                </div>
                <div className="bottom-meta">
                  <span className="page-pill">{toArabicNumeral(currentPage)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {precacheStatus.downloading && !precacheStatus.complete && (
        <div className="download-progress">
          <div className="download-progress-header">
            <i className="fas fa-download" />
            <span>جاري تحميل القرآن للقراءة بدون إنترنت</span>
          </div>
          <div className="download-progress-bar">
            <div className="download-progress-fill" style={{ width: `${(precacheStatus.current / precacheStatus.total) * 100}%` }} />
          </div>
          <div className="download-progress-text">
            {precacheStatus.message || `${precacheStatus.current} / ${precacheStatus.total}`}
          </div>
        </div>
      )}

      <footer className="mushaf-footer">
        <button className="nav-btn" onClick={() => updatePage(currentPage + 1)} disabled={currentPage === TOTAL_PAGES} type="button">
          التالية <i className="fas fa-chevron-left" />
        </button>
        <div className="footer-info">
          <span>الجزء {toArabicNumeral(getJuzNumber(currentPage))}</span>
          {' • '}
          {toArabicNumeral(currentPage)} / {toArabicNumeral(TOTAL_PAGES)}
        </div>
        <button className="nav-btn" onClick={() => updatePage(currentPage - 1)} disabled={currentPage === 1} type="button">
          <i className="fas fa-chevron-right" /> السابقة
        </button>
      </footer>

      <button className="fullscreen-toggle" onClick={() => setFullscreen(!fullscreen)} type="button" title={fullscreen ? "إنهاء ملء الشاشة" : "ملء الشاشة"}>
        <i className={`fas ${fullscreen ? "fa-compress" : "fa-expand"}`} />
      </button>
    </div>
  )
}
