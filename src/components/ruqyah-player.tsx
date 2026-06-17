"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

interface RuqyahPlayerProps {
    onBack: () => void
}

interface RuqyahTrack {
    title: string
    description: string
    url: string
    reciter?: string
}

export function RuqyahPlayer({ onBack }: RuqyahPlayerProps) {
    const tracks: RuqyahTrack[] = [
        {
            title: "رقية شرعية - تحصين",
            description: "رقية شرعية للتحصين والحفظ من الشياطين",
            url: "https://soundcloud.com/islamic-media/tahseen",
            reciter: "Islamic Media"
        },
        {
            title: "رقية شرعية شاملة",
            description: "رقية شرعية كاملة للحفظ والشفاء",
            url: "https://soundcloud.com/muslimsaleh/rokyashar3ya",
            reciter: "مسلم صالح"
        },
        {
            title: "رقية شرعية - محمد جودة",
            description: "رقية شرعية بصوت الشيخ محمد جودة",
            url: "https://soundcloud.com/goda-al-king/mohamedgoda",
            reciter: "محمد جودة"
        },
        {
            title: "رقية شرعية للعين والحسد",
            description: "رقية متخصصة للعين والحسد",
            url: "https://soundcloud.com/abo-alazz-971975426/256k-mp3",
            reciter: "رقية شرعية"
        },
        {
            title: "رقية شرعية - محمد عمرو",
            description: "رقية شرعية قوية ومؤثرة",
            url: "https://soundcloud.com/mohamed-amr-915443934/8tkblixnxmx5",
            reciter: "محمد عمرو"
        },
        {
            title: "رقية شرعية للسحر والمس",
            description: "رقية متخصصة للسحر والمس",
            url: "https://soundcloud.com/0c6x6akylngp/mgkslttunqb0",
            reciter: "رقية شرعية"
        },
        {
            title: "رقية شرعية للأطفال - نوم هادئ",
            description: "رقية للأطفال ومغص الرضع بصوت عذب لنوم هادئ",
            url: "https://soundcloud.com/mola-11/192-kbps-mp3",
            reciter: "تلاوة خاشعة"
        },
        {
            title: "رقية شرعية للأطفال - مشاري العفاسي",
            description: "رقية للنوم بهدوء وطمأنينة للأطفال",
            url: "https://soundcloud.com/mahmoud-elnemer7/quran22",
            reciter: "مشاري العفاسي"
        },
        {
            title: "رقية شرعية للأطفال والنوم - ياسر الدوسري",
            description: "رقية شاملة للسحر والحسد ولنوم الأطفال",
            url: "https://soundcloud.com/menna-khater-679139209/9tqjlzzvl3ud",
            reciter: "ياسر الدوسري"
        },
        {
            title: "رقية شرعية كاملة - للحسد والسحر",
            description: "رقية لعلاج الحسد والسحر والقلق والهم",
            url: "https://soundcloud.com/nona-al-425829369/luwbsdto9jjl",
            reciter: "تلاوة مختارة"
        }
    ]

    return (
        <div className="pb-8 animate-fade-in">

            {/* Back Button */}
            <Button
                onClick={onBack}
                variant="outline"
                className="rounded-full mb-4"
            >
                <i className="fas fa-arrow-right ms-2"></i>
                رجوع للمكتبة
            </Button>

            {/* Header */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-8 rounded-xl text-white mb-8 shadow-[0_10px_25px_rgba(139,92,246,0.2)] text-center">
                <div className="mb-3">
                    <i className="fas fa-book-medical text-4xl mb-2 opacity-75 block"></i>
                    <h1 className="font-bold mb-1">رقية شرعية</h1>
                    <p className="opacity-90">آيات وأدعية الرقية الشرعية - مجموعة متنوعة</p>
                </div>
            </div>

            {/* Tracks Grid */}
            <div className="grid gap-6">
                {tracks.map((track, index) => (
                    <div key={index} className="bg-card border border-border rounded-xl p-6 shadow-sm border-2 border-transparent transition-all duration-300 hover:border-purple-500 hover:shadow-[0_8px_16px_rgba(139,92,246,0.15)] hover:-translate-y-0.5">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-[50px] h-[50px] max-md:w-[45px] max-md:h-[45px] bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center text-white text-2xl max-md:text-xl shrink-0">
                                <i className="fas fa-play"></i>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg max-md:text-base font-bold text-foreground m-0 mb-1">{track.title}</h3>
                                <p className="text-sm text-muted-foreground m-0">{track.description}</p>
                                {track.reciter && (
                                    <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-1">
                                        <i className="fas fa-microphone-alt ms-1"></i>
                                        {track.reciter}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SoundCloud Embed */}
                        <div className="w-full rounded-xl overflow-hidden shadow-sm">
                            <iframe
                                width="100%"
                                height="166"
                                scrolling="no"
                                frameBorder="no"
                                allow="autoplay"
                                src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(track.url)}&color=%238b5cf6&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`}
                            ></iframe>
                        </div>
                    </div>
                ))}
            </div>

            {/* Info Section */}
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 mt-8">
                <div className="text-purple-800 dark:text-purple-300 font-bold text-xl mb-4 flex items-center gap-2">
                    <i className="fas fa-info-circle"></i>
                    <span>عن الرقية الشرعية</span>
                </div>
                <div className="text-purple-900 dark:text-purple-200 leading-relaxed text-base">
                    الرقية الشرعية هي التعوذ بالله من الشيطان والاستعانة به في دفع ما يضر العبد، وتكون بقراءة آيات من القرآن الكريم والأدعية المأثورة عن النبي ﷺ. يُنصح بالاستماع في مكان هادئ والتركيز على معاني الآيات.
                </div>

                <div className="mt-3 text-center">
                    <small className="text-muted-foreground">
                        <i className="fas fa-volume-up ms-1"></i>
                        استمع للرقية التي تناسبك وكررها حسب الحاجة
                    </small>
                </div>
            </div>
        </div>
    )
}
