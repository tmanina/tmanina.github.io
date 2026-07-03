"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRadioContext } from "@/contexts/radio-context"
import { Button } from "@/components/ui/button"
import { FloatingToast } from "@/components/floating-toast"
import type { ToastVariant } from "@/components/floating-toast"
import {
    type Radio,
    categories as categoryList,
    manualRadios,
    RADIOS_API_URL,
    categorizeRadio as categorizeRadioFn,
    getCategoryIcon as getCategoryIconFn,
} from "./radio-player-data"

interface RadioPlayerProps {
    onBack?: () => void
}

export function RadioPlayer({ onBack }: RadioPlayerProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { activeRadioId, activeIsPlaying, setActiveRadio } = useRadioContext()
    const selectedCategory = searchParams.get("category")

    const [radios, setRadios] = React.useState<Radio[]>([])
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [playingRadio, setPlayingRadio] = React.useState<Radio | null>(null)
    const [isPlaying, setIsPlaying] = React.useState(false)
    const [volume, setVolume] = React.useState(0.7)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [toast, setToast] = React.useState<{ message: string; variant: ToastVariant } | null>(null)
    const handleCloseToast = React.useCallback(() => setToast(null), [])

    const audioRef = React.useRef<HTMLAudioElement>(null)
    const playingRadioRef = React.useRef(playingRadio)
    playingRadioRef.current = playingRadio
    const isPlayingRef = React.useRef(isPlaying)
    isPlayingRef.current = isPlaying

    const categories = categoryList

    React.useEffect(() => {
        fetchRadios()
    }, [])

    React.useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume
        }
    }, [volume])

    // Setup Media Session API for background playback and notifications
    React.useEffect(() => {
        if ('mediaSession' in navigator && playingRadio && isPlaying) {
            // Get the category name for the current radio
            const categoryId = categorizeRadioFn(playingRadio)
            const category = categories.find(c => c.id === categoryId)

            navigator.mediaSession.metadata = new MediaMetadata({
                title: playingRadio.name,
                artist: 'إذاعة القرآن الكريم',
                album: category?.name || 'مكتبة الإذاعات',
                artwork: [
                    { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
                ]
            })

            // Set playback state
            navigator.mediaSession.playbackState = 'playing'

            // Play Handler
            navigator.mediaSession.setActionHandler('play', () => {
                if (audioRef.current) {
                    audioRef.current.play().catch(() => setIsPlaying(false))
                    setIsPlaying(true)
                }
            })

            // Pause Handler
            navigator.mediaSession.setActionHandler('pause', () => {
                if (audioRef.current) {
                    audioRef.current.pause()
                    setIsPlaying(false)
                }
            })

            // Stop Handler
            navigator.mediaSession.setActionHandler('stop', () => {
                stopRadio()
            })
        } else if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = playingRadio ? 'paused' : 'none'
        }

        // Cleanup on unmount or when radio stops
        return () => {
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = null
                navigator.mediaSession.setActionHandler('play', null)
                navigator.mediaSession.setActionHandler('pause', null)
                navigator.mediaSession.setActionHandler('stop', null)
            }
        }
    }, [playingRadio, isPlaying])

    // Keep audio playing in background - handle visibility change
    React.useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && playingRadio && isPlaying) {
                // Tab became visible - check if audio is still playing
                if (audioRef.current && audioRef.current.paused) {
                    audioRef.current.play().catch((err) => {
                        // Try to reload the stream
                        if (audioRef.current && playingRadio) {
                            audioRef.current.src = playingRadio.url
                            audioRef.current.load()
                            audioRef.current.play().catch(() => setIsPlaying(false))
                        }
                    })
                }
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [playingRadio, isPlaying])

    // Auto-reconnect on audio stall or error
    React.useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        let reconnectAttempts = 0
        const maxReconnectAttempts = 5
        let reconnectTimeout: NodeJS.Timeout | null = null

        const handleStalled = () => {
            if (playingRadio && isPlaying && reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++
                // Try to reload the stream
                reconnectTimeout = setTimeout(() => {
                    if (audio && playingRadio) {
                        const currentSrc = playingRadio.url
                        audio.src = ''
                        audio.load()
                        audio.src = currentSrc
                        audio.play().catch(() => {})
                    }
                }, 1000 * reconnectAttempts) // Exponential backoff
            }
        }

        const handleError = () => {
            if (playingRadio && isPlaying && reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++
                reconnectTimeout = setTimeout(() => {
                    if (audio && playingRadio) {
                        audio.src = playingRadio.url
                        audio.load()
                        audio.play().catch(() => {
                            setIsPlaying(false)
                        })
                    }
                }, 2000 * reconnectAttempts)
            } else if (reconnectAttempts >= maxReconnectAttempts) {
                setIsPlaying(false)
            }
        }

        const handlePlaying = () => {
            // Reset reconnect attempts when playback starts
            reconnectAttempts = 0
        }

        audio.addEventListener('stalled', handleStalled)
        audio.addEventListener('error', handleError)
        audio.addEventListener('playing', handlePlaying)

        return () => {
            if (reconnectTimeout) clearTimeout(reconnectTimeout)
            audio.removeEventListener('stalled', handleStalled)
            audio.removeEventListener('error', handleError)
            audio.removeEventListener('playing', handlePlaying)
        }
    }, [playingRadio, isPlaying])

    // Keep-alive ping - prevent browser from suspending audio
    React.useEffect(() => {
        if (!playingRadio || !isPlaying) return

        // Create a periodic check every 30 seconds to keep the connection alive
        const keepAliveInterval = setInterval(() => {
            if (audioRef.current && isPlaying) {
                // Check if audio is actually playing
                if (audioRef.current.paused) {
                    audioRef.current.play().catch(() => {
                        // Try to reload the stream
                        if (playingRadio) {
                            audioRef.current!.src = playingRadio.url
                            audioRef.current!.load()
                            audioRef.current!.play().catch(() => setIsPlaying(false))
                        }
                    })
                }
            }
        }, 30000) // Check every 30 seconds

        return () => clearInterval(keepAliveInterval)
    }, [playingRadio, isPlaying])

    // Sync with RadioContext: stop if another component starts playing a different radio
    React.useEffect(() => {
        if (activeRadioId !== null && activeRadioId !== (playingRadioRef.current?.id ?? -1) && activeIsPlaying) {
            if (audioRef.current && isPlayingRef.current) {
                audioRef.current.pause()
                audioRef.current.src = ""
                setPlayingRadio(null)
                setIsPlaying(false)
            }
        }
    }, [activeRadioId, activeIsPlaying])

    const fetchRadios = async () => {
        try {
            setLoading(true)

            const response = await fetch(RADIOS_API_URL)
            if (!response.ok) throw new Error("فشل تحميل الإذاعات")
            const data = await response.json()
            setRadios([...manualRadios, ...(data.radios || [])])
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ ما")
        } finally {
            setLoading(false)
        }
    }

    const getRadiosByCategory = (categoryId: string): Radio[] => {
        return radios.filter(radio => categorizeRadioFn(radio) === categoryId)
    }

    const getCategoryRadios = (): Radio[] => {
        if (!selectedCategory) return []
        return getRadiosByCategory(selectedCategory)
    }

    const filteredRadios = getCategoryRadios().filter(radio =>
        radio.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const playRadio = (radio: Radio) => {
        setActiveRadio(radio.id, true)
        if (playingRadio?.id === radio.id) {
            togglePlayPause()
        } else {
            setPlayingRadio(radio)
            setIsPlaying(true)
            if (audioRef.current) {
                audioRef.current.src = radio.url
                audioRef.current.play().catch(() => setIsPlaying(false))
            }
            setToast({
                message: `جاري تشغيل ${radio.name}`,
                variant: 'info',
            })
        }
    }

    const togglePlayPause = () => {
        if (!audioRef.current) return

        if (isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
            if (playingRadio) setActiveRadio(playingRadio.id, false)
        } else {
            if (playingRadio) setActiveRadio(playingRadio.id, true)
            audioRef.current.play().catch(() => setIsPlaying(false))
            setIsPlaying(true)
        }
    }

    const stopRadio = () => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.src = ""
        }
        setPlayingRadio(null)
        setIsPlaying(false)
        setActiveRadio(null, false)
    }

    const handleCategorySelect = (categoryId: string) => {
        router.push(`?view=media&id=radio&category=${categoryId}`)
        setSearchQuery("")
    }

    const handleBackToCategories = () => {
        router.push(`?view=media&id=radio`)
        setSearchQuery("")
    }

    const selectedCategoryObj = categories.find(c => c.id === selectedCategory)

    return (
        <div className="py-4">
            <style>{`
                .category-card::before {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 5px;
                    background: var(--gradient);
                }

                .volume-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #3b82f6;
                    cursor: pointer;
                }

                .volume-slider::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #3b82f6;
                    cursor: pointer;
                    border: none;
                }
            `}</style>

            {/* Back Button */}
            <Button
                onClick={() => {
                    if (selectedCategory) {
                        handleBackToCategories()
                    } else {
                        onBack?.()
                    }
                }}
                variant="outline"
                className="rounded-full mb-4"
            >
                <i className="fas fa-arrow-right ms-2"></i>
                {selectedCategory ? 'رجوع للتصنيفات' : 'رجوع للمكتبة'}
            </Button>

            {/* Hidden audio element */}
            <audio
                ref={audioRef}
                onEnded={stopRadio}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={() => setIsPlaying(false)}
                crossOrigin="anonymous"
            />

            {/* Header */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white px-8 py-10 rounded-[20px] mb-8">
                <h2 className="text-2xl md:text-3xl font-bold m-0 mb-2 flex items-center gap-4">
                    <i className="fas fa-broadcast-tower"></i>
                    {selectedCategoryObj ? selectedCategoryObj.name : "مكتبة الإذاعات"}
                </h2>
                <p className="text-base opacity-95 m-0">
                    {selectedCategoryObj ? selectedCategoryObj.description : "اختر التصنيف المناسب لك"}
                </p>
            </div>

            {/* Breadcrumb Navigation */}
            {selectedCategory && (
                <div className="flex items-center gap-3 mb-6 px-6 py-4 bg-card rounded-[15px] shadow-sm">
                    <span className="text-muted-foreground no-underline font-medium transition-colors duration-300 cursor-pointer hover:text-blue-500" onClick={handleBackToCategories}>
                        <i className="fas fa-home ml-2"></i>
                        راديو
                    </span>
                    <span className="text-muted-foreground/50">
                        <i className="fas fa-chevron-left"></i>
                    </span>
                    <span className="text-foreground font-semibold">{selectedCategoryObj?.name}</span>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="text-center px-4 py-12">
                    <div className="w-[60px] h-[60px] border-4 border-rose-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
                    <h3>جاري تحميل الإذاعات...</h3>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="text-center px-4 py-12">
                    <div className="text-[4rem] text-red-500 mb-4">
                        <i className="fas fa-exclamation-circle"></i>
                    </div>
                    <h3>حدث خطأ في تحميل الإذاعات</h3>
                    <p className="text-muted-foreground">{error}</p>
                    <button className="bg-blue-500 text-white border-none px-8 py-3.5 rounded-[50px] font-semibold mt-4 cursor-pointer transition-all duration-300 hover:bg-blue-600 hover:-translate-y-0.5" onClick={fetchRadios}>
                        <i className="fas fa-redo ml-2"></i>
                        إعادة المحاولة
                    </button>
                </div>
            )}

            {/* Categories Grid - Level 1 */}
            {!loading && !error && !selectedCategory && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {categories.map((category) => {
                        const count = getRadiosByCategory(category.id).length
                        if (count === 0) return null

                        return (
                            <div
                                key={category.id}
                                className="bg-white rounded-[20px] p-6 md:p-8 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer border-2 border-transparent relative overflow-hidden hover:-translate-y-2 hover:shadow-[0_12px_28px_rgba(0,0,0,0.15)] hover:border-rose-300/30"
                                style={{ '--gradient': category.gradient } as React.CSSProperties}
                                onClick={() => handleCategorySelect(category.id)}
                            >
                                <div className="flex items-center gap-5 mb-4">
                                    <div className="w-[60px] h-[60px] rounded-[15px] flex items-center justify-center text-white text-2xl shrink-0" style={{ background: category.gradient }}>
                                        <i className={`fas ${category.icon}`}></i>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-foreground m-0 mb-1">{category.name}</h3>
                                        <p className="text-sm text-muted-foreground font-medium">
                                            <i className="fas fa-broadcast-tower ml-1"></i>
                                            {count} إذاعة
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground/70 m-0 leading-relaxed">{category.description}</p>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Station List - Level 2 */}
            {!loading && !error && selectedCategory && (
                <>
                    {/* Search Box */}
                    <div className="bg-card rounded-[15px] p-6 mb-8 shadow-sm">
                        <div className="relative">
                            <i className="fas fa-search absolute" style={{ right: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}></i>
                            <input
                                type="text"
                                className="border-2 border-gray-200 rounded-[50px] px-6 py-3.5 text-base transition-all duration-300 focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(236,72,153,0.1)] focus:outline-none w-full"
                                placeholder="ابحث عن إذاعة..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ paddingRight: '3.5rem' }}
                            />
                        </div>
                    </div>

                    {/* Radio Grid */}
                    {filteredRadios.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {filteredRadios.map((radio) => (
                                <div
                                    key={radio.id}
                                    className={`bg-card rounded-[15px] p-6 shadow-sm transition-all duration-300 cursor-pointer border-2 hover:-translate-y-1 hover:shadow-md hover:border-blue-500 ${playingRadio?.id === radio.id ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20' : 'border-transparent'}`}
                                    onClick={() => playRadio(radio)}
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`w-[50px] h-[50px] bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white text-xl shrink-0 overflow-hidden ${playingRadio?.id === radio.id ? 'animate-pulse' : ''}`}>
                                            <i className={playingRadio?.id === radio.id && isPlaying ? "fas fa-volume-up" : "fas fa-radio"}></i>
                                        </div>
                                        <h3 className="text-lg font-semibold text-foreground m-0 leading-relaxed">{radio.name}</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="flex-1 px-3 py-3 rounded-xl border-none font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-br from-blue-500 to-blue-700 text-white hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(236,72,153,0.4)]" type="button">
                                            <i className={`fas ${playingRadio?.id === radio.id && isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                                            {playingRadio?.id === radio.id && isPlaying ? 'إيقاف مؤقت' : 'استماع'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center px-4 py-16 bg-card rounded-[20px] shadow-sm">
                            <div className="text-[4rem] text-gray-300 mb-6">
                                <i className="fas fa-search"></i>
                            </div>
                            <h4 className="text-muted-foreground">لا توجد نتائج</h4>
                            <p className="text-muted-foreground">جرب البحث بكلمات أخرى</p>
                        </div>
                    )}
                </>
            )}

            <FloatingToast
                message={toast?.message || ''}
                variant={toast?.variant || 'info'}
                isVisible={toast !== null}
                onClose={handleCloseToast}
                autoCloseMs={4000}
            />

            {/* Player Bar */}
            {playingRadio && (
                <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-0 right-0 bg-card border-t-2 border-blue-500 p-4 md:px-8 md:py-5 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-[1000] animate-slide-up">
                    <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center gap-4 md:gap-6">
                        <div className="flex-1 w-full md:w-auto flex items-center gap-4">
                            <div className="w-[50px] h-[50px] bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white text-xl animate-pulse shrink-0 overflow-hidden">
                                {playingRadio.img ? (
                                    <img src={playingRadio.img} alt={playingRadio.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                                ) : (
                                    <i className={`fas ${getCategoryIconFn(playingRadio)}`}></i>
                                )}
                            </div>
                            <div className="playing-info">
                                <h4 className="m-0 text-base font-semibold text-foreground">{playingRadio.name}</h4>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    <i className={`fas ${isPlaying ? 'fa-circle text-red-500' : 'fa-pause-circle text-muted-foreground'} ml-1`}></i>
                                    {isPlaying ? 'يتم البث الآن' : 'متوقف مؤقتاً'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                className="w-[50px] h-[50px] rounded-full border-none bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-lg"
                                onClick={togglePlayPause}
                                type="button"
                                title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                            >
                                <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                            </button>
                            <button
                                className="w-[50px] h-[50px] rounded-full border-none bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-lg"
                                onClick={stopRadio}
                                type="button"
                                title="إيقاف"
                            >
                                <i className="fas fa-stop"></i>
                            </button>
                            <div className="hidden md:flex items-center gap-3">
                                <i className="fas fa-volume-up text-muted-foreground"></i>
                                <input
                                    type="range"
                                    className="w-[100px] h-[6px] rounded-[3px] bg-gray-200 outline-none appearance-none"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
