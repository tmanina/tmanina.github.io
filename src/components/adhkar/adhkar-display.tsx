"use client"

import * as React from "react"
import { type AdhkarConfig, type RemainingMap } from "./types"
import { getInitialRemaining, incrementDailyDhikr, copyDhikr } from "./utils"
import { dispatchAdhkarToast, useAdhkarToastListener } from "./toast-events"
import { FloatingToast } from "@/components/floating-toast"
import { shareTextAsImage } from "@/lib/share-image"

interface AdhkarDisplayProps {
    config: AdhkarConfig
    prefix: string
}

const ADHKAR_FAVORITES_KEY = "adhkar-favorites"

function loadFavoriteAdhkar(): string[] {
    if (typeof window === "undefined") return []

    try {
        const raw = window.localStorage.getItem(ADHKAR_FAVORITES_KEY)
        const parsed = raw ? JSON.parse(raw) : []
        return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : []
    } catch {
        return []
    }
}

function saveFavoriteAdhkar(favorites: string[]) {
    if (typeof window === "undefined") return

    try {
        window.localStorage.setItem(ADHKAR_FAVORITES_KEY, JSON.stringify(favorites))
    } catch {
        dispatchAdhkarToast("تعذّر حفظ المفضلة الآن.", "error")
    }
}

export function AdhkarDisplay({ config, prefix }: AdhkarDisplayProps) {
    const [remaining, setRemaining] = React.useState<RemainingMap>(() =>
        getInitialRemaining(config.data, prefix)
    )
    const [searchQuery, setSearchQuery] = React.useState("")
    const [favorites, setFavorites] = React.useState<string[]>([])
    const [showFavoritesOnly, setShowFavoritesOnly] = React.useState(false)

    React.useEffect(() => {
        setFavorites(loadFavoriteAdhkar())
    }, [])

    const handleDhikrClick = (key: string, maxRepeat: number) => {
        const current = remaining[key] ?? maxRepeat
        if (current <= 0) return

        const newRemaining = current - 1

        // Vibrate on each click
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            try {
                // Short vibration on each click
                navigator.vibrate?.(40)
            } catch {
                // ignore
            }
        }

        incrementDailyDhikr(1)

        setRemaining((prev) => ({
            ...prev,
            [key]: newRemaining,
        }))

        if (newRemaining <= 0 && current > 0 && typeof navigator !== "undefined" && "vibrate" in navigator) {
            try {
                // Longer vibration pattern on completion
                navigator.vibrate?.(100)
            } catch {
                // ignore
            }
        }
    }

    const resetAllCounters = () => {
        setRemaining(getInitialRemaining(config.data, prefix))
    }

    const toggleFavorite = (key: string) => {
        setFavorites((prev) => {
            const next = prev.includes(key)
                ? prev.filter((item) => item !== key)
                : [...prev, key]
            saveFavoriteAdhkar(next)
            dispatchAdhkarToast(
                next.includes(key) ? "تمت إضافة الذكر إلى المفضلة." : "تمت إزالة الذكر من المفضلة.",
                "success"
            )
            return next
        })
    }

    const handleShareImage = async (text: string, bless?: string) => {
        try {
            const result = await shareTextAsImage({
                title: config.title,
                text,
                source: bless,
                filename: `${prefix}-share.png`,
            })
            dispatchAdhkarToast(
                result === "shared" ? "تم فتح نافذة المشاركة." : "تم حفظ صورة الذكر.",
                "success"
            )
        } catch {
            dispatchAdhkarToast("تعذّرت مشاركة الذكر كصورة.", "error")
        }
    }

    // Extract gradient color for accents
    const gradientColor = config.gradient.includes('#f59e0b') ? '#f59e0b' :
        config.gradient.includes('#8b5cf6') ? '#8b5cf6' :
            config.gradient.includes('#10b981') ? '#10b981' : '#6366f1'

    const { toast: adhkarToast, handleClose: handleCloseAdhkarToast } = useAdhkarToastListener()

    // Sort adhkar: incomplete first, completed last
    const sortedAdhkar = React.useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase()

        return config.data.map((dhikr, index) => ({
            dhikr,
            index,
            key: `${prefix}-${index}`,
        })).filter(({ dhikr, key }) => {
            const matchesSearch = !normalizedQuery ||
                dhikr.zekr.toLowerCase().includes(normalizedQuery) ||
                dhikr.bless?.toLowerCase().includes(normalizedQuery)
            const matchesFavorite = !showFavoritesOnly || favorites.includes(key)
            return matchesSearch && matchesFavorite
        }).sort((a, b) => {
            const aRemaining = remaining[a.key] ?? a.dhikr.repeat
            const bRemaining = remaining[b.key] ?? b.dhikr.repeat
            const aIsDone = aRemaining <= 0
            const bIsDone = bRemaining <= 0

            // Incomplete first (false < true), completed last
            if (aIsDone !== bIsDone) {
                return aIsDone ? 1 : -1
            }
            // Keep original order within same status
            return a.index - b.index
        })
    }, [config.data, favorites, remaining, prefix, searchQuery, showFavoritesOnly])

    return (
        <div className="flex justify-center">
            <div className="w-full max-w-4xl">
                <div className="mb-3 grid gap-2 md:grid-cols-[1fr_auto_auto]">
                    <label className="relative block">
                        <span className="sr-only">بحث داخل الأذكار</span>
                        <i className="fas fa-search pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="ابحث داخل الأذكار..."
                            className="h-11 w-full rounded-full border border-border bg-background pr-11 pl-4 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                        />
                    </label>
                    <button
                        type="button"
                        className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${showFavoritesOnly
                            ? "border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
                            : "border-border bg-background hover:bg-accent"
                            }`}
                        onClick={() => setShowFavoritesOnly((prev) => !prev)}
                    >
                        <i className={`${showFavoritesOnly ? "fas" : "far"} fa-heart`} />
                        <span>{showFavoritesOnly ? "عرض الكل" : "المفضلة"}</span>
                    </button>
                    <button
                        type="button"
                        className="flex items-center justify-center rounded-full border border-border bg-background hover:bg-accent hover:text-accent-foreground shadow-sm size-11 transition-colors"
                        onClick={resetAllCounters}
                        title="إعادة تعيين"
                        aria-label="إعادة تعيين العدادات"
                    >
                        <i className="fas fa-rotate-right text-base" />
                    </button>
                </div>

                {/* Main card */}
                <div className="bg-card rounded-2xl shadow-lg overflow-hidden border-0">
                    <div className="p-4 md:p-5 text-white relative" style={{ background: config.gradient }}>
                        <h2 className="text-xl font-bold mb-0 flex items-center gap-3">
                            <div
                                className="rounded-full flex items-center justify-center"
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <i className={`fas fa-${config.icon} text-xl`} />
                            </div>
                            <span>{config.title}</span>
                        </h2>
                    </div>
                    <div className="p-4 md:p-5 bg-muted/50">
                        <div className="flex flex-col gap-4">
                            {sortedAdhkar.length === 0 && (
                                <div className="rounded-xl border border-dashed border-border bg-background p-8 text-center text-muted-foreground">
                                    <i className="fas fa-magnifying-glass text-3xl mb-3 block" />
                                    <p className="mb-1 font-semibold">لا توجد نتائج مطابقة</p>
                                    <p className="mb-0 text-sm">جرّب كلمة أخرى أو ألغِ فلتر المفضلة.</p>
                                </div>
                            )}
                            {sortedAdhkar.map(({ dhikr, key }) => {
                                const remainingCount = remaining[key] ?? dhikr.repeat
                                const isDone = remainingCount <= 0
                                const circleContent = isDone ? "✓" : remainingCount
                                const isFavorite = favorites.includes(key)

                                return (
                                    <div
                                        key={key}
                                        onClick={() => handleDhikrClick(key, dhikr.repeat)}
                                        className="relative"
                                        style={{
                                            cursor: "pointer",
                                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                        }}
                                    >
                                        {/* Accent border on the left */}
                                        <div
                                            className="absolute inset-y-0 right-0 rounded-r-xl"
                                            style={{
                                                width: '5px',
                                                background: isDone ? '#10b981' : gradientColor,
                                                opacity: isDone ? 1 : 0.7,
                                                transition: 'all 0.3s ease',
                                            }}
                                        />

                                        <div
                                            className={`p-4 md:p-5 rounded-xl shadow h-full ${isDone
                                                ? "border-0"
                                                : "border-0"
                                                }`}
                                            style={{
                                                marginLeft: '5px',
                                                backgroundColor: isDone
                                                    ? 'hsl(var(--muted))'
                                                    : 'hsl(var(--background))',
                                                boxShadow: isDone
                                                    ? '0 2px 12px rgba(0, 0, 0, 0.06)'
                                                    : '0 2px 12px rgba(0, 0, 0, 0.08)',
                                                transition: 'all 0.3s ease',
                                                border: isDone ? 'none' : '1px solid hsl(var(--border))',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isDone) {
                                                    e.currentTarget.style.transform = 'translateY(-4px)'
                                                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)'
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isDone) {
                                                    e.currentTarget.style.transform = 'translateY(0)'
                                                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.08)'
                                                }
                                            }}
                                        >
                                            {/* Dhikr text */}
                                            <div className="flex-1 mb-3">
                                                <p
                                                    className="mb-3"
                                                    style={{
                                                        fontSize: '1.4rem',
                                                        lineHeight: '2.2',
                                                        textAlign: 'justify',
                                                        fontFamily: 'var(--font-amiri), Amiri, serif',
                                                        fontWeight: '500',
                                                        color: 'hsl(var(--foreground))',
                                                    }}
                                                >
                                                    {dhikr.zekr}
                                                </p>

                                                {/* Bless text */}
                                                {dhikr.bless && (
                                                    <div
                                                        className="p-3 rounded-xl"
                                                        style={{
                                                            backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                                            borderLeft: '3px solid #10b981',
                                                        }}
                                                    >
                                                        <p className="mb-0 text-emerald-600 font-medium" style={{ fontSize: '0.95rem' }}>
                                                            <i className="fas fa-star ms-2" style={{ fontSize: '0.8rem' }}></i>
                                                            {dhikr.bless}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bottom bar: counter + actions */}
                                            <div className="pt-3 border-t flex justify-between items-center gap-3 flex-wrap">
                                                {/* Repeat counter */}
                                                <div className="flex items-center gap-3">
                                                    <span className="text-muted-foreground font-medium" style={{ fontSize: '0.9rem' }}>
                                                        عدد التكرار
                                                    </span>
                                                    <div
                                                        className="rounded-full inline-flex items-center justify-center font-bold"
                                                        style={{
                                                            width: "38px",
                                                            height: "38px",
                                                            border: `2px solid ${isDone ? '#10b981' : gradientColor}`,
                                                            backgroundColor: isDone ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 0, 0, 0.03)',
                                                            color: isDone ? '#10b981' : gradientColor,
                                                            fontSize: isDone ? '1.1rem' : '0.95rem',
                                                            transition: 'all 0.3s ease',
                                                        }}
                                                    >
                                                        {circleContent}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-accent"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            toggleFavorite(key)
                                                        }}
                                                        aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                                                    >
                                                        <i className={`${isFavorite ? "fas text-red-500" : "far text-muted-foreground"} fa-heart`} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-accent"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleShareImage(dhikr.zekr, dhikr.bless)
                                                        }}
                                                        aria-label="مشاركة كصورة"
                                                    >
                                                        <i className="fas fa-image text-muted-foreground" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-border bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            copyDhikr(dhikr.zekr)
                                                        }}
                                                        style={{
                                                            fontSize: '0.9rem',
                                                        }}
                                                    >
                                                        <i className="fas fa-copy" />
                                                        <span>نسخ</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <FloatingToast
                message={adhkarToast?.message || ''}
                variant={adhkarToast?.variant || 'success'}
                isVisible={adhkarToast !== null}
                onClose={handleCloseAdhkarToast}
                autoCloseMs={3000}
            />
        </div>
    )
}
