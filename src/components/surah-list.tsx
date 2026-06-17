'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

interface SurahData {
    number: number
    name: string
    englishName: string
    revelationType: 'مكية' | 'مدنية'
    versesCount: number
}

export default function SurahList() {
    const router = useRouter()

    const surahs: SurahData[] = [
        { number: 1, name: 'الفَاتِحَة', englishName: 'Al-Fatihah', revelationType: 'مكية', versesCount: 7 },
        { number: 2, name: 'البَقَرَة', englishName: 'Al-Baqarah', revelationType: 'مدنية', versesCount: 286 },
        { number: 3, name: 'آل عِمرَان', englishName: 'Ali Imran', revelationType: 'مدنية', versesCount: 200 },
        { number: 4, name: 'النِّسَاء', englishName: 'An-Nisa', revelationType: 'مدنية', versesCount: 176 },
        { number: 5, name: 'المَائِدَة', englishName: 'Al-Maidah', revelationType: 'مدنية', versesCount: 120 },
        { number: 6, name: 'الأَنعَام', englishName: 'Al-Anam', revelationType: 'مكية', versesCount: 165 },
        { number: 7, name: 'الأَعرَاف', englishName: 'Al-Araf', revelationType: 'مكية', versesCount: 206 },
        { number: 8, name: 'الأَنفَال', englishName: 'Al-Anfal', revelationType: 'مدنية', versesCount: 75 },
        { number: 9, name: 'التَّوبَة', englishName: 'At-Tawbah', revelationType: 'مدنية', versesCount: 129 },
        { number: 10, name: 'يُونُس', englishName: 'Yunus', revelationType: 'مكية', versesCount: 109 },
        { number: 11, name: 'هُود', englishName: 'Hud', revelationType: 'مكية', versesCount: 123 },
        { number: 12, name: 'يُوسُف', englishName: 'Yusuf', revelationType: 'مكية', versesCount: 111 },
        { number: 13, name: 'الرَّعد', englishName: 'Ar-Rad', revelationType: 'مدنية', versesCount: 43 },
        { number: 14, name: 'إبراهِيم', englishName: 'Ibrahim', revelationType: 'مكية', versesCount: 52 },
        { number: 15, name: 'الحِجر', englishName: 'Al-Hijr', revelationType: 'مكية', versesCount: 99 },
        { number: 16, name: 'النَّحل', englishName: 'An-Nahl', revelationType: 'مكية', versesCount: 128 },
        { number: 17, name: 'الإسرَاء', englishName: 'Al-Isra', revelationType: 'مكية', versesCount: 111 },
        { number: 18, name: 'الكَهف', englishName: 'Al-Kahf', revelationType: 'مكية', versesCount: 110 },
        { number: 19, name: 'مَريَم', englishName: 'Maryam', revelationType: 'مكية', versesCount: 98 },
        { number: 20, name: 'طه', englishName: 'Taha', revelationType: 'مكية', versesCount: 135 },
        { number: 21, name: 'الأَنبيَاء', englishName: 'Al-Anbiya', revelationType: 'مكية', versesCount: 112 },
        { number: 22, name: 'الحَج', englishName: 'Al-Hajj', revelationType: 'مدنية', versesCount: 78 },
        { number: 23, name: 'المُؤمِنُون', englishName: 'Al-Muminun', revelationType: 'مكية', versesCount: 118 },
        { number: 24, name: 'النُّور', englishName: 'An-Nur', revelationType: 'مدنية', versesCount: 64 },
        { number: 25, name: 'الفُرقَان', englishName: 'Al-Furqan', revelationType: 'مكية', versesCount: 77 },
        { number: 26, name: 'الشُّعَرَاء', englishName: 'Ash-Shuara', revelationType: 'مكية', versesCount: 227 },
        { number: 27, name: 'النَّمل', englishName: 'An-Naml', revelationType: 'مكية', versesCount: 93 },
        { number: 28, name: 'القَصَص', englishName: 'Al-Qasas', revelationType: 'مكية', versesCount: 88 },
        { number: 29, name: 'العَنكَبُوت', englishName: 'Al-Ankabut', revelationType: 'مكية', versesCount: 69 },
        { number: 30, name: 'الرُّوم', englishName: 'Ar-Rum', revelationType: 'مكية', versesCount: 60 },
        { number: 31, name: 'لُقمَان', englishName: 'Luqman', revelationType: 'مكية', versesCount: 34 },
        { number: 32, name: 'السَّجدَة', englishName: 'As-Sajdah', revelationType: 'مكية', versesCount: 30 },
        { number: 33, name: 'الأَحزَاب', englishName: 'Al-Ahzab', revelationType: 'مدنية', versesCount: 73 },
        { number: 34, name: 'سَبَأ', englishName: 'Saba', revelationType: 'مكية', versesCount: 54 },
        { number: 35, name: 'فَاطِر', englishName: 'Fatir', revelationType: 'مكية', versesCount: 45 },
        { number: 36, name: 'يس', englishName: 'Ya-Sin', revelationType: 'مكية', versesCount: 83 },
        { number: 37, name: 'الصَّافَّات', englishName: 'As-Saffat', revelationType: 'مكية', versesCount: 182 },
        { number: 38, name: 'ص', englishName: 'Sad', revelationType: 'مكية', versesCount: 88 },
        { number: 39, name: 'الزُّمَر', englishName: 'Az-Zumar', revelationType: 'مكية', versesCount: 75 },
        { number: 40, name: 'غَافِر', englishName: 'Ghafir', revelationType: 'مكية', versesCount: 85 },
        { number: 41, name: 'فُصِّلَت', englishName: 'Fussilat', revelationType: 'مكية', versesCount: 54 },
        { number: 42, name: 'الشُّورَى', englishName: 'Ash-Shuraa', revelationType: 'مكية', versesCount: 53 },
        { number: 43, name: 'الزُّخرُف', englishName: 'Az-Zukhruf', revelationType: 'مكية', versesCount: 89 },
        { number: 44, name: 'الدُّخَان', englishName: 'Ad-Dukhan', revelationType: 'مكية', versesCount: 59 },
        { number: 45, name: 'الجَاثِيَة', englishName: 'Al-Jathiyah', revelationType: 'مكية', versesCount: 37 },
        { number: 46, name: 'الأَحقَاف', englishName: 'Al-Ahqaf', revelationType: 'مكية', versesCount: 35 },
        { number: 47, name: 'مُحَمَّد', englishName: 'Muhammad', revelationType: 'مدنية', versesCount: 38 },
        { number: 48, name: 'الفَتح', englishName: 'Al-Fath', revelationType: 'مدنية', versesCount: 29 },
        { number: 49, name: 'الحُجُرَات', englishName: 'Al-Hujurat', revelationType: 'مدنية', versesCount: 18 },
        { number: 50, name: 'ق', englishName: 'Qaf', revelationType: 'مكية', versesCount: 45 },
        { number: 51, name: 'الذَّارِيَات', englishName: 'Adh-Dhariyat', revelationType: 'مكية', versesCount: 60 },
        { number: 52, name: 'الطُّور', englishName: 'At-Tur', revelationType: 'مكية', versesCount: 49 },
        { number: 53, name: 'النَّجم', englishName: 'An-Najm', revelationType: 'مكية', versesCount: 62 },
        { number: 54, name: 'القَمَر', englishName: 'Al-Qamar', revelationType: 'مكية', versesCount: 55 },
        { number: 55, name: 'الرَّحمَن', englishName: 'Ar-Rahman', revelationType: 'مدنية', versesCount: 78 },
        { number: 56, name: 'الوَاقِعَة', englishName: 'Al-Waqiah', revelationType: 'مكية', versesCount: 96 },
        { number: 57, name: 'الحَدِيد', englishName: 'Al-Hadid', revelationType: 'مدنية', versesCount: 29 },
        { number: 58, name: 'المُجَادَلَة', englishName: 'Al-Mujadila', revelationType: 'مدنية', versesCount: 22 },
        { number: 59, name: 'الحَشر', englishName: 'Al-Hashr', revelationType: 'مدنية', versesCount: 24 },
        { number: 60, name: 'المُمتَحنَة', englishName: 'Al-Mumtahanah', revelationType: 'مدنية', versesCount: 13 },
        { number: 61, name: 'الصَّف', englishName: 'As-Saf', revelationType: 'مدنية', versesCount: 14 },
        { number: 62, name: 'الجُمُعَة', englishName: 'Al-Jumuah', revelationType: 'مدنية', versesCount: 11 },
        { number: 63, name: 'المُنَافِقُون', englishName: 'Al-Munafiqun', revelationType: 'مدنية', versesCount: 11 },
        { number: 64, name: 'التَّغَابُن', englishName: 'At-Taghabun', revelationType: 'مدنية', versesCount: 18 },
        { number: 65, name: 'الطَّلَاق', englishName: 'At-Talaq', revelationType: 'مدنية', versesCount: 12 },
        { number: 66, name: 'التَّحرِيم', englishName: 'At-Tahrim', revelationType: 'مدنية', versesCount: 12 },
        { number: 67, name: 'المُلك', englishName: 'Al-Mulk', revelationType: 'مكية', versesCount: 30 },
        { number: 68, name: 'القَلَم', englishName: 'Al-Qalam', revelationType: 'مكية', versesCount: 52 },
        { number: 69, name: 'الحَاقَّة', englishName: 'Al-Haqqah', revelationType: 'مكية', versesCount: 52 },
        { number: 70, name: 'المَعَارِج', englishName: 'Al-Maarij', revelationType: 'مكية', versesCount: 44 },
        { number: 71, name: 'نُوح', englishName: 'Nuh', revelationType: 'مكية', versesCount: 28 },
        { number: 72, name: 'الجِن', englishName: 'Al-Jinn', revelationType: 'مكية', versesCount: 28 },
        { number: 73, name: 'المُزَّمِّل', englishName: 'Al-Muzzammil', revelationType: 'مكية', versesCount: 20 },
        { number: 74, name: 'المُدَّثِّر', englishName: 'Al-Muddaththir', revelationType: 'مكية', versesCount: 56 },
        { number: 75, name: 'القِيَامَة', englishName: 'Al-Qiyamah', revelationType: 'مكية', versesCount: 40 },
        { number: 76, name: 'الإِنسَان', englishName: 'Al-Insan', revelationType: 'مدنية', versesCount: 31 },
        { number: 77, name: 'المُرسَلَات', englishName: 'Al-Mursalat', revelationType: 'مكية', versesCount: 50 },
        { number: 78, name: 'النَّبَأ', englishName: 'An-Naba', revelationType: 'مكية', versesCount: 40 },
        { number: 79, name: 'النَّازِعَات', englishName: 'An-Naziat', revelationType: 'مكية', versesCount: 46 },
        { number: 80, name: 'عَبَس', englishName: 'Abasa', revelationType: 'مكية', versesCount: 42 },
        { number: 81, name: 'التَّكوِير', englishName: 'At-Takwir', revelationType: 'مكية', versesCount: 29 },
        { number: 82, name: 'الانفِطَار', englishName: 'Al-Infitar', revelationType: 'مكية', versesCount: 19 },
        { number: 83, name: 'المُطَفِّفِين', englishName: 'Al-Mutaffifin', revelationType: 'مكية', versesCount: 36 },
        { number: 84, name: 'الانشِقَاق', englishName: 'Al-Inshiqaq', revelationType: 'مكية', versesCount: 25 },
        { number: 85, name: 'البُرُوج', englishName: 'Al-Buruj', revelationType: 'مكية', versesCount: 22 },
        { number: 86, name: 'الطَّارِق', englishName: 'At-Tariq', revelationType: 'مكية', versesCount: 17 },
        { number: 87, name: 'الأَعلَى', englishName: 'Al-Ala', revelationType: 'مكية', versesCount: 19 },
        { number: 88, name: 'الغَاشِيَة', englishName: 'Al-Ghashiyah', revelationType: 'مكية', versesCount: 26 },
        { number: 89, name: 'الفَجر', englishName: 'Al-Fajr', revelationType: 'مكية', versesCount: 30 },
        { number: 90, name: 'البَلَد', englishName: 'Al-Balad', revelationType: 'مكية', versesCount: 20 },
        { number: 91, name: 'الشَّمس', englishName: 'Ash-Shams', revelationType: 'مكية', versesCount: 15 },
        { number: 92, name: 'اللَّيل', englishName: 'Al-Layl', revelationType: 'مكية', versesCount: 21 },
        { number: 93, name: 'الضُّحَى', englishName: 'Ad-Duhaa', revelationType: 'مكية', versesCount: 11 },
        { number: 94, name: 'الشَّرح', englishName: 'Ash-Sharh', revelationType: 'مكية', versesCount: 8 },
        { number: 95, name: 'التِّين', englishName: 'At-Tin', revelationType: 'مكية', versesCount: 8 },
        { number: 96, name: 'العَلَق', englishName: 'Al-Alaq', revelationType: 'مكية', versesCount: 19 },
        { number: 97, name: 'القَدر', englishName: 'Al-Qadr', revelationType: 'مكية', versesCount: 5 },
        { number: 98, name: 'البَيِّنَة', englishName: 'Al-Bayyinah', revelationType: 'مدنية', versesCount: 8 },
        { number: 99, name: 'الزَّلزَلَة', englishName: 'Az-Zalzalah', revelationType: 'مدنية', versesCount: 8 },
        { number: 100, name: 'العَادِيَات', englishName: 'Al-Adiyat', revelationType: 'مكية', versesCount: 11 },
        { number: 101, name: 'القَارِعَة', englishName: 'Al-Qariah', revelationType: 'مكية', versesCount: 11 },
        { number: 102, name: 'التَّكَاثُر', englishName: 'At-Takathur', revelationType: 'مكية', versesCount: 8 },
        { number: 103, name: 'العَصر', englishName: 'Al-Asr', revelationType: 'مكية', versesCount: 3 },
        { number: 104, name: 'الهُمَزَة', englishName: 'Al-Humazah', revelationType: 'مكية', versesCount: 9 },
        { number: 105, name: 'الفِيل', englishName: 'Al-Fil', revelationType: 'مكية', versesCount: 5 },
        { number: 106, name: 'قُرَيش', englishName: 'Quraysh', revelationType: 'مكية', versesCount: 4 },
        { number: 107, name: 'المَاعُون', englishName: 'Al-Maun', revelationType: 'مكية', versesCount: 7 },
        { number: 108, name: 'الكَوثَر', englishName: 'Al-Kawthar', revelationType: 'مكية', versesCount: 3 },
        { number: 109, name: 'الكَافِرُون', englishName: 'Al-Kafirun', revelationType: 'مكية', versesCount: 6 },
        { number: 110, name: 'النَّصر', englishName: 'An-Nasr', revelationType: 'مدنية', versesCount: 3 },
        { number: 111, name: 'المَسَد', englishName: 'Al-Masad', revelationType: 'مكية', versesCount: 5 },
        { number: 112, name: 'الإِخلَاص', englishName: 'Al-Ikhlas', revelationType: 'مكية', versesCount: 4 },
        { number: 113, name: 'الفَلَق', englishName: 'Al-Falaq', revelationType: 'مكية', versesCount: 5 },
        { number: 114, name: 'النَّاس', englishName: 'An-Nas', revelationType: 'مكية', versesCount: 6 }
    ]

    const [searchQuery, setSearchQuery] = React.useState('')
    const [filterType, setFilterType] = React.useState<'all' | 'مكية' | 'مدنية'>('all')

    const filteredSurahs = surahs.filter(surah => {
        const matchesSearch = surah.name.includes(searchQuery) ||
            surah.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            surah.number.toString().includes(searchQuery)
        const matchesFilter = filterType === 'all' || surah.revelationType === filterType
        return matchesSearch && matchesFilter
    })

    const navigateToSurah = (number: number) => {
        router.push(`?view=media&id=surah-reader&surah=${number}`)
    }

    return (
        <div className="bg-gradient-to-br from-[#f6f1e7] to-[#e8dfc8] dark:from-background dark:to-background min-h-screen p-5">

            {/* Header */}
            <div className="max-w-5xl mx-auto mb-8 bg-card dark:bg-card rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.1)] border-2 border-[#c9a961]">
                <div className="flex justify-between items-center mb-2">
                    <div></div>
                    <h1 className="text-3xl font-bold text-[#2c1810] dark:text-foreground text-center m-0">📚 فهرس سور القرآن الكريم</h1>
                    <button className="bg-transparent border-2 border-[#c9a961] text-[#c9a961] w-10 h-10 rounded-full flex items-center justify-center cursor-pointer text-2xl font-bold transition-all duration-300 leading-none hover:bg-[#c9a961] hover:text-white hover:rotate-90" onClick={() => router.push('?view=media')} title="رجوع">
                        ✕
                    </button>
                </div>
                <p className="text-center text-gray-500 mb-5">
                    114 سورة - اختر السورة للقراءة الكاملة
                </p>

                <div className="flex gap-4 flex-wrap mt-5 max-md:flex-col">
                    <input
                        type="text"
                        className="flex-1 min-w-[250px] px-5 py-3 border-2 border-[#c9a961] rounded-xl text-base rtl transition-all duration-300 text-foreground bg-background font-medium placeholder:text-muted-foreground focus:outline-none focus:border-[#8b6914] focus:ring-2 focus:ring-[#c9a961]/20"
                        placeholder="🔍 ابحث عن سورة (الاسم أو الرقم)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                    <div className="flex gap-2 max-md:justify-center">
                        <button
                            className={`px-6 py-3 border-2 border-[#c9a961] rounded-xl cursor-pointer font-semibold transition-all duration-300 hover:bg-[#c9a961] hover:text-white ${filterType === 'all' ? 'bg-[#c9a961] text-white' : 'bg-card text-[#8b6914] dark:text-amber-300'}`}
                            onClick={() => setFilterType('all')}
                        >
                            الكل
                        </button>
                        <button
                            className={`px-6 py-3 border-2 border-[#c9a961] rounded-xl cursor-pointer font-semibold transition-all duration-300 hover:bg-[#c9a961] hover:text-white ${filterType === 'مكية' ? 'bg-[#c9a961] text-white' : 'bg-card text-[#8b6914] dark:text-amber-300'}`}
                            onClick={() => setFilterType('مكية')}
                        >
                            المكية
                        </button>
                        <button
                            className={`px-6 py-3 border-2 border-[#c9a961] rounded-xl cursor-pointer font-semibold transition-all duration-300 hover:bg-[#c9a961] hover:text-white ${filterType === 'مدنية' ? 'bg-[#c9a961] text-white' : 'bg-card text-[#8b6914] dark:text-amber-300'}`}
                            onClick={() => setFilterType('مدنية')}
                        >
                            المدنية
                        </button>
                    </div>
                </div>
            </div>

            {/* Surahs Grid */}
            <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredSurahs.map((surah) => (
                    <div
                        key={surah.number}
                        className="bg-card rounded-xl p-5 cursor-pointer transition-all duration-300 border-2 border-[#e8dfc8] dark:border-border shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:border-[#c9a961]"
                        onClick={() => navigateToSurah(surah.number)}
                    >
                        <div className="inline-flex w-10 h-10 bg-gradient-to-br from-[#c9a961] to-[#8b6914] text-white rounded-full items-center justify-center font-bold text-lg mb-3">{surah.number}</div>
                        <div className="text-xl font-bold text-[#2c1810] dark:text-foreground mb-1" dir="rtl">{surah.name}</div>
                        <div className="text-sm text-muted-foreground mb-2">{surah.englishName}</div>
                        <div className="flex justify-between mt-3 pt-3 border-t border-[#e8dfc8] dark:border-border">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${surah.revelationType === 'مكية' ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'}`}>
                                {surah.revelationType}
                            </span>
                            <span className="text-xs text-muted-foreground">{surah.versesCount} آية</span>
                        </div>
                    </div>
                ))}
            </div>

            {filteredSurahs.length === 0 && (
                <div className="text-center py-12 text-lg text-gray-500">
                    لا توجد نتائج للبحث 🔍
                </div>
            )}
        </div>
    )
}
