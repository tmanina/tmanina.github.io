"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { FloatingToast } from "@/components/floating-toast"
import {
  sunnahItems,
  sunnahCategories,
  normalizeArabic,
  SUNNAH_FAVS_KEY,
} from "./sunnah-data"
import type { SunnahCategory, SunnahItem } from "./sunnah-data"

const HEADER_HADITH =
  '«مَنْ سَنَّ فِي الْإِسْلَامِ سُنَّةً حَسَنَةً، فَعُمِلَ بِهَا بَعْدَهُ، كُتِبَ لَهُ مِثْلُ أَجْرِ مَنْ عَمِلَ بِهَا مِنْ غَيْرِ أَنْ يُنْقَصَ مِنْ أُجُورِهِمْ شَيْءٌ»'
const HEADER_SOURCE = "صحيح مسلم: 1017"

function readFavs(): string[] {
  try {
    const raw = localStorage.getItem(SUNNAH_FAVS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []
  } catch {
    return []
  }
}

function writeFavs(ids: string[]) {
  try {
    localStorage.setItem(SUNNAH_FAVS_KEY, JSON.stringify(ids))
  } catch {
    /* ignore quota / private mode */
  }
}

function buildShareText(item: SunnahItem): string {
  return [
    `سُنَّة: ${item.title}`,
    "",
    item.hadith,
    "",
    `المصدر: ${item.source}`,
    "",
    "من السنن المهجورة - تطبيق طمأنينة",
  ].join("\n")
}

export function SunnahPage({ onBack }: { onBack?: () => void }) {
  const [activeCategory, setActiveCategory] = React.useState<SunnahCategory>("all")
  const [query, setQuery] = React.useState("")
  const [favs, setFavs] = React.useState<string[]>([])
  const [toast, setToast] = React.useState<{ message: string; variant: "success" | "error" } | null>(null)

  React.useEffect(() => {
    setFavs(readFavs())
  }, [])

  const showToast = React.useCallback((message: string, variant: "success" | "error" = "success") => {
    setToast({ message, variant })
  }, [])

  const normalizedQuery = normalizeArabic(query)

  const categoryFiltered = React.useMemo(() => {
    if (activeCategory === "all") return sunnahItems
    if (activeCategory === "favs") return sunnahItems.filter((item) => favs.includes(item.id))
    return sunnahItems.filter((item) => item.category === activeCategory)
  }, [activeCategory, favs])

  const display = React.useMemo(() => {
    if (!normalizedQuery) return categoryFiltered
    return categoryFiltered.filter((item) => {
      const haystack = normalizeArabic(
        `${item.title} ${item.description} ${item.action} ${item.hadith} ${item.source} ${item.categoryAr}`
      )
      return haystack.includes(normalizedQuery)
    })
  }, [categoryFiltered, normalizedQuery])

  const countFor = React.useCallback(
    (category: SunnahCategory): number => {
      if (category === "all") return sunnahItems.length
      if (category === "favs") return sunnahItems.filter((item) => favs.includes(item.id)).length
      return sunnahItems.filter((item) => item.category === category).length
    },
    [favs]
  )

  const toggleFav = React.useCallback(
    (item: SunnahItem) => {
      setFavs((prev) => {
        const next = prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
        writeFavs(next)
        showToast(
          next.includes(item.id) ? `تمت إضافة «${item.title}» إلى المفضلة` : `تمت إزالة «${item.title}» من المفضلة`
        )
        return next
      })
    },
    [showToast]
  )

  const handleCopy = React.useCallback(
    async (item: SunnahItem) => {
      const text = `${item.title}\n\n${item.hadith}\n\nطريقة التطبيق: ${item.action}\n\nالمصدر: ${item.source}`
      try {
        await navigator.clipboard.writeText(text)
        showToast("تم نسخ السنة، يمكنك لصقها الآن")
      } catch {
        showToast("تعذر النسخ، حاول مرة أخرى", "error")
      }
    },
    [showToast]
  )

  const handleShare = React.useCallback(
    async (item: SunnahItem) => {
      const text = buildShareText(item)
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({ title: item.title, text })
          return
        } catch {
          /* user cancelled or share failed; fall through to clipboard */
        }
      }
      try {
        await navigator.clipboard.writeText(text)
        showToast("تعذرت المشاركة، تم نسخ النص بدلاً منها")
      } catch {
        showToast("تعذرت المشاركة والنسخ", "error")
      }
    },
    [showToast]
  )

  return (
    <div className="space-y-5" data-testid="sunnah-page">
      {/* Header */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
        <div className="bg-gradient-to-br from-teal-600 via-emerald-700 to-teal-800 p-5 text-center text-white md:p-7">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl shadow-sm backdrop-blur">
            <i className="fas fa-seedling"></i>
          </div>
          <h2 className="mb-2 text-2xl font-extrabold md:text-3xl">السنن المهجورة واليومية</h2>
          <p className="mx-auto mb-0 max-w-2xl text-sm font-medium leading-7 text-white/88 md:text-base">
            إحياء السنن النبوية الثابتة في اليوم والليلة مع كيفية تطبيقها وأجرها
          </p>
          <div className="mx-auto mt-4 max-w-2xl rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
            <p
              className="mb-2 text-base leading-9 md:text-lg"
              style={{ fontFamily: "var(--font-amiri), Amiri, serif" }}
            >
              {HEADER_HADITH}
            </p>
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
              {HEADER_SOURCE}
            </span>
          </div>
        </div>
      </section>

      {/* Search */}
      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <label className="relative block">
          <span className="sr-only">ابحث في السنن</span>
          <i className="fas fa-search absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground"></i>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث عن سنة... (حتى بدون تشكيل)"
            data-testid="sunnah-search"
            className="h-12 w-full rounded-xl border border-input bg-background ps-4 pe-11 text-sm text-foreground outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </label>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="تصنيفات السنن">
        {sunnahCategories.map((category) => {
          const isActive = activeCategory === category.key
          return (
            <button
              key={category.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-testid={`sunnah-filter-${category.key}`}
              onClick={() => setActiveCategory(category.key)}
              className={
                isActive
                  ? "rounded-full border-0 bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow transition-all hover:bg-teal-700"
                  : "rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-accent"
              }
            >
              <i className={`${category.icon} me-1.5`}></i>
              {category.label}
              <span
                className={
                  isActive
                    ? "ms-1.5 rounded-full bg-white/25 px-2 py-0.5 text-xs font-bold"
                    : "ms-1.5 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-muted-foreground"
                }
                data-testid={`sunnah-count-${category.key}`}
              >
                {countFor(category.key)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Cards */}
      {display.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed border-border bg-card py-12 text-center text-muted-foreground"
          data-testid="sunnah-empty"
        >
          <i className="fas fa-magnifying-glass mb-3 block text-4xl"></i>
          <p>{activeCategory === "favs" ? "لم تضف أي سنة إلى المفضلة بعد" : "لا توجد نتائج مطابقة لهذا البحث"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {display.map((item) => (
            <SunnahCard
              key={item.id}
              item={item}
              isFav={favs.includes(item.id)}
              onToggleFav={() => toggleFav(item)}
              onCopy={() => handleCopy(item)}
              onShare={() => handleShare(item)}
            />
          ))}
        </div>
      )}

      {/* Back button */}
      {onBack && (
        <div className="flex justify-center">
          <Button onClick={onBack} variant="outline" className="rounded-full">
            <i className="fas fa-arrow-right ms-2"></i>
            رجوع للمكتبة
          </Button>
        </div>
      )}

      <FloatingToast
        message={toast?.message ?? ""}
        variant={toast?.variant ?? "success"}
        isVisible={toast !== null}
        onClose={() => setToast(null)}
      />
    </div>
  )
}

function SunnahCard({
  item,
  isFav,
  onToggleFav,
  onCopy,
  onShare,
}: {
  item: SunnahItem
  isFav: boolean
  onToggleFav: () => void
  onCopy: () => void
  onShare: () => void
}) {
  return (
    <article
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
      data-testid="sunnah-item"
      data-id={item.id}
      data-category={item.category}
    >
      <div className="p-5">
        {/* Pills */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-teal-600/10 px-3 py-1 text-xs font-bold text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
            <i className="fas fa-circle-check me-1"></i>
            {item.categoryAr}
          </span>
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            <i className="fas fa-bookmark me-1"></i>
            {item.source}
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-3 text-lg font-bold text-card-foreground md:text-xl">{item.title}</h3>

        {/* Description */}
        <div className="mb-3">
          <h4 className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-card-foreground">
            <i className="fas fa-lightbulb text-amber-500"></i>
            فضل وأهمية السنة
          </h4>
          <p className="m-0 text-sm leading-7 text-muted-foreground">{item.description}</p>
        </div>

        {/* Action */}
        <div className="mb-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 dark:bg-emerald-500/10">
          <h4 className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-300">
            <i className="fas fa-circle-check"></i>
            كيفية التطبيق العملي
          </h4>
          <p className="m-0 text-sm leading-7 text-card-foreground">{item.action}</p>
        </div>

        {/* Hadith */}
        <div className="rounded-xl border-r-4 border-teal-600 bg-accent/40 p-4">
          <p
            className="m-0 text-base leading-9 text-card-foreground md:text-lg"
            style={{ fontFamily: "var(--font-amiri), Amiri, serif" }}
          >
            ﴿ {item.hadith} ﴾
          </p>
        </div>

        {/* Footnote */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>
            <i className="fas fa-book-atlas me-1 text-teal-600 dark:text-teal-400"></i>
            المصدر: {item.source}
          </span>
          {item.reward && (
            <span className="font-semibold text-amber-700 dark:text-amber-300">
              <i className="fas fa-gift me-1"></i>
              الأجر: {item.reward}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={onToggleFav}
            aria-pressed={isFav}
            aria-label={isFav ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
            data-testid="sunnah-fav-btn"
            className={
              isFav
                ? "rounded-full border-0 bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-teal-700"
                : "rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-accent"
            }
          >
            <i className={`${isFav ? "fas" : "far"} fa-bookmark me-1 ${isFav ? "text-white" : ""}`}></i>
            {isFav ? "في المفضلة" : "حفظ في المفضلة"}
          </button>
          <button
            type="button"
            onClick={onCopy}
            aria-label="نسخ السنة"
            data-testid="sunnah-copy-btn"
            className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-accent"
          >
            <i className="fas fa-copy me-1"></i>
            نسخ
          </button>
          <button
            type="button"
            onClick={onShare}
            aria-label="مشاركة السنة"
            data-testid="sunnah-share-btn"
            className="rounded-full border-0 bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105 hover:bg-teal-700 active:scale-95"
          >
            <i className="fas fa-share-nodes me-1"></i>
            مشاركة
          </button>
        </div>
      </div>
    </article>
  )
}
