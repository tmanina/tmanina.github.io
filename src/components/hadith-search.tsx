"use client"

import React, { useState, useCallback } from "react"

interface HadithResult {
  hadith: string
  rawi: string
  mohdith: string
  source: string
  ref: string
  grade: string
}

const DORAR_API = "https://tmanina-dorar-api.smitten-rust-chip.workers.dev/"

function parseDorarHtml(html: string): HadithResult[] {
  const results: HadithResult[] = []
  const blocks = html.split("--------------")
  for (const block of blocks) {
    const hadithMatch = block.match(/<div class="hadith"[^>]*>([\s\S]*?)<\/div>/)
    if (!hadithMatch) continue
    const hadith = hadithMatch[1].replace(/<[^>]*>/g, "").replace(/^\d+\s*-\s*/, "").trim()
    if (!hadith) continue
    const rawi = extractField(block, "الراوي")
    const mohdith = extractField(block, "المحدث")
    const source = extractField(block, "المصدر")
    const ref = extractField(block, "الصفحة أو الرقم")
    const grade = extractField(block, "خلاصة حكم المحدث")
    results.push({ hadith, rawi, mohdith, source, ref, grade })
  }
  return results
}

function extractField(html: string, label: string): string {
  const regex = new RegExp(`${label}:<\\/span>\\s*([\\s\\S]*?)(?:<\\/span>|<br|\\n)`)
  const match = html.match(regex)
  if (!match) return ""
  return match[1].replace(/<[^>]*>/g, "").replace(/^\s*-\s*$/, "").trim()
}

export function HadithSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<HadithResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [hasSearched, setHasSearched] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)

  const search = useCallback(async (term: string) => {
    if (!term.trim()) return
    setLoading(true)
    setError("")
    setHasSearched(true)
    setResults([])

    try {
      const res = await fetch(`${DORAR_API}?skey=${encodeURIComponent(term)}`, {
        signal: AbortSignal.timeout(20000),
      })
      if (!res.ok) throw new Error("network")

      const data = await res.json()
      const html = data?.ahadith?.result
      if (!html || typeof html !== "string") {
        setResults([])
        return
      }

      const parsed = parseDorarHtml(html)
      setResults(parsed)
    } catch {
      setError("تعذر الاتصال بالبحث. حاول مرة أخرى.")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    search(query)
  }

  return (
    <div className="hadith-search-card">
      <style jsx>{`
        .hadith-search-card {
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
        }
        .dark .hadith-search-card {
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .search-header {
          background: var(--hero-gradient);
          padding: 1rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .search-header-icon { font-size: 1.5rem; }
        .search-header-text h3 {
          margin: 0; font-size: 1rem; font-weight: 700; color: white;
        }
        .search-header-text p {
          margin: 0; font-size: 0.75rem; color: rgba(255,255,255,0.8);
        }
        .search-form {
          padding: 1rem 1.25rem;
          display: flex; gap: 0.5rem;
        }
        .search-input {
          flex: 1; padding: 0.75rem 1rem;
          border: 2px solid hsl(var(--border));
          border-radius: 50px; font-size: 0.95rem;
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          transition: border-color 0.2s;
        }
        .search-input:focus { outline: none; border-color: hsl(var(--primary)); }
        .search-input::placeholder { color: hsl(var(--muted-foreground)); }
        .search-btn {
          width: 46px; height: 46px; border-radius: 50%; border: none;
          background: var(--primary-gradient);
          color: white; font-size: 1rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: transform 0.2s, box-shadow 0.2s;
        }
        .search-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(44, 110, 124, 0.4);
        }
        .search-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .spinner {
          width: 20px; height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .error-msg {
          padding: 0.75rem 1.25rem; color: hsl(var(--destructive));
          font-size: 0.85rem; text-align: center;
        }
        .results-list {
          max-height: 60vh; overflow-y: auto;
          padding: 0 0.75rem 0.75rem;
        }
        .result-item {
          background: hsl(var(--muted));
          border: 1px solid hsl(var(--border));
          border-radius: 0.75rem; padding: 0.85rem;
          margin-bottom: 0.5rem; cursor: pointer;
          transition: border-color 0.2s;
        }
        .result-item:hover { border-color: hsl(var(--primary)); }
        .result-item.expanded { border-color: hsl(var(--primary)); background: hsl(var(--card)); }
        .result-grade {
          display: inline-block; padding: 0.15rem 0.5rem;
          border-radius: 12px; font-size: 0.7rem; font-weight: 700;
          margin-bottom: 0.4rem;
        }
        .grade-sahih { background: #dcfce7; color: #166534; }
        .dark .grade-sahih { background: rgba(34,197,94,0.15); color: #4ade80; }
        .grade-hasan { background: #fef3c7; color: #92400e; }
        .dark .grade-hasan { background: rgba(234,179,8,0.15); color: #facc15; }
        .grade-daif { background: #fee2e2; color: #991b1b; }
        .dark .grade-daif { background: rgba(239,68,68,0.15); color: #f87171; }
        .grade-other { background: hsl(var(--muted)); color: hsl(var(--muted-foreground)); }
        .result-meta {
          font-size: 0.78rem; color: hsl(var(--muted-foreground));
          margin-bottom: 0.25rem; line-height: 1.5;
        }
        .result-meta strong { color: hsl(var(--foreground)); }
        .result-hadith {
          font-family: 'Scheherazade New', 'Amiri', 'Traditional Arabic', serif;
          font-size: 1.05rem; line-height: 1.9;
          color: hsl(var(--foreground));
          direction: rtl; text-align: justify;
          margin-top: 0.5rem; padding-top: 0.5rem;
          border-top: 1px solid hsl(var(--border));
        }
        .no-results {
          text-align: center; padding: 1.5rem;
          color: hsl(var(--muted-foreground)); font-size: 0.9rem;
        }
        .powered-by {
          text-align: center; padding: 0.5rem; font-size: 0.7rem;
          color: hsl(var(--muted-foreground));
          border-top: 1px solid hsl(var(--border));
        }
        .powered-by a { color: hsl(var(--primary)); text-decoration: none; }
        @media (max-width: 640px) {
          .search-form { padding: 0.75rem 1rem; }
          .result-hadith { font-size: 0.95rem; }
        }
      `}</style>

      <div className="search-header">
        <span className="search-header-icon">🔍</span>
        <div className="search-header-text">
          <h3>البحث في الأحاديث النبوية</h3>
          <p>بحث مباشر من الموسوعة الحديثية (الدرر السنية)</p>
        </div>
      </div>

      <form className="search-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="search-input"
          placeholder="اكتب كلمة للبحث في الأحاديث..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          dir="rtl"
        />
        <button
          type="submit"
          className="search-btn"
          disabled={loading || !query.trim()}
        >
          {loading ? <span className="spinner"></span> : <i className="fas fa-search"></i>}
        </button>
      </form>

      {error && <div className="error-msg">{error}</div>}

      {hasSearched && !loading && results.length === 0 && !error && (
        <div className="no-results">لا توجد نتائج لهذا البحث</div>
      )}

      {results.length > 0 && (
        <div className="results-list">
          {results.map((item, idx) => (
            <div
              key={idx}
              className={`result-item ${expanded === idx ? "expanded" : ""}`}
              onClick={() => setExpanded(expanded === idx ? null : idx)}
            >
              <span className={`result-grade ${getGradeClass(item.grade)}`}>
                {item.grade || "غير محدد"}
              </span>
              <div className="result-meta">
                {item.mohdith && <span><strong>المحدث:</strong> {item.mohdith}</span>}
                {item.source && <span> — <strong>المصدر:</strong> {item.source}</span>}
                {item.ref && <span> ({item.ref})</span>}
              </div>
              {item.rawi && item.rawi !== "-" && (
                <div className="result-meta"><strong>الراوي:</strong> {item.rawi}</div>
              )}
              {expanded === idx && (
                <div className="result-hadith">{item.hadith}</div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="powered-by">
        البيانات من <a href="https://dorar.net" target="_blank" rel="noopener noreferrer">الدرر السنية</a>
      </div>
    </div>
  )
}

function getGradeClass(grade: string): string {
  if (!grade) return "grade-other"
  if (grade.includes("صحيح")) return "grade-sahih"
  if (grade.includes("حسن")) return "grade-hasan"
  if (grade.includes("ضعيف") || grade.includes("موضوع") || grade.includes("منكر")) return "grade-daif"
  return "grade-other"
}
