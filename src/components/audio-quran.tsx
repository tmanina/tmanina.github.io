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
    const [surahs, setSurahs] = React.useState<Surah[]>([])
    const [selectedReciter, setSelectedReciter] = React.useState<Reciter | null>(null)
    const [selectedMoshaf, setSelectedMoshaf] = React.useState<Moshaf | null>(null)
    const [selectedSurah, setSelectedSurah] = React.useState<number | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [audioUrl, setAudioUrl] = React.useState("")
    const [showPlayer, setShowPlayer] = React.useState(false)

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

    const loadReciters = async () => {
        try {
            const response = await fetch('https://www.mp3quran.net/api/v3/reciters?language=ar')
            const data = await response.json()
            // Get top 20 reciters
            setReciters(data.reciters.slice(0, 20))
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

    const getSurahList = (moshaf: Moshaf): number[] => {
        return moshaf.surah_list.split(',').map(Number)
    }

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

            // Get current surah list
            const currentSurahList = selectedMoshaf ? getSurahList(selectedMoshaf) : []
            const currentIndex = currentSurahList.indexOf(selectedSurah)

            // Previous Track Handler
            navigator.mediaSession.setActionHandler('previoustrack', () => {
                if (currentIndex > 0) {
                    handleSurahSelect(currentSurahList[currentIndex - 1])
                }
            })

            // Next Track Handler
            navigator.mediaSession.setActionHandler('nexttrack', () => {
                if (currentIndex < currentSurahList.length - 1) {
                    handleSurahSelect(currentSurahList[currentIndex + 1])
                }
            })

            // Play Handler
            navigator.mediaSession.setActionHandler('play', () => {
                const audio = document.querySelector('audio')
                if (audio) audio.play()
            })

            // Pause Handler
            navigator.mediaSession.setActionHandler('pause', () => {
                const audio = document.querySelector('audio')
                if (audio) audio.pause()
            })
        }

        return () => {
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = null
            }
        }
    }, [selectedSurah, selectedReciter, audioUrl, selectedMoshaf])

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
                    text-align: center;
                    font-family: 'Traditional Arabic', 'Amiri', serif;
                    font-size: 1.1rem;
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

                .audio-player {
                    margin-top: 2rem;
                    padding: 2rem;
                    background: white;
                    border-radius: 1rem;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
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

                audio {
                    width: 100%;
                    margin-top: 1rem;
                }

                @media (max-width: 768px) {
                    .reciters-grid,
                    .surahs-list {
                        grid-template-columns: 1fr;
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

            {/* Player Page - Shown when surah is selected */}
            {showPlayer && audioUrl && selectedSurah ? (
                <div className="player-page">
                    <div className="audio-player">
                        <audio controls autoPlay key={audioUrl}>
                            <source src={audioUrl} type="audio/mpeg" />
                            متصفحك لا يدعم تشغيل الصوت
                        </audio>
                    </div>
                </div>
            ) : !selectedReciter ? (
                /* Reciters Grid */
                <div className="reciters-grid">
                    {reciters.map(reciter => (
                        <div
                            key={reciter.id}
                            className="reciter-card"
                            onClick={() => handleReciterSelect(reciter)}
                        >
                            <div className="reciter-icon">
                                <i className="fas fa-microphone"></i>
                            </div>
                            <div className="reciter-name">{reciter.name}</div>
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
