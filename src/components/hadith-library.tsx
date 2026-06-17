"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

interface HadithCollection {
  slug: string
  name: { en: string; ar: string }
  intro: { en: string | null; ar: string | null }
  hasBooks: boolean
  hasChapters: boolean
  totalHadith: number
  totalAvailable: number
}

interface HadithBook {
  collection: string
  bookNumber: string
  name: { en: string; ar: string }
  hadithStartNumber: number
  hadithEndNumber: number
  hadithCount: number
}

interface HadithItem {
  collection: string
  bookNumber: string
  hadithNumber: string
  chapterTitle: { en: string | null; ar: string | null }
  ar: { text: string; grades: Array<{ graded_by: string | null; grade: string }> }
  en: { text: string; grades: Array<{ graded_by: string | null; grade: string }> }
}

interface SharhEntry {
  text: string
  source: string
  scholar: string
}

interface HadithLibraryProps {
  onBack: () => void
}

const COLORS: Record<string, { color: string; gradient: string }> = {
  bukhari: { color: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b, #d97706)" },
  muslim: { color: "#10b981", gradient: "linear-gradient(135deg, #10b981, #059669)" },
  tirmidhi: { color: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6, #2563eb)" },
  abudawud: { color: "#8b5cf6", gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)" },
  nasai: { color: "#ec4899", gradient: "linear-gradient(135deg, #ec4899, #db2777)" },
  ibnmajah: { color: "#ef4444", gradient: "linear-gradient(135deg, #ef4444, #dc2626)" },
  ahmad: { color: "#14b8a6", gradient: "linear-gradient(135deg, #14b8a6, #0d9488)" },
  malik: { color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1, #4f46e5)" },
  darimi: { color: "#64748b", gradient: "linear-gradient(135deg, #64748b, #475569)" },
  riyadussalihin: { color: "#34d399", gradient: "linear-gradient(135deg, #34d399, #059669)" },
  adab: { color: "#06b6d4", gradient: "linear-gradient(135deg, #06b6d4, #0891b2)" },
  shamail: { color: "#f43f5e", gradient: "linear-gradient(135deg, #f43f5e, #e11d48)" },
  mishkat: { color: "#7c3aed", gradient: "linear-gradient(135deg, #7c3aed, #6d28d9)" },
  bulugh: { color: "#f97316", gradient: "linear-gradient(135deg, #f97316, #ea580c)" },
  forty: { color: "#84cc16", gradient: "linear-gradient(135deg, #84cc16, #65a30d)" },
  hisn: { color: "#eab308", gradient: "linear-gradient(135deg, #eab308, #ca8a04)" },
  virtues: { color: "#78716c", gradient: "linear-gradient(135deg, #78716c, #57534e)" },
}

const COL_DESC: Record<string, string> = {
  bukhari: "الجامع المسند الصحيح",
  muslim: "المسند الصحيح المختصر",
  tirmidhi: "السنن والجامع",
  abudawud: "سنن أبي داود السجستاني",
  nasai: "السنن الصغرى",
  ibnmajah: "السنن",
  ahmad: "المسند",
  malik: "الموطأ",
  darimi: "السنن",
  riyadussalihin: "من أهم كتب الحديث",
  adab: "في الآداب الإسلامية",
  shamail: "في شمائله ﷺ",
  mishkat: "مشكاة المصابيح",
  bulugh: "بلوغ المرام",
  forty: "الأربعون النووية",
  hisn: "الرقية والأذكار",
  virtues: "فضائل القرآن",
}

const COL_INTRO_AR: Record<string, string> = {
  bukhari: "صحيح البخاري هو مجموعة من الأحاديث النبوية جمعها الإمام محمد بن إسماعيل البخاري (ت 256 هـ) رحمه الله. ويُعد كتابه أصح كتاب بعد كتاب الله عند جماهير المسلمين. يحتوي على أكثر من 7500 حديث (مع التكرار) موزعة على 97 كتاباً. الترجمة المقدمة هنا للدكتور محمد محسن خان.",
  muslim: "صحيح مسلم هو مجموعة من الأحاديث النبوية جمعها الإمام مسلم بن الحجاج النيسابوري رحمه الله. ويُعد صحيح مسلم من أصح كتب الحديث النبوي، ويشكل مع صحيح البخاري \"الصحيحين\". يحتوي على حوالي 7500 حديث (مع التكرار) موزعة على 57 كتاباً.",
  nasai: "سنن النسائي هو مجموعة من الأحاديث النبوية جمعها الإمام أحمد بن شعيب النسائي رحمه الله. يُعد أحد الكتب الستة المشهورة في الحديث النبوي (كُتب السِّتَّة). يحتوي على حوالي 5700 حديث (مع التكرار) في 52 كتاباً.",
  abudawud: "سنن أبي داود هو مجموعة من الأحاديث النبوية جمعها الإمام أبو داود سليمان بن الأشعث السجستاني رحمه الله. يُعد أحد الكتب الستة المشهورة في الحديث النبوي. يحتوي على 5274 حديثاً في 43 كتاباً.",
  tirmidhi: "الجامع الترمذي هو مجموعة من الأحاديث النبوية جمعها الإمام أبو عيسى محمد الترمذي رحمه الله. يُعد أحد الكتب الستة المشهورة في الحديث النبوي. يحتوي على حوالي 4400 حديث (مع التكرار) في 50 كتاباً.",
  ibnmajah: "سنن ابن ماجه هو مجموعة من الأحاديث النبوية جمعها الإمام محمد بن يزيد ابن ماجه القزويني رحمه الله. يُعد سادس الكتب الستة المشهورة في الحديث النبوي. يحتوي على 4341 حديثاً في 37 كتاباً.",
  ahmad: "مسند أحمد هو مجموعة من الأحاديث النبوية جمعها الإمام أحمد بن حنبل (ت 241 هـ) رحمه الله. وهو أحد أشهر كتب الحديث النبوي وأهمها، ويُعد أكبر كتب الحديث الرئيسية حيث يحتوي على حوالي 28,199 حديثاً (مع التكرار) في 24 كتاباً.",
  darimi: "سنن الدارمي هو مجموعة من الأحاديث النبوية جمعها الإمام عبد الله بن عبد الرحمن الدارمي (ت 255 هـ) رحمه الله. يُعد أحد كتب الحديث المهمة، ويُصنف ضمن \"كتب الحديث التسعة\".",
  riyadussalihin: "رياض الصالحين هو مجموعة منتقاة من الأحاديث النبوية جمعها الإمام يحيى بن شرف النووي رحمه الله. وهو من أكثر كتب الحديث شهرة وانتشاراً في العالم الإسلامي، يحتوي على حوالي 1900 حديث في الأخلاق والآداب والعبادات وغيرها.",
  mishkat: "مشكاة المصابيح هو مجموعة منتقاة من الأحاديث النبوية جمعها الإمام الخطيب التبريزي. قام التبريزي بالتوسع في كتاب سابق اسمه \"مصابيح السنة\" للإمام البغوي. يحتوي على حوالي 6000 حديث منتقاة من الكتب الستة ومسند أحمد وغيرها.",
  virtues: "هذه مجموعة قصيرة من الأحاديث الصحيحة جمعها الشيخ سليمان هاني حول فضائل سور وآيات القرآن الكريم. الغرض من هذه المجموعة هو جمع الأحاديث الصحيحة في مكان واحد مع استبعاد الأحاديث الضعيفة أو الموضوعة.",
}

const FAV_KEY = "hadith-favs"
const LIMIT = 200

function colorOf(slug: string) {
  return COLORS[slug] || { color: "#6b7280", gradient: "linear-gradient(135deg, #6b7280, #4b5563)" }
}

function getFavs(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]")) }
  catch { return new Set() }
}

function toggleFav(key: string): Set<string> {
  const set = getFavs()
  if (set.has(key)) set.delete(key)
  else set.add(key)
  localStorage.setItem(FAV_KEY, JSON.stringify([...set]))
  return set
}

function hKey(h: { collection: string; bookNumber: string; hadithNumber: string }) {
  return `${h.collection}:${h.bookNumber}:${h.hadithNumber}`
}

function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0656-\u065B\u065C-\u065E]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
}

function normalizeGrade(g: string): string {
  return g.toLowerCase().replace(/['`]/g, "").trim()
}

function gradeBadgeCls(grade: string): string {
  const g = normalizeGrade(grade)
  if (g.startsWith("sahih")) return "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300"
  if (g.startsWith("hasan")) return "text-amber-600 bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300"
  if (g.startsWith("daif")) return "text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-300"
  return "text-gray-600 bg-gray-100 dark:bg-muted dark:text-muted-foreground"
}

function gradeAr(grade: string): string {
  const g = grade.toLowerCase().replace(/['`]/g, "").trim()
  if (g.includes("sahih") && g.includes("hasan")) return "حسن صحيح"
  if (g.includes("hasan") && g.includes("daif")) return "حسن ضعيف"
  if (g.startsWith("sahih")) return "صحيح"
  if (g.startsWith("hasan")) return "حسن"
  if (g.startsWith("daif")) return "ضعيف"
  return grade
}

function arBookName(book: { name: { en: string; ar: string | null } }): string {
  if (book.name.ar) return book.name.ar
  const m = book.name.en.match(/^Book\s+(\d+)(?::\s*(.*))?$/i)
  if (m) return m[2] ? `الكتاب ${m[1]}: ${m[2]}` : `الكتاب ${m[1]}`
  return book.name.en
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
  const [openSharh, setOpenSharh] = React.useState<Set<string>>(new Set())

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
    return items
  }, [hadiths, search, favs, showFavs])

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
                    const sk = hKey(h)
                    const entry = sharhData[sk]
                    if (!entry) return null
                    const isOpen = openSharh.has(sk)
                    return (
                      <div className="mb-3">
                        <button
                          type="button"
                          onClick={() => {
                            const n = new Set(openSharh)
                            if (isOpen) n.delete(sk)
                            else n.add(sk)
                            setOpenSharh(n)
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 transition-colors"
                        >
                          <i className={`fas ${isOpen ? "fa-chevron-up" : "fa-chevron-down"} text-xs`} />
                          {isOpen ? "إخفاء الشرح" : "عرض الشرح"}
                          <span className="opacity-60 text-[10px]">· {entry.scholar}</span>
                        </button>
                        {isOpen && (
                          <div className="mt-2 p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-200/60 dark:border-emerald-800/30">
                            <p className="text-sm leading-relaxed text-foreground mb-2" style={{ lineHeight: "1.9" }}>
                              {entry.text}
                            </p>
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                              <span><i className="fas fa-book ms-1 opacity-60" />{entry.source}</span>
                              <span><i className="fas fa-user ms-1 opacity-60" />{entry.scholar}</span>
                            </div>
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
