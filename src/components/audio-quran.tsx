"use client"

import * as React from "react"

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
        <div className="audio-quran animate__animated animate__fadeIn">
            <style jsx>{`
                .audio-quran {
                    padding-bottom: 2rem;
                }

                .quran-header {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    padding: 2rem;
                    border-radius: 1rem;
                    color: white;
                    margin-bottom: 2rem;
                    box-shadow: 0 10px 25px rgba(16, 185, 129, 0.2);
                }

                .header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                .header-text {
                    flex: 1;
                }

                .favorites-toggle-btn {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    padding: 0.75rem 1.5rem;
                    border-radius: 50px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.3s ease;
                    white-space: nowrap;
                }

                .favorites-toggle-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                    border-color: rgba(255, 255, 255, 0.5);
                    transform: translateY(-2px);
                }

                .favorites-toggle-btn.active {
                    background: white;
                    color: #10b981;
                    border-color: white;
                }

                .favorites-count {
                    background: #10b981;
                    color: white;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                    font-weight: 700;
                }

                .favorites-toggle-btn.active .favorites-count {
                    background: white;
                    color: #10b981;
                    border: 2px solid #10b981;
                }

                .search-container {
                    margin-top: 1.5rem;
                    max-width: 600px;
                    margin-left: auto;
                    margin-right: auto;
                }

                .search-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .search-icon {
                    position: absolute;
                    right: 1rem;
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 1rem;
                    pointer-events: none;
                }

                .search-input {
                    width: 100%;
                    padding: 0.875rem 3rem 0.875rem 1rem;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 2rem;
                    background: rgba(255, 255, 255, 0.15);
                    color: white;
                    font-size: 1rem;
                    font-family: 'Traditional Arabic', 'Amiri', serif;
                    transition: all 0.3s;
                    backdrop-filter: blur(10px);
                    text-align: right;
                    direction: rtl;
                }

                .search-input::placeholder {
                    color: rgba(255, 255, 255, 0.6);
                }

                .search-input:focus {
                    outline: none;
                    border-color: rgba(255, 255, 255, 0.6);
                    background: rgba(255, 255, 255, 0.25);
                }

                .clear-search {
                    position: absolute;
                    left: 1rem;
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s;
                }

                .clear-search:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(1.1);
                }

                .reciters-count {
                    margin-top: 0.75rem;
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.8);
                    font-family: 'Traditional Arabic', 'Amiri', serif;
                }

                .reciters-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .reciter-card {
                    background: white;
                    border-radius: 1rem;
                    padding: 1.5rem;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                    border: 2px solid transparent;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .reciter-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
                    border-color: #10b981;
                }

                .reciter-icon {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 1.5rem;
                    margin-bottom: 1rem;
                }

                .reciter-name {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #1f2937;
                    font-family: 'Traditional Arabic', 'Amiri', serif;
                }

                .reciter-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .reciter-info {
                    flex: 1;
                }

                .favorite-btn {
                    background: none;
                    border: none;
                    color: #d1d5db;
                    font-size: 1.2rem;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 50%;
                    transition: all 0.3s ease;
                }

                .favorite-btn:hover {
                    background: rgba(16, 185, 129, 0.1);
                    color: #10b981;
                    transform: scale(1.1);
                }

                .favorite-btn.active {
                    color: #10b981;
                    animation: heartBeat 0.3s ease-in-out;
                }

                @keyframes heartBeat {
                    0%, 100% { transform: scale(1); }
                    25% { transform: scale(1.3); }
                    50% { transform: scale(1.1); }
                    75% { transform: scale(1.2); }
                }

                .surahs-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 1rem;
                    margin-top: 2rem;
                }

                .surah-button {
                    padding: 1rem;
                    background: white;
                    border: 2px solid #e5e7eb;
                    border-radius: 0.75rem;
                    color: #374151;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-family: 'Traditional Arabic', 'Amiri', serif;
                    font-size: 1.1rem;
                    text-align: center;
                }

                .surah-button:hover {
                    background: #10b981;
                    border-color: #10b981;
                    color: white;
                    transform: scale(1.05);
                }

                .surah-button.active {
                    background: #10b981;
                    border-color: #10b981;
                    color: white;
                }

                .timer-dropdown-wrapper {
                    position: relative;
                    display: inline-block;
                }

                .timer-active {
                    color: #10b981 !important;
                    background: rgba(16, 185, 129, 0.1) !important;
                }

                .timer-dropdown {
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    margin-bottom: 10px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    padding: 0.5rem;
                    min-width: 180px;
                    z-index: 1001;
                    animation: dropdownSlideUp 0.2s ease-out;
                }

                @keyframes dropdownSlideUp {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }

                .timer-dropdown-header {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #6b7280;
                    padding: 0.5rem 0.75rem;
                    border-bottom: 1px solid #e5e7eb;
                    margin-bottom: 0.25rem;
                    font-family: 'Traditional Arabic', 'Amiri', serif;
                }

                .timer-option {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background: none;
                    border: none;
                    border-radius: 8px;
                    text-align: right;
                    font-size: 1rem;
                    font-weight: 500;
                    color: #1f2937;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-family: 'Traditional Arabic', 'Amiri', serif;
                }

                .timer-option:hover {
                    background: #f3f4f6;
                }

                .timer-option.active {
                    background: #10b981;
                    color: white;
                }

                .timer-option i {
                    font-size: 0.875rem;
                }

                .audio-player {
                    margin-top: 2rem;
                    padding: 2.5rem;
                    background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
                    border-radius: 1.5rem;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.08);
                    border: 1px solid rgba(16, 185, 129, 0.1);
                }

                .player-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .surah-title {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #10b981;
                    font-family: 'Traditional Arabic', 'Amiri', serif;
                    margin-bottom: 0.5rem;
                }

                .reciter-name-display {
                    color: #6b7280;
                    font-size: 1.1rem;
                    font-family: 'Traditional Arabic', 'Amiri', serif;
                }

                .controls-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .main-controls {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .control-btn {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    border: 2px solid #e5e7eb;
                    background: white;
                    color: #374151;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-size: 1.2rem;
                    flex-shrink: 0;
                }

                .control-btn:hover:not(:disabled) {
                    background: #10b981;
                    border-color: #10b981;
                    color: white;
                    transform: scale(1.1);
                }

                .control-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }

                .play-pause-btn {
                    width: 70px;
                    height: 70px;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    border: none;
                    color: white;
                    font-size: 1.8rem;
                    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
                }

                .play-pause-btn:hover {
                    transform: scale(1.15);
                    box-shadow: 0 12px 30px rgba(16, 185, 129, 0.4);
                }

                .skip-btn {
                    width: 42px;
                    height: 42px;
                    font-size: 0.85rem;
                    background: #f3f4f6;
                    border-color: #d1d5db;
                }

                .skip-btn:hover:not(:disabled) {
                    background: #10b981;
                    border-color: #10b981;
                    color: white;
                }

                .progress-container {
                    width: 100%;
                }

                .progress-bar {
                    width: 100%;
                    height: 10px;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 10px;
                    overflow: visible;
                    cursor: pointer;
                    position: relative;
                    padding: 0;
                }

                .progress-bar-inner {
                    width: 100%;
                    height: 100%;
                    border-radius: 8px;
                    position: relative;
                    overflow: visible; /* Make sure knob is visible */
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #10b981 0%, #059669 100%);
                    border-radius: 10px;
                    transition: width 0.1s linear;
                    position: absolute; /* Anchor to right */
                    right: 0;
                    top: 0;
                }

                .progress-fill::after {
                    content: '';
                    position: absolute;
                    left: -7px; /* Position at the end (left side) of the fill */
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

                .time-display {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 0.5rem;
                    font-size: 0.875rem;
                    color: #6b7280;
                    font-family: 'Traditional Arabic', 'Amiri', serif;
                }

                audio {
                    display: none;
                }

                .now-playing {
                    text-align: center;
                    margin-bottom: 1.5rem;
                }

                .now-playing-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #10b981;
                    font-family: 'Traditional Arabic', 'Amiri', serif;
                    margin-bottom: 0.5rem;
                }

                .now-playing-reciter {
                    color: #6b7280;
                    font-size: 1rem;
                }

                @media (max-width: 768px) {
                    .header-content {
                        flex-direction: column;
                        align-items: center;
                    }

                    .header-text {
                        text-align: center;
                    }

                    .favorites-toggle-btn {
                        width: 100%;
                        justify-content: center;
                    }

                    .timer-dropdown {
                        left: auto;
                        right: 0;
                        transform: none;
                    }

                    @keyframes dropdownSlideUp {
                        from {
                            opacity: 0;
                            transform: translateY(10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    .reciters-grid,
                    .surahs-list {
                        grid-template-columns: 1fr;
                    }

                    .audio-player {
                        padding: 1.5rem;
                    }

                    .surah-title {
                        font-size: 1.5rem;
                    }

                    .reciter-name-display {
                        font-size: 0.95rem;
                    }

                    .main-controls {
                        gap: 0.5rem;
                    }

                    .control-btn {
                        width: 44px;
                        height: 44px;
                        font-size: 1rem;
                    }

                    .play-pause-btn {
                        width: 60px;
                        height: 60px;
                        font-size: 1.5rem;
                    }

                    .skip-btn {
                        width: 38px;
                        height: 38px;
                        font-size: 0.75rem;
                    }

                    .progress-bar {
                        height: 10px;
                        padding: 0;
                    }

                    .progress-bar-inner {
                        height: 100%;
                    }

                    .progress-fill::after {
                        width: 14px;
                        height: 14px;
                        left: -7px;
                        right: auto;
                    }
                }
            `}</style>

            {/* Back Button */}
            <button
                className="btn btn-outline-secondary rounded-pill mb-4"
                onClick={() => {
                    if (showPlayer) {
                        handleBackFromPlayer()
                    } else if (selectedReciter) {
                        setSelectedReciter(null)
                    } else {
                        onBack()
                    }
                }}
                type="button"
            >
                <i className="fas fa-arrow-right me-2"></i>
                {showPlayer ? 'رجوع للسور' : selectedReciter ? 'رجوع للقراء' : 'رجوع للمكتبة'}
            </button>

            {/* Header */}
            <div className="quran-header text-center">
                <div className="header-content">
                    <div className="header-text">
                        <i className="fas fa-volume-up fs-1 mb-2 opacity-75"></i>
                        <h1 className="fw-bold mb-1">
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
                            className={`favorites-toggle-btn ${showFavoritesOnly ? 'active' : ''}`}
                            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                            type="button"
                        >
                            <i className={showFavoritesOnly ? "fas fa-heart" : "far fa-heart"}></i>
                            المفضلة
                            {favoriteReciters.length > 0 && (
                                <span className="favorites-count">{favoriteReciters.length}</span>
                            )}
                        </button>
                    )}
                </div>

                {/* Search Bar - Only show when viewing reciters list */}
                {!selectedReciter && !showPlayer && (
                    <div className="search-container">
                        <div className="search-wrapper">
                            <i className="fas fa-search search-icon"></i>
                            <input
                                type="text"
                                className="search-input"
                                placeholder="ابحث عن قارئ..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    className="clear-search"
                                    onClick={() => setSearchQuery("")}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                        </div>
                        <div className="reciters-count">
                            {filteredReciters.length} من {reciters.length} قارئ
                        </div>
                    </div>
                )}
            </div>

            {/* Player Page - Shown when surah is selected */}
            {showPlayer && audioUrl && selectedSurah ? (
                <div className="player-page">
                    <div className="audio-player">
                        {/* Player Header */}
                        <div className="player-header">
                            <div className="surah-title">سورة {surahNames[selectedSurah]}</div>
                            <div className="reciter-name-display">{selectedReciter?.name}</div>
                        </div>

                        {/* Controls Container */}
                        <div className="controls-container">
                            {/* Main Playback Controls */}
                            <div className="main-controls">
                                {/* Timer Dropdown */}
                                <div className="timer-dropdown-wrapper">
                                    <button
                                        className={`control-btn ${sleepTimer ? 'timer-active' : ''}`}
                                        onClick={() => setShowTimerDropdown(!showTimerDropdown)}
                                        title="المُؤقت"
                                    >
                                        <i className="far fa-clock"></i>
                                    </button>
                                    {showTimerDropdown && (
                                        <div className="timer-dropdown">
                                            <div className="timer-dropdown-header">المُؤقت</div>
                                            <button
                                                className={`timer-option ${sleepTimer === null ? 'active' : ''}`}
                                                onClick={() => setSleepTimerMinutes(null)}
                                                type="button"
                                            >
                                                00:00
                                                {sleepTimer === null && <i className="fas fa-check"></i>}
                                            </button>
                                            <button
                                                className={`timer-option ${sleepTimer === 15 ? 'active' : ''}`}
                                                onClick={() => setSleepTimerMinutes(15)}
                                                type="button"
                                            >
                                                15 دقيقة
                                                {sleepTimer === 15 && <i className="fas fa-check"></i>}
                                            </button>
                                            <button
                                                className={`timer-option ${sleepTimer === 30 ? 'active' : ''}`}
                                                onClick={() => setSleepTimerMinutes(30)}
                                                type="button"
                                            >
                                                30 دقيقة
                                                {sleepTimer === 30 && <i className="fas fa-check"></i>}
                                            </button>
                                            <button
                                                className={`timer-option ${sleepTimer === 60 ? 'active' : ''}`}
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
                                    className="control-btn"
                                    onClick={playPreviousSurah}
                                    disabled={!canGoPrevious()}
                                    title="السورة السابقة"
                                >
                                    <i className="fas fa-step-backward"></i>
                                </button>

                                {/* Skip Backward -10s */}
                                <button
                                    className="control-btn skip-btn"
                                    onClick={skipBackward}
                                    title="رجوع 10 ثواني"
                                >
                                    <i className="fas fa-undo"></i>
                                    <span style={{ fontSize: '0.65rem', marginRight: '2px' }}>10</span>
                                </button>

                                {/* Play/Pause Button */}
                                <button
                                    className="control-btn play-pause-btn"
                                    onClick={togglePlayPause}
                                    title={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
                                >
                                    <i className={`fas fa-${isPlaying ? 'pause' : 'play'}`}></i>
                                </button>

                                {/* Skip Forward +10s */}
                                <button
                                    className="control-btn skip-btn"
                                    onClick={skipForward}
                                    title="تقدم 10 ثواني"
                                >
                                    <span style={{ fontSize: '0.65rem', marginLeft: '2px' }}>10</span>
                                    <i className="fas fa-redo"></i>
                                </button>

                                {/* Next Track Button */}
                                <button
                                    className="control-btn"
                                    onClick={playNextSurah}
                                    disabled={!canGoNext()}
                                    title="السورة التالية"
                                >
                                    <i className="fas fa-step-forward"></i>
                                </button>
                            </div>

                            <div className="progress-container">
                                <div
                                    className="progress-bar"
                                    onMouseDown={handleDragStart}
                                    onTouchStart={handleDragStart}
                                    onMouseMove={handleDragMove}
                                    onTouchMove={handleDragMove}
                                    onMouseUp={handleDragEnd}
                                    onTouchEnd={handleDragEnd}
                                >
                                    <div className="progress-bar-inner">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="time-display">
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
                <div className="reciters-grid">
                    {filteredReciters.map(reciter => (
                        <div
                            key={reciter.id}
                            className="reciter-card"
                            onClick={() => handleReciterSelect(reciter)}
                        >
                            <div className="reciter-header">
                                <div className="reciter-icon">
                                    <i className="fas fa-microphone"></i>
                                </div>
                                <div className="reciter-info">
                                    <div className="reciter-name">{reciter.name}</div>
                                </div>
                                <button
                                    className={`favorite-btn ${favoriteReciters.includes(reciter.id) ? 'active' : ''}`}
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
                <div className="surahs-list">
                    {getSurahList(selectedMoshaf).map(surahId => (
                        <button
                            key={surahId}
                            className={`surah-button ${selectedSurah === surahId ? 'active' : ''}`}
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
