"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

interface LivePlayerProps {
    onBack?: () => void
}

interface StreamOption {
    id: string
    title: string
    source: string
    videoId: string
    description: string
}

const LIVE_STREAMS: StreamOption[] = [
    {
        id: "makkah-official",
        title: "الحرم المكي الشريف (مكة المكرمة)",
        source: "قناة القرآن الكريم",
        videoId: "Hr7uPQSmHzM",
        description: "بث مباشر على مدار الساعة من الحرم المكي الشريف والكعبة المشرفة",
    },
    {
        id: "madinah-live",
        title: "المسجد النبوي الشريف (المدينة المنورة)",
        source: "قناة السنة النبوية",
        videoId: "lQBg27EEjNE",
        description: "بث مباشر على مدار الساعة من المسجد النبوي الشريف بالمدينة المنورة",
    },
]

export function LivePlayer({ onBack }: LivePlayerProps) {
    const [selectedStreamId, setSelectedStreamId] = React.useState<string>("makkah-official")
    const [reloadKey, setReloadKey] = React.useState<number>(0)

    const activeStream =
        LIVE_STREAMS.find((s) => s.id === selectedStreamId) || LIVE_STREAMS[0]

    const handleRefresh = () => {
        setReloadKey((prev) => prev + 1)
    }

    return (
        <div className="py-4 animate-fade-in">
            {/* Back Button */}
            {onBack && (
                <Button
                    onClick={onBack}
                    variant="outline"
                    className="rounded-full mb-4 flex items-center gap-2 hover:bg-muted"
                >
                    <i className="fas fa-arrow-right"></i>
                    <span>العودة إلى المكتبة</span>
                </Button>
            )}

            {/* Header Banner */}
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-700 text-white p-6 md:p-8 rounded-2xl mb-6 shadow-lg shadow-red-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="size-9 rounded-xl bg-white/20 flex items-center justify-center text-lg shadow-inner">
                                <i className="fas fa-video"></i>
                            </span>
                            <h1 className="text-2xl md:text-3xl font-extrabold m-0">بث مباشر الحرم المكي الشريف</h1>
                            <span className="inline-flex items-center gap-2 text-xs md:text-sm bg-white/20 backdrop-blur-sm px-3.5 py-1 rounded-full font-bold">
                                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></span>
                                مباشر الآن 24/7
                            </span>
                        </div>
                        <p className="text-white/90 text-sm md:text-base m-0 leading-relaxed">
                            {activeStream.description}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleRefresh}
                            className="bg-white/20 hover:bg-white/30 text-white border-white/20 rounded-xl flex items-center gap-1.5 text-xs font-bold"
                            title="إعادة تحميل البث"
                        >
                            <i className="fas fa-rotate-right"></i>
                            <span>تحديث البث</span>
                        </Button>
                        <a
                            href={`https://www.youtube.com/watch?v=${activeStream.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-white text-red-600 hover:bg-white/90 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition-colors"
                        >
                            <i className="fab fa-youtube text-sm"></i>
                            <span>فتح في يوتيوب</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Stream Selector Tabs */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
                {LIVE_STREAMS.map((stream) => {
                    const isSelected = stream.id === activeStream.id
                    return (
                        <button
                            key={stream.id}
                            type="button"
                            onClick={() => setSelectedStreamId(stream.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border ${
                                isSelected
                                    ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20"
                                    : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                            }`}
                        >
                            <i className={`fas ${isSelected ? "fa-circle-play" : "fa-tv"}`}></i>
                            <span>{stream.title}</span>
                        </button>
                    )
                })}
            </div>

            {/* Video Player */}
            <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-sm">
                <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-xl bg-black shadow-inner">
                    <iframe
                        key={`${activeStream.videoId}-${reloadKey}`}
                        className="absolute top-0 left-0 w-full h-full border-0"
                        src={`https://www.youtube.com/embed/${activeStream.videoId}?autoplay=1&mute=1`}
                        title={activeStream.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                    ></iframe>
                </div>

                <div className="mt-4 pt-3 border-t border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 font-semibold">
                        <i className="fas fa-tower-broadcast text-red-500"></i>
                        <span>المصدر: {activeStream.source}</span>
                    </div>
                    <span className="text-muted-foreground/80">
                        إذا واجهتك مشكلة في تشغيل البث، يمكنك التبديل إلى القناة البديلة أو الضغط على زر &quot;تحديث البث&quot;.
                    </span>
                </div>
            </div>
        </div>
    )
}
