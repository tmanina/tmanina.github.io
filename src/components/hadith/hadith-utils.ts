// Utility functions and types extracted from hadith-library.tsx
// These are pure functions that can be unit tested independently.

export interface HadithCollection {
  slug: string
  name: { en: string; ar: string }
  intro: { en: string | null; ar: string | null }
  hasBooks: boolean
  hasChapters: boolean
  totalHadith: number
  totalAvailable: number
}

export interface HadithBook {
  collection: string
  bookNumber: string
  name: { en: string; ar: string }
  hadithStartNumber: number
  hadithEndNumber: number
  hadithCount: number
}

export interface HadithItem {
  collection: string
  bookNumber: string
  hadithNumber: string
  chapterTitle: { en: string | null; ar: string | null }
  ar: { text: string; grades: Array<{ graded_by: string | null; grade: string }> }
  en: { text: string; grades: Array<{ graded_by: string | null; grade: string }> }
}

export interface SharhEntry {
  text: string
  source: string
  scholar: string
  sourceUrl?: string
  bookTitle?: string
  verified?: boolean
  // Optional fields that are always present on ReviewedSharhEntry but may
  // also appear on legacy entries; declared on the base type so union access
  // is type-safe without `as any` casts.
  bookName?: string
  attribution?: string
}

export interface ReviewedSharhEntry extends SharhEntry {
  sourceHadithNumber: string
  match: {
    method:
      | "hadith_number"
      | "matn_similarity"
      | "manual"
      | "placeholder"
      | "api-hadith-text"
      | "segment_sharh"
      | "shared_sharh"
      | "manual-fix"
      | "shamela_aligned"
      | "shamela_page"
      | "shamela_precise"
      | "shamela_precise_v2"
      | "shamela_precise_v3"
      | "shamela_precise_v4"
    confidence: number
    reviewed: boolean
    matchedText?: string
    reviewer?: string
  }
  summary?: string
  deepExplanation?: string
  benefits?: string[]
  notes?: string
  matn?: string
  sharh?: number
  attribution?: string
  bookName?: string
}

export interface ReviewedSharhFile {
  meta?: {
    collection: string
    bookTitle: string
    scholar: string
    source: string
    policy: string
    schemaVersion: number
  }
  sharhPool?: string[]
  entries?: Record<string, ReviewedSharhEntry>
}

export interface DorarApiItem {
  th?: string
}

export interface DorarApiResponse {
  ahadith?: DorarApiItem[] | { result?: string }
}

export interface DorarSearchResult {
  id: string
  html: string
}

export const COLORS: Record<string, { color: string; gradient: string }> = {
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

export const COL_DESC: Record<string, string> = {
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

export const COL_INTRO_AR: Record<string, string> = {
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

export const FAV_KEY = "hadith-favs"
export const LIMIT = 200
export const DORAR_SEARCH_BASE_URL = "https://dorar.net/search?q="
export const DORAR_PROXY_URL = "https://tmanina-dorar-api.smitten-rust-chip.workers.dev/"

export function colorOf(slug: string) {
  return COLORS[slug] || { color: "#6b7280", gradient: "linear-gradient(135deg, #6b7280, #4b5563)" }
}

export function getFavs(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]"))
  } catch {
    return new Set()
  }
}

export function toggleFav(key: string): Set<string> {
  const set = getFavs()
  if (set.has(key)) set.delete(key)
  else set.add(key)
  localStorage.setItem(FAV_KEY, JSON.stringify([...set]))
  return set
}

export function hKey(h: { collection: string; bookNumber: string; hadithNumber: string }) {
  return `${h.collection}:${h.bookNumber}:${h.hadithNumber}`
}

export function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0656-\u065B\u065C-\u065E]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
}

export function normalizeGrade(g: string): string {
  return g.toLowerCase().replace(/['`]/g, "").trim()
}

export function gradeBadgeCls(grade: string): string {
  const g = normalizeGrade(grade)
  if (g.startsWith("sahih")) return "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300"
  if (g.startsWith("hasan")) return "text-amber-600 bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300"
  if (g.startsWith("daif")) return "text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-300"
  return "text-gray-600 bg-gray-100 dark:bg-muted dark:text-muted-foreground"
}

export function gradeAr(grade: string): string {
  const g = grade.toLowerCase().replace(/['`]/g, "").trim()
  if (g.includes("sahih") && g.includes("hasan")) return "حسن صحيح"
  if (g.includes("hasan") && g.includes("daif")) return "حسن ضعيف"
  if (g.startsWith("sahih")) return "صحيح"
  if (g.startsWith("hasan")) return "حسن"
  if (g.startsWith("daif")) return "ضعيف"
  return grade
}

export function arBookName(book: { name: { en: string; ar: string | null } }): string {
  if (book.name.ar) return book.name.ar
  const m = book.name.en.match(/^Book\s+(\d+)(?::\s*(.*))?$/i)
  if (m) return m[2] ? `الكتاب ${m[1]}: ${m[2]}` : `الكتاب ${m[1]}`
  return book.name.en
}

export function isPlaceholderEntry(entry: ReviewedSharhEntry): boolean {
  const text = entry.text || ""
  const method = entry.match?.method
  return (
    method === "placeholder" ||
    text.includes("[نص الحديث والشرح غير متاحين حالياً") ||
    text.includes("[شرح غير متاح حالياً") ||
    text.includes("[سيتم إضافة المحتوى لاحقاً")
  )
}

export function isApiHadithTextEntry(entry: ReviewedSharhEntry): boolean {
  return entry.match?.method === "api-hadith-text"
}

export function isTrustedReviewedSharhEntry(entry: ReviewedSharhEntry): boolean {
  return entry.match?.reviewed === true && entry.match.confidence >= 0.9
}

export function isSafeReviewedSharhText(text: string): boolean {
  if (text.trim().length <= 30) return false
  if (/^\s*\]/.test(text)) return false
  if (/^[\s\n]*[\u0660-\u0669]{1,4}\s*[-ـ]/u.test(text)) return false
  return true
}

export function extractDorarHtmlResults(data: DorarApiResponse): string[] {
  if (Array.isArray(data.ahadith)) {
    return data.ahadith.map((item) => item.th || "")
  }

  if (data.ahadith && typeof data.ahadith.result === "string") {
    return data.ahadith.result
      .split(/\n?--------------\n?<br\s*\/?>/i)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

/**
 * Resolve the sharh entry for a hadith, handling both the new Shamela format
 * (sharh as index into sharhPool) and the legacy format (text field on entry).
 * Returns null if no trusted entry is available.
 */
export function resolveSharhEntry(
  h: HadithItem,
  riyadSharhData: Record<string, ReviewedSharhEntry>,
  sharhData: Record<string, SharhEntry>,
  sharhPool: string[]
): SharhEntry | ReviewedSharhEntry | null {
  const key = hKey(h)
  if (h.collection === "riyadussalihin") {
    const entry = riyadSharhData[key]
    if (!entry) return null
    if (!isTrustedReviewedSharhEntry(entry)) return null

    // New Shamela format: sharh is an index into sharhPool
    const sharhIdx = entry.sharh
    if (typeof sharhIdx === "number" && sharhIdx >= 0 && sharhPool[sharhIdx]) {
      const sharhText = sharhPool[sharhIdx]
      if (isSafeReviewedSharhText(sharhText)) {
        return {
          ...entry,
          text: sharhText,
          source: entry.source || "shamela_aligned",
          scholar: entry.scholar || "ابن عثيمين",
          attribution: entry.attribution || "",
          bookName: entry.bookName || "",
          sourceHadithNumber: entry.sourceHadithNumber || h.hadithNumber,
          match: entry.match || {
            method: "shamela_aligned",
            confidence: 0.98,
            reviewed: true,
          },
        }
      }
    }

    // Legacy format: entry has text field
    if (isPlaceholderEntry(entry)) return null
    if (isApiHadithTextEntry(entry)) return entry
    if (!isSafeReviewedSharhText(entry.text || "")) return null
    return entry
  }
  return sharhData[key] || null
}

/**
 * Check whether a hadith has an available sharh entry (without returning it).
 */
export function hasSharhAvailable(
  h: HadithItem,
  riyadSharhData: Record<string, ReviewedSharhEntry>,
  sharhData: Record<string, SharhEntry>,
  sharhPool: string[]
): boolean {
  const key = hKey(h)
  if (h.collection === "riyadussalihin") {
    const entry = riyadSharhData[key]
    if (!entry) return false
    if (!isTrustedReviewedSharhEntry(entry)) return false
    // New Shamela format: sharh is index into sharhPool
    const sharhIdx = entry.sharh
    if (typeof sharhIdx === "number" && sharhIdx >= 0 && isSafeReviewedSharhText(sharhPool[sharhIdx] || "")) return true
    // Legacy format
    if (isPlaceholderEntry(entry)) return false
    if (isApiHadithTextEntry(entry)) return true
    return isSafeReviewedSharhText(entry.text || "")
  }
  return !!sharhData[key]
}
