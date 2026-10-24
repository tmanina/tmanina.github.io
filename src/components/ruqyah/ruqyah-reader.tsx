"use client"

import * as React from "react"
import { FloatingToast, type ToastVariant } from "@/components/floating-toast"
import { cn } from "@/lib/utils"
import {
    RUQYAH_DUA_COUNT,
    RUQYAH_ITEMS,
    RUQYAH_QURAN_COUNT,
    RUQYAH_TOTAL_COUNT,
    type RuqyahItem,
} from "./ruqyah-data"

type CategoryFilter = "all" | "quran" | "dua" | "completed"
type FontSizeLevel = "small" | "medium" | "large"

const STORAGE_KEY = "tmanina_ruqyah_counts_v1"

const FONT_SIZE_CLASSES: Record<FontSizeLevel, string> = {
    small: "text-lg",
    medium: "text-xl",
    large: "text-2xl",
}

function sanitizeCounts(raw: unknown): Record<string, number> {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
    const validIds = new Set(RUQYAH_ITEMS.map((item) => item.id))
    const result: Record<string, number> = {}
    for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
        if (validIds.has(id) && typeof value === "number" && Number.isFinite(value) && value >= 0) {
            result[id] = Math.floor(value)
        }
    }
    return result
}

function loadStoredCounts(): Record<string, number> {
    if (typeof window === "undefined") return {}
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) return {}
        return sanitizeCounts(JSON.parse(raw))
    } catch {
        return {}
    }
}

function buildShareText(item: RuqyahItem): string {
    return `${item.title}\n\n${item.text}\n\nالمصدر: ${item.source}`
}

function renderRuqyahText(text: string) {
    const parts = text.split(/(﴿[0-9٠-٩]+﴾)/g)
    if (parts.length === 1) {
        return text
    }
    return parts.map((part, index) => {
        const isAyahMarker = /^﴿[0-9٠-٩]+﴾$/.test(part.trim())
        if (isAyahMarker) {
            return (
                <span
                    key={index}
                    className="inline-flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold mx-2 px-1 select-none align-middle"
                >
                    {part.trim()}
                </span>
            )
        }
        return <React.Fragment key={index}>{part}</React.Fragment>
    })
}

export function RuqyahReader() {
    const [counts, setCounts] = React.useState<Record<string, number>>(loadStoredCounts)
    const [filter, setFilter] = React.useState<CategoryFilter>("all")
    const [fontSize, setFontSize] = React.useState<FontSizeLevel>("medium")
    const [toast, setToast] = React.useState<{ message: string; variant: ToastVariant } | null>(null)

    const showToast = React.useCallback((message: string, variant: ToastVariant) => {
        setToast({ message, variant })
    }, [])

    React.useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(counts))
        } catch {
            // التخزين المحلي قد يكون محجوبًا أو ممتلئًا؛ نتجاهل بهدوء
        }
    }, [counts])

    const completedIds = React.useMemo(
        () =>
            new Set(
                RUQYAH_ITEMS.filter((item) => (counts[item.id] ?? 0) >= item.targetCount).map((item) => item.id)
            ),
        [counts]
    )

    const filteredItems = React.useMemo(() => {
        if (filter === "quran") return RUQYAH_ITEMS.filter((item) => item.category === "quran")
        if (filter === "dua") return RUQYAH_ITEMS.filter((item) => item.category === "dua")
        if (filter === "completed") return RUQYAH_ITEMS.filter((item) => completedIds.has(item.id))
        return RUQYAH_ITEMS
    }, [filter, completedIds])

    const completedCount = completedIds.size
    const progressPercent = Math.round((completedCount / RUQYAH_TOTAL_COUNT) * 100)

    const increment = (item: RuqyahItem) => {
        const current = counts[item.id] ?? 0
        if (current >= item.targetCount) return
        const next = current + 1
        setCounts((prev) => ({ ...prev, [item.id]: next }))
        if (next === item.targetCount) {
            showToast(`اكتمل عدّاد: ${item.title}`, "success")
        }
    }

    const resetItem = (item: RuqyahItem) => {
        setCounts((prev) => ({ ...prev, [item.id]: 0 }))
    }

    const resetAll = () => {
        setCounts({})
        showToast("تمت إعادة ضبط جميع العدادات", "info")
    }

    const copyItem = async (item: RuqyahItem) => {
        try {
            if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable")
            await navigator.clipboard.writeText(buildShareText(item))
            showToast("تم نسخ النص مع المصدر", "success")
        } catch {
            showToast("تعذر النسخ، حاول مرة أخرى", "error")
        }
    }

    const shareItem = async (item: RuqyahItem) => {
        if (typeof navigator.share === "function") {
            try {
                await navigator.share({ title: item.title, text: buildShareText(item) })
                showToast("تمت المشاركة بنجاح", "success")
                return
            } catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") return
                // في حال فشل المشاركة ن fallback إلى النسخ
            }
        }
        await copyItem(item)
    }

    const filterTabs: Array<{ id: CategoryFilter; label: string; badge: number }> = [
        { id: "all", label: "الكل", badge: RUQYAH_TOTAL_COUNT },
        { id: "quran", label: "آيات قرآنية", badge: RUQYAH_QURAN_COUNT },
        { id: "dua", label: "أدعية نبوية", badge: RUQYAH_DUA_COUNT },
        { id: "completed", label: "المكتملة", badge: completedCount },
    ]

    return (
        <div className="space-y-6" data-testid="ruqyah-reader">
            {/* فلترة التصنيف */}
            <div className="flex flex-wrap gap-2" role="group" aria-label="تصفية حسب التصنيف">
                {filterTabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        data-testid={`ruqyah-filter-${tab.id}`}
                        aria-pressed={filter === tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all",
                            filter === tab.id
                                ? "bg-purple-600 text-white shadow-md"
                                : "bg-card border border-border text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-500/40"
                        )}
                    >
                        <span>{tab.label}</span>
                        <span
                            className={cn(
                                "inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full text-xs",
                                filter === tab.id
                                    ? "bg-white/20 text-white"
                                    : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                            )}
                        >
                            {tab.badge}
                        </span>
                    </button>
                ))}
            </div>

            {/* شريط التقدم وأدوات التحكم */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2 text-sm font-bold">
                    <span className="text-foreground">
                        <i className="fas fa-chart-line ms-1 text-purple-500"></i>
                        التقدم في القراءة
                    </span>
                    <span data-testid="ruqyah-progress-label" className="text-purple-600 dark:text-purple-400">
                        {completedCount} / {RUQYAH_TOTAL_COUNT} ({progressPercent}%)
                    </span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-4">
                    <div
                        data-testid="ruqyah-progress-bar"
                        className="h-full bg-gradient-to-l from-purple-500 to-purple-700 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1" role="group" aria-label="حجم الخط">
                        {(
                            [
                                { level: "small" as FontSizeLevel, label: "A-", name: "تصغير الخط" },
                                { level: "medium" as FontSizeLevel, label: "A", name: "حجم خط متوسط" },
                                { level: "large" as FontSizeLevel, label: "A+", name: "تكبير الخط" },
                            ]
                        ).map((option) => (
                            <button
                                key={option.level}
                                type="button"
                                aria-label={option.name}
                                aria-pressed={fontSize === option.level}
                                onClick={() => setFontSize(option.level)}
                                className={cn(
                                    "w-9 h-9 rounded-lg text-sm font-bold transition-colors",
                                    fontSize === option.level
                                        ? "bg-purple-600 text-white"
                                        : "bg-muted text-muted-foreground hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400"
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={resetAll}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                    >
                        <i className="fas fa-rotate-left"></i>
                        إعادة ضبط الكل
                    </button>
                </div>
            </div>

            {/* بطاقات الرقية */}
            {filteredItems.length === 0 ? (
                <div data-testid="ruqyah-empty" className="text-center text-muted-foreground py-12">
                    <i className="fas fa-check-circle text-3xl mb-3 block text-emerald-500"></i>
                    لم تكتمل أي رقية بعد، ابدأ بالقراءة وسيظهر تقدمك هنا.
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredItems.map((item) => {
                        const count = counts[item.id] ?? 0
                        const isComplete = count >= item.targetCount
                        return (
                            <div
                                key={item.id}
                                data-testid="ruqyah-item"
                                data-id={item.id}
                                data-category={item.category}
                                className="bg-card border border-border rounded-xl p-6 shadow-sm"
                            >
                                {/* العنوان والتصنيفات */}
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <h3 className="text-lg max-md:text-base font-bold text-foreground m-0">
                                        {item.title}
                                    </h3>
                                    <span
                                        className={cn(
                                            "text-xs font-bold px-2.5 py-1 rounded-full",
                                            item.category === "quran"
                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                        )}
                                    >
                                        {item.category === "quran" ? "آية قرآنية" : "دعاء نبوي"}
                                    </span>
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                        {item.targetCount} مرات
                                    </span>
                                </div>

                                {/* نص الرقية */}
                                <p
                                    data-testid="ruqyah-text"
                                    className={cn(
                                        "text-foreground leading-[2.3] md:leading-[2.5] whitespace-pre-line mb-4",
                                        FONT_SIZE_CLASSES[fontSize]
                                    )}
                                    style={{ fontFamily: "var(--font-amiri), Amiri, serif" }}
                                >
                                    {renderRuqyahText(item.text)}
                                </p>

                                {item.note && (
                                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 bg-muted/50 rounded-lg p-3 m-0">
                                        <i className="fas fa-lightbulb ms-1 text-amber-500"></i>
                                        {item.note}
                                    </p>
                                )}

                                {/* العدّاد والأدوات */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        data-testid="ruqyah-counter"
                                        aria-label={`زيادة عدّاد ${item.title}`}
                                        onClick={() => increment(item)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                                            isComplete
                                                ? "bg-emerald-600 text-white"
                                                : "bg-purple-600 hover:bg-purple-700 text-white"
                                        )}
                                    >
                                        {isComplete && <i className="fas fa-check-circle"></i>}
                                        <span data-testid="ruqyah-count">
                                            {count} / {item.targetCount}
                                        </span>
                                        {isComplete && <span>اكتمل</span>}
                                    </button>

                                    <button
                                        type="button"
                                        data-testid="ruqyah-reset-item"
                                        aria-label={`إعادة ضبط عدّاد ${item.title}`}
                                        disabled={count === 0}
                                        onClick={() => resetItem(item)}
                                        className={cn(
                                            "flex items-center justify-center w-9 h-9 rounded-xl text-sm transition-colors",
                                            count === 0
                                                ? "bg-muted text-muted-foreground/40 cursor-not-allowed"
                                                : "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                                        )}
                                    >
                                        <i className="fas fa-rotate-left"></i>
                                    </button>

                                    <div className="flex items-center gap-2 ms-auto">
                                        <button
                                            type="button"
                                            data-testid="ruqyah-copy"
                                            aria-label={`نسخ ${item.title}`}
                                            onClick={() => copyItem(item)}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-muted text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                        >
                                            <i className="fas fa-copy"></i>
                                            نسخ
                                        </button>
                                        <button
                                            type="button"
                                            data-testid="ruqyah-share"
                                            aria-label={`مشاركة ${item.title}`}
                                            onClick={() => shareItem(item)}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-muted text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                        >
                                            <i className="fas fa-share-alt"></i>
                                            مشاركة
                                        </button>
                                    </div>
                                </div>

                                {/* المصدر */}
                                <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground leading-relaxed">
                                    <i className="fas fa-book-open ms-1"></i>
                                    {item.source}
                                    {item.repeatBasis === "reading-guide" && (
                                        <span className="block mt-1 text-amber-600 dark:text-amber-400">
                                            <i className="fas fa-info-circle ms-1"></i>
                                            عدد التكرار إرشادي وليس مأثورًا بعينه.
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <FloatingToast
                message={toast?.message ?? ""}
                variant={toast?.variant ?? "info"}
                isVisible={toast !== null}
                onClose={() => setToast(null)}
            />
        </div>
    )
}
