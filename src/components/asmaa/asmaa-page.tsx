"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { asmaaData } from "./asmaa-data"
import type { AsmaaItem } from "./asmaa-data"

const gradients = [
  "linear-gradient(135deg, #667eea, #764ba2)",
  "linear-gradient(135deg, #f093fb, #f5576c)",
  "linear-gradient(135deg, #4facfe, #00f2fe)",
  "linear-gradient(135deg, #43e97b, #38f9d7)",
  "linear-gradient(135deg, #fa709a, #fee140)",
  "linear-gradient(135deg, #a18cd1, #fbc2eb)",
  "linear-gradient(135deg, #fccb90, #d57eeb)",
  "linear-gradient(135deg, #e0c3fc, #8ec5fc)",
  "linear-gradient(135deg, #f5576c, #ff6f91)",
  "linear-gradient(135deg, #667eea, #764ba2)",
  "linear-gradient(135deg, #89f7fe, #66a6ff)",
  "linear-gradient(135deg, #fddb92, #d1fdff)",
]

function nameGradient(id: number) {
  return gradients[id % gradients.length]
}

function getFavs(): number[] {
  try {
    const raw = localStorage.getItem("asmaa-favorites")
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function toggleFav(id: number): number[] {
  const favs = getFavs()
  const idx = favs.indexOf(id)
  const next = idx === -1 ? [...favs, id] : favs.filter((f) => f !== id)
  localStorage.setItem("asmaa-favorites", JSON.stringify(next))
  return next
}

const TASBIH_KEY = "asmaa-tasbih"

function getCounts(): Record<number, number> {
  try {
    const raw = localStorage.getItem(TASBIH_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function incrementCount(id: number): Record<number, number> {
  const counts = getCounts()
  counts[id] = (counts[id] || 0) + 1
  localStorage.setItem(TASBIH_KEY, JSON.stringify(counts))
  return { ...counts }
}

function resetCount(id: number): Record<number, number> {
  const counts = getCounts()
  delete counts[id]
  localStorage.setItem(TASBIH_KEY, JSON.stringify(counts))
  return { ...counts }
}

interface AsmaaPageProps {
  onBack?: () => void
}

export function AsmaaPage({ onBack }: AsmaaPageProps) {
  const [selectedId, setSelectedId] = React.useState<number | null>(null)

  const selected = selectedId ? asmaaData.find((a) => a.id === selectedId) : null

  return (
    <div>
      {!selected ? (
        <AsmaaGrid onSelect={setSelectedId} />
      ) : (
        <AsmaaDetail item={selected} onBack={() => setSelectedId(null)} />
      )}
    </div>
  )
}

function AsmaaGrid({ onSelect }: { onSelect: (id: number) => void }) {
  const [favs, setFavs] = React.useState<number[]>([])
  const [showFavsOnly, setShowFavsOnly] = React.useState(false)

  React.useEffect(() => { setFavs(getFavs()) }, [])

  const display = showFavsOnly ? asmaaData.filter((a) => favs.includes(a.id)) : asmaaData

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold gradient-text mb-2">أسماء الله الحسنى</h2>
        <p className="text-muted-foreground text-lg">{showFavsOnly ? display.length : 99} اسماً</p>
      </div>

      <div className="flex justify-center gap-2 mb-6 flex-wrap">
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

      {showFavsOnly && display.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <i className="fas fa-heart-crack text-4xl mb-3 block" />
          <p>لم تضف أسماء إلى المفضلة بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {display.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl overflow-hidden shadow-md cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl bg-card border border-border"
              onClick={() => onSelect(item.id)}
            >
              <div
                className="p-5 text-white text-center"
                style={{ background: nameGradient(item.id) }}
              >
                <div className="text-3xl font-bold mb-2 leading-relaxed">{item.name}</div>
                <div className="text-sm opacity-90">{item.transliteration}</div>
              </div>
              <div className="p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{item.meaning}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AsmaaDetail({ item, onBack }: { item: AsmaaItem; onBack: () => void }) {
  const [count, setCount] = React.useState(0)
  const [favs, setFavs] = React.useState<number[]>([])
  const [showShare, setShowShare] = React.useState(false)

  React.useEffect(() => {
    const counts = getCounts()
    setCount(counts[item.id] || 0)
    setFavs(getFavs())
  }, [item.id])

  const handleCount = () => {
    const next = incrementCount(item.id)
    setCount(next[item.id] || 0)
  }

  const handleReset = () => {
    const next = resetCount(item.id)
    setCount(next[item.id] || 0)
  }

  const isFav = favs.includes(item.id)

  const handleFav = () => {
    const next = toggleFav(item.id)
    setFavs(next)
  }

  const shareText = `﷽\n${item.name} (${item.transliteration})\n${item.meaning}\n${item.verse || ""}\n\nمن أسماء الله الحسنى - تطبيق طمأنينة`

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: item.name, text: shareText })
        return
      } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(shareText)
    } catch { /* ignore */ }
    setShowShare(true)
    setTimeout(() => setShowShare(false), 2500)
  }

  const bgGrad = nameGradient(item.id)

  return (
    <div>
      <Button onClick={onBack} variant="outline" className="rounded-full mb-4">
        <i className="fas fa-arrow-right ms-2" />
        رجوع للأسماء
      </Button>

      {/* Header card */}
      <div
        className="rounded-2xl overflow-hidden shadow-lg mb-6 text-white text-center"
        style={{ background: bgGrad }}
      >
        <div className="p-8 md:p-10">
          <div className="text-5xl md:text-6xl font-bold mb-3 leading-relaxed">{item.name}</div>
          <div className="text-lg opacity-90 mb-1">{item.transliteration}</div>
          <div className="w-16 h-0.5 bg-white/40 mx-auto my-4 rounded-full" />
          <p className="text-base md:text-lg opacity-95 leading-relaxed max-w-lg mx-auto">{item.meaning}</p>
        </div>
      </div>

      {/* Verse */}
      {item.verse && (
        <div className="bg-card rounded-xl shadow-sm border border-border p-4 mb-4">
          <div className="flex items-start gap-3">
            <i className="fas fa-quote-right text-primary text-lg mt-1" />
            <p className="mb-0 text-sm leading-relaxed">{item.verse}</p>
          </div>
        </div>
      )}

      {/* Tasbih counter */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-5 mb-4">
        <div className="text-center">
          <div className="text-muted-foreground text-sm mb-2">
            <i className="fas fa-repeat ms-1" />
            عدد التسبيح
          </div>
          <div
            className="text-5xl font-bold mb-4 cursor-pointer select-none transition-transform active:scale-110"
            style={{ color: "hsl(var(--foreground))" }}
            onClick={handleCount}
          >
            {count}
          </div>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={handleCount}
              className="rounded-full px-6 py-2 text-sm font-medium text-white border-0 transition-all hover:scale-105 active:scale-95"
              style={{ background: bgGrad }}
            >
              <i className="fas fa-plus ms-1" />
              تسبيحة
            </button>
            {count > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full px-4 py-2 text-sm font-medium border border-border bg-background text-muted-foreground transition-all hover:bg-accent"
              >
                <i className="fas fa-undo ms-1" />
                إعادة
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={handleFav}
          className="rounded-full px-5 py-2.5 text-sm font-medium border border-border bg-card transition-all hover:bg-accent"
        >
          <i className={`${isFav ? "fas" : "far"} fa-heart ms-1 ${isFav ? "text-red-500" : ""}`} />
          {isFav ? "إزالة من المفضلة" : "أضف إلى المفضلة"}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="rounded-full px-5 py-2.5 text-sm font-medium border-0 text-white transition-all hover:scale-105 active:scale-95"
          style={{ background: bgGrad }}
        >
          <i className="fas fa-share-nodes ms-1" />
          مشاركة
        </button>
      </div>

      {/* Share toast */}
      {showShare && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-full shadow-lg text-sm animate-fade-in">
          <i className="fas fa-check ms-1" />
          تم نسخ النص، يمكنك لصقه الآن
        </div>
      )}
    </div>
  )
}
