"use client"

import * as React from "react"

interface LivePlayerProps {
    onBack?: () => void
}

export function LivePlayer({ onBack }: LivePlayerProps) {
    return (
        <div className="py-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-8 rounded-2xl mb-8 shadow-lg shadow-red-500/30">
                <h2 className="text-2xl md:text-3xl font-bold m-0 mb-2 flex items-center gap-4 max-md:flex-col max-md:items-start">
                    <i className="fas fa-video"></i>
                    بث مباشر
                    <span className="inline-flex items-center gap-2 text-base bg-white/20 px-4 py-1.5 rounded-full">
                        <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></span>
                        مباشر
                    </span>
                </h2>
                <p className="text-base opacity-95 m-0">الحرم المكي - بث مباشر</p>
            </div>

            {/* Video Player */}
            <div className="bg-card border border-border rounded-xl p-6 max-md:p-4">
                <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-xl">
                    <iframe
                        className="absolute top-0 left-0 w-full h-full border-0"
                        src="https://www.youtube.com/embed/PfrBk8tPF7c?autoplay=1&mute=1"
                        title="بث مباشر || قناة القرآن الكريم Makkah Live"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                    ></iframe>
                </div>
            </div>
        </div>
    )
}
