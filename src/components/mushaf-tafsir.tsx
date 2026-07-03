"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"

const QURAN_COM_API = "https://api.quran.com/api/v4"

interface Verse {
  id: number
  verse_number: number
  verse_key: string
  text_uthmani: string
  text_imlaei: string
}

interface TafsirEntry {
  id: number
  resource_id: number
  verse_key: string
  text: string
}

interface TafsirData {
  tafsirs: TafsirEntry[]
}

interface SurahInfo {
  id: number
  name_arabic: string
  name_simple: string
  verses_count: number
  revelation_place: string
  pages: number[]
}

interface ChapterData {
  chapter: SurahInfo
}

interface VersesData {
  verses: Verse[]
}

const TAFSIR_SOURCES = [
  { id: 14, name: "تفسير ابن كثير", shortName: "ابن كثير", color: "#d4a574" },
  { id: 15, name: "تفسير الطبري", shortName: "الطبري", color: "#4a5d7e" },
  { id: 91, name: "تفسير السعدي", shortName: "السعدي", color: "#7d9d7f" },
  { id: 16, name: "التفسير الميسّر", shortName: "الميسّر", color: "#8b5cf6" },
]

const surahNames: { [key: number]: string } = {
  1: "الفاتحة", 2: "البقرة", 3: "آل عمران", 4: "النساء", 5: "المائدة",
  6: "الأنعام", 7: "الأعراف", 8: "الأنفال", 9: "التوبة", 10: "يونس",
  11: "هود", 12: "يوسف", 13: "الرعد", 14: "ابراهيم", 15: "الحجر",
  16: "النحل", 17: "الإسراء", 18: "الكهف", 19: "مريم", 20: "طه",
  21: "الأنبياء", 22: "الحج", 23: "المؤمنون", 24: "النور", 25: "الفرقان",
  26: "الشعراء", 27: "النمل", 28: "القصص", 29: "العنكبوت", 30: "الروم",
  31: "لقمان", 32: "السجدة", 33: "الأحزاب", 34: "سبأ", 35: "فاطر",
  36: "يس", 37: "الصافات", 38: "ص", 39: "الزمر", 40: "غافر",
  41: "فصلت", 42: "الشورى", 43: "الزخرف", 44: "الدخان", 45: "الجاثية",
  46: "الأحقاف", 47: "محمد", 48: "الفتح", 49: "الحجرات", 50: "ق",
  51: "الذاريات", 52: "الطور", 53: "النجم", 54: "القمر", 55: "الرحمن",
  56: "الواقعة", 57: "الحديد", 58: "المجادلة", 59: "الحشر", 60: "الممتحنة",
  61: "الصف", 62: "الجمعة", 63: "المنافقون", 64: "التغابن", 65: "الطلاق",
  66: "التحريم", 67: "الملك", 68: "القلم", 69: "الحاقة", 70: "المعارج",
  71: "نوح", 72: "الجن", 73: "المزمل", 74: "المدثر", 75: "القيامة",
  76: "الإنسان", 77: "المرسلات", 78: "النبإ", 79: "النازعات", 80: "عبس",
  81: "التكوير", 82: "الإنفطار", 83: "المطففين", 84: "الإنشقاق", 85: "البروج",
  86: "الطارق", 87: "الأعلى", 88: "الغاشية", 89: "الفجر", 90: "البلد",
  91: "الشمس", 92: "الليل", 93: "الضحى", 94: "الشرح", 95: "التين",
  96: "العلق", 97: "القدر", 98: "البينة", 99: "الزلزلة", 100: "العاديات",
  101: "القارعة", 102: "التكاثر", 103: "العصر", 104: "الهمزة", 105: "الفيل",
  106: "قريش", 107: "الماعون", 108: "الكوثر", 109: "الكافرون", 110: "النصر",
  111: "المسد", 112: "الإخلاص", 113: "الفلق", 114: "الناس",
}

function getCacheKey(chapterId: number, resourceId: number): string {
  return `tafsir_v3_${chapterId}_${resourceId}`
}

function getVersesCacheKey(chapterId: number): string {
  return `verses_v1_${chapterId}`
}

function getCachedData<T>(key: string, maxAge: number): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.timestamp > maxAge) {
      localStorage.removeItem(key)
      return null
    }
    return parsed.data
  } catch {
    return null
  }
}

function setCacheData(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }))
  } catch {
    // localStorage full, ignore
  }
}

function cleanHtml(html: string): string {
  return html
    .replace(/<span class="blue">/g, '<span style="color: var(--bs-primary, #3b82f6)">')
    .replace(/<span class="reference brown">/g, '<span style="color: var(--bs-secondary-color, #6b7280)">')
    .replace(/<span class="arabic qpc-hafs">/g, '<span class="qpc-hafs">')
}

export function MushafWithTafsir({ onBack }: { onBack: () => void }) {
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null)
  const [surahInfo, setSurahInfo] = useState<SurahInfo | null>(null)
  const [verses, setVerses] = useState<Verse[]>([])
  const [selectedTafsirs, setSelectedTafsirs] = useState<number[]>([14])
  const [tafsirData, setTafsirData] = useState<{ [key: number]: TafsirEntry[] }>({})
  const [loading, setLoading] = useState(false)
  const [loadingTafsir, setLoadingTafsir] = useState<{ [key: number]: boolean }>({})
  const [expandedTafsir, setExpandedTafsir] = useState<{ [key: string]: number | null }>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [showTafsirPanel, setShowTafsirPanel] = useState(true)
  const contentRef = useRef<HTMLDivElement>(null)

  const loadSurah = useCallback(async (chapterId: number) => {
    setLoading(true)
    setSelectedSurah(chapterId)
    setVerses([])
    setTafsirData({})
    setExpandedTafsir({})

    try {
      const versesKey = getVersesCacheKey(chapterId)
      let cachedVerses = getCachedData<VersesData>(versesKey, 7 * 24 * 60 * 60 * 1000)

      if (!cachedVerses) {
        const res = await fetch(
          `${QURAN_COM_API}/verses/by_chapter/${chapterId}?language=ar&words=false&per_page=300&fields=text_uthmani,text_imlaei`
        )
        if (!res.ok) throw new Error("Failed to fetch verses")
        cachedVerses = await res.json()
        setCacheData(versesKey, cachedVerses)
      }

      if (cachedVerses) {
        setVerses(cachedVerses.verses)
      }

      const chapterRes = await fetch(`${QURAN_COM_API}/chapters/${chapterId}?language=ar`)
      if (chapterRes.ok) {
        const chapterData: ChapterData = await chapterRes.json()
        setSurahInfo(chapterData.chapter)
      }
    } catch (err) {
      console.error("Error loading surah:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTafsir = useCallback(async (chapterId: number, resourceId: number) => {
    setLoadingTafsir(prev => ({ ...prev, [resourceId]: true }))

    try {
      const cacheKey = getCacheKey(chapterId, resourceId)
      let cached = getCachedData<TafsirData>(cacheKey, 30 * 24 * 60 * 60 * 1000)

      if (!cached) {
        const res = await fetch(
          `${QURAN_COM_API}/tafsirs/${resourceId}/by_chapter/${chapterId}?language=ar&per_page=500`
        )
        if (!res.ok) throw new Error("Failed to fetch tafsir")
        cached = await res.json()
        setCacheData(cacheKey, cached)
      }

      if (cached) {
        setTafsirData(prev => ({ ...prev, [resourceId]: cached.tafsirs }))
      }
    } catch (err) {
      console.error("Error loading tafsir:", err)
    } finally {
      setLoadingTafsir(prev => ({ ...prev, [resourceId]: false }))
    }
  }, [])

  const toggleTafsirSource = useCallback((resourceId: number) => {
    setSelectedTafsirs(prev => {
      const has = prev.includes(resourceId)
      if (has) {
        return prev.filter(id => id !== resourceId)
      }
      return [...prev, resourceId]
    })
  }, [])

  useEffect(() => {
    if (!selectedSurah) return
    selectedTafsirs.forEach(id => {
      if (!tafsirData[id] && !loadingTafsir[id]) {
        loadTafsir(selectedSurah, id)
      }
    })
  }, [selectedSurah, selectedTafsirs, tafsirData, loadingTafsir, loadTafsir])

  const toggleExpand = (verseKey: string, resourceId: number) => {
    setExpandedTafsir(prev => {
      const current = prev[verseKey]
      return { ...prev, [verseKey]: current === resourceId ? null : resourceId }
    })
  }

  const filteredSurahs = Object.entries(surahNames).filter(([id, name]) => {
    if (!searchQuery) return true
    return name.includes(searchQuery) || id.includes(searchQuery)
  })

  if (selectedSurah && surahInfo) {
    return (
      <div className="mushaf-tafsir-view">
        <style jsx>{`
          /* ===== QURAN FONTS ===== */
          @import url('https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&display=swap');

          @font-face {
            font-family: 'AlQuranAlKareem';
            src: url('/fonts/AlQuranAlKareem.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
            unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF;
          }

          @font-face {
            font-family: 'KFGQPC';
            src: url('/fonts/KFGQPC-Hafs.otf') format('opentype');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
            unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF;
          }

          @font-face {
            font-family: 'KFGQPC HAFS Uthmanic Script';
            src: url('/fonts/KFGQPC-Uthmanic-Script-HAFS.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
          }

          .mushaf-tafsir-view {
            padding-bottom: 2rem;
          }
          .surah-header {
            background: linear-gradient(135deg, #1a5c3a 0%, #0d3d24 100%);
            border-radius: 1rem;
            padding: 1.5rem;
            color: white;
            margin-bottom: 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .surah-title-section h2 {
            font-size: 1.5rem;
            font-weight: 700;
            margin: 0;
            font-family: 'Scheherazade New', 'Amiri', 'Traditional Arabic', serif;
          }
          .surah-meta {
            font-size: 0.9rem;
            opacity: 0.85;
            margin-top: 0.25rem;
          }
          .back-btn {
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: background 0.2s;
          }
          .back-btn:hover {
            background: rgba(255,255,255,0.3);
          }
          .tafsir-toolbar {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: var(--bs-body-secondary, #f8f9fa);
            border-radius: 0.75rem;
            border: 1px solid var(--bs-border-color, #dee2e6);
          }
          .toolbar-label {
            font-weight: 600;
            font-size: 0.9rem;
            color: var(--bs-body-color, #212529);
            width: 100%;
            margin-bottom: 0.25rem;
          }
          .tafsir-toggle {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.4rem 0.8rem;
            border-radius: 20px;
            border: 2px solid var(--bs-border-color, #dee2e6);
            background: var(--bs-body-bg, #fff);
            color: var(--bs-body-color, #212529);
            cursor: pointer;
            font-size: 0.8rem;
            font-weight: 600;
            transition: all 0.2s;
          }
          .tafsir-toggle.active {
            border-color: var(--tafsir-color, #3b82f6);
            background: var(--tafsir-bg, rgba(59,130,246,0.1));
            color: var(--tafsir-color, #3b82f6);
          }
          .tafsir-toggle .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--tafsir-color, #3b82f6);
          }
          .verse-card {
            background: var(--bs-body-bg, #fff);
            border: 1px solid var(--bs-border-color, #dee2e6);
            border-radius: 1rem;
            padding: 1.5rem;
            margin-bottom: 1.25rem;
            transition: border-color 0.2s;
          }
          .verse-card:has(.tafsir-open) {
            border-color: #1a5c3a;
          }
          .verse-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
          }
          .verse-number-badge {
            background: linear-gradient(135deg, #1a5c3a, #2d8659);
            color: white;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.85rem;
            flex-shrink: 0;
          }
          .verse-key {
            font-size: 0.8rem;
            color: var(--bs-secondary-color, #6b7280);
            font-weight: 500;
          }
          .verse-text {
            font-family: 'Scheherazade New', 'Amiri', 'Traditional Arabic', 'KFGQPC', 'AlQuranAlKareem', serif;
            font-size: clamp(1.4rem, 3.5vw, 1.9rem);
            line-height: 2.4;
            text-align: justify;
            text-align-last: center;
            direction: rtl;
            color: var(--bs-body-color, #212529);
            padding: 0.75rem 0;
            font-weight: 700;
            font-feature-settings: "liga" 1, "calt" 1, "kern" 1;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          .tafsir-section {
            margin-top: 0.75rem;
            border-top: 1px solid var(--bs-border-color, #dee2e6);
            padding-top: 0.75rem;
          }
          .tafsir-source-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.3rem;
            padding: 0.3rem 0.6rem;
            border-radius: 15px;
            border: 1px solid var(--bs-border-color, #dee2e6);
            background: var(--bs-body-bg, #fff);
            color: var(--bs-body-color, #212529);
            cursor: pointer;
            font-size: 0.75rem;
            font-weight: 500;
            transition: all 0.2s;
            margin-left: 0.3rem;
            margin-bottom: 0.3rem;
          }
          .tafsir-source-btn.active {
            border-color: var(--source-color, #3b82f6);
            background: var(--source-bg, rgba(59,130,246,0.1));
            color: var(--source-color, #3b82f6);
          }
          .tafsir-source-btn .source-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--source-color, #3b82f6);
          }
          .tafsir-content {
            margin-top: 0.75rem;
            padding: 1rem;
            border-radius: 0.5rem;
            font-family: 'Scheherazade New', 'Traditional Arabic', 'Amiri', serif;
            font-size: 1.15rem;
            line-height: 2;
            color: var(--bs-body-color, #212529);
            direction: rtl;
            text-align: justify;
          }
          .tafsir-loading {
            text-align: center;
            padding: 1rem;
            color: var(--bs-secondary-color, #6b7280);
          }
          .tafsir-loading .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid var(--bs-border-color, #dee2e6);
            border-top-color: #1a5c3a;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-left: 0.5rem;
            vertical-align: middle;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .loading-container {
            text-align: center;
            padding: 3rem;
            color: var(--bs-secondary-color, #6b7280);
          }
          .loading-container .big-spinner {
            display: inline-block;
            width: 40px;
            height: 40px;
            border: 3px solid var(--bs-border-color, #dee2e6);
            border-top-color: #1a5c3a;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-bottom: 1rem;
          }
          .show-tafsir-toggle {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
          }
          .show-tafsir-toggle label {
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--bs-body-color, #212529);
            cursor: pointer;
          }
          .switch {
            position: relative;
            display: inline-block;
            width: 44px;
            height: 24px;
          }
          .switch input { opacity: 0; width: 0; height: 0; }
          .slider {
            position: absolute;
            cursor: pointer;
            top: 0; left: 0; right: 0; bottom: 0;
            background-color: var(--bs-border-color, #ccc);
            transition: 0.3s;
            border-radius: 24px;
          }
          .slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: 0.3s;
            border-radius: 50%;
          }
          .switch input:checked + .slider { background-color: #1a5c3a; }
          .switch input:checked + .slider:before { transform: translateX(20px); }
          @media (max-width: 768px) {
            .surah-header {
              padding: 1rem;
            }
            .surah-title-section h2 {
              font-size: 1.2rem;
            }
            .verse-text {
              font-size: clamp(1.2rem, 5.5vw, 1.6rem);
              line-height: 2.2;
            }
            .verse-card {
              padding: 1rem;
            }
          }
        `}</style>

        <div className="surah-header">
          <div className="surah-title-section">
            <h2>سورة {surahInfo.name_arabic}</h2>
            <div className="surah-meta">
              {surahInfo.revelation_place === "makkah" ? "مكية" : "مدنية"} — {surahInfo.verses_count} آية — الصفحة {surahInfo.pages[0]}
            </div>
          </div>
          <button className="back-btn" onClick={() => {
            setSelectedSurah(null)
            setSurahInfo(null)
            setVerses([])
            setTafsirData({})
          }}>
            <i className="fas fa-arrow-right me-1"></i> العودة
          </button>
        </div>

        <div className="tafsir-toolbar">
          <div className="toolbar-label">
            <i className="fas fa-book-open me-1"></i> مصادر التفسير
          </div>
          {TAFSIR_SOURCES.map(src => (
            <button
              key={src.id}
              className={`tafsir-toggle ${selectedTafsirs.includes(src.id) ? "active" : ""}`}
              style={{ "--tafsir-color": src.color, "--tafsir-bg": `${src.color}15` } as React.CSSProperties}
              onClick={() => toggleTafsirSource(src.id)}
            >
              <span className="dot"></span>
              {src.shortName}
              {loadingTafsir[src.id] && <span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }}></span>}
            </button>
          ))}
        </div>

        <div className="show-tafsir-toggle">
          <label className="switch">
            <input
              type="checkbox"
              checked={showTafsirPanel}
              onChange={(e) => setShowTafsirPanel(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
          <label onClick={() => setShowTafsirPanel(!showTafsirPanel)}>
            إظهار التفسير أسفل كل آية
          </label>
        </div>

        <div ref={contentRef}>
          {loading ? (
            <div className="loading-container">
              <div className="big-spinner"></div>
              <div>جاري تحميل السورة...</div>
            </div>
          ) : (
            verses.map(verse => (
              <div key={verse.verse_key} className="verse-card">
                <div className="verse-header">
                  <span className="verse-number-badge">{verse.verse_number}</span>
                  <span className="verse-key">سورة {surahInfo.name_arabic} — الآية {verse.verse_number}</span>
                </div>
                <div className="verse-text">{verse.text_imlaei || verse.text_uthmani}</div>

                {showTafsirPanel && selectedTafsirs.length > 0 && (
                  <div className="tafsir-section">
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "0.5rem" }}>
                      {TAFSIR_SOURCES.filter(s => selectedTafsirs.includes(s.id)).map(src => (
                        <button
                          key={src.id}
                          className={`tafsir-source-btn ${expandedTafsir[verse.verse_key] === src.id ? "active" : ""}`}
                          style={{ "--source-color": src.color, "--source-bg": `${src.color}15` } as React.CSSProperties}
                          onClick={() => toggleExpand(verse.verse_key, src.id)}
                        >
                          <span className="source-dot"></span>
                          {src.shortName}
                        </button>
                      ))}
                    </div>

                    {expandedTafsir[verse.verse_key] && (
                      <div className="tafsir-content">
                        {loadingTafsir[expandedTafsir[verse.verse_key]!] ? (
                          <div className="tafsir-loading">
                            <span className="spinner"></span>
                            جاري تحميل التفسير...
                          </div>
                        ) : (
                          (() => {
                            const rId = expandedTafsir[verse.verse_key]!
                            const entries = tafsirData[rId]
                            if (!entries) return <div className="tafsir-loading">لم يتم تحميل هذا التفسير بعد</div>
                            const entry = entries.find(e => e.verse_key === verse.verse_key)
                            if (!entry) return <div className="tafsir-loading">لا يوجد تفسير لهذه الآية</div>
                            return (
                              <div dangerouslySetInnerHTML={{ __html: cleanHtml(entry.text) }} />
                            )
                          })()
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mushaf-tafsir-view">
      <style jsx>{`
        .mushaf-tafsir-view {
          padding-bottom: 2rem;
        }
        .section-header {
          background: linear-gradient(135deg, #1a5c3a 0%, #0d3d24 100%);
          border-radius: 1rem;
          padding: 1.5rem;
          color: white;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        .section-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 0.25rem 0;
        }
        .section-header p {
          margin: 0;
          opacity: 0.85;
          font-size: 0.9rem;
        }
        .search-box {
          margin-bottom: 1.5rem;
        }
        .search-input {
          width: 100%;
          padding: 0.85rem 1.25rem 0.85rem 2.5rem;
          border-radius: 50px;
          border: 2px solid var(--bs-border-color, #dee2e6);
          background: var(--bs-body-bg, #fff);
          color: var(--bs-body-color, #212529);
          font-size: 1rem;
          transition: border-color 0.2s;
        }
        .search-input:focus {
          outline: none;
          border-color: #1a5c3a;
        }
        .search-wrapper {
          position: relative;
        }
        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--bs-secondary-color, #6b7280);
        }
        .surahs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 0.75rem;
        }
        .surah-card {
          background: var(--bs-body-bg, #fff);
          border: 2px solid var(--bs-border-color, #dee2e6);
          border-radius: 0.75rem;
          padding: 1rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .surah-card:hover {
          border-color: #1a5c3a;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(26, 92, 58, 0.15);
        }
        .surah-number {
          background: linear-gradient(135deg, #1a5c3a, #2d8659);
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 0.5rem;
          font-weight: 700;
          font-size: 0.8rem;
        }
        .surah-name-ar {
          font-family: 'Traditional Arabic', 'Amiri', serif;
          font-size: 1rem;
          font-weight: 700;
          color: var(--bs-body-color, #212529);
          margin-bottom: 0.15rem;
        }
        .surah-meta-info {
          font-size: 0.75rem;
          color: var(--bs-secondary-color, #6b7280);
        }
        @media (max-width: 768px) {
          .surahs-grid {
            grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
            gap: 0.5rem;
          }
          .surah-card {
            padding: 0.75rem;
          }
        }
      `}</style>

      <div className="section-header">
        <h2>
          <i className="fas fa-book-open me-2"></i>
          مصحف مع التفسير
        </h2>
        <p>القرآن الكريم مع تفسير ابن كثير، الطبري، السعدي، والتفسير الميسّر</p>
      </div>

      <div className="search-box">
        <div className="search-wrapper">
          <i className="fas fa-search search-icon"></i>
          <input
            type="text"
            className="search-input"
            placeholder="ابحث عن سورة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="surahs-grid">
        {filteredSurahs.map(([id, name]) => (
          <div
            key={id}
            className="surah-card"
            onClick={() => loadSurah(parseInt(id))}
          >
            <div className="surah-number">{id}</div>
            <div className="surah-name-ar">{name}</div>
            <div className="surah-meta-info">
              {parseInt(id) <= 114 ? `${[
                7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,
                128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,
                34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,
                35,38,28,28,20,56,40,53,42,28,19,15,26,19,18,
                11,11,18,12,12,12,11,11,8,19,5,8,8,11,11,
                12,12,9,7,13,15,11,12,11,11,12,11,11,9,14,
                9,10,5,8,5,4,5,6,3,5,4,5,3,6,3,
              ][parseInt(id)-1] || ''} آية` : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
