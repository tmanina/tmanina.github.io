'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface SurahInfo {
    id: number
    name_arabic: string
    name_simple: string
    name_complex: string
    revelation_place: string
    verses_count: number
}

interface Verse {
    id: number
    verse_number: number
    verse_key: string
    text_uthmani: string
}

export default function SurahReader() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const surahNumber = Number(searchParams.get('surah') || '1')

    const [surahInfo, setSurahInfo] = React.useState<SurahInfo | null>(null)
    const [verses, setVerses] = React.useState<Verse[]>([])
    const [loading, setLoading] = React.useState(true)
    const [nightMode, setNightMode] = React.useState(false)

    // Surah names in Arabic
    const surahNames: Record<number, string> = {
        1: 'الفَاتِحَة', 2: 'البَقَرَة', 3: 'آل عِمرَان', 4: 'النِّسَاء', 5: 'المَائِدَة',
        6: 'الأَنعَام', 7: 'الأَعرَاف', 8: 'الأَنفَال', 9: 'التَّوبَة', 10: 'يُونُس',
        11: 'هُود', 12: 'يُوسُف', 13: 'الرَّعد', 14: 'إبراهِيم', 15: 'الحِجر',
        16: 'النَّحل', 17: 'الإسرَاء', 18: 'الكَهف', 19: 'مَريَم', 20: 'طه',
        21: 'الأَنبيَاء', 22: 'الحَج', 23: 'المُؤمِنُون', 24: 'النُّور', 25: 'الفُرقَان',
        26: 'الشُّعَرَاء', 27: 'النَّمل', 28: 'القَصَص', 29: 'العَنكَبُوت', 30: 'الرُّوم',
        31: 'لُقمَان', 32: 'السَّجدَة', 33: 'الأَحزَاب', 34: 'سَبَأ', 35: 'فَاطِر',
        36: 'يس', 37: 'الصَّافَّات', 38: 'ص', 39: 'الزُّمَر', 40: 'غَافِر',
        41: 'فُصِّلَت', 42: 'الشُّورَى', 43: 'الزُّخرُف', 44: 'الدُّخَان', 45: 'الجَاثِيَة',
        46: 'الأَحقَاف', 47: 'مُحَمَّد', 48: 'الفَتح', 49: 'الحُجُرَات', 50: 'ق',
        51: 'الذَّارِيَات', 52: 'الطُّور', 53: 'النَّجم', 54: 'القَمَر', 55: 'الرَّحمَن',
        56: 'الوَاقِعَة', 57: 'الحَدِيد', 58: 'المُجَادَلَة', 59: 'الحَشر', 60: 'المُمتَحنَة',
        61: 'الصَّف', 62: 'الجُمُعَة', 63: 'المُنَافِقُون', 64: 'التَّغَابُن', 65: 'الطَّلَاق',
        66: 'التَّحرِيم', 67: 'المُلك', 68: 'القَلَم', 69: 'الحَاقَّة', 70: 'المَعَارِج',
        71: 'نُوح', 72: 'الجِن', 73: 'المُزَّمِّل', 74: 'المُدَّثِّر', 75: 'القِيَامَة',
        76: 'الإِنسَان', 77: 'المُرسَلَات', 78: 'النَّبَأ', 79: 'النَّازِعَات', 80: 'عَبَس',
        81: 'التَّكوِير', 82: 'الانفِطَار', 83: 'المُطَفِّفِين', 84: 'الانشِقَاق', 85: 'البُرُوج',
        86: 'الطَّارِق', 87: 'الأَعلَى', 88: 'الغَاشِيَة', 89: 'الفَجر', 90: 'البَلَد',
        91: 'الشَّمس', 92: 'اللَّيل', 93: 'الضُّحَى', 94: 'الشَّرح', 95: 'التِّين',
        96: 'العَلَق', 97: 'القَدر', 98: 'البَيِّنَة', 99: 'الزَّلزَلَة', 100: 'العَادِيَات',
        101: 'القَارِعَة', 102: 'التَّكَاثُر', 103: 'العَصر', 104: 'الهُمَزَة', 105: 'الفِيل',
        106: 'قُرَيش', 107: 'المَاعُون', 108: 'الكَوثَر', 109: 'الكَافِرُون', 110: 'النَّصر',
        111: 'المَسَد', 112: 'الإِخلَاص', 113: 'الفَلَق', 114: 'النَّاس'
    }

    // Load night mode preference
    React.useEffect(() => {
        const saved = localStorage.getItem('surah_night_mode')
        if (saved) setNightMode(saved === 'true')
    }, [])

    // Fetch surah data
    React.useEffect(() => {
        const fetchSurah = async () => {
            setLoading(true)
            try {
                // Fetch surah info
                const infoResponse = await fetch(
                    `https://api.quran.com/api/v4/chapters/${surahNumber}?language=ar`
                )
                const infoData = await infoResponse.json()
                setSurahInfo(infoData.chapter)

                // Fetch all verses
                const versesResponse = await fetch(
                    `https://api.quran.com/api/v4/verses/by_chapter/${surahNumber}?language=ar&words=false&per_page=300&fields=text_uthmani`
                )
                const versesData = await versesResponse.json()
                setVerses(versesData.verses)
            } catch (error) {
                console.error('Error fetching surah:', error)
            } finally {
                setLoading(false)
            }
        }

        if (surahNumber >= 1 && surahNumber <= 114) {
            fetchSurah()
        }
    }, [surahNumber])

    const navigateToSurah = (num: number) => {
        if (num >= 1 && num <= 114) {
            router.push(`?view=media&id=surah-reader&surah=${num}`)
        }
    }

    const toggleNightMode = () => {
        const newMode = !nightMode
        setNightMode(newMode)
        localStorage.setItem('surah_night_mode', newMode.toString())
    }

    if (loading) {
        return (
            <div className="surah-reader loading">
                <div className="loading-spinner">جاري التحميل...</div>
            </div>
        )
    }

    const noBasmala = [1, 9] // Al-Fatiha and At-Tawbah don't have Basmala at the beginning

    return (
        <div className={`surah-reader ${nightMode ? 'night' : ''}`}>
            <style jsx>{`
                /* ===== FONTS ===== */
                @import url('https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&display=swap');
                
                @font-face {
                    font-family: 'KFGQPC';
                    src: url('/fonts/KFGQPC-Uthmanic-Script-HAFS.ttf') format('truetype');
                    font-weight: normal;
                    font-style: normal;
                    font-display: swap;
                }

                /* ===== CONTAINER ===== */
                .surah-reader {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #f6f1e7 0%, #e8dfc8 100%);
                    padding: 20px;
                    font-family: 'Scheherazade New', serif;
                }
                .surah-reader.night {
                    background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
                }

                /* ===== HEADER ===== */
                .surah-header {
                    max-width: 900px;
                    margin: 0 auto 30px;
                    background: #fff;
                    border-radius: 16px;
                    padding: 25px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    border: 2px solid #c9a961;
                }
                .night .surah-header {
                    background: #1a1a2e;
                    border-color: #c9a961;
                }

                .header-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .surah-title {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #2c1810;
                    text-align: center;
                    margin: 0;
                }
                .night .surah-title {
                    color: #c9a961;
                }

                .surah-meta {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    margin-top: 15px;
                    font-size: 1.1rem;
                    color: #666;
                }
                .night .surah-meta {
                    color: #aaa;
                }

                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .night-toggle {
                    background: transparent;
                    border: 2px solid #c9a961;
                    color: #c9a961;
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 1.3rem;
                    transition: all 0.3s;
                }
                .night-toggle:hover {
                    background: #c9a961;
                    color: #fff;
                }

                /* ===== NAVIGATION ===== */
                .surah-nav {
                    max-width: 900px;
                    margin: 0 auto 30px;
                    display: flex;
                    justify-content: space-between;
                    gap: 15px;
                }

                .nav-btn {
                    flex: 1;
                    padding: 15px 25px;
                    background: #fff;
                    border: 2px solid #c9a961;
                    border-radius: 12px;
                    color: #2c1810;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    white-space: nowrap;
                }
                .nav-btn:hover {
                    background: #c9a961;
                    color: #fff;
                }
                .nav-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .night .nav-btn {
                    background: #1a1a2e;
                    color: #c9a961;
                }
                .night .nav-btn:hover {
                    background: #c9a961;
                    color: #1a1a2e;
                }
                
                .btn-text {
                    display: inline;
                }
                
                .btn-surah-name {
                    font-size: 0.9em;
                    opacity: 0.8;
                }

                /* ===== VERSES CONTAINER ===== */
                .verses-container {
                    max-width: 1000px;
                    margin: 0 auto;
                    background: #fffef8;
                    border-radius: 16px;
                    padding: 50px 60px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    border: 2px solid #c9a961;
                    min-height: 80vh;
                }
                .night .verses-container {
                    background: #121210;
                    border-color: #c9a961;
                }

                /* ===== BASMALA ===== */
                .basmala {
                    text-align: center;
                    font-family: 'KFGQPC', serif;
                    font-size: 2.8rem;
                    color: #000000;
                    margin-bottom: 40px;
                    padding-bottom: 25px;
                    border-bottom: 3px solid #c9a961;
                    font-weight: 700;
                }
                .night .basmala {
                    color: #c9a961;
                }

                /* ===== VERSES ===== */
                .verses-text {
                    font-family: 'KFGQPC', 'Scheherazade New', serif;
                    font-size: 2rem;
                    line-height: 2.2;
                    color: #000000;
                    text-align: justify;
                    text-align-last: center;
                    text-justify: inter-character;
                    direction: rtl;
                    word-spacing: 0.05em;
                    letter-spacing: 0.02em;
                    -webkit-text-stroke: 0;
                    font-feature-settings: "calt" 1, "liga" 1, "kern" 1;
                    font-stretch: expanded;
                }
                .night .verses-text {
                    color: #e8e0d5;
                }

                .verse-content {
                    display: inline;
                }

                .verse-number-circle {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'KFGQPC', serif;
                    color: #c9a961;
                    font-size: 1.6rem;
                    font-weight: 700;
                    margin: 0 6px;
                    vertical-align: middle;
                    padding: 0 2px;
                }
                .night .verse-number-circle {
                    color: #c9a961;
                }

                /* ===== LOADING ===== */
                .loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    font-size: 1.5rem;
                    color: #c9a961;
                }

                /* ===== RESPONSIVE ===== */
                @media (max-width: 768px) {
                    .surah-reader {
                        padding: 15px 10px;
                    }
                    .surah-header {
                        padding: 20px 15px;
                        margin-bottom: 20px;
                    }
                    .surah-title {
                        font-size: 1.6rem;
                    }
                    .surah-meta {
                        flex-direction: column;
                        gap: 10px;
                        font-size: 0.95rem;
                    }
                    .surah-nav {
                        gap: 8px;
                        margin-bottom: 20px;
                    }
                    .nav-btn {
                        font-size: 0.85rem;
                        padding: 10px 8px;
                        flex-direction: column;
                        gap: 4px;
                        min-height: 60px;
                    }
                    .btn-text {
                        font-size: 0.75rem;
                    }
                    .btn-surah-name {
                        display: none;
                    }
                    .verses-container {
                        padding: 30px 15px;
                        min-height: auto;
                    }
                    .verses-text {
                        font-size: 1.5rem;
                        line-height: 2.2;
                        text-align: center;
                    }
                    .basmala {
                        font-size: 2rem;
                        margin-bottom: 30px;
                    }
                    .verse-number-circle {
                        font-size: 1.3rem;
                        margin: 0 4px;
                    }
                }

                @media (min-width: 1400px) {
                    .verses-container {
                        max-width: 1200px;
                    }
                    .verses-text {
                        font-size: 2.4rem;
                        line-height: 3;
                    }
                }
            `}</style>

            {/* Header */}
            <div className="surah-header">
                <div className="header-top">
                    <div></div>
                    <h1 className="surah-title">سُورَةُ {surahNames[surahNumber]}</h1>
                    <button className="night-toggle" onClick={toggleNightMode}>
                        {nightMode ? '☀️' : '🌙'}
                    </button>
                </div>
                <div className="surah-meta">
                    <div className="meta-item">
                        <span>📍</span>
                        <span>{surahInfo?.revelation_place === 'makkah' ? 'مكية' : 'مدنية'}</span>
                    </div>
                    <div className="meta-item">
                        <span>📖</span>
                        <span>عدد الآيات: {surahInfo?.verses_count}</span>
                    </div>
                    <div className="meta-item">
                        <span>🔢</span>
                        <span>رقم السورة: {surahNumber}</span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="surah-nav">
                <button
                    className="nav-btn"
                    onClick={() => navigateToSurah(surahNumber - 1)}
                    disabled={surahNumber === 1}
                >
                    <span>←</span>
                    <span className="btn-text">السابقة</span>
                    {surahNumber > 1 && <span className="btn-surah-name">({surahNames[surahNumber - 1]})</span>}
                </button>
                <button
                    className="nav-btn"
                    onClick={() => router.push('?view=media&id=surah-list')}
                >
                    <span>📚</span>
                    <span className="btn-text">القائمة</span>
                </button>
                <button
                    className="nav-btn"
                    onClick={() => navigateToSurah(surahNumber + 1)}
                    disabled={surahNumber === 114}
                >
                    <span>→</span>
                    <span className="btn-text">التالية</span>
                    {surahNumber < 114 && <span className="btn-surah-name">({surahNames[surahNumber + 1]})</span>}
                </button>
            </div>

            {/* Verses */}
            <div className="verses-container">
                {/* Basmala - except for Al-Fatiha and At-Tawbah */}
                {!noBasmala.includes(surahNumber) && (
                    <div className="basmala">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِيمِ</div>
                )}

                <div className="verses-text">
                    {verses.map((verse, index) => (
                        <React.Fragment key={verse.id}>
                            <span className="verse-content">{verse.text_uthmani}</span>
                            <span className="verse-number-circle">
                                ﴿{verse.verse_number}﴾
                            </span>
                            {' '}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    )
}
