"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { FloatingToast, type ToastVariant } from "@/components/floating-toast"
import { prophetsData, PROPHET_CATEGORIES } from "./prophets-data"
import { type ProphetStory, type ProphetCategory } from "./types"

interface ProphetsStoriesProps {
  onBack: () => void
}

const FAVORITES_STORAGE_KEY = "tmanina_prophet_favorites"

export function ProphetsStories({ onBack }: ProphetsStoriesProps) {
  const [selectedProphetId, setSelectedProphetId] = React.useState<string | null>(null)
  const [activeCategory, setActiveCategory] = React.useState<ProphetCategory>("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [favorites, setFavorites] = React.useState<string[]>([])
  const [activeTab, setActiveTab] = React.useState<"milestones" | "lessons" | "hadiths" | "miracles">("milestones")
  
  // Toast state
  const [toastMsg, setToastMsg] = React.useState("")
  const [toastVariant, setToastVariant] = React.useState<ToastVariant>("info")
  const [toastVisible, setToastVisible] = React.useState(false)

  const showToast = (msg: string, variant: ToastVariant = "info") => {
    setToastMsg(msg)
    setToastVariant(variant)
    setToastVisible(true)
  }

  // Load favorites
  React.useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
      if (stored) {
        setFavorites(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
  }, [])

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setFavorites((prev) => {
      const exists = prev.includes(id)
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id]
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      showToast(exists ? "تمت إزالة القصة من المفضلة" : "تمت إضافة القصة إلى المفضلة", "success")
      return next
    })
  }

  const selectedProphet = React.useMemo(() => {
    return prophetsData.find((p) => p.id === selectedProphetId) || null
  }, [selectedProphetId])

  const filteredProphets = React.useMemo(() => {
    return prophetsData.filter((p) => {
      const matchesCategory =
        activeCategory === "all" ||
        p.category === activeCategory

      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.title.toLowerCase().includes(query) ||
        p.brief.toLowerCase().includes(query) ||
        p.lessons.some((l) => l.toLowerCase().includes(query))

      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery])

  const handleCopyText = (text: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(`تم نسخ ${label} بنجاح`, "success")
      })
    }
  }

  const handleShare = async (prophet: ProphetStory) => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `قصة ${prophet.name} - طمأنينة`,
          text: `${prophet.name} (${prophet.title}):\n${prophet.brief}\nمن العبر: ${prophet.lessons[0] || ""}`,
          url: window.location.href,
        })
      } catch {
        // user cancelled or share failed
      }
    } else {
      handleCopyText(
        `${prophet.name} (${prophet.title})\n${prophet.brief}\nمن العبر: ${prophet.lessons.join("\n- ")}`,
        "ملخص القصة والعِبر"
      )
    }
  }

  const navigateAdjacent = (direction: "next" | "prev") => {
    if (!selectedProphet) return
    const currentIndex = prophetsData.findIndex((p) => p.id === selectedProphet.id)
    if (currentIndex === -1) return

    let nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1
    if (nextIndex < 0) nextIndex = prophetsData.length - 1
    if (nextIndex >= prophetsData.length) nextIndex = 0

    setSelectedProphetId(prophetsData[nextIndex].id)
    setActiveTab("milestones")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="animate-fade-in pb-12">
      <FloatingToast
        message={toastMsg}
        variant={toastVariant}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <Button
          onClick={() => {
            if (selectedProphetId) {
              setSelectedProphetId(null)
            } else {
              onBack()
            }
          }}
          variant="outline"
          className="rounded-full shadow-sm hover:bg-muted"
        >
          <i className="fas fa-arrow-right ms-2"></i>
          {selectedProphetId ? "رجوع لقصص الأنبياء" : "رجوع للمكتبة"}
        </Button>

        {selectedProphet && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full size-9"
              onClick={() => toggleFavorite(selectedProphet.id)}
              title={favorites.includes(selectedProphet.id) ? "إزالة من المفضلة" : "إضافة للمفضلة"}
            >
              <i
                className={`fas fa-heart text-sm ${
                  favorites.includes(selectedProphet.id) ? "text-red-500" : "text-muted-foreground"
                }`}
              ></i>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full size-9"
              onClick={() => handleShare(selectedProphet)}
              title="مشاركة القصة"
            >
              <i className="fas fa-share-alt text-sm text-muted-foreground"></i>
            </Button>
          </div>
        )}
      </div>

      {!selectedProphet ? (
        /* ================= OVERVIEW LIST VIEW ================= */
        <>
          {/* Hero Banner */}
          <div className="rounded-2xl p-6 md:p-8 text-white mb-8 shadow-lg text-center relative overflow-hidden bg-gradient-to-br from-amber-600 via-amber-700 to-emerald-800">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4 shadow-inner border border-white/20">
              <i className="fas fa-book-open-reader"></i>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold mb-2">قصص الأنبياء والمرسلين</h1>
            <p className="text-white/90 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
              عِبرٌ خالدة ورحلة إيمانية في سير ورسالات الأنبياء الكرام من بدء الخلق مع آدم عليه السلام وصولاً إلى خاتم النبيين محمد ﷺ.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs md:text-sm font-semibold">
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                <i className="fas fa-check-circle ms-1"></i> {prophetsData.length} نبياً ورسولاً
              </span>
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                <i className="fas fa-book-bookmark ms-1"></i> مصادر تراثية معتمدة (البداية والنهاية والطبري)
              </span>
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                <i className="fas fa-scroll ms-1"></i> أحاديث نبوية صحيحة
              </span>
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                <i className="fas fa-lightbulb ms-1"></i> عبر ودروس مستفادة
              </span>
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                <i className="fas fa-quran ms-1"></i> شواهد قرآنية
              </span>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="space-y-4 mb-6">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث باسم النبي، العبر، أو الكلمات المفتاحية..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pe-10 ps-4 rounded-xl border border-input bg-card text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-sm font-medium"
              />
              <span className="absolute end-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <i className="fas fa-search"></i>
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                >
                  <i className="fas fa-times-circle"></i> مسح
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {PROPHET_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id as ProphetCategory)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                      isActive
                        ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                        : "bg-card text-muted-foreground border border-border hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Prophets Cards Grid */}
          {filteredProphets.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-2xl">
              <i className="fas fa-search text-4xl text-muted-foreground/60 mb-3 block"></i>
              <h3 className="text-lg font-bold text-foreground mb-1">لا توجد نتائج مطابقة</h3>
              <p className="text-muted-foreground text-sm">جرّب تغيير عبارة البحث أو اختيار تصنيف آخر</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProphets.map((prophet) => {
                const isFav = favorites.includes(prophet.id)
                return (
                  <div
                    key={prophet.id}
                    onClick={() => {
                      setSelectedProphetId(prophet.id)
                      setActiveTab("milestones")
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }}
                    className="group bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                  >
                    {/* Top Decor Line */}
                    <div
                      className="absolute top-0 inset-x-0 h-1.5 opacity-80 group-hover:opacity-100 transition-opacity"
                      style={{ background: prophet.gradient }}
                    ></div>

                    <div>
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="size-12 rounded-xl flex items-center justify-center text-white text-xl shadow-md shrink-0"
                            style={{ background: prophet.gradient }}
                          >
                            <i className={`fas ${prophet.icon}`}></i>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors m-0">
                              {prophet.name}
                            </h3>
                            <span className="text-xs text-muted-foreground font-medium block">
                              {prophet.title}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(prophet.id, e)}
                          className="size-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
                          title="حفظ في المفضلة"
                        >
                          <i className={`fas fa-heart text-sm ${isFav ? "text-red-500" : "opacity-40"}`}></i>
                        </button>
                      </div>

                      {/* Brief */}
                      <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3 mb-4">
                        {prophet.brief}
                      </p>
                    </div>

                    {/* Footer Info */}
                    <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <i className="fas fa-quran text-amber-500"></i>
                        <span>ذُكر {prophet.quranMentionCount} مرة</span>
                      </span>
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 group-hover:translate-x-[-2px] transition-transform">
                        قراءة القصة <i className="fas fa-chevron-left text-[10px]"></i>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      ) : (
        /* ================= DETAILED PROPHET STORY VIEW ================= */
        <div className="space-y-6 animate-fade-in">
          {/* Hero Banner for Selected Prophet */}
          <div
            className="rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden"
            style={{ background: selectedProphet.gradient }}
          >
            <div className="absolute top-0 end-0 translate-x-8 -translate-y-8 size-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="size-16 md:size-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl md:text-4xl shadow-inner border border-white/20 shrink-0">
                  <i className={`fas ${selectedProphet.icon}`}></i>
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold mb-2 backdrop-blur-sm">
                    <i className="fas fa-clock ms-1"></i> {selectedProphet.period}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-extrabold m-0 leading-tight">
                    {selectedProphet.name}
                  </h1>
                  <p className="text-white/90 text-sm md:text-base font-medium mt-1 mb-0">
                    {selectedProphet.title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3.5 py-2 text-center border border-white/10">
                  <span className="text-[11px] text-white/80 block">الذكر في القرآن</span>
                  <span className="text-lg md:text-xl font-extrabold">{selectedProphet.quranMentionCount}</span>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3.5 py-2 text-center border border-white/10">
                  <span className="text-[11px] text-white/80 block">المحطات الرئيسية</span>
                  <span className="text-lg md:text-xl font-extrabold">{selectedProphet.milestones.length}</span>
                </div>
                {selectedProphet.hadiths && selectedProphet.hadiths.length > 0 && (
                  <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3.5 py-2 text-center border border-white/10">
                    <span className="text-[11px] text-white/80 block">أحاديث نبوية</span>
                    <span className="text-lg md:text-xl font-extrabold">{selectedProphet.hadiths.length}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Prophet Brief Text */}
            <div className="mt-6 pt-5 border-t border-white/20 text-white/95 text-sm md:text-base leading-relaxed">
              {selectedProphet.brief}
            </div>
          </div>

          {/* Heritage Sources Card */}
          {selectedProphet.heritageSources && selectedProphet.heritageSources.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 text-lg">
                  <i className="fas fa-book-bookmark"></i>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground m-0">المصادر التراثية المعتمدة للسرد</h4>
                  <p className="text-xs text-muted-foreground m-0 mt-0.5">مستند إلى أمهات كتب التفسير والتاريخ والحديث النبوي الشريف</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedProphet.heritageSources.map((source, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 bg-card border border-border/80 px-2.5 py-1 rounded-lg text-xs font-semibold text-foreground shadow-2xs"
                  >
                    <i className="fas fa-feather-pointed text-[10px] text-amber-500"></i>
                    {source}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Verses Card */}
          {selectedProphet.keyVerses.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm mb-3">
                <i className="fas fa-quran"></i>
                <span>شواهد من آيات الذكر الحكيم</span>
              </div>
              <div className="grid gap-3">
                {selectedProphet.keyVerses.map((verse, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-muted/50 border border-border/70 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <p className="text-base md:text-lg font-semibold text-foreground m-0" style={{ lineHeight: "1.8" }}>
                      ﴿ {verse.text} ﴾
                    </p>
                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                      <span className="text-xs font-bold text-muted-foreground bg-card px-2.5 py-1 rounded-md border border-border">
                        سورة {verse.surah} ({verse.ayah})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(`﴿ ${verse.text} ﴾ [سورة ${verse.surah}: ${verse.ayah}]`, "الآية")}
                        className="text-muted-foreground hover:text-amber-600 text-xs flex items-center gap-1 transition-colors"
                        title="نسخ الآية"
                      >
                        <i className="fas fa-copy"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex border-b border-border gap-2 overflow-x-auto scrollbar-none pb-px">
            <button
              type="button"
              onClick={() => setActiveTab("milestones")}
              className={`pb-3 px-4 font-bold text-sm transition-all whitespace-nowrap relative ${
                activeTab === "milestones"
                  ? "text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <i className="fas fa-route ms-1.5"></i>
              أحداث ومحطات القصة ({selectedProphet.milestones.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("hadiths")}
              className={`pb-3 px-4 font-bold text-sm transition-all whitespace-nowrap relative ${
                activeTab === "hadiths"
                  ? "text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <i className="fas fa-scroll ms-1.5"></i>
              الأحاديث والسنة النبوية ({selectedProphet.hadiths?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("lessons")}
              className={`pb-3 px-4 font-bold text-sm transition-all whitespace-nowrap relative ${
                activeTab === "lessons"
                  ? "text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <i className="fas fa-lightbulb ms-1.5"></i>
              الدروس والعِبر ({selectedProphet.lessons.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("miracles")}
              className={`pb-3 px-4 font-bold text-sm transition-all whitespace-nowrap relative ${
                activeTab === "miracles"
                  ? "text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <i className="fas fa-star ms-1.5"></i>
              المعجزات والآيات ({selectedProphet.miracles.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[250px]">
            {activeTab === "milestones" && (
              <div className="space-y-4">
                {selectedProphet.milestones.map((milestone, idx) => (
                  <div
                    key={idx}
                    className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 mb-2">
                      <span className="size-6 rounded-full bg-amber-500/10 flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span>{milestone.stage}</span>
                    </div>

                    <h3 className="text-lg md:text-xl font-bold text-foreground mb-3">
                      {milestone.title}
                    </h3>

                    <p className="text-foreground/90 text-sm md:text-base leading-relaxed m-0 whitespace-pre-line text-justify">
                      {milestone.story}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "hadiths" && (
              <div className="space-y-4">
                {selectedProphet.hadiths && selectedProphet.hadiths.length > 0 ? (
                  selectedProphet.hadiths.map((hadith, idx) => (
                    <div
                      key={idx}
                      className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                          <i className="fas fa-scroll"></i>
                          {hadith.narrator ? hadith.narrator : "حديث نبوي شريف"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(`«${hadith.text}»\n[المصدر: ${hadith.source}]`, "الحديث الشريف")}
                          className="text-muted-foreground hover:text-amber-600 text-xs flex items-center gap-1 transition-colors px-2.5 py-1 rounded-md hover:bg-muted"
                          title="نسخ الحديث الشريف"
                        >
                          <i className="fas fa-copy ms-1"></i>
                          <span>نسخ</span>
                        </button>
                      </div>

                      <p className="text-base md:text-lg font-semibold text-foreground leading-loose mb-4 text-justify select-text">
                        « {hadith.text} »
                      </p>

                      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground pt-3 border-t border-border/60">
                        <i className="fas fa-book-open text-amber-500"></i>
                        <span>تخريج الحديث: {hadith.source}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-card border border-border rounded-2xl">
                    <i className="fas fa-scroll text-3xl text-muted-foreground/60 mb-2 block"></i>
                    <p className="text-muted-foreground text-sm">لم تُسجل أحاديث خاصة في هذا القسم لهذا النبي</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "lessons" && (
              <div className="grid gap-3">
                {selectedProphet.lessons.map((lesson, idx) => (
                  <div
                    key={idx}
                    className="bg-card border border-border rounded-xl p-4 md:p-5 shadow-sm flex items-start justify-between gap-3 group hover:border-amber-500/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <i className="fas fa-check"></i>
                      </div>
                      <p className="text-sm md:text-base font-medium text-foreground m-0 leading-relaxed">
                        {lesson}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyText(lesson, "الفائدة")}
                      className="text-muted-foreground hover:text-foreground size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                      title="نسخ الفائدة"
                    >
                      <i className="fas fa-copy text-xs"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "miracles" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedProphet.miracles.map((miracle, idx) => (
                  <div
                    key={idx}
                    className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-3.5"
                  >
                    <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg shrink-0">
                      <i className="fas fa-wand-magic-sparkles"></i>
                    </div>
                    <span className="text-sm md:text-base font-semibold text-foreground">
                      {miracle}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Adjacent Navigation (Previous / Next Prophet) */}
          <div className="pt-6 border-t border-border flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => navigateAdjacent("prev")}
              className="rounded-xl flex items-center gap-2 text-xs md:text-sm font-bold"
            >
              <i className="fas fa-arrow-right"></i>
              <span>النبي السابق</span>
            </Button>

            <span className="text-xs text-muted-foreground font-semibold">
              {selectedProphet.order} من {prophetsData.length}
            </span>

            <Button
              variant="outline"
              onClick={() => navigateAdjacent("next")}
              className="rounded-xl flex items-center gap-2 text-xs md:text-sm font-bold"
            >
              <span>النبي التالي</span>
              <i className="fas fa-arrow-left"></i>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
