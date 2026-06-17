"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FloatingToast } from "@/components/floating-toast"
import type { ToastVariant } from "@/components/floating-toast"
import { duaCategories } from "./dua-data"
import type { DuaCategory } from "./types"
import { shareTextAsImage } from "@/lib/share-image"

const FAV_KEY = "dua-favorites"

function getFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAV_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function toggleFavorite(id: string): string[] {
  const favs = getFavorites()
  const idx = favs.indexOf(id)
  const next = idx === -1 ? [...favs, id] : favs.filter((f) => f !== id)
  localStorage.setItem(FAV_KEY, JSON.stringify(next))
  return next
}

interface DuaLibraryProps {
  onBack?: () => void
}

export function DuaLibrary({ onBack }: DuaLibraryProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlCategory = searchParams.get("id")
  const [internalCategory, setInternalCategory] = React.useState<string | null>(null)

  const selectedCategory = onBack ? internalCategory : urlCategory

  const handleCardClick = (catId: string) => {
    if (onBack) {
      setInternalCategory(catId)
    } else {
      router.push(`?view=dua-library&id=${catId}`)
    }
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleBack = () => {
    if (onBack) {
      setInternalCategory(null)
    } else {
      router.push("?view=dua-library")
    }
  }

  const category = selectedCategory
    ? duaCategories.find((c) => c.id === selectedCategory)
    : null

  return (
    <div className="dua-page">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold gradient-text mb-2">مكتبة الأدعية</h2>
        <p className="text-muted-foreground text-lg">أدعية مأثورة من القرآن والسنة</p>
      </div>

      {!selectedCategory ? (
        <DuaGrid
          categories={duaCategories}
          onCardClick={handleCardClick}
        />
      ) : category ? (
        <DuaDetail
          category={category}
          onBack={handleBack}
        />
      ) : null}
    </div>
  )
}

function DuaGrid({
  categories,
  onCardClick,
}: {
  categories: DuaCategory[]
  onCardClick: (id: string) => void
}) {
  const [favs, setFavs] = React.useState<string[]>([])
  const [showFavsOnly, setShowFavsOnly] = React.useState(false)

  React.useEffect(() => {
    setFavs(getFavorites())
  }, [])

  const visible = showFavsOnly
    ? categories
        .map((cat) => ({
          ...cat,
          items: cat.items.filter((i) => favs.includes(i.id)),
        }))
        .filter((cat) => cat.items.length > 0)
    : categories

  if (showFavsOnly && visible.length === 0) {
    return (
      <div>
        <div className="flex justify-center mb-6">
          <Button
            variant={showFavsOnly ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setShowFavsOnly(!showFavsOnly)}
          >
            <i className={`fas fa-heart ms-2 ${showFavsOnly ? "" : "text-muted-foreground"}`} />
            {showFavsOnly ? "عرض الكل" : "المفضلة"}
          </Button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <i className="fas fa-heart-crack text-4xl mb-3 block" />
          <p>لم تضع أدعية في المفضلة بعد</p>
          <p className="text-sm">اضغط على أيقونة القلب بجانب أي دعاء لإضافته</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-center mb-6">
        <Button
          variant={showFavsOnly ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setShowFavsOnly(!showFavsOnly)}
        >
          <i className={`fas fa-heart ms-2 ${showFavsOnly ? "" : "text-muted-foreground"}`} />
          {showFavsOnly ? "عرض الكل" : "المفضلة"}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visible.map((cat) => (
          <DuaCategoryCard key={cat.id} category={cat} onClick={() => onCardClick(cat.id)} />
        ))}
      </div>
    </div>
  )
}

function DuaCategoryCard({ category, onClick }: { category: DuaCategory; onClick: () => void }) {
  return (
    <div
      className="shadow-md bg-card rounded-2xl border-0 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
      onClick={onClick}
    >
      <div
        className="p-6 text-white text-center"
        style={{ background: category.gradient }}
      >
        <div
          className="rounded-full flex items-center justify-center mx-auto mb-3"
          style={{
            width: "72px",
            height: "72px",
            backgroundColor: "rgba(255,255,255,0.2)",
            backdropFilter: "blur(10px)",
          }}
        >
          <i className={`fas fa-${category.icon} text-2xl`} />
        </div>
        <h3 className="text-xl font-bold mb-1">{category.title}</h3>
        <p className="text-sm opacity-90">{category.items.length} دعاء</p>
      </div>
      <div className="p-4 text-center">
        <button
          className="px-5 py-2 rounded-full border-0 font-semibold text-sm transition-all shadow-sm hover:shadow-md"
          style={{
            background: "hsl(var(--background))",
            color: "hsl(var(--foreground))",
            border: "1px solid hsl(var(--border))",
          }}
          type="button"
        >
          <i className="fas fa-book-open ms-2" />
          عرض الأدعية
        </button>
      </div>
    </div>
  )
}

function DuaDetail({ category, onBack }: { category: DuaCategory; onBack: () => void }) {
  const [favs, setFavs] = React.useState<string[]>([])
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [toast, setToast] = React.useState<{ message: string; variant: ToastVariant } | null>(null)

  React.useEffect(() => {
    setFavs(getFavorites())
  }, [])

  const handleFav = (id: string) => {
    const next = toggleFavorite(id)
    setFavs(next)
    setToast({
      message: next.includes(id) ? "تمت إضافة الدعاء إلى المفضلة." : "تمت إزالة الدعاء من المفضلة.",
      variant: "success",
    })
  }

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setToast({ message: "تم نسخ الدعاء.", variant: "success" })
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      setToast({ message: "تعذّر نسخ الدعاء.", variant: "error" })
    }
  }

  const handleShareImage = async (text: string, source: string) => {
    try {
      const result = await shareTextAsImage({
        title: category.title,
        text,
        source,
        filename: `${category.id}-dua.png`,
      })
      setToast({
        message: result === "shared" ? "تم فتح نافذة المشاركة." : "تم حفظ صورة الدعاء.",
        variant: "success",
      })
    } catch {
      setToast({ message: "تعذّرت مشاركة الدعاء كصورة.", variant: "error" })
    }
  }

  return (
    <div>
      <Button onClick={onBack} variant="outline" className="rounded-full mb-4">
        <i className="fas fa-arrow-right ms-2" />
        رجوع للأقسام
      </Button>

      <div className="bg-card rounded-2xl shadow-lg overflow-hidden border-0">
        <div
          className="p-5 text-white"
          style={{ background: category.gradient }}
        >
          <div className="flex items-center gap-3">
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(10px)",
              }}
            >
              <i className={`fas fa-${category.icon} text-xl`} />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-0">{category.title}</h2>
              <p className="text-sm opacity-90 mb-0">{category.items.length} أدعية</p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-5 bg-muted/50">
          <div className="flex flex-col gap-4">
            {category.items.map((item) => {
              const isFav = favs.includes(item.id)
              const isCopied = copiedId === item.id

              return (
                <div
                  key={item.id}
                  className="p-4 md:p-5 rounded-xl shadow-sm bg-card border border-border"
                >
                  <p
                    className="mb-4"
                    style={{
                      fontSize: "1.3rem",
                      lineHeight: "2.2",
                      textAlign: "justify",
                      fontFamily: "var(--font-amiri), Amiri, serif",
                      fontWeight: "500",
                    }}
                  >
                    {item.text}
                  </p>

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        <i className="fas fa-bookmark" />
                        {item.source}
                      </span>
                      {item.reward && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                          <i className="fas fa-star" />
                          {item.reward}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleFav(item.id)}
                        className="rounded-full p-2 transition-colors hover:bg-accent"
                        aria-label={isFav ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                      >
                        <i className={`${isFav ? "fas" : "far"} fa-heart ${isFav ? "text-red-500" : "text-muted-foreground"}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShareImage(item.text, item.source)}
                        className="rounded-full p-2 transition-colors hover:bg-accent"
                        aria-label="مشاركة الدعاء كصورة"
                      >
                        <i className="fas fa-image text-muted-foreground" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(item.id, item.text)}
                        className="rounded-full p-2 transition-colors hover:bg-accent"
                        aria-label="نسخ الدعاء"
                      >
                        <i className={`fas ${isCopied ? "fa-check text-emerald-500" : "fa-copy text-muted-foreground"}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <FloatingToast
        message={toast?.message || ""}
        variant={toast?.variant || "success"}
        isVisible={toast !== null}
        onClose={() => setToast(null)}
        autoCloseMs={3000}
      />
    </div>
  )
}
