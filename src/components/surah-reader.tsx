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
    const [done, setDone] = React.useState(false)

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

    // Load completed status
    React.useEffect(() => {
        try {
            const raw = localStorage.getItem("completed-surahs")
            const arr = raw ? JSON.parse(raw) : []
            setDone(arr.includes(surahNumber))
        } catch { setDone(false) }
    }, [surahNumber])

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
            <div className="flex items-center justify-center min-h-screen bg-[#f5f0e8] p-5 text-[#b8944b] text-2xl font-serif">
                <div className="w-10 h-10 border-4 border-neutral-200 dark:border-neutral-700 border-t-[#c9a961] rounded-full animate-spin mx-auto">جاري التحميل...</div>
            </div>
        )
    }

    const noBasmala = [1, 9] // Al-Fatiha and At-Tawbah don't have Basmala at the beginning

    return (
        <div className={`min-h-screen bg-[#f5f0e8] p-5 font-serif ${nightMode ? 'bg-[#0d0d0d]' : ''}`} dir="rtl">


            {/* Header */}
            <div className={`max-w-[1000px] mx-auto mb-[30px] bg-[#faf6ef] rounded p-[30px_25px_25px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] border-b-[3px] border-[#b8944b] relative max-md:p-[20px_12px_18px] max-md:mb-4 ${nightMode ? 'bg-[#1a1a1a]' : ''}`}>
                <div className="flex justify-between items-center mb-3 pt-1.5">
                    <button className="bg-transparent border border-[#b8944b] text-[#b8944b] w-10 h-10 rounded-full flex items-center justify-center cursor-pointer text-lg transition-all duration-300 shrink-0 hover:bg-[#b8944b] hover:text-white" onClick={toggleNightMode}>
                        {nightMode ? '☀️' : '🌙'}
                    </button>
                    <div className="flex-1 text-center">
                        <h1 className={`text-2xl md:text-3xl font-bold text-[#2c1810] m-0 tracking-wide max-md:text-xl ${nightMode ? 'text-[#d4b87a]' : ''}`}>سُورَةُ {surahNames[surahNumber]}</h1>
                    </div>
                    <div style={{ width: 40, flexShrink: 0 }} />
                </div>
                <div className={`flex justify-center gap-6 mt-2.5 text-sm text-[#7a6a5a] max-md:flex-col max-md:gap-1.5 max-md:text-xs ${nightMode ? 'text-[#8a7a6a]' : ''}`}>
                    <div className="flex items-center gap-1.5">
                        <span>📍</span>
                        <span>{surahInfo?.revelation_place === 'makkah' ? 'مكية' : 'مدنية'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span>📖</span>
                        <span>عدد الآيات: {surahInfo?.verses_count}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span>🔢</span>
                        <span>رقم السورة: {surahNumber}</span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="max-w-[1000px] mx-auto mb-6 flex justify-between gap-3 max-md:gap-1.5 max-md:mb-4">
                <button
                    className={`flex-1 px-5 py-3 bg-[#faf6ef] border border-[#d4c4a8] rounded-lg text-[#3a2a1a] text-base font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap hover:bg-[#b8944b] hover:text-white hover:border-[#b8944b] disabled:opacity-40 disabled:cursor-not-allowed max-md:text-xs max-md:px-1.5 max-md:py-2.5 max-md:flex-col max-md:gap-0.5 max-md:min-h-[56px] ${nightMode ? 'bg-[#1a1a1a] text-[#d4b87a] border-[#3a2a1a]' : ''}`}
                    onClick={() => navigateToSurah(surahNumber - 1)}
                    disabled={surahNumber === 1}
                >
                    <span>←</span>
                    <span className="max-md:text-xs">السابقة</span>
                    {surahNumber > 1 && <span className="text-sm opacity-75 max-md:hidden">({surahNames[surahNumber - 1]})</span>}
                </button>
                <button
                    className={`flex-1 px-5 py-3 bg-[#faf6ef] border border-[#d4c4a8] rounded-lg text-[#3a2a1a] text-base font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap hover:bg-[#b8944b] hover:text-white hover:border-[#b8944b] disabled:opacity-40 disabled:cursor-not-allowed max-md:text-xs max-md:px-1.5 max-md:py-2.5 max-md:flex-col max-md:gap-0.5 max-md:min-h-[56px] ${nightMode ? 'bg-[#1a1a1a] text-[#d4b87a] border-[#3a2a1a]' : ''}`}
                    onClick={() => router.push('?view=media&id=surah-list')}
                >
                    <span>📚</span>
                    <span className="max-md:text-xs">القائمة</span>
                </button>
                <button
                    className={`flex-1 px-5 py-3 bg-[#faf6ef] border border-[#d4c4a8] rounded-lg text-[#3a2a1a] text-base font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap hover:bg-[#b8944b] hover:text-white hover:border-[#b8944b] disabled:opacity-40 disabled:cursor-not-allowed max-md:text-xs max-md:px-1.5 max-md:py-2.5 max-md:flex-col max-md:gap-0.5 max-md:min-h-[56px] ${nightMode ? 'bg-[#1a1a1a] text-[#d4b87a] border-[#3a2a1a]' : ''}`}
                    onClick={() => navigateToSurah(surahNumber + 1)}
                    disabled={surahNumber === 114}
                >
                    <span>→</span>
                    <span className="max-md:text-xs">التالية</span>
                    {surahNumber < 114 && <span className="text-sm opacity-75 max-md:hidden">({surahNames[surahNumber + 1]})</span>}
                </button>
            </div>

            {/* Mark as completed */}
            <div className="text-center mb-4">
                <button
                    type="button"
                    onClick={() => {
                        try {
                            const raw = localStorage.getItem("completed-surahs")
                            const arr = raw ? JSON.parse(raw) : []
                            if (arr.includes(surahNumber)) {
                                const next = arr.filter((n: number) => n !== surahNumber)
                                localStorage.setItem("completed-surahs", JSON.stringify(next))
                                setDone(false)
                            } else {
                                localStorage.setItem("completed-surahs", JSON.stringify([...arr, surahNumber]))
                                setDone(true)
                            }
                            window.dispatchEvent(new Event("storage"))
                        } catch { /* ignore */ }
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${done ? "bg-emerald-600 text-white shadow-sm" : "bg-white/80 text-amber-900 border border-amber-300"}`}
                >
                    <i className={`fas ${done ? "fa-check-circle" : "fa-bookmark"} ms-1`} />
                    {done ? "تمت القراءة ✓" : "سجِّل كمقروء"}
                </button>
            </div>

            {/* Verses */}
            <div className={`max-w-[1000px] mx-auto bg-[#fcf9f3] rounded p-[50px_56px] shadow-[0_2px_16px_rgba(0,0,0,0.05)] border-x border-[#e8dcc8] min-h-[60vh] relative max-md:p-6 xl:max-w-[1100px] ${nightMode ? 'bg-[#121210] border-[#2a2a1a]' : ''}`}>
                {/* Basmala - except for Al-Fatiha and At-Tawbah */}
                {!noBasmala.includes(surahNumber) && (
                    <div className={`text-center font-serif text-[2.6rem] text-[#1a1a1a] mb-9 pb-7 border-b border-[#d4c4a8] font-semibold tracking-wide max-md:text-[1.8rem] max-md:mb-6 max-md:pb-5 ${nightMode ? 'text-[#d4b87a] border-[#2a2a1a]' : ''}`}>بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِيمِ</div>
                )}

                <div className={`font-serif text-[2.2rem] leading-[2.4] text-[#1a1a1a] [text-align-last:center] tracking-wide text-justify max-md:text-[1.6rem] max-md:leading-[2.2] max-md:text-center xl:text-[2.6rem] xl:leading-[2.8] ${nightMode ? 'text-[#e0d8c8]' : ''}`}>
                    {verses.map((verse, index) => (
                        <React.Fragment key={verse.id}>
                            <span>{verse.text_uthmani}</span>
                            <span className={`inline-flex items-center justify-center font-serif text-[#b8944b] text-[1.6rem] font-bold mx-1 align-middle px-0.5 max-md:text-[1.3rem] max-md:mx-0.5 ${nightMode ? 'text-[#b8944b]' : ''}`}>
                                ﴿{verse.verse_number}﴾
                            </span>
                            {' '}
                        </React.Fragment>
                    ))}
                </div>
                <div className={`text-center pt-9 mt-9 border-t border-[#d4c4a8] text-[2rem] text-[#b8944b] ${nightMode ? 'border-[#2a2a1a]' : ''}`}>۞</div>
            </div>
        </div>
    )
}
