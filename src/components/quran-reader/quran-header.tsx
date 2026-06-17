"use client"

import * as React from "react"
import { surahNames, surahPages, toArabicNumeral, getJuzNumber } from "./utils"

interface QuranHeaderProps {
  currentPage: number
  totalPages: number
  verses: { verse_key: string }[]
  bookmarks: number[]
  nightMode: boolean
  onBack: () => void
  onToggleBookmark: (page: number) => void
  onUpdatePage: (page: number) => void
  onToggleNightMode: () => void
}

/**
 * QuranReader header with navigation, settings menu, surah list, and bookmarks panel.
 */
export function QuranHeader({
  currentPage,
  totalPages,
  verses,
  bookmarks,
  nightMode,
  onBack,
  onToggleBookmark,
  onUpdatePage,
  onToggleNightMode,
}: QuranHeaderProps) {
  const [showMenu, setShowMenu] = React.useState(false)
  const [showSurahList, setShowSurahList] = React.useState(false)
  const [showBookmarks, setShowBookmarks] = React.useState(false)
  const [jumpPage, setJumpPage] = React.useState("")
  const menuRef = React.useRef<HTMLDivElement>(null)

  const isPageBookmarked = bookmarks.includes(currentPage)

  const surahInfo =
    verses.length > 0
      ? {
          number: parseInt(verses[0].verse_key.split(":")[0]),
          name: surahNames[parseInt(verses[0].verse_key.split(":")[0])] || `سورة ${toArabicNumeral(parseInt(verses[0].verse_key.split(":")[0]))}`,
        }
      : null

  const handleJumpToPage = () => {
    const page = parseInt(jumpPage)
    if (page >= 1 && page <= totalPages) {
      onUpdatePage(page)
      setJumpPage("")
      setShowMenu(false)
    }
  }

  const handleSurahSelect = (surahNum: number) => {
    const pageNum = surahPages[surahNum]
    if (pageNum) onUpdatePage(pageNum)
    setShowSurahList(false)
    setShowMenu(false)
  }

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
        setShowSurahList(false)
        setShowBookmarks(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="mushaf-header" ref={menuRef}>
      <button className="header-btn" onClick={onBack} type="button" title="رجوع">
        <i className="fas fa-arrow-right"></i>
      </button>

      <div className="header-center">
        <span
          className="surah-name"
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
            setShowSurahList(false)
            setShowBookmarks(false)
          }}
        >
          {surahInfo ? surahInfo.name : "القرآن الكريم"}
        </span>
        <span className="page-info">
          الجزء {toArabicNumeral(getJuzNumber(currentPage))} • صفحة {toArabicNumeral(currentPage)}
        </span>
      </div>

      <div className="header-actions">
        <button
          className={`header-btn ${isPageBookmarked ? "active" : ""}`}
          onClick={() => onToggleBookmark(currentPage)}
          type="button"
          title={isPageBookmarked ? "إزالة العلامة" : "إضافة علامة"}
        >
          <i className="fas fa-bookmark" style={{ color: isPageBookmarked ? "#ffd700" : undefined }}></i>
        </button>
        <button
          className={`header-btn ${showBookmarks ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation()
            setShowBookmarks(!showBookmarks)
            setShowMenu(false)
            setShowSurahList(false)
          }}
          type="button"
          title="العلامات المرجعية"
        >
          <i className="fas fa-list"></i>
        </button>
        <button
          className={`header-btn ${nightMode ? "active" : ""}`}
          onClick={onToggleNightMode}
          type="button"
          title="الوضع الليلي"
        >
          <i className={`fas ${nightMode ? "fa-sun" : "fa-moon"}`}></i>
        </button>
        <button
          className={`header-btn ${showMenu ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
            setShowSurahList(false)
            setShowBookmarks(false)
          }}
          type="button"
          title="الإعدادات"
        >
          <i className="fas fa-cog"></i>
        </button>
      </div>

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
                onKeyDown={(e) => e.key === "Enter" && handleJumpToPage()}
                min="1"
                max="604"
              />
              <button className="go-btn" onClick={handleJumpToPage} type="button">انتقال</button>
            </div>
          </div>
          <div className="menu-section">
            <button
              className="surah-list-btn"
              onClick={(e) => { e.stopPropagation(); setShowSurahList(true) }}
              type="button"
            >
              <span>اختر سورة</span>
              <i className="fas fa-chevron-left"></i>
            </button>
          </div>
        </div>
      )}

      {showSurahList && (
        <div className="surah-list" onClick={(e) => e.stopPropagation()}>
          <div className="surah-list-header">
            <button className="back-btn" onClick={(e) => { e.stopPropagation(); setShowSurahList(false) }} type="button">
              <i className="fas fa-arrow-right"></i>
              <span>رجوع</span>
            </button>
          </div>
          {Object.entries(surahNames).map(([num, name]) => (
            <div key={num} className="surah-item" onClick={() => handleSurahSelect(parseInt(num))}>
              <span>{name}</span>
              <span className="surah-num">{num}</span>
            </div>
          ))}
        </div>
      )}

      {showBookmarks && (
        <div className="bookmarks-panel" onClick={(e) => e.stopPropagation()}>
          <div className="bookmarks-header">
            <h3 className="bookmarks-title">العلامات المرجعية</h3>
            <button className="back-btn" onClick={(e) => { e.stopPropagation(); setShowBookmarks(false) }} type="button">
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="bookmarks-list">
            {bookmarks.length === 0 ? (
              <div className="empty-bookmarks">
                لا توجد علامات مرجعية<br />
                اضغط على أيقونة العلامة لإضافة صفحة
              </div>
            ) : (
              bookmarks.map((page) => (
                <div key={page} className="bookmark-item" onClick={() => { onUpdatePage(page); setShowBookmarks(false) }}>
                  <span>صفحة <span className="bookmark-page">{toArabicNumeral(page)}</span></span>
                  <button className="bookmark-delete" onClick={(e) => { e.stopPropagation(); onToggleBookmark(page) }} type="button" title="حذف">
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </header>
  )
}
