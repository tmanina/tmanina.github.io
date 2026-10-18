"use client"

import * as React from "react"
import { useRadioContext } from "@/contexts/radio-context"
import { FloatingToast } from "@/components/floating-toast"
import type { ToastVariant } from "@/components/floating-toast"

const RADIOS = [
    {
        id: 90000,
        name: "إذاعة القرأن الكريم من القاهرة",
        shortName: "القاهرة",
        url: "https://stream.zeno.fm/ru2hqnplhk7uv",
    },
    {
        id: 90029,
        name: "المنشاوي - اذاعة القران الكريم",
        shortName: "المنشاوي",
        url: "https://radio.alhuwayni.com/listen/alminshawi/radio.mp3",
    },
    {
        id: 90030,
        name: "الرقية الشرعية",
        shortName: "الرقية الشرعية",
        url: "https://qurango.net/radio/roqiah",
    },
]

export function MiniRadioPlayer() {
    const [isPlaying, setIsPlaying] = React.useState(false)
    const [volume, setVolume] = React.useState(0.7)
    const [audioError, setAudioError] = React.useState(false)
    const [isBuffering, setIsBuffering] = React.useState(false)
    const [currentRadioIndex, setCurrentRadioIndex] = React.useState(0)
    const [toast, setToast] = React.useState<{ message: string; variant: ToastVariant } | null>(null)
    const handleCloseToast = React.useCallback(() => setToast(null), [])

    const currentRadio = RADIOS[currentRadioIndex]
    const audioRef = React.useRef<HTMLAudioElement>(null)
    const retryCountRef = React.useRef(0)
    const retryTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const stallTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const wantsPlaybackRef = React.useRef(false)
    const startingPlaybackRef = React.useRef(false)
    const currentRadioRef = React.useRef(currentRadio)
    const playRequestRef = React.useRef(0)
    const prevRadioNameRef = React.useRef(currentRadio.name)
    const { activeRadioId, activeIsPlaying, setActiveRadio } = useRadioContext()

    // Handle volume changes
    React.useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume
        }
    }, [volume])

    const clearRecoveryTimers = React.useCallback(() => {
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
        if (stallTimerRef.current) clearTimeout(stallTimerRef.current)
        retryTimerRef.current = null
        stallTimerRef.current = null
    }, [])

    const stopPlayback = React.useCallback((updateContext: boolean) => {
        wantsPlaybackRef.current = false
        startingPlaybackRef.current = false
        playRequestRef.current++
        clearRecoveryTimers()
        retryCountRef.current = 0
        audioRef.current?.pause()
        setIsPlaying(false)
        setIsBuffering(false)
        if (updateContext) setActiveRadio(currentRadioRef.current.id, false)
    }, [clearRecoveryTimers, setActiveRadio])

    // Retry only while this station is still the one the listener chose.
    const scheduleReconnect = (radio = currentRadioRef.current) => {
        if (!wantsPlaybackRef.current || currentRadioRef.current.id !== radio.id || retryTimerRef.current) return
        if (stallTimerRef.current) clearTimeout(stallTimerRef.current)
        stallTimerRef.current = null

        if (retryCountRef.current >= 5) {
            stopPlayback(true)
            setAudioError(true)
            setToast({ message: 'تعذر إعادة الاتصال بالراديو، اضغط للتشغيل مجددًا', variant: 'warning' })
            return
        }

        const delay = Math.min(2000 * ++retryCountRef.current, 10000)
        setIsPlaying(false)
        setIsBuffering(true)
        retryTimerRef.current = setTimeout(() => {
            retryTimerRef.current = null
            if (!wantsPlaybackRef.current || currentRadioRef.current.id !== radio.id || !audioRef.current) return

            const audio = audioRef.current
            const request = ++playRequestRef.current
            startingPlaybackRef.current = true
            audio.src = radio.url
            audio.load()
            audio.play().then(() => {
                if (request === playRequestRef.current) startingPlaybackRef.current = false
            }).catch((err) => {
                if (request !== playRequestRef.current || !wantsPlaybackRef.current) return
                startingPlaybackRef.current = false
                if (err instanceof DOMException && err.name === 'NotAllowedError') {
                    stopPlayback(true)
                    setAudioError(true)
                    setToast({ message: 'اضغط للتشغيل مجددًا', variant: 'warning' })
                } else {
                    scheduleReconnect(radio)
                }
            })
        }, delay)
    }

    // Sync with RadioContext: pause if another component starts playing a different radio
    React.useEffect(() => {
        if (activeRadioId !== null && activeRadioId !== currentRadio.id && activeIsPlaying) {
            if (wantsPlaybackRef.current) stopPlayback(false)
        }
    }, [activeRadioId, activeIsPlaying, currentRadio.id, stopPlayback])

    const togglePlay = () => {
        if (!audioRef.current) return

        if (wantsPlaybackRef.current) {
            stopPlayback(true)
        } else {
            wantsPlaybackRef.current = true
            currentRadioRef.current = currentRadio
            retryCountRef.current = 0
            clearRecoveryTimers()
            setActiveRadio(currentRadio.id, true)
            setAudioError(false)
            setIsBuffering(true)
            startingPlaybackRef.current = true
            if (audioError || !audioRef.current.src) {
                audioRef.current.src = currentRadio.url
                audioRef.current.load()
            }
            const request = ++playRequestRef.current
            audioRef.current.play()
                .then(() => {
                    if (request !== playRequestRef.current || !wantsPlaybackRef.current) return
                    startingPlaybackRef.current = false
                    setIsPlaying(true)
                    setIsBuffering(false)
                    setAudioError(false)
                    retryCountRef.current = 0
                })
                .catch((err) => {
                    if (request !== playRequestRef.current || !wantsPlaybackRef.current) return
                    startingPlaybackRef.current = false
                    if (err instanceof DOMException && err.name === 'NotAllowedError') {
                        stopPlayback(true)
                        setAudioError(true)
                        setToast({ message: 'اضغط للتشغيل مجددًا', variant: 'warning' })
                    } else {
                        scheduleReconnect(currentRadio)
                    }
                })
        }
    }

    const selectRadio = (index: number) => {
        if (currentRadioIndex === index) return

        const radio = RADIOS[index]
        clearRecoveryTimers()
        retryCountRef.current = 0
        wantsPlaybackRef.current = true
        startingPlaybackRef.current = true
        currentRadioRef.current = radio
        setCurrentRadioIndex(index)

        if (!audioRef.current) return

        playRequestRef.current++
        audioRef.current.pause()
        audioRef.current.src = radio.url
        audioRef.current.load()
        setActiveRadio(radio.id, true)
        setIsBuffering(true)
        setAudioError(false)
        const request = ++playRequestRef.current
        audioRef.current.play()
            .then(() => {
                if (request !== playRequestRef.current || !wantsPlaybackRef.current) return
                startingPlaybackRef.current = false
                setIsPlaying(true)
                setIsBuffering(false)
                setAudioError(false)
                retryCountRef.current = 0
            })
            .catch((err) => {
                if (request !== playRequestRef.current || !wantsPlaybackRef.current) return
                startingPlaybackRef.current = false
                if (err instanceof DOMException && err.name === 'NotAllowedError') {
                    stopPlayback(true)
                    setAudioError(true)
                    setToast({ message: 'اضغط للتشغيل مجددًا', variant: 'warning' })
                } else {
                    scheduleReconnect(radio)
                }
            })
    }

    const renderRadioButtons = () => (
        RADIOS.map((radio, index) => (
            <button
                key={radio.id}
                type="button"
                className={`flex-1 border-0 bg-transparent text-white/50 text-xs font-semibold px-2 py-1 rounded-lg cursor-pointer transition-all duration-300 whitespace-nowrap hover:text-white/80 max-[400px]:text-[0.65rem] max-[400px]:px-[0.35rem] max-[400px]:py-[0.25rem] ${currentRadioIndex === index ? 'bg-amber-500/20 text-[#ffd700] shadow-[0_2px_8px_rgba(255,215,0,0.15)]' : ''}`}
                onClick={() => selectRadio(index)}
            >
                {radio.shortName}
            </button>
        ))
    )

    // Refs for Media Session handlers (defined after togglePlay to avoid TDZ)
    const togglePlayRef = React.useRef(togglePlay)

    React.useEffect(() => {
        togglePlayRef.current = togglePlay
    })

    // Media Session API - show playing info in mobile notification/lock screen
    React.useEffect(() => {
        if (!('mediaSession' in navigator) || activeRadioId !== currentRadio.id) return

        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentRadio.name,
            artist: 'إذاعة القرآن الكريم',
            album: 'راديو القرآن',
            artwork: [
                { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
                { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
            ]
        })

        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'

        // Register handlers — they use refs to always have fresh state
        navigator.mediaSession.setActionHandler('play', () => {
            if (audioRef.current && !wantsPlaybackRef.current) {
                togglePlayRef.current()
            }
        })

        navigator.mediaSession.setActionHandler('pause', () => {
            if (audioRef.current && wantsPlaybackRef.current) {
                togglePlayRef.current()
            }
        })

        navigator.mediaSession.setActionHandler('stop', () => {
            stopPlayback(true)
        })

        return () => {
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = null
                navigator.mediaSession.setActionHandler('play', null)
                navigator.mediaSession.setActionHandler('pause', null)
                navigator.mediaSession.setActionHandler('stop', null)
            }
        }
    }, [isPlaying, currentRadio, activeRadioId, stopPlayback])

    const handleAudioError = () => {
        startingPlaybackRef.current = false
        if (wantsPlaybackRef.current) scheduleReconnect()
    }

    const handleWaiting = () => {
        if (!wantsPlaybackRef.current || stallTimerRef.current) return
        setIsBuffering(true)
        stallTimerRef.current = setTimeout(() => {
            stallTimerRef.current = null
            if (wantsPlaybackRef.current && audioRef.current &&
                audioRef.current.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
                scheduleReconnect()
            }
        }, 15000)
    }

    const handlePlaying = () => {
        if (!wantsPlaybackRef.current) {
            audioRef.current?.pause()
            return
        }
        clearRecoveryTimers()
        retryCountRef.current = 0
        startingPlaybackRef.current = false
        setIsBuffering(false)
        setIsPlaying(true)
        setAudioError(false)

        // Show a notification when a new station starts playing
        if (prevRadioNameRef.current !== currentRadio.name) {
            prevRadioNameRef.current = currentRadio.name
            setToast({
                message: `جاري تشغيل ${currentRadio.name}`,
                variant: 'info',
            })
        }
    }

    const handleEnded = () => {
        startingPlaybackRef.current = false
        if (wantsPlaybackRef.current) scheduleReconnect()
    }

    const handlePause = () => {
        setIsPlaying(false)
        if (wantsPlaybackRef.current && !startingPlaybackRef.current) scheduleReconnect()
    }

    React.useEffect(() => {
        const resumeIfInterrupted = () => {
            if (wantsPlaybackRef.current && audioRef.current &&
                (audioRef.current.paused || audioRef.current.error)) {
                scheduleReconnect()
            }
        }
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') resumeIfInterrupted()
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('online', resumeIfInterrupted)
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('online', resumeIfInterrupted)
        }
    })

    React.useEffect(() => () => {
        wantsPlaybackRef.current = false
        startingPlaybackRef.current = false
        playRequestRef.current++
        clearRecoveryTimers()
    }, [clearRecoveryTimers])

    return (
        <>
            <style>{`
                @keyframes wave {
                    0%, 100% { height: 30%; }
                    50% { height: 85%; }
                }
                .volume-slider-mini::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: #ffd700;
                    cursor: pointer;
                    box-shadow: 0 2px 6px rgba(255, 215, 0, 0.4);
                }
                .volume-slider-mini::-moz-range-thumb {
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: #ffd700;
                    cursor: pointer;
                    border: none;
                }
            `}</style>

            <audio
                ref={audioRef}
                onError={handleAudioError}
                onWaiting={handleWaiting}
                onStalled={handleWaiting}
                onPlaying={handlePlaying}
                onPause={handlePause}
                onEnded={handleEnded}
                crossOrigin="anonymous"
                preload="metadata"
            />

            <div className="bg-gradient-to-br from-[#1a3a2a] to-[#2d5a4b] rounded-2xl p-3 relative overflow-hidden shadow-[0_8px_32px_rgba(26,58,42,0.3)] border border-white/10 md:rounded-[20px] md:px-6 md:py-5">
                {/* Gradient overlay */}
                <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] pointer-events-none" style={{ background: 'radial-gradient(circle at 30% 50%, rgba(255,215,0,0.03) 0%, transparent 50%)' }}></div>
                {/* Mobile layout */}
                <div className="md:hidden">
                    <div className="flex w-full flex-col items-center gap-1 text-center sm:w-auto sm:flex-row sm:items-center sm:gap-4 sm:text-right">
                        <div className="mb-0.5 flex w-full max-w-sm gap-1 bg-white/10 rounded-[10px] p-[3px] [direction:ltr]">
                            {renderRadioButtons()}
                        </div>
                        <h4 className="m-0 max-w-full truncate text-sm font-bold text-white md:max-w-none md:text-base">{currentRadio.name}</h4>
                        <div className="flex items-center justify-center gap-1.5 text-xs text-white/50 md:justify-start">
                            <span className={`w-1.5 h-1.5 rounded-full inline-block ${audioError ? 'bg-red-500' : isBuffering ? 'bg-amber-500 animate-pulse' : isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                            {audioError
                                ? 'تعذر الاتصال - اضغط لإعادة المحاولة'
                                : isBuffering
                                    ? 'جاري التحميل...'
                                    : isPlaying
                                        ? 'يتم البث الآن'
                                        : 'محتاج تفاعل للتشغيل'
                            }
                        </div>
                    </div>
                    <div className="mt-2 flex shrink-0 items-center justify-center gap-3">
                        <button
                            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-gradient-to-br from-[#ffd700] to-[#f59e0b] text-[#1a3a2a] shadow-[0_4px_12px_rgba(255,215,0,0.3)] transition-all duration-300 hover:scale-110 hover:shadow-[0_6px_20px_rgba(255,215,0,0.5)] active:scale-95 max-[400px]:h-9 max-[400px]:w-9 max-[400px]:text-sm md:h-10 md:w-10"
                            onClick={togglePlay}
                            type="button"
                            title={isPlaying || isBuffering ? 'إيقاف' : 'تشغيل'}
                            aria-label={isPlaying || isBuffering ? 'إيقاف الراديو' : 'تشغيل الراديو'}
                        >
                            <i className={`fas ${isPlaying || isBuffering ? 'fa-pause' : 'fa-play'}`} style={{ marginRight: isPlaying || isBuffering ? 0 : '2px' }}></i>
                        </button>
                    </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden md:flex md:items-center md:gap-4">
                    {/* Wave Visualization */}
                    <div className="absolute top-1/2 left-5 w-9 h-9 -translate-y-1/2 pointer-events-none">
                        {[
                            { left: 0, height: isPlaying ? '60%' : '30%', delay: 0 },
                            { left: 8, height: isPlaying ? '80%' : '30%', delay: 0.2 },
                            { left: 16, height: isPlaying ? '50%' : '30%', delay: 0.4 },
                            { left: 24, height: isPlaying ? '70%' : '30%', delay: 0.6 },
                            { left: 32, height: isPlaying ? '45%' : '30%', delay: 0.8 },
                        ].map((bar, i) => (
                            <div
                                key={i}
                                className="absolute bottom-0 w-[4px] bg-gradient-to-t from-[#ffd700] to-[#ffa500] rounded-[2px] transition-all duration-300"
                                style={{
                                    left: bar.left,
                                    height: bar.height,
                                    animation: isPlaying ? `wave 1.2s ease-in-out ${bar.delay}s infinite` : 'none',
                                }}
                            ></div>
                        ))}
                    </div>

                    {/* Radio Info */}
                    <div className="flex flex-col items-center text-center gap-1 w-full sm:flex-row sm:items-center sm:text-right sm:gap-4 sm:w-auto">
                        <div className="hidden md:flex md:w-11 md:h-11 md:bg-amber-500/15 md:rounded-xl md:items-center md:justify-center md:shrink-0 md:border md:border-amber-500/20">
                            <i className="fas fa-broadcast-tower text-[#ffd700] text-xl"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex gap-1.5 bg-white/10 rounded-[10px] p-[3px] mb-1 sm:mb-0 [direction:ltr]">
                                {renderRadioButtons()}
                            </div>
                            <h4 className="text-sm md:text-base font-bold text-white m-0 truncate max-w-full md:max-w-none">{currentRadio.name}</h4>
                            <div className="text-xs text-white/50 flex items-center justify-center gap-1.5 md:justify-start">
                            <span className={`w-1.5 h-1.5 rounded-full inline-block ${audioError ? 'bg-red-500' : isBuffering ? 'bg-amber-500 animate-pulse' : isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                                {audioError
                                    ? 'تعذر الاتصال - اضغط لإعادة المحاولة'
                                    : isBuffering
                                        ? 'جاري التحميل...'
                                        : isPlaying
                                            ? 'يتم البث الآن'
                                            : 'محتاج تفاعل للتشغيل'
                                }
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-3 mt-1 shrink-0">
                        <button
                            className="w-[42px] h-[42px] md:w-10 md:h-10 rounded-full border-0 bg-gradient-to-br from-[#ffd700] to-[#f59e0b] text-[#1a3a2a] flex items-center justify-center cursor-pointer transition-all duration-300 shadow-[0_4px_12px_rgba(255,215,0,0.3)] hover:scale-110 hover:shadow-[0_6px_20px_rgba(255,215,0,0.5)] active:scale-95 shrink-0 max-[400px]:w-[38px] max-[400px]:h-[38px] max-[400px]:text-sm"
                            onClick={togglePlay}
                            type="button"
                            title={isPlaying || isBuffering ? 'إيقاف' : 'تشغيل'}
                            aria-label={isPlaying || isBuffering ? 'إيقاف الراديو' : 'تشغيل الراديو'}
                        >
                            <i className={`fas ${isPlaying || isBuffering ? 'fa-pause' : 'fa-play'}`} style={{ marginRight: isPlaying || isBuffering ? 0 : '2px' }}></i>
                        </button>
                        <div className="items-center gap-2 hidden md:flex">
                            <i className="fas fa-volume-up text-white/50 text-sm"></i>
                            <input
                                type="range"
                                className="w-[70px] h-1 rounded bg-white/15 cursor-pointer appearance-none outline-none"
                                min="0"
                                max="1"
                                step="0.05"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                title="مستوى الصوت"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <FloatingToast
                message={toast?.message || ''}
                variant={toast?.variant || 'info'}
                isVisible={toast !== null}
                onClose={handleCloseToast}
                autoCloseMs={4000}
            />
        </>
    )
}
