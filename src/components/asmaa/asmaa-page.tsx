"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { asmaaData } from "./asmaa-data"
import type { AsmaaItem } from "./asmaa-data"
import { FloatingToast } from "@/components/floating-toast"

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

const trustedSources = [
  {
    title: "شرح حديث: إن لله تسعة وتسعين اسمًا",
    publisher: "الدرر السنية",
    href: "https://dorar.net/hadith/sharh/113822",
  },
  {
    title: "صحة حديث: إن لله تسعة وتسعين اسمًا",
    publisher: "موقع الشيخ ابن باز",
    href: "https://binbaz.org.sa/fatwas/8972/%D9%85%D8%A7-%D8%B5%D8%AD%D8%A9-%D8%AD%D8%AF%D9%8A%D8%AB-%D8%A7%D9%86-%D9%84%D9%84%D9%87-%D8%AA%D8%B3%D8%B9%D8%A9-%D9%88%D8%AA%D8%B3%D8%B9%D9%8A%D9%86-%D8%A7%D8%B3%D9%85%D8%A7",
  },
  {
    title: "أسماء الله الحسنى لا تنحصر بعدد معين",
    publisher: "إسلام ويب",
    href: "https://www.islamweb.net/ar/fatwa/97032/%D8%A3%D8%B3%D9%85%D8%A7%D8%A1-%D8%A7%D9%84%D9%84%D9%87-%D8%A7%D9%84%D8%AD%D8%B3%D9%86%D9%89-%D9%84%D8%A7-%D8%AA%D9%86%D8%AD%D8%B5%D8%B1-%D8%A8%D8%B9%D8%AF%D8%AF-%D9%85%D8%B9%D9%8A%D9%86",
  },
]

const explanationPrinciples = [
  {
    title: "الإحصاء ليس عدًّا فقط",
    body: "يدخل في إحصاء الأسماء حفظها، وفهم معانيها، وتدبر آثارها، والعمل بما تقتضيه من تعظيم الله ودعائه بها.",
  },
  {
    title: "الأسماء باب معرفة الله",
    body: "كل اسم من أسماء الله يدل على كمال يليق بالله سبحانه، فيزداد به العبد تعظيمًا ومحبة ورجاء وخوفًا.",
  },
  {
    title: "الدعاء بها من العمل بها",
    body: "من الانتفاع بالاسم أن يدعو العبد ربه به دعاء يناسب معناه، مع الأدب والافتقار وحسن الظن بالله.",
  },
]

function buildNameInsights(item: AsmaaItem) {
  return [
    {
      title: "المعنى العقدي",
      body: `يدل اسم ${item.name} على معنى من معاني الكمال لله تعالى: ${item.meaning}. وهذا المعنى يثبت لله على وجه يليق بجلاله، بلا تشبيه ولا تمثيل ولا نقص.`,
    },
    {
      title: "أثر الإيمان بالاسم",
      body: "كلما فهم العبد هذا الاسم ازداد قلبه تعلقًا بالله، واستحضر أن أمره كله بيد ربه، فيظهر أثر ذلك في الدعاء والتوكل وحسن العبادة.",
    },
    {
      title: "تأمل عملي",
      body: item.verse
        ? `اقرأ الشاهد القرآني المرتبط بهذا الاسم، ثم اسأل نفسك: ما الصفة التي يعرّفني الله بها هنا؟ وكيف يظهر أثرها في عبادتي وسلوكي اليوم؟`
        : "تأمل المعنى المختصر، ثم اربطه بموقف عملي من يومك: دعاء، شكر، صبر، توبة، أو حسن توكل.",
    },
    {
      title: "دعاء مناسب",
      body: `اللهم إني أسألك باسمك ${item.name} أن تملأ قلبي بمعرفتك وتعظيمك، وأن تجعلني ممن يدعوك بأسمائك الحسنى ويعمل بما يرضيك.`,
    },
  ]
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

export function AsmaaPage() {
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
  const [query, setQuery] = React.useState("")

  React.useEffect(() => { setFavs(getFavs()) }, [])

  const normalizedQuery = query.trim().toLowerCase()
  const filtered = normalizedQuery
    ? asmaaData.filter((item) => {
      return (
        item.name.includes(query.trim()) ||
        item.meaning.includes(query.trim()) ||
        item.transliteration.toLowerCase().includes(normalizedQuery)
      )
    })
    : asmaaData
  const display = showFavsOnly ? filtered.filter((a) => favs.includes(a.id)) : filtered

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
        <div className="relative bg-gradient-to-br from-[#143f39] via-[#1f6f61] to-[#d4a574] p-5 text-center text-white md:p-7">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/18 text-2xl shadow-sm backdrop-blur">
            <i className="fas fa-gem"></i>
          </div>
          <h2 className="mb-2 text-2xl font-extrabold md:text-3xl">أسماء الله الحسنى</h2>
          <p className="mx-auto mb-0 max-w-2xl text-sm font-medium leading-7 text-white/88 md:text-base">
            تعرّف على المعنى المختصر، وتأمل الاسم، واحفظ ما يلمس قلبك في المفضلة.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-white/20 bg-white/12 px-3 py-2 backdrop-blur">
              <div className="text-xl font-bold">99</div>
              <div className="text-[0.7rem] text-white/75">اسمًا</div>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/12 px-3 py-2 backdrop-blur">
              <div className="text-xl font-bold">{favs.length}</div>
              <div className="text-[0.7rem] text-white/75">مفضلة</div>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/12 px-3 py-2 backdrop-blur">
              <div className="text-xl font-bold">{display.length}</div>
              <div className="text-[0.7rem] text-white/75">معروض</div>
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">بحث في أسماء الله الحسنى</span>
            <i className="fas fa-search absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground"></i>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث بالاسم أو المعنى..."
              className="h-12 w-full rounded-xl border border-input bg-background px-4 pe-4 ps-11 text-sm text-foreground outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </label>
          <Button
            variant={showFavsOnly ? "default" : "outline"}
            size="sm"
            className="h-12 rounded-xl px-5"
            onClick={() => setShowFavsOnly(!showFavsOnly)}
          >
            <i className={`fas fa-heart ms-2 ${showFavsOnly ? "" : "text-muted-foreground"}`} />
            {showFavsOnly ? "عرض الكل" : "المفضلة"}
          </Button>
        </div>
      </div>

      {showFavsOnly && display.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card py-12 text-center text-muted-foreground">
          <i className="fas fa-heart-crack text-4xl mb-3 block" />
          <p>لم تضف أسماء إلى المفضلة بعد</p>
        </div>
      ) : display.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card py-12 text-center text-muted-foreground">
          <i className="fas fa-magnifying-glass text-4xl mb-3 block" />
          <p>لا توجد نتائج مطابقة لهذا البحث</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {display.map((item) => (
            <button
              key={item.id}
              type="button"
              className="group overflow-hidden rounded-2xl border border-border bg-card text-right shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              onClick={() => onSelect(item.id)}
            >
              <div
                className="relative p-5 text-white text-center"
                style={{ background: nameGradient(item.id) }}
              >
                <span className="absolute end-3 top-3 rounded-full bg-white/20 px-2 py-1 text-xs font-bold backdrop-blur">
                  {item.id}
                </span>
                <div className="text-3xl font-bold mb-2 leading-relaxed">{item.name}</div>
                <div className="text-sm opacity-90">{item.transliteration}</div>
              </div>
              <div className="p-4">
                <p className="mb-3 text-sm leading-7 text-card-foreground">{item.meaning}</p>
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  <i className="fas fa-arrow-left-long transition-transform group-hover:-translate-x-1"></i>
                  اقرأ الشرح
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AsmaaDetail({ item, onBack }: { item: AsmaaItem; onBack: () => void }) {
  const [count, setCount] = React.useState(0)
  const [favs, setFavs] = React.useState<number[]>([])
  const [shareToastVisible, setShareToastVisible] = React.useState(false)

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
    setShareToastVisible(true)
  }

  const bgGrad = nameGradient(item.id)
  const nameInsights = buildNameInsights(item)

  return (
    <div>
      <Button onClick={onBack} variant="outline" className="rounded-full mb-4">
        <i className="fas fa-arrow-right ms-2" />
        رجوع للأسماء
      </Button>

      {/* Header card */}
      <div
        className="rounded-2xl overflow-hidden shadow-lg mb-4 text-white text-center"
        style={{ background: bgGrad }}
      >
        <div className="p-8 md:p-10">
          <div className="text-5xl md:text-6xl font-bold mb-3 leading-relaxed">{item.name}</div>
          <div className="text-lg opacity-90 mb-1">{item.transliteration}</div>
          <div className="w-16 h-0.5 bg-white/40 mx-auto my-4 rounded-full" />
          <p className="text-base md:text-lg opacity-95 leading-relaxed max-w-lg mx-auto">{item.meaning}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <i className="fas fa-book-open text-amber-600 dark:text-amber-300"></i>
              مختصر المعنى
            </h3>
            <p className="mb-0 text-sm leading-8 text-card-foreground">{item.meaning}</p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <i className="fas fa-layer-group text-emerald-600 dark:text-emerald-300"></i>
              شرح أعمق للاسم
            </h3>
            <div className="space-y-3">
              {nameInsights.map((insight) => (
                <div
                  key={insight.title}
                  className="rounded-xl border border-border bg-background p-4"
                >
                  <h4 className="mb-2 text-sm font-bold text-card-foreground">
                    {insight.title}
                  </h4>
                  <p className="mb-0 text-sm leading-8 text-muted-foreground">
                    {insight.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {item.verse && (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
                <i className="fas fa-quote-right text-emerald-600 dark:text-emerald-300"></i>
                شاهد من القرآن
              </h3>
              <p className="mb-0 text-sm leading-8 text-card-foreground">{item.verse}</p>
            </section>
          )}

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <i className="fas fa-lightbulb text-sky-600 dark:text-sky-300"></i>
              طريقة الانتفاع
            </h3>
            <p className="mb-0 text-sm leading-8 text-muted-foreground">
              المقصود بإحصاء أسماء الله ليس مجرد العد فقط، بل حفظها وفهم معانيها والعمل بما تقتضيه من تعظيم الله ودعائه بها.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <i className="fas fa-compass text-amber-600 dark:text-amber-300"></i>
              منهج موثوق في الفهم
            </h3>
            <div className="grid gap-3 md:grid-cols-3">
              {explanationPrinciples.map((principle) => (
                <div
                  key={principle.title}
                  className="rounded-xl border border-border bg-background p-4"
                >
                  <h4 className="mb-2 text-sm font-bold text-card-foreground">
                    {principle.title}
                  </h4>
                  <p className="mb-0 text-xs leading-7 text-muted-foreground">
                    {principle.body}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          {/* Tasbih counter */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
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

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <i className="fas fa-shield-halved text-amber-600 dark:text-amber-300"></i>
              مصادر موثوقة
            </h3>
            <div className="space-y-2">
              {trustedSources.map((source) => (
                <a
                  key={source.href}
                  href={source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border border-border bg-background p-3 text-sm transition hover:border-amber-500/50 hover:bg-amber-500/10"
                >
                  <span className="block font-bold text-card-foreground">{source.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{source.publisher}</span>
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex justify-center gap-3">
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

      <FloatingToast
        message="تم نسخ النص، يمكنك لصقه الآن"
        variant="success"
        isVisible={shareToastVisible}
        onClose={() => setShareToastVisible(false)}
      />
    </div>
  )
}
