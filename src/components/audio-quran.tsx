"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

interface Reciter {
    id: number
    name: string
    moshaf: Moshaf[]
}

interface Moshaf {
    id: number
    name: string
    server: string
    surah_total: number
    surah_list: string
}

interface Surah {
    id: number
    name: string
}

interface AudioQuranProps {
    onBack: () => void
}

export function AudioQuran({ onBack }: AudioQuranProps) {
    const [reciters, setReciters] = React.useState<Reciter[]>([])
    const [filteredReciters, setFilteredReciters] = React.useState<Reciter[]>([])
    const [searchQuery, setSearchQuery] = React.useState("")
    const [surahs, setSurahs] = React.useState<Surah[]>([])
    const [selectedReciter, setSelectedReciter] = React.useState<Reciter | null>(null)
    const [selectedMoshaf, setSelectedMoshaf] = React.useState<Moshaf | null>(null)
    const [selectedSurah, setSelectedSurah] = React.useState<number | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [audioUrl, setAudioUrl] = React.useState("")
    const [showPlayer, setShowPlayer] = React.useState(false)
    const [isPlaying, setIsPlaying] = React.useState(false)
    const [currentTime, setCurrentTime] = React.useState(0)
    const [duration, setDuration] = React.useState(0)
    const [isDragging, setIsDragging] = React.useState(false)
    const [favoriteReciters, setFavoriteReciters] = React.useState<number[]>([])
    const [favoriteSurahs, setFavoriteSurahs] = React.useState<number[]>([])
    const [showFavoritesOnly, setShowFavoritesOnly] = React.useState(false)
    const [showTimerDropdown, setShowTimerDropdown] = React.useState(false)
    const [sleepTimer, setSleepTimer] = React.useState<number | null>(null)
    const [timerEndTime, setTimerEndTime] = React.useState<number | null>(null)
    const audioRef = React.useRef<HTMLAudioElement>(null)

    // Surah names in Arabic
    const surahNames: { [key: number]: string } = {
        1: "الفاتحة", 2: "البقرة", 3: "آل عمران", 4: "النساء", 5: "المائدة",
        6: "الأنعام", 7: "الأعراف", 8: "الأنفال", 9: "التوبة", 10: "يونس",
        11: "هود", 12: "يوسف", 13: "الرعد", 14: "إبراهيم", 15: "الحجر",
        16: "النحل", 17: "الإسراء", 18: "الكهف", 19: "مريم", 20: "طه",
        21: "الأنبياء", 22: "الحج", 23: "المؤمنون", 24: "النور", 25: "الفرقان",
        26: "الشعراء", 27: "النمل", 28: "القصص", 29: "العنكبوت", 30: "الروم",
        31: "لقمان", 32: "السجدة", 33: "الأحزاب", 34: "سبأ", 35: "فاطر",
        36: "يس", 37: "الصافات", 38: "ص", 39: "الزمر", 40: "غافر",
        41: "فصلت", 42: "الشورى", 43: "الزخرف", 44: "الدخان", 45: "الجاثية",
        46: "الأحقاف", 47: "محمد", 48: "الفتح", 49: "الحجرات", 50: "ق",
        51: "الذاريات", 52: "الطور", 53: "النجم", 54: "القمر", 55: "الرحمن",
        56: "الواقعة", 57: "الحديد", 58: "المجادلة", 59: "الحشر", 60: "الممتحنة",
        61: "الصف", 62: "الجمعة", 63: "المنافقون", 64: "التغابن", 65: "الطلاق",
        66: "التحريم", 67: "الملك", 68: "القلم", 69: "الحاقة", 70: "المعارج",
        71: "نوح", 72: "الجن", 73: "المزمل", 74: "المدثر", 75: "القيامة",
        76: "الإنسان", 77: "المرسلات", 78: "النبأ", 79: "النازعات", 80: "عبس",
        81: "التكوير", 82: "الانفطار", 83: "المطففين", 84: "الانشقاق", 85: "البروج",
        86: "الطارق", 87: "الأعلى", 88: "الغاشية", 89: "الفجر", 90: "البلد",
        91: "الشمس", 92: "الليل", 93: "الضحى", 94: "الشرح", 95: "التين",
        96: "العلق", 97: "القدر", 98: "البينة", 99: "الزلزلة", 100: "العاديات",
        101: "القارعة", 102: "التكاثر", 103: "العصر", 104: "الهمزة", 105: "الفيل",
        106: "قريش", 107: "الماعون", 108: "الكوثر", 109: "الكافرون", 110: "النصر",
        111: "المسد", 112: "الإخلاص", 113: "الفلق", 114: "الناس"
    }

    React.useEffect(() => {
        loadReciters()
    }, [])

    // Load favorites from localStorage
    React.useEffect(() => {
        const savedReciters = localStorage.getItem('quran-favorite-reciters')
        const savedSurahs = localStorage.getItem('quran-favorite-surahs')
        if (savedReciters) setFavoriteReciters(JSON.parse(savedReciters))
        if (savedSurahs) setFavoriteSurahs(JSON.parse(savedSurahs))
    }, [])

    // Filter reciters based on search query and favorites
    React.useEffect(() => {
        let filtered = reciters

        if (searchQuery.trim() !== "") {
            filtered = filtered.filter(reciter => reciter.name.includes(searchQuery))
        }

        if (showFavoritesOnly) {
            filtered = filtered.filter(reciter => favoriteReciters.includes(reciter.id))
        }

        setFilteredReciters(filtered.sort((a, b) => a.name.localeCompare(b.name, 'ar')))
    }, [searchQuery, reciters, showFavoritesOnly, favoriteReciters])

    const loadReciters = async () => {
        try {
            const response = await fetch('https://www.mp3quran.net/api/v3/reciters?language=ar')
            const data = await response.json()
            // Load ALL reciters from the API and sort alphabetically by Arabic name
            const sortedReciters = data.reciters.sort((a: Reciter, b: Reciter) =>
                a.name.localeCompare(b.name, 'ar')
            )
            setReciters(sortedReciters)
            setFilteredReciters(sortedReciters)
        } catch (error) {
            console.error('Error loading reciters:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleReciterSelect = (reciter: Reciter) => {
        setSelectedReciter(reciter)
        if (reciter.moshaf.length > 0) {
            setSelectedMoshaf(reciter.moshaf[0])
        }
        setShowPlayer(false)
    }

    const handleSurahSelect = (surahId: number) => {
        setSelectedSurah(surahId)
        if (selectedMoshaf) {
            // Format surah number with leading zeros (001, 002, etc.)
            const formattedId = surahId.toString().padStart(3, '0')
            const url = `${selectedMoshaf.server}${formattedId}.mp3`
            setAudioUrl(url)
            setShowPlayer(true)
        }
    }

    const handleBackFromPlayer = () => {
        setShowPlayer(false)
        setSelectedSurah(null)
        setAudioUrl("")
    }

    // Format time in MM:SS
    const formatTime = (seconds: number): string => {
        if (isNaN(seconds)) return "00:00"
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // Handle seeking
    const handleSeek = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        if (!audioRef.current || duration === 0) return

        const bar = document.querySelector('.progress-bar-inner') as HTMLElement
        if (!bar) return

        const rect = bar.getBoundingClientRect()
        let clientX

        if ('touches' in e) {
            clientX = e.touches[0].clientX
        } else {
            clientX = (e as MouseEvent).clientX
        }

        // For RTL: calculate from right side
        const clickX = rect.right - clientX
        const percentage = Math.max(0, Math.min(1, clickX / rect.width))
        const newTime = percentage * duration

        setCurrentTime(newTime)

        // Only update audio time if not dragging (or on drag end)
        if (!isDragging) {
            audioRef.current.currentTime = newTime
        }
    }

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true)
        handleSeek(e)
    }

    const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (isDragging) {
            handleSeek(e)
        }
    }

    const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
        if (isDragging) {
            setIsDragging(false)
            if (audioRef.current) {
                audioRef.current.currentTime = currentTime
            }
        }
    }

    // Add global event listeners for drag end/move
    React.useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                handleSeek(e)
            }
        }

        const handleGlobalMouseUp = (e: MouseEvent) => {
            if (isDragging) {
                setIsDragging(false)
                if (audioRef.current) {
                    audioRef.current.currentTime = currentTime
                }
            }
        }

        const handleGlobalTouchMove = (e: TouchEvent) => {
            if (isDragging) {
                handleSeek(e)
            }
        }

        const handleGlobalTouchEnd = (e: TouchEvent) => {
            if (isDragging) {
                setIsDragging(false)
                if (audioRef.current) {
                    audioRef.current.currentTime = currentTime
                }
            }
        }

        if (isDragging) {
            document.addEventListener('mousemove', handleGlobalMouseMove)
            document.addEventListener('mouseup', handleGlobalMouseUp)
            document.addEventListener('touchmove', handleGlobalTouchMove)
            document.addEventListener('touchend', handleGlobalTouchEnd)
        }

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove)
            document.removeEventListener('mouseup', handleGlobalMouseUp)
            document.removeEventListener('touchmove', handleGlobalTouchMove)
            document.removeEventListener('touchend', handleGlobalTouchEnd)
        }
    }, [isDragging, currentTime, duration])

    const getSurahList = (moshaf: Moshaf): number[] => {
        return moshaf.surah_list.split(',').map(Number)
    }

    // Playback control functions
    const togglePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause()
            } else {
                audioRef.current.play()
            }
        }
    }

    const playNextSurah = () => {
        if (!selectedMoshaf || !selectedSurah) return
        const surahList = getSurahList(selectedMoshaf)
        const currentIndex = surahList.indexOf(selectedSurah)
        if (currentIndex < surahList.length - 1) {
            handleSurahSelect(surahList[currentIndex + 1])
        }
    }

    const playPreviousSurah = () => {
        if (!selectedMoshaf || !selectedSurah) return
        const surahList = getSurahList(selectedMoshaf)
        const currentIndex = surahList.indexOf(selectedSurah)
        if (currentIndex > 0) {
            handleSurahSelect(surahList[currentIndex - 1])
        }
    }

    const skipForward = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration)
        }
    }

    const skipBackward = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0)
        }
    }

    const canGoNext = (): boolean => {
        if (!selectedMoshaf || !selectedSurah) return false
        const surahList = getSurahList(selectedMoshaf)
        const currentIndex = surahList.indexOf(selectedSurah)
        return currentIndex < surahList.length - 1
    }

    const canGoPrevious = (): boolean => {
        if (!selectedMoshaf || !selectedSurah) return false
        const surahList = getSurahList(selectedMoshaf)
        const currentIndex = surahList.indexOf(selectedSurah)
        return currentIndex > 0
    }

    // Toggle favorite reciter
    const toggleFavoriteReciter = (reciterId: number, e: React.MouseEvent) => {
        e.stopPropagation()
        const newFavorites = favoriteReciters.includes(reciterId)
            ? favoriteReciters.filter(id => id !== reciterId)
            : [...favoriteReciters, reciterId]
        setFavoriteReciters(newFavorites)
        localStorage.setItem('quran-favorite-reciters', JSON.stringify(newFavorites))
    }

    // Toggle favorite surah
    const toggleFavoriteSurah = (surahId: number, e: React.MouseEvent) => {
        e.stopPropagation()
        const newFavorites = favoriteSurahs.includes(surahId)
            ? favoriteSurahs.filter(id => id !== surahId)
            : [...favoriteSurahs, surahId]
        setFavoriteSurahs(newFavorites)
        localStorage.setItem('quran-favorite-surahs', JSON.stringify(newFavorites))
    }

    // Sleep timer functions
    const setSleepTimerMinutes = (minutes: number | null) => {
        if (minutes === null) {
            setSleepTimer(null)
            setTimerEndTime(null)
        } else {
            setSleepTimer(minutes)
            setTimerEndTime(Date.now() + minutes * 60 * 1000)
        }
        setShowTimerDropdown(false)
    }

    // Stop audio
    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.src = ""
        }
        setIsPlaying(false)
        setCurrentTime(0)
        setDuration(0)
    }

    // Check timer expiration
    React.useEffect(() => {
        if (timerEndTime && Date.now() >= timerEndTime) {
            stopAudio()
            setSleepTimer(null)
            setTimerEndTime(null)
        }

        if (timerEndTime) {
            const interval = setInterval(() => {
                if (Date.now() >= timerEndTime) {
                    stopAudio()
                    setSleepTimer(null)
                    setTimerEndTime(null)
                }
            }, 1000)
            return () => clearInterval(interval)
        }
    }, [timerEndTime])

    // Setup Media Session API for lock screen controls
    React.useEffect(() => {
        if ('mediaSession' in navigator && selectedSurah && selectedReciter && audioUrl) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: `سورة ${surahNames[selectedSurah]}`,
                artist: selectedReciter.name,
                album: 'القرآن الكريم',
                artwork: [
                    { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
                ]
            })

            // Play Handler
            navigator.mediaSession.setActionHandler('play', () => {
                if (audioRef.current) {
                    audioRef.current.play()
                }
            })

            // Pause Handler
            navigator.mediaSession.setActionHandler('pause', () => {
                if (audioRef.current) {
                    audioRef.current.pause()
                }
            })

            // Previous Track Handler
            navigator.mediaSession.setActionHandler('previoustrack', canGoPrevious() ? playPreviousSurah : null)

            // Next Track Handler
            navigator.mediaSession.setActionHandler('nexttrack', canGoNext() ? playNextSurah : null)

            // Update playback state
            navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
        }

        return () => {
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = null
                navigator.mediaSession.setActionHandler('play', null)
                navigator.mediaSession.setActionHandler('pause', null)
                navigator.mediaSession.setActionHandler('previoustrack', null)
                navigator.mediaSession.setActionHandler('nexttrack', null)
            }
        }
    }, [selectedSurah, selectedReciter, audioUrl, selectedMoshaf, isPlaying])

    // Keep audio playing in background - handle visibility change
    React.useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isPlaying && audioUrl) {
                // Tab became visible - check if audio is still playing
                if (audioRef.current && audioRef.current.paused) {
                    console.log('Resuming Quran audio after tab became visible')
                    audioRef.current.play().catch((err) => {
                        console.error('Failed to resume Quran audio:', err)
                        // Try to reload
                        if (audioRef.current) {
                            audioRef.current.src = audioUrl
                            audioRef.current.load()
                            audioRef.current.play().catch(() => setIsPlaying(false))
                        }
                    })
                }
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [isPlaying, audioUrl])

    // Auto-reconnect on audio stall or error
    React.useEffect(() => {
        const audio = audioRef.current
        if (!audio || !audioUrl) return

        let reconnectAttempts = 0
        const maxReconnectAttempts = 3

        const handleStalled = () => {
            console.log('Quran audio stalled')
            if (isPlaying && reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++
                setTimeout(() => {
                    if (audio && audioUrl) {
                        const time = audio.currentTime
                        audio.src = audioUrl
                        audio.currentTime = time
                        audio.play().catch(console.error)
                    }
                }, 1000 * reconnectAttempts)
            }
        }

        const handlePlaying = () => {
            reconnectAttempts = 0
        }

        audio.addEventListener('stalled', handleStalled)
        audio.addEventListener('playing', handlePlaying)

        return () => {
            audio.removeEventListener('stalled', handleStalled)
            audio.removeEventListener('playing', handlePlaying)
        }
    }, [audioUrl, isPlaying])

    // Keep-alive ping - prevent browser from suspending audio
    React.useEffect(() => {
        if (!isPlaying || !audioUrl) return

        const keepAliveInterval = setInterval(() => {
            if (audioRef.current && isPlaying && audioRef.current.paused) {
                console.log('Quran keep-alive: Audio paused unexpectedly, resuming...')
                audioRef.current.play().catch(() => {
                    // Try reload
                    if (audioRef.current && audioUrl) {
                        const time = audioRef.current.currentTime
                        audioRef.current.src = audioUrl
                        audioRef.current.currentTime = time
                        audioRef.current.play().catch(() => setIsPlaying(false))
                    }
                })
            }
        }, 30000)

        return () => clearInterval(keepAliveInterval)
    }, [isPlaying, audioUrl])

    return (
        <div className="pb-8 animate-fade-in">
            <style jsx>{`
                .progress-fill::after {
                    content: '';
                    position: absolute;
                    left: -7px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 16px;
                    height: 16px;
                    background: white;
                    border: 3px solid #10b981;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    z-index: 10;
                }
                @media (max-width: 768px) {
                    .progress-fill::after {
                        width: 14px;
                        height: 14px;
                        left: -7px;
                    }
                }
            `}</style>

            {/* Back Button */}
            <Button
                onClick={() => {
                    if (showPlayer) {
                        handleBackFromPlayer()
                    } else if (selectedReciter) {
                        setSelectedReciter(null)
                    } else {
                        onBack()
                    }
                }}
                variant="outline"
                className="rounded-full mb-4"
            >
                <i className="fas fa-arrow-right ms-2"></i>
                {showPlayer ? 'رجوع للسور' : selectedReciter ? 'رجوع للقراء' : 'رجوع للمكتبة'}
            </Button>

            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-8 rounded-xl text-white mb-8 shadow-[0_10px_25px_rgba(16,185,129,0.2)]">
                <div className="flex flex-col items-center md:flex-row md:justify-between md:items-start gap-4 mb-4">
                    <div className="flex-1 text-center md:text-start">
                        <i className="fas fa-volume-up text-[2.5rem] mb-2 opacity-75"></i>
                        <h1 className="font-bold mb-1">
                            {showPlayer && selectedSurah
                                ? `سورة ${surahNames[selectedSurah]}`
                                : selectedReciter
                                    ? selectedReciter.name
                                    : 'القرآن الكريم - صوتي'
                            }
                        </h1>
                        <p className="opacity-90">
                            {showPlayer && selectedSurah
                                ? `بصوت: ${selectedReciter?.name}`
                                : selectedReciter
                                    ? 'اختر السورة للاستماع'
                                    : 'اختر القارئ المفضل لك'
                            }
                        </p>
                    </div>
                    {!showPlayer && (
                        <button
                            className={`bg-white/20 text-white border-2 border-white/30 px-5 py-3 rounded-full text-base font-semibold cursor-pointer flex items-center gap-2 transition-all duration-300 whitespace-nowrap w-full md:w-auto justify-center md:justify-start hover:bg-white/30 hover:border-white/50 hover:-translate-y-0.5 ${showFavoritesOnly ? 'bg-white text-emerald-500 border-white' : ''}`}
                            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                            type="button"
                        >
                            <i className={showFavoritesOnly ? "fas fa-heart" : "far fa-heart"}></i>
                            المفضلة
                            {favoriteReciters.length > 0 && (
                                <span className={`bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold ${showFavoritesOnly ? 'bg-white text-emerald-500 border-2 border-emerald-500' : ''}`}>{favoriteReciters.length}</span>
                            )}
                        </button>
                    )}
                </div>

                {/* Search Bar - Only show when viewing reciters list */}
                {!selectedReciter && !showPlayer && (
                    <div className="mt-6 relative max-w-lg mx-auto">
                        <div className="relative flex items-center">
                            <i className="fas fa-search absolute end-4 top-1/2 -translate-y-1/2 text-white/70 text-base pointer-events-none"></i>
                            <input
                                type="text"
                                className="w-full ps-4 pe-12 py-3.5 border-2 border-white/30 rounded-[2rem] bg-white/15 text-white text-base transition-all duration-300 text-right placeholder:text-white/60 focus:outline-none focus:border-white/60 focus:bg-white/25"
                                placeholder="ابحث عن قارئ..."
                                dir="rtl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    className="absolute start-4 bg-white/20 border-none text-white w-7 h-7 rounded-full cursor-pointer flex items-center justify-center transition-all duration-300 hover:bg-white/30 hover:scale-110"
                                    onClick={() => setSearchQuery("")}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                        </div>
                        <div className="mt-3 text-sm text-white/80">
                            {filteredReciters.length} من {reciters.length} قارئ
                        </div>
                    </div>
                )}
            </div>

            {/* Player Page - Shown when surah is selected */}
            {showPlayer && audioUrl && selectedSurah ? (
                <div>
                    <div className="mt-8 p-6 md:p-10 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-emerald-500/10">
                        {/* Player Header */}
                        <div className="text-center mb-8">
                            <div className="text-2xl md:text-3xl font-bold text-emerald-500 mb-2">سورة {surahNames[selectedSurah]}</div>
                            <div className="text-gray-500 text-base md:text-lg">{selectedReciter?.name}</div>
                        </div>

                        {/* Controls Container */}
                        <div className="flex flex-col gap-6">
                            {/* Main Playback Controls */}
                            <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
                                {/* Timer Dropdown */}
                                <div className="relative inline-block">
                                    <button
                                        className={`w-11 h-11 md:w-[50px] md:h-[50px] text-base md:text-xl rounded-full border-2 border-gray-200 bg-white text-gray-700 flex items-center justify-center cursor-pointer transition-all duration-300 shrink-0 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed ${sleepTimer ? 'text-emerald-500 bg-emerald-500/10' : ''}`}
                                        onClick={() => setShowTimerDropdown(!showTimerDropdown)}
                                        title="المُؤقت"
                                    >
                                        <i className="far fa-clock"></i>
                                    </button>
                                    {showTimerDropdown && (
                                        <div className="absolute bottom-full mb-2.5 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] p-2 min-w-[180px] z-[1001] max-md:right-0 max-md:translate-x-0 md:left-1/2 md:-translate-x-1/2 animate-fade-in-up">
                                            <div className="text-sm font-semibold text-gray-500 px-3 py-2 border-b border-gray-200 mb-1">المُؤقت</div>
                                            <button
                                                className={`w-full px-4 py-3 bg-transparent border-0 rounded-lg text-right text-base font-medium text-gray-800 cursor-pointer transition-all duration-200 flex justify-between items-center hover:bg-gray-100 ${sleepTimer === null ? 'bg-emerald-500 text-white' : ''}`}
                                                onClick={() => setSleepTimerMinutes(null)}
                                                type="button"
                                            >
                                                00:00
                                                {sleepTimer === null && <i className="fas fa-check"></i>}
                                            </button>
                                            <button
                                                className={`w-full px-4 py-3 bg-transparent border-0 rounded-lg text-right text-base font-medium text-gray-800 cursor-pointer transition-all duration-200 flex justify-between items-center hover:bg-gray-100 ${sleepTimer === 15 ? 'bg-emerald-500 text-white' : ''}`}
                                                onClick={() => setSleepTimerMinutes(15)}
                                                type="button"
                                            >
                                                15 دقيقة
                                                {sleepTimer === 15 && <i className="fas fa-check"></i>}
                                            </button>
                                            <button
                                                className={`w-full px-4 py-3 bg-transparent border-0 rounded-lg text-right text-base font-medium text-gray-800 cursor-pointer transition-all duration-200 flex justify-between items-center hover:bg-gray-100 ${sleepTimer === 30 ? 'bg-emerald-500 text-white' : ''}`}
                                                onClick={() => setSleepTimerMinutes(30)}
                                                type="button"
                                            >
                                                30 دقيقة
                                                {sleepTimer === 30 && <i className="fas fa-check"></i>}
                                            </button>
                                            <button
                                                className={`w-full px-4 py-3 bg-transparent border-0 rounded-lg text-right text-base font-medium text-gray-800 cursor-pointer transition-all duration-200 flex justify-between items-center hover:bg-gray-100 ${sleepTimer === 60 ? 'bg-emerald-500 text-white' : ''}`}
                                                onClick={() => setSleepTimerMinutes(60)}
                                                type="button"
                                            >
                                                60 دقيقة
                                                {sleepTimer === 60 && <i className="fas fa-check"></i>}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Previous Track Button */}
                                <button
                                    className="w-11 h-11 md:w-[50px] md:h-[50px] text-base md:text-xl rounded-full border-2 border-gray-200 bg-white text-gray-700 flex items-center justify-center cursor-pointer transition-all duration-300 shrink-0 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
                                    onClick={playPreviousSurah}
                                    disabled={!canGoPrevious()}
                                    title="السورة السابقة"
                                >
                                    <i className="fas fa-step-backward"></i>
                                </button>

                                {/* Skip Backward -10s */}
                                <button
                                    className="w-[38px] h-[38px] md:w-[42px] md:h-[42px] text-xs md:text-sm rounded-full border-2 border-gray-300 bg-gray-100 text-gray-700 flex items-center justify-center cursor-pointer transition-all duration-300 shrink-0 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white hover:scale-110"
                                    onClick={skipBackward}
                                    title="رجوع 10 ثواني"
                                >
                                    <i className="fas fa-undo"></i>
                                    <span style={{ fontSize: '0.65rem', marginRight: '2px' }}>10</span>
                                </button>

                                {/* Play/Pause Button */}
                                <button
                                    className="w-[60px] h-[60px] md:w-[70px] md:h-[70px] text-2xl md:text-3xl rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-none text-white flex items-center justify-center cursor-pointer transition-all duration-300 shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:scale-110 hover:shadow-[0_12px_30px_rgba(16,185,129,0.4)] active:scale-95 shrink-0"
                                    onClick={togglePlayPause}
                                    title={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
                                >
                                    <i className={`fas fa-${isPlaying ? 'pause' : 'play'}`}></i>
                                </button>

                                {/* Skip Forward +10s */}
                                <button
                                    className="w-[38px] h-[38px] md:w-[42px] md:h-[42px] text-xs md:text-sm rounded-full border-2 border-gray-300 bg-gray-100 text-gray-700 flex items-center justify-center cursor-pointer transition-all duration-300 shrink-0 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white hover:scale-110"
                                    onClick={skipForward}
                                    title="تقدم 10 ثواني"
                                >
                                    <span style={{ fontSize: '0.65rem', marginLeft: '2px' }}>10</span>
                                    <i className="fas fa-redo"></i>
                                </button>

                                {/* Next Track Button */}
                                <button
                                    className="w-11 h-11 md:w-[50px] md:h-[50px] text-base md:text-xl rounded-full border-2 border-gray-200 bg-white text-gray-700 flex items-center justify-center cursor-pointer transition-all duration-300 shrink-0 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
                                    onClick={playNextSurah}
                                    disabled={!canGoNext()}
                                    title="السورة التالية"
                                >
                                    <i className="fas fa-step-forward"></i>
                                </button>
                            </div>

                            <div className="w-full">
                                <div
                                    className="w-full h-2.5 bg-white border border-gray-200 rounded-[10px] overflow-visible cursor-pointer relative p-0"
                                    onMouseDown={handleDragStart}
                                    onTouchStart={handleDragStart}
                                    onMouseMove={handleDragMove}
                                    onTouchMove={handleDragMove}
                                    onMouseUp={handleDragEnd}
                                    onTouchEnd={handleDragEnd}
                                >
                                    <div className="w-full h-full rounded-lg relative overflow-visible">
                                        <div
                                            className="progress-fill h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-[10px] absolute right-0 top-0"
                                            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between mt-2 text-sm text-gray-500">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Hidden Audio Element */}
                        <audio
                            ref={audioRef}
                            src={audioUrl}
                            autoPlay
                            className="hidden"
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onTimeUpdate={(e) => {
                                if (!isDragging) {
                                    setCurrentTime(e.currentTarget.currentTime)
                                }
                            }}
                            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                            onEnded={playNextSurah}
                        />
                    </div>
                </div>
            ) : !selectedReciter ? (
                /* Reciters Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {filteredReciters.map(reciter => (
                        <div
                            key={reciter.id}
                            className="bg-white rounded-xl p-6 shadow-[0_4px_6px_rgba(0,0,0,0.05)] border-2 border-transparent cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(0,0,0,0.1)] hover:border-emerald-500"
                            onClick={() => handleReciterSelect(reciter)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-[50px] h-[50px] rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-2xl mb-4 shrink-0">
                                    <i className="fas fa-microphone"></i>
                                </div>
                                <div className="flex-1">
                                    <div className="text-lg font-semibold text-gray-800">{reciter.name}</div>
                                </div>
                                <button
                                    className={`bg-transparent border-none text-gray-300 text-xl cursor-pointer p-2 rounded-full transition-all duration-300 hover:bg-emerald-500/10 hover:text-emerald-500 hover:scale-110 ${favoriteReciters.includes(reciter.id) ? 'text-emerald-500' : ''}`}
                                    onClick={(e) => toggleFavoriteReciter(reciter.id, e)}
                                    type="button"
                                    aria-label="إضافة إلى المفضلة"
                                >
                                    <i className={favoriteReciters.includes(reciter.id) ? "fas fa-heart" : "far fa-heart"}></i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : selectedMoshaf && (
                /* Surahs List */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                    {getSurahList(selectedMoshaf).map(surahId => (
                        <button
                            key={surahId}
                            className={`p-4 bg-white border-2 border-gray-200 rounded-xl text-gray-700 font-semibold cursor-pointer transition-all duration-300 text-center hover:bg-emerald-500 hover:border-emerald-500 hover:text-white hover:scale-105 ${selectedSurah === surahId ? 'bg-emerald-500 border-emerald-500 text-white' : ''}`}
                            onClick={() => handleSurahSelect(surahId)}
                        >
                            {surahId}. {surahNames[surahId]}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
