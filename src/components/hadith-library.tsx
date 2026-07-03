"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  type HadithCollection,
  type HadithBook,
  type HadithItem,
  type SharhEntry,
  type ReviewedSharhEntry,
  type ReviewedSharhFile,
  type DorarApiResponse,
  type DorarSearchResult,
  COLORS,
  COL_DESC,
  COL_INTRO_AR,
  FAV_KEY,
  LIMIT,
  DORAR_SEARCH_BASE_URL,
  DORAR_PROXY_URL,
  colorOf,
  getFavs,
  toggleFav,
  hKey,
  normalizeArabic,
  normalizeGrade,
  gradeBadgeCls,
  gradeAr,
  arBookName,
  isPlaceholderEntry,
  isApiHadithTextEntry,
  isTrustedReviewedSharhEntry,
  extractDorarHtmlResults,
  resolveSharhEntry,
} from "./hadith/hadith-utils"

interface HadithLibraryProps {
  onBack: () => void
}

function sanitizeDorarHtml(html: string): string {
  if (typeof window === "undefined") return ""

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html")
  const allowedTags = new Set([
    "DIV", "SPAN", "P", "BR", "B", "STRONG", "I", "EM", "U", "SMALL", "UL", "OL", "LI", "A",
  ])

  doc.body.querySelectorAll("*").forEach((element) => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes))
      return
    }

    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase()
      const value = attribute.value
      const isSafeLink =
        element.tagName === "A" &&
        name === "href" &&
        /^https:\/\/(?:www\.)?dorar\.net\//.test(value)
      const isSafeClass = name === "class" && /^[\w\s:-]+$/.test(value)

      if (isSafeLink) {
        element.setAttribute("target", "_blank")
        element.setAttribute("rel", "noopener noreferrer")
        return
      }

      if (!isSafeClass) {
        element.removeAttribute(attribute.name)
      }
    })
  })

  return doc.body.firstElementChild?.innerHTML || ""
}

function searchDorarByJsonp(query: string): Promise<DorarApiResponse> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Dorar search is browser-only"))
      return
    }

    const callbackName = `tmaninaDorarCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const script = document.createElement("script")
    const cleanup = () => {
      delete (window as typeof window & Record<string, unknown>)[callbackName]
      script.remove()
    }
    const timeout = window.setTimeout(() => {
      cleanup()
      reject(new Error("Dorar search timed out"))
    }, 12000)

    ;(window as typeof window & Record<string, (data: DorarApiResponse) => void>)[callbackName] = (data) => {
      window.clearTimeout(timeout)
      cleanup()
      resolve(data)
    }

    script.src = `https://dorar.net/dorar_api.json?skey=${encodeURIComponent(query)}&callback=${encodeURIComponent(callbackName)}`
    script.async = true
    script.onerror = () => {
      window.clearTimeout(timeout)
      cleanup()
      reject(new Error("Dorar search failed"))
    }

    document.head.appendChild(script)
  })
}

async function searchDorarByProxy(query: string): Promise<DorarApiResponse> {
  const response = await fetch(`${DORAR_PROXY_URL}?skey=${encodeURIComponent(query)}`, {
    headers: { accept: "application/json" },
  })

  if (!response.ok) {
    throw new Error("Dorar proxy search failed")
  }

  return response.json() as Promise<DorarApiResponse>
}

async function searchDorar(query: string): Promise<DorarApiResponse> {
  try {
    return await searchDorarByProxy(query)
  } catch {
    return searchDorarByJsonp(query)
  }
}

export function DorarHadithSearch() {
  const [query, setQuery] = React.useState("")
  const [searchedQuery, setSearchedQuery] = React.useState("")
  const [results, setResults] = React.useState<DorarSearchResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  const directSearchUrl = searchedQuery
    ? `${DORAR_SEARCH_BASE_URL}${encodeURIComponent(searchedQuery)}`
    : "https://dorar.net/hadith"

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setError("اكتب كلمتين أو جزءًا واضحًا من الحديث للبحث.")
      setResults([])
      setSearchedQuery(trimmed)
      return
    }

    setLoading(true)
    setError("")
    setResults([])
    setSearchedQuery(trimmed)

    try {
      const data = await searchDorar(trimmed)
      const safeResults = extractDorarHtmlResults(data)
        .map((html, index) => ({
          id: `${Date.now()}-${index}`,
          html: sanitizeDorarHtml(html),
        }))
        .filter((item) => item.html.trim().length > 0)

      setResults(safeResults)
      if (safeResults.length === 0) {
        setError("لم تظهر نتائج من الدرر السنية لهذا البحث.")
      }
    } catch {
      setError("تعذر جلب النتائج داخل التطبيق الآن. افتح النتائج مباشرة في موقع الدرر من الزر التالي.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="bg-gradient-to-br from-amber-600 via-orange-600 to-emerald-700 p-5 text-white">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="mb-1 text-xl font-extrabold">بحث الدرر السنية</h2>
            <p className="mb-0 text-sm leading-7 text-white/85">
              ابحث في الموسوعة الحديثية من الدرر السنية. إذا منع المصدر العرض داخل التطبيق، افتح النتائج مباشرة.
            </p>
          </div>
          <a
            href="https://dorar.net/article/389/%D8%AE%D8%AF%D9%85%D8%A9-%D9%88%D8%A7%D8%AC%D9%87%D8%A9-%D8%A7%D9%84%D9%85%D9%88%D8%B3%D9%88%D8%B9%D8%A9-%D8%A7%D9%84%D8%AD%D8%AF%D9%8A%D8%AB%D9%8A%D8%A9-API"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/25"
          >
            <i className="fas fa-link ms-2" />
            توثيق API
          </a>
        </div>
      </div>

      <div className="p-4">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">بحث في الدرر السنية</span>
            <i className="fas fa-search absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-12 w-full rounded-xl border border-input bg-background px-4 pe-4 ps-11 text-sm text-foreground outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              placeholder="مثال: إنما الأعمال بالنيات"
            />
          </label>
          <Button type="submit" className="h-12 rounded-xl px-6" disabled={loading}>
            {loading ? (
              <>
                <span className="ms-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                محاولة العرض
              </>
            ) : (
              <>
                <i className="fas fa-magnifying-glass ms-2" />
                عرض داخل التطبيق
              </>
            )}
          </Button>
          <a
            href={query.trim() ? `${DORAR_SEARCH_BASE_URL}${encodeURIComponent(query.trim())}` : "https://dorar.net/hadith"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-bold text-foreground transition hover:bg-muted"
          >
            <i className="fas fa-arrow-up-right-from-square ms-2" />
            فتح في الدرر
          </a>
        </form>

        <p className="mt-3 mb-0 text-xs leading-6 text-muted-foreground">
          المصدر: مؤسسة الدرر السنية. يتم عرض النتائج عبر وسيط Cloudflare Worker مخصص للتطبيق، وزر “فتح في الدرر” يبقى المسار الموثوق دائمًا عند تعذر الجلب.
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm leading-7 text-amber-700 dark:text-amber-300">
            {error}
            {searchedQuery && (
              <a
                href={directSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ms-2 inline-flex font-bold underline"
              >
                فتح البحث في الدرر
              </a>
            )}
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-card-foreground">
                {results.length} نتيجة من الدرر السنية
              </span>
              <a
                href={directSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-amber-700 underline dark:text-amber-300"
              >
                عرض في المصدر
              </a>
            </div>
            {results.map((result, index) => (
              <article
                key={result.id}
                className="rounded-xl border border-border bg-background p-4 text-sm leading-8 text-foreground"
              >
                <div className="mb-2 inline-flex rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                  نتيجة {index + 1}
                </div>
                <div
                  className="dorar-result-content"
                  dangerouslySetInnerHTML={{ __html: result.html }}
                />
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export function HadithLibrary({ onBack }: HadithLibraryProps) {
  const [screen, setScreen] = React.useState<"collections" | "books" | "hadiths">("collections")

  const [collections, setCollections] = React.useState<HadithCollection[]>([])
  const [colLoading, setColLoading] = React.useState(false)
  const [colError, setColError] = React.useState(false)

  const [selCol, setSelCol] = React.useState<HadithCollection | null>(null)
  const [books, setBooks] = React.useState<HadithBook[]>([])
  const [booksLoading, setBooksLoading] = React.useState(false)
  const [booksError, setBooksError] = React.useState(false)

  const [selBook, setSelBook] = React.useState<HadithBook | null>(null)
  const [hadiths, setHadiths] = React.useState<HadithItem[]>([])
  const [totalInBook, setTotalInBook] = React.useState(0)
  const [offset, setOffset] = React.useState(0)
  const [hLoading, setHLoading] = React.useState(false)
  const [hError, setHError] = React.useState(false)
  const [loadingMore, setLoadingMore] = React.useState(false)

  const [search, setSearch] = React.useState("")
  const [favs, setFavs] = React.useState<Set<string>>(new Set())
  const [showFavs, setShowFavs] = React.useState(false)
  const [copied, setCopied] = React.useState<string | null>(null)
  const [perPage, setPerPage] = React.useState(10)
  const [page, setPage] = React.useState(1)
  const [sharhData, setSharhData] = React.useState<Record<string, SharhEntry>>({})
  const [riyadSharhData, setRiyadSharhData] = React.useState<Record<string, ReviewedSharhEntry>>({})
  const [sharhPool, setSharhPool] = React.useState<string[]>([])
  const [sharhExpanded, setSharhExpanded] = React.useState<Set<string>>(new Set())
  const [showOnlyWithSharh, setShowOnlyWithSharh] = React.useState(false)

  React.useEffect(() => {
    setColLoading(true)
    fetch("https://api.islamic.app/v1/hadith/collections")
      .then((r) => r.json())
      .then((d) => {
        const list: HadithCollection[] = d?.data || []
        setCollections(list.filter((c) => c.totalAvailable > 0 && c.hasBooks))
        setColLoading(false)
      })
      .catch(() => { setColError(true); setColLoading(false) })
  }, [])

  React.useEffect(() => { setFavs(getFavs()) }, [])

  React.useEffect(() => {
    fetch("/data/sharh.json")
      .then((r) => r.json())
      .then((d) => setSharhData(d || {}))
      .catch(() => {})
  }, [])

  React.useEffect(() => {
    fetch("/data/riyad-uthaymeen-shamela-final.json")
      .then((r) => r.json())
      .then((d: ReviewedSharhFile) => {
        setRiyadSharhData(d?.entries || {})
        setSharhPool(d?.sharhPool || [])
      })
      .catch(() => {})
  }, [])

  const loadBooks = React.useCallback((slug: string) => {
    setBooksLoading(true)
    setBooksError(false)
    fetch(`https://api.islamic.app/v1/hadith/collections/${slug}/books`)
      .then((r) => r.json())
      .then((d) => { setBooks(d?.data || []); setBooksLoading(false) })
      .catch(() => { setBooksError(true); setBooksLoading(false) })
  }, [])

  const loadHadiths = React.useCallback(async (slug: string, bookNum: string, off: number, append = false) => {
    if (append) setLoadingMore(true)
    else setHLoading(true)
    setHError(false)

    try {
      const r = await fetch(
        `https://api.islamic.app/v1/hadith/collections/${slug}/books/${bookNum}/hadiths?limit=${LIMIT}&offset=${off}`
      )
      const d = await r.json()
      const data = d?.data
      if (!data) throw new Error()
      const items: HadithItem[] = data.hadiths || []
      setHadiths((prev) => (append ? [...prev, ...items] : items))
      setTotalInBook(data.total)
      setOffset(off + items.length)
    } catch {
      if (slug === "bukhari") {
        try {
          const r2 = await fetch("/data/bukhari.json")
          const d2 = await r2.json()
          const local: { hadith_number: number; page: number; text: string }[] = d2?.hadiths || []
          const converted: HadithItem[] = local.map((h) => ({
            collection: "bukhari", bookNumber: bookNum, hadithNumber: String(h.hadith_number),
            chapterTitle: { en: null, ar: null },
            ar: { text: h.text, grades: [] },
            en: { text: "", grades: [] },
          }))
          setHadiths((prev) => (append ? [...prev, ...converted] : converted))
          setTotalInBook(converted.length)
          setOffset(converted.length)
          setHError(false)
        } catch { setHError(true) }
      } else {
        setHError(true)
      }
    }

    if (append) setLoadingMore(false)
    else setHLoading(false)
  }, [])

  React.useEffect(() => {
    if (!selBook) return
    setPage(1); setSearch(""); setShowFavs(false)
    loadHadiths(selBook.collection, selBook.bookNumber, 0, false)
  }, [selBook, loadHadiths])

  const toggleSharh = (key: string) => {
    setSharhExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Wrapper that captures current state for resolveSharhEntry
  const getSharhEntry = React.useCallback(
    (h: HadithItem): SharhEntry | ReviewedSharhEntry | null => {
      return resolveSharhEntry(h, riyadSharhData, sharhData, sharhPool)
    },
    [riyadSharhData, sharhData, sharhPool]
  )

  const filtered = React.useMemo(() => {
    let items = hadiths
    if (search.trim()) {
      const q = normalizeArabic(search.trim().toLowerCase())
      items = items.filter(
        (h) =>
          h.hadithNumber.includes(q) ||
          normalizeArabic((h.ar?.text || "")).includes(q) ||
          (h.en?.text || "").toLowerCase().includes(q)
      )
    }
    if (showFavs) items = items.filter((h) => favs.has(hKey(h)))
    if (showOnlyWithSharh) items = items.filter((h) => getSharhEntry(h) !== null)
    return items
  }, [hadiths, search, favs, showFavs, showOnlyWithSharh, getSharhEntry])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)
  const hasMore = offset < totalInBook

  const handleCopy = async (key: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 2000) }
    catch { /* */ }
  }

  const handleFav = (h: HadithItem) => { const n = toggleFav(hKey(h)); setFavs(new Set(n)) }

  const pickCollection = (c: HadithCollection) => {
    setSelCol(c); setBooks([]); loadBooks(c.slug); setScreen("books")
  }

  const pickBook = (b: HadithBook) => { setSelBook(b); setScreen("hadiths") }

  const backToCols = () => { setSelCol(null); setScreen("collections") }

  const backToBooks = () => {
    setSelBook(null); setSearch(""); setPage(1); setShowFavs(false); setScreen("books")
  }

  // --- Collections screen ---
  if (screen === "collections") {
    return (
      <div className="animate__animated animate__fadeIn">
        <Button onClick={onBack} variant="outline" className="rounded-full mb-4">
          <i className="fas fa-arrow-right ms-2" /> رجوع للمكتبة
        </Button>
        <div className="text-center mb-6">
          <div className="rounded-2xl p-8 text-white mb-6" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
            <i className="fas fa-book-open text-5xl mb-3 opacity-75 block" />
            <h1 className="text-2xl font-bold">الموسوعة الحديثية</h1>
            <p className="opacity-90">كتب الحديث النبوي الشريف</p>
          </div>
        </div>
        {/* <DorarHadithSearch /> */}
        {colLoading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">جاري تحميل قائمة الكتب...</p>
          </div>
        ) : colError ? (
          <div className="text-center py-12 text-muted-foreground">
            <i className="fas fa-exclamation-triangle text-4xl mb-3 block" />
            <p>تعذر تحميل قائمة الكتب</p>
            <p className="text-sm">يرجى المحاولة لاحقاً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {collections.map((col) => {
              const c = colorOf(col.slug)
              return (
                <div
                  key={col.slug}
                  className="rounded-2xl overflow-hidden shadow-md bg-card border border-border cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                  onClick={() => pickCollection(col)}
                >
                  <div className="p-6 text-white text-center" style={{ background: c.gradient }}>
                    <div className="rounded-full flex items-center justify-center mx-auto mb-3" style={{ width: "72px", height: "72px", backgroundColor: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
                      <i className="fas fa-book text-2xl" />
                    </div>
                    <h3 className="text-xl font-bold mb-1">{col.name.ar}</h3>
                    <p className="text-sm opacity-90">{COL_DESC[col.slug] || col.name.ar}</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      <i className="fas fa-list ms-1" />{col.totalAvailable.toLocaleString()} حديث
                    </p>
                    <button
                      className="px-5 py-2 rounded-full border font-semibold text-sm transition-all shadow-sm hover:shadow-md"
                      style={{ background: "hsl(var(--background))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}
                      type="button"
                    >
                      <i className="fas fa-book-open ms-2" />تصفح الأحاديث
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // --- Books screen ---
  if (screen === "books") {
    const c = selCol ? colorOf(selCol.slug) : colorOf("bukhari")
    return (
      <div className="animate__animated animate__fadeIn">
        <Button onClick={backToCols} variant="outline" className="rounded-full mb-4">
          <i className="fas fa-arrow-right ms-2" /> رجوع للمجموعات
        </Button>
        {selCol && (
          <div className="rounded-2xl p-6 text-white mb-6 text-center" style={{ background: c.gradient }}>
            <h2 className="text-xl font-bold mb-1">{selCol.name.ar}</h2>
            <p className="opacity-90 text-sm">{COL_DESC[selCol.slug] || selCol.name.ar}</p>
            <p className="opacity-80 text-xs mt-1">{selCol.totalAvailable.toLocaleString()} حديث</p>
            {COL_INTRO_AR[selCol.slug] && (
              <p className="opacity-70 text-xs mt-2 leading-relaxed max-w-xl mx-auto">{COL_INTRO_AR[selCol.slug]}</p>
            )}
          </div>
        )}
        {booksLoading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">جاري تحميل الكتب...</p>
          </div>
        ) : booksError ? (
          <div className="text-center py-12 text-muted-foreground">
            <i className="fas fa-exclamation-triangle text-4xl mb-3 block" />
            <p>تعذر تحميل قائمة الكتب</p>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <i className="fas fa-book text-4xl mb-3 block" />
            <p>لا توجد كتب متاحة في هذه المجموعة</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {books.map((b) => {
              const bc = colorOf(b.collection)
              return (
                <div
                  key={b.bookNumber}
                  className="rounded-2xl overflow-hidden shadow-sm bg-card border border-border cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  onClick={() => pickBook(b)}
                >
                  <div className="p-4 text-white text-center" style={{ background: bc.gradient }}>
                    <h4 className="font-bold text-lg mb-0.5">{arBookName(b)}</h4>
                  </div>
                  <div className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      {b.hadithCount} حديث
                      {b.hadithStartNumber > 0 && (
                        <span> (رقم {b.hadithStartNumber} – {b.hadithEndNumber})</span>
                      )}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // --- Hadiths screen ---
  const col = selCol!
  const c = colorOf(col.slug)

  return (
    <div className="animate__animated animate__fadeIn">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button onClick={backToBooks} variant="outline" className="rounded-full">
          <i className="fas fa-arrow-right ms-2" /> رجوع للكتب
        </Button>
        <Button onClick={backToCols} variant="ghost" size="sm" className="rounded-full">
          <i className="fas fa-layer-group ms-1" />{col.name.ar}
        </Button>
      </div>

      <div className="rounded-2xl p-6 text-white mb-6 text-center" style={{ background: c.gradient }}>
        <span className="text-sm opacity-80">{col.name.ar} / {selBook ? arBookName(selBook) : ""}</span>
        <h2 className="text-xl font-bold mt-1">
          {selBook ? arBookName(selBook) : ""}
          <br />
          <span className="text-sm font-normal opacity-80">
            {hadiths.length > 0 ? `${hadiths.length} حديث متاح` : "تحميل الأحاديث..."}
          </span>
        </h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <i className="fas fa-search absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            className="w-full h-10 rounded-xl border border-input bg-background pe-10 ps-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="ابحث برقم الحديث أو النص..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Button
          variant={showFavs ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => { setShowFavs(!showFavs); setPage(1) }}
        >
          <i className={`fas fa-heart ms-1 ${showFavs ? "" : "text-muted-foreground"}`} />
          {showFavs ? "الكل" : "المفضلة"}
        </Button>
        <Button
          variant={showOnlyWithSharh ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => { setShowOnlyWithSharh(!showOnlyWithSharh); setPage(1) }}
        >
          <i className={`fas fa-book-open ms-1 ${showOnlyWithSharh ? "" : "text-muted-foreground"}`} />
          {showOnlyWithSharh ? "الكل" : "بشرح"}
        </Button>
      </div>

      {!hLoading && filtered.length > 0 && !hError && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-muted-foreground">
            {filtered.length} من {totalInBook} نتيجة{showFavs && ` - ${favs.size} مفضلة`}
          </span>
          <select
            className="rounded-xl border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      )}

      {hLoading && hadiths.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري تحميل الأحاديث...</p>
        </div>
      ) : hError && hadiths.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <i className="fas fa-exclamation-triangle text-4xl mb-3 block" />
          <p>تعذر تحميل الأحاديث</p>
          <p className="text-sm">يرجى المحاولة لاحقاً</p>
        </div>
      ) : paged.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <i className="fas fa-search text-4xl mb-3 block" />
          <p>لا توجد نتائج للبحث</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {paged.map((h) => {
              const key = hKey(h)
              const isFav = favs.has(key)
              const isCopied = copied === key
              const grades = h.ar?.grades?.length ? h.ar.grades : (h.en?.grades?.length ? h.en.grades : [])

              return (
                <div key={key} className="bg-card rounded-xl shadow-sm border border-border p-4 md:p-5 transition-all hover:shadow-md">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: c.color }}>
                      <i className="fas fa-hashtag" />{h.hadithNumber}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {grades.map((g, i) => (
                        <span key={i} className={`px-2 py-0.5 rounded-full text-xs font-medium ${gradeBadgeCls(g.grade)}`}>{gradeAr(g.grade)}</span>
                      ))}
                    </div>
                  </div>

                  {h.chapterTitle?.ar && (
                    <div className="mb-3 px-3 py-2 rounded-lg bg-muted/50 text-sm text-muted-foreground font-medium">{h.chapterTitle.ar}</div>
                  )}

                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <i className="fas fa-quote-right opacity-60" />
                    نص الحديث
                  </div>
                  <p
                    className="mb-4 leading-relaxed"
                    style={{
                      fontSize: "1.3rem",
                      lineHeight: "2.2",
                      fontFamily: "var(--font-amiri), Amiri, serif",
                      fontWeight: "500",
                      color: "hsl(var(--foreground))",
                    }}
                  >
                    {h.ar?.text || "(النص العربي غير متاح)"}
                  </p>

                  {h.en?.text && (
                    <div className="mb-3 p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground leading-relaxed border border-border/50">
                      <i className="fas fa-language ms-1 opacity-60" />
                      {h.en.text}
                    </div>
                  )}

                  {/* الشرح */}
                  {(() => {
                    const entry = getSharhEntry(h)
                    const isExpanded = sharhExpanded.has(key)
                    const hasSharh = entry !== null
                    const isApiTextOnly = entry && "match" in entry ? isApiHadithTextEntry(entry) : false
                    return (
                      <div className="mb-3 rounded-xl border border-emerald-200/60 dark:border-emerald-800/30 overflow-hidden">
                        {hasSharh ? (
                          <>
                            <div
                              className="flex items-center justify-between gap-2 px-4 py-3 bg-emerald-50/80 dark:bg-emerald-900/10 cursor-pointer select-none transition hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20"
                              onClick={() => toggleSharh(key)}
                            >
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                                <i className="fas fa-book-open opacity-70" />
                                {isApiTextOnly ? "الحديث" : "شرح الحديث"}
                                {isApiTextOnly && (
                                  <span className="me-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                    الشرح قادم إن شاء الله
                                  </span>
                                )}
                                {!isApiTextOnly && entry?.verified && (
                                  <span className="me-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                    موثق
                                  </span>
                                )}
                              </span>
                              <i className={`fas fa-chevron-${isExpanded ? "up" : "down"} text-emerald-600 dark:text-emerald-400 text-xs transition-transform`} />
                            </div>
                            {isExpanded && (
                              <div className="p-4 bg-emerald-50/40 dark:bg-emerald-900/5">
                                {isApiTextOnly ? (
                                  <>
                                    <p className="text-sm leading-relaxed text-foreground mb-2" style={{ lineHeight: "1.9" }}>
                                      {entry.text}
                                    </p>
                                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                                      <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                                        <i className="fas fa-clock" />
                                        <span>شرح ابن عثيمين غير متاح حالياً - سيتم إضافته إن شاء الله</span>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    {"summary" in entry && entry.summary && (
                                      <div className="mb-3 rounded-lg bg-white/60 p-3 text-sm leading-relaxed text-foreground dark:bg-emerald-950/20">
                                        <div className="mb-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">مختصر الشرح</div>
                                        {entry.summary}
                                      </div>
                                    )}
                                    <p className="text-sm leading-relaxed text-foreground mb-2" style={{ lineHeight: "1.9" }}>
                                      {"deepExplanation" in entry && entry.deepExplanation ? entry.deepExplanation : entry.text}
                                    </p>
                                    {"benefits" in entry && entry.benefits?.length ? (
                                      <div className="mb-3 rounded-lg bg-white/60 p-3 dark:bg-emerald-950/20">
                                        <div className="mb-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">فوائد الحديث</div>
                                        <ul className="m-0 list-disc space-y-1 pe-5 text-sm leading-relaxed text-foreground">
                                          {entry.benefits.map((benefit, index) => (
                                            <li key={index}>{benefit}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    ) : null}
                                    {"notes" in entry && entry.notes && (
                                      <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs leading-relaxed text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                                        {entry.notes}
                                      </div>
                                    )}
                                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                                      <span><i className="fas fa-book ms-1 opacity-60" />{entry.bookTitle || entry.bookName || entry.source}</span>
                                      <span><i className="fas fa-user ms-1 opacity-60" />{entry.scholar}</span>
                                      {entry.attribution && (
                                        <span className="text-emerald-700 dark:text-emerald-400"><i className="fas fa-quote-right ms-1 opacity-60" />{entry.attribution}</span>
                                      )}
                                      {entry.sourceUrl && (
                                        <a
                                          href={entry.sourceUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-emerald-700 hover:underline dark:text-emerald-300"
                                        >
                                          <i className="fas fa-link opacity-60" />
                                          المصدر
                                        </a>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 text-[11px] text-muted-foreground">
                            <i className="fas fa-circle-exclamation opacity-50" />
                            لا يوجد شرح متاح لهذا الحديث
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                    <Button variant="ghost" size="sm" className="rounded-full" onClick={() => handleFav(h)}>
                      <i className={`${isFav ? "fas" : "far"} fa-heart ${isFav ? "text-red-500" : "text-muted-foreground"}`} />
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-full" onClick={() => handleCopy(key, h.ar?.text || h.en?.text || "")}>
                      <i className={`fas ${isCopied ? "fa-check text-emerald-500" : "fa-copy text-muted-foreground"}`} />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page <= 1}>
                <i className="fas fa-chevron-right ms-1" /> السابق
              </Button>
              <span className="text-sm text-muted-foreground">{page} من {totalPages}</span>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page >= totalPages}>
                التالي <i className="fas fa-chevron-left ms-1" />
              </Button>
            </div>
          )}

          {hasMore && !hLoading && (
            <div className="text-center mt-6">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => loadHadiths(col.slug, selBook!.bookNumber, offset, true)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin ms-2" />جاري التحميل...</>
                ) : (
                  <><i className="fas fa-plus ms-2" />عرض المزيد ({totalInBook - offset} متبقي)</>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
