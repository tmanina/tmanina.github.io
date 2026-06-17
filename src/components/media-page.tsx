"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"

// Lazy-loaded media components
const AudioQuran = dynamic(() => import("./audio-quran").then(m => m.AudioQuran), { loading: () => <div className="text-center py-12"><div className="w-10 h-10 border-4 border-border border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" /><p className="text-muted-foreground text-sm">جاري التحميل...</p></div> })
const HadithLibrary = dynamic(() => import("./hadith-library").then(m => m.HadithLibrary), { loading: LoadingSpinner })
const RuqyahPlayer = dynamic(() => import("./ruqyah-player").then(m => m.RuqyahPlayer), { loading: LoadingSpinner })
const VectorMushaf = dynamic(() => import("./vector-mushaf").then(m => m.VectorMushaf), { loading: () => <div className="text-center py-12"><div className="w-10 h-10 border-4 border-border border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" /><p className="text-muted-foreground text-sm">جاري تحميل المصحف...</p></div> })
const RadioPlayer = dynamic(() => import("./radio-player").then(m => m.RadioPlayer), { loading: LoadingSpinner })
const SahabaPlayer = dynamic(() => import("./sahaba-player").then(m => m.SahabaPlayer), { loading: LoadingSpinner })
const LivePlayer = dynamic(() => import("./live-player").then(m => m.LivePlayer), { loading: LoadingSpinner })
const PodcastPlayer = dynamic(() => import("./podcast-player").then(m => m.PodcastPlayer), { loading: LoadingSpinner })
const DuaLibrary = dynamic(() => import("./dua-library/dua-library").then(m => m.DuaLibrary), { loading: LoadingSpinner })
const AsmaaPage = dynamic(() => import("./asmaa/asmaa-page").then(m => m.AsmaaPage), { loading: LoadingSpinner })
const SurahReader = dynamic(() => import("./surah-reader"), { loading: LoadingSpinner })
const SurahList = dynamic(() => import("./surah-list"), { loading: LoadingSpinner })
const QuranReader = dynamic(() => import("./quran-reader/quran-reader").then(m => m.QuranReader), { loading: () => <div className="flex items-center justify-center py-20"><div className="text-center"><div className="mx-auto mb-4 w-12 h-12 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div><p className="text-muted-foreground">جاري تحميل المصحف...</p></div></div> })

function LoadingSpinner() {
  return (
    <div className="text-center py-12">
      <div className="w-10 h-10 border-4 border-border border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-muted-foreground text-sm">جاري التحميل...</p>
    </div>
  )
}

export function MediaPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const activeSection = searchParams.get("id")
    // 2-day temporary "new" badge state
    const [showNewBadge, setShowNewBadge] = React.useState(false)
    React.useEffect(() => {
        const key = 'mediaPageNewBadgeTimestamp'
        const stored = localStorage.getItem(key)
        const now = Date.now()
        if (!stored) {
            localStorage.setItem(key, now.toString())
            setShowNewBadge(true)
            return
        }
        const saved = parseInt(stored, 10)
        const diffDays = (now - saved) / (1000 * 60 * 60 * 24)
        if (diffDays < 2) {
            setShowNewBadge(true)
        } else {
            setShowNewBadge(false)
            localStorage.removeItem(key)
        }
    }, [])

    const handleSectionChange = (section: string | null) => {
        if (section) {
            router.push(`?view=media&id=${section}`)
        } else {
            router.push('?view=media')
        }
    }

    return (
        <div className="py-4">


            {!activeSection ? (
                <>
                    {/* Header */}
                    <div className="text-center mb-5 animate__animated animate__fadeIn">
                        <h2 className="text-3xl font-bold gradient-text mb-2">المكتبة الإسلامية</h2>
                        <p className="text-muted-foreground text-lg">محتوى إسلامي متنوع لإثراء معرفتك</p>
                    </div>

                    {/* Media Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate__animated animate__fadeInUp">
                        {/* رقية شرعية */}
                        <div>
                            <div
                                className="transition-all duration-300 ease-out border-0 overflow-hidden h-full cursor-pointer group shadow bg-card rounded-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
                                onClick={() => handleSectionChange('ruqyah')}
                            >
                                <div className="p-10 max-md:p-8 border-0 relative text-center bg-gradient-to-br from-purple-500 to-purple-700">
                                    {showNewBadge && (<span className="absolute top-2 end-2 bg-red-500 text-white text-sm font-semibold px-2 py-1 rounded-lg z-10">جديد</span>)}
                                    <div className="w-20 h-20 max-md:w-[70px] max-md:h-[70px] bg-white/25 rounded-full flex items-center justify-center text-3xl max-md:text-2xl mx-auto mb-5 backdrop-blur-md shadow-md">
                                        <i className="fas fa-book-medical"></i>
                                    </div>
                                    <h3 className="text-white text-2xl max-md:text-xl font-bold m-0 shadow-[0_2px_4px_rgba(0,0,0,0.15)]">رقية شرعية</h3>
                                    <p className="text-white/95 text-sm mt-1.5 font-medium mb-4">آيات وأدعية الرقية الشرعية</p>
                                    <button className="bg-white text-purple-700 border-0 rounded-full px-5 py-3 font-semibold text-base shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50" type="button">
                                        <i className="fas fa-folder-open ms-2"></i>
                                        عرض المحتوى
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* صوتيات */}
                        <div>
                            <div
                                className="transition-all duration-300 ease-out border-0 overflow-hidden h-full cursor-pointer group shadow bg-card rounded-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
                                onClick={() => handleSectionChange('audio')}
                            >
                                <div className="p-10 max-md:p-8 border-0 relative text-center bg-gradient-to-br from-emerald-400 to-emerald-600">
                                    {showNewBadge && (<span className="absolute top-2 end-2 bg-red-500 text-white text-sm font-semibold px-2 py-1 rounded-lg z-10">جديد</span>)}
                                    <div className="w-20 h-20 max-md:w-[70px] max-md:h-[70px] bg-white/25 rounded-full flex items-center justify-center text-3xl max-md:text-2xl mx-auto mb-5 backdrop-blur-md shadow-md">
                                        <i className="fas fa-headphones"></i>
                                    </div>
                                    <h3 className="text-white text-2xl max-md:text-xl font-bold m-0 shadow-[0_2px_4px_rgba(0,0,0,0.15)]">قرآن كريم - صوتي</h3>
                                    <p className="text-white/95 text-sm mt-1.5 font-medium mb-4">استمع للقرآن بأصوات القراء</p>
                                    <button className="bg-white text-emerald-600 border-0 rounded-full px-5 py-3 font-semibold text-base shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50" type="button">
                                        <i className="fas fa-play ms-2"></i>
                                        استماع الآن
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* أحاديث */}
                        <div>
                            <div
                                className="transition-all duration-300 ease-out border-0 overflow-hidden h-full cursor-pointer group shadow bg-card rounded-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
                                onClick={() => handleSectionChange('hadiths')}
                            >
                                <div className="p-10 max-md:p-8 border-0 relative text-center bg-gradient-to-br from-amber-500 to-amber-700">
                                    {showNewBadge && (<span className="absolute top-2 end-2 bg-red-500 text-white text-sm font-semibold px-2 py-1 rounded-lg z-10">جديد</span>)}
                                    <div className="w-20 h-20 max-md:w-[70px] max-md:h-[70px] bg-white/25 rounded-full flex items-center justify-center text-3xl max-md:text-2xl mx-auto mb-5 backdrop-blur-md shadow-md">
                                        <i className="fas fa-book-quran"></i>
                                    </div>
                                    <h3 className="text-white text-2xl max-md:text-xl font-bold m-0 shadow-[0_2px_4px_rgba(0,0,0,0.15)]">أحاديث</h3>
                                    <p className="text-white/95 text-sm mt-1.5 font-medium mb-4">أحاديث نبوية شريفة</p>
                                    <button className="bg-white text-amber-700 border-0 rounded-full px-5 py-3 font-semibold text-base shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50" type="button">
                                        <i className="fas fa-folder-open ms-2"></i>
                                        عرض المحتوى
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* القرآن الكريم - Hidden until update */}
                        {/* <div className="col-12 col-md-6 col-xl-3">
                            <div
                                className="transition-all duration-300 ease-out border-0 overflow-hidden h-full cursor-pointer group shadow hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
                                onClick={() => handleSectionChange('quran')}
                            >
                                <div className="p-10 max-md:p-8 border-0 relative text-center bg-gradient-to-br from-emerald-400 to-emerald-600">
                                    {showNewBadge && (<span className="absolute top-2 end-2 bg-red-500 text-white text-sm font-semibold px-2 py-1 rounded-lg z-10">جديد</span>)}
                                    <div className="w-20 h-20 max-md:w-[70px] max-md:h-[70px] bg-white/25 rounded-full flex items-center justify-center text-3xl max-md:text-2xl mx-auto mb-5 backdrop-blur-md shadow-md">
                                        <i className="fas fa-quran"></i>
                                    </div>
                                    <h3 className="text-white text-2xl max-md:text-xl font-bold m-0 shadow-[0_2px_4px_rgba(0,0,0,0.15)]">المصحف الشريف</h3>
                                    <p className="text-white/95 text-sm mt-1.5 font-medium mb-4">قراءة بنظام الصفحات</p>
                                    <button className="bg-white text-emerald-600 border-0 rounded-full px-5 py-3 font-semibold text-base shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50" type="button">
                                        <i className="fas fa-folder-open ms-2"></i>
                                        عرض المحتوى
                                    </button>
                                </div>
                            </div>
                        </div> */}

                        {/* قراءة السور */}
                        <div>
                            <div
                                className="transition-all duration-300 ease-out border-0 overflow-hidden h-full cursor-pointer group shadow bg-card rounded-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
                                onClick={() => handleSectionChange('surah-reader')}
                            >
                                <div className="p-10 max-md:p-8 border-0 relative text-center bg-gradient-to-br from-[#c9a961] to-[#8b6914]">
                                    <span className="absolute top-2 end-2 bg-red-500 text-white text-sm font-semibold px-2 py-1 rounded-lg z-10">جديد</span>
                                    <div className="w-20 h-20 max-md:w-[70px] max-md:h-[70px] bg-white/25 rounded-full flex items-center justify-center text-3xl max-md:text-2xl mx-auto mb-5 backdrop-blur-md shadow-md">
                                        <i className="fas fa-book-open"></i>
                                    </div>
                                    <h3 className="text-white text-2xl max-md:text-xl font-bold m-0 shadow-[0_2px_4px_rgba(0,0,0,0.15)]">قراءة السور</h3>
                                    <p className="text-white/95 text-sm mt-1.5 font-medium mb-4">السور كاملة للقراءة</p>
                                    <button className="bg-white text-[#8b6914] border-0 rounded-full px-5 py-3 font-semibold text-base shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50" type="button">
                                        <i className="fas fa-book-reader ms-2"></i>
                                        قراءة القرآن
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* المصحف الرقمي - صور */}
                        <div>
                            <div
                                className="transition-all duration-300 ease-out border-0 overflow-hidden h-full cursor-pointer group shadow bg-card rounded-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
                                onClick={() => handleSectionChange('mushaf')}
                            >
                                <div className="p-10 max-md:p-8 border-0 relative text-center bg-gradient-to-br from-emerald-600 to-emerald-800">
                                    <span className="absolute top-2 end-2 bg-red-500 text-white text-sm font-semibold px-2 py-1 rounded-lg z-10">جديد</span>
                                    <div className="w-20 h-20 max-md:w-[70px] max-md:h-[70px] bg-white/25 rounded-full flex items-center justify-center text-3xl max-md:text-2xl mx-auto mb-5 backdrop-blur-md shadow-md">
                                        <i className="fas fa-image"></i>
                                    </div>
                                    <h3 className="text-white text-2xl max-md:text-xl font-bold m-0 shadow-[0_2px_4px_rgba(0,0,0,0.15)]">المصحف الرقمي</h3>
                                    <p className="text-white/95 text-sm mt-1.5 font-medium mb-4">صور 100% مطابقة للمطبوع</p>
                                    <button className="bg-white text-emerald-800 border-0 rounded-full px-5 py-3 font-semibold text-base shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50" type="button">
                                        <i className="fas fa-eye ms-2"></i>
                                        عرض المصحف
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* مكتبة الأدعية */}
                        <div>
                            <div
                                className="transition-all duration-300 ease-out border-0 overflow-hidden h-full cursor-pointer group shadow bg-card rounded-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
                                onClick={() => handleSectionChange('dua')}
                            >
                                <div className="p-10 max-md:p-8 border-0 relative text-center bg-gradient-to-br from-[#d4a574] to-[#7d9d7f]">
                                    <span className="absolute top-2 end-2 bg-red-500 text-white text-sm font-semibold px-2 py-1 rounded-lg z-10">جديد</span>
                                    <div className="w-20 h-20 max-md:w-[70px] max-md:h-[70px] bg-white/25 rounded-full flex items-center justify-center text-3xl max-md:text-2xl mx-auto mb-5 backdrop-blur-md shadow-md">
                                        <i className="fas fa-hands-praying"></i>
                                    </div>
                                    <h3 className="text-white text-2xl max-md:text-xl font-bold m-0 shadow-[0_2px_4px_rgba(0,0,0,0.15)]">مكتبة الأدعية</h3>
                                    <p className="text-white/95 text-sm mt-1.5 font-medium mb-4">أدعية مأثورة مقسمة (السفر، المطر، الطعام، الإفطار)</p>
                                    <button className="bg-white text-[#7d9d7f] border-0 rounded-full px-5 py-3 font-semibold text-base shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50" type="button">
                                        <i className="fas fa-book-open ms-2"></i>
                                        عرض الأدعية
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* أسماء الله الحسنى */}
                        <div>
                            <div
                                className="transition-all duration-300 ease-out border-0 overflow-hidden h-full cursor-pointer group shadow bg-card rounded-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
                                onClick={() => handleSectionChange('asmaa')}
                            >
                                <div className="p-10 max-md:p-8 border-0 relative text-center bg-gradient-to-br from-[#667eea] to-[#764ba2]">
                                    <span className="absolute top-2 end-2 bg-red-500 text-white text-sm font-semibold px-2 py-1 rounded-lg z-10">جديد</span>
                                    <div className="w-20 h-20 max-md:w-[70px] max-md:h-[70px] bg-white/25 rounded-full flex items-center justify-center text-3xl max-md:text-2xl mx-auto mb-5 backdrop-blur-md shadow-md">
                                        <i className="fas fa-dove"></i>
                                    </div>
                                    <h3 className="text-white text-2xl max-md:text-xl font-bold m-0 shadow-[0_2px_4px_rgba(0,0,0,0.15)]">أسماء الله الحسنى</h3>
                                    <p className="text-white/95 text-sm mt-1.5 font-medium mb-4">99 اسماً مع معانيها وتسبيح</p>
                                    <button className="bg-white text-[#764ba2] border-0 rounded-full px-5 py-3 font-semibold text-base shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50" type="button">
                                        <i className="fas fa-book-open ms-2"></i>
                                        عرض الأسماء
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* راديو */}
                        <div>
                            <div
                                className="transition-all duration-300 ease-out border-0 overflow-hidden h-full cursor-pointer group shadow bg-card rounded-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
                                onClick={() => handleSectionChange('radio')}
                            >
                                <div className="p-10 max-md:p-8 border-0 relative text-center bg-gradient-to-br from-blue-500 to-blue-700">
                                    {showNewBadge && (<span className="absolute top-2 end-2 bg-red-500 text-white text-sm font-semibold px-2 py-1 rounded-lg z-10">جديد</span>)}
                                    <div className="w-20 h-20 max-md:w-[70px] max-md:h-[70px] bg-white/25 rounded-full flex items-center justify-center text-3xl max-md:text-2xl mx-auto mb-5 backdrop-blur-md shadow-md">
                                        <i className="fas fa-broadcast-tower"></i>
                                    </div>
                                    <h3 className="text-white text-2xl max-md:text-xl font-bold m-0 shadow-[0_2px_4px_rgba(0,0,0,0.15)]">راديو</h3>
                                    <p className="text-white/95 text-sm mt-1.5 font-medium mb-4">إذاعات القرآن الكريم مباشرة</p>
                                    <button className="bg-white text-blue-700 border-0 rounded-full px-5 py-3 font-semibold text-base shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50" type="button">
                                        <i className="fas fa-play ms-2"></i>
                                        استماع الآن
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* صور من حياة الصحابة */}
                        <div>
                            <div
                                className="transition-all duration-300 ease-out border-0 overflow-hidden h-full cursor-pointer group shadow bg-card rounded-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
                                onClick={() => handleSectionChange('sahaba')}
                            >
                                <div className="p-10 max-md:p-8 border-0 relative text-center bg-gradient-to-br from-orange-300 to-orange-500">
                                    {showNewBadge && (<span className="absolute top-2 end-2 bg-red-500 text-white text-sm font-semibold px-2 py-1 rounded-lg z-10">جديد</span>)}
                                    <div className="w-20 h-20 max-md:w-[70px] max-md:h-[70px] bg-white/25 rounded-full flex items-center justify-center text-3xl max-md:text-2xl mx-auto mb-5 backdrop-blur-md shadow-md">
                                        <i className="fas fa-users"></i>
                                    </div>
                                    <h3 className="text-white text-2xl max-md:text-xl font-bold m-0 shadow-[0_2px_4px_rgba(0,0,0,0.15)]">حياه الصحابة</h3>
                                    <p className="text-white/95 text-sm mt-1.5 font-medium mb-4">قصص ومواقف من حياة الصحابة</p>
                                    <button className="bg-white text-orange-500 border-0 rounded-full px-5 py-3 font-semibold text-base shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50" type="button">
                                        <i className="fas fa-play ms-2"></i>
                                        استماع الآن
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* بودكاست */}
                        <div>
                            <div
                                className="transition-all duration-300 ease-out border-0 overflow-hidden h-full cursor-pointer group shadow bg-card rounded-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
                                onClick={() => handleSectionChange('podcast')}
                            >
                                <div className="p-10 max-md:p-8 border-0 relative text-center bg-gradient-to-br from-purple-500 to-purple-700">
                                    <span className="absolute top-2 end-2 bg-red-500 text-white text-sm font-semibold px-2 py-1 rounded-lg z-10">جديد</span>
                                    <div className="w-20 h-20 max-md:w-[70px] max-md:h-[70px] bg-white/25 rounded-full flex items-center justify-center text-3xl max-md:text-2xl mx-auto mb-5 backdrop-blur-md shadow-md">
                                        <i className="fas fa-podcast"></i>
                                    </div>
                                    <h3 className="text-white text-2xl max-md:text-xl font-bold m-0 shadow-[0_2px_4px_rgba(0,0,0,0.15)]">بودكاست</h3>
                                    <p className="text-white/95 text-sm mt-1.5 font-medium mb-4">مناقشة و تبسيط كتب التراث الديني</p>
                                    <button className="bg-white text-purple-700 opacity-70 border-0 rounded-full px-5 py-3 font-semibold text-base shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50" type="button">
                                        <i className="fas fa-play ms-2"></i>
                                        استماع الآن
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* فيديو - قريباً */}
                        <div>
                            <div className="transition-all duration-300 ease-out border-0 overflow-hidden h-full cursor-not-allowed opacity-60 shadow bg-card rounded-2xl">
                                <div className="p-10 max-md:p-8 border-0 relative text-center bg-gradient-to-br from-gray-500 to-gray-700">
                                    {showNewBadge && (<span className="absolute top-2 end-2 bg-red-500 text-white text-sm font-semibold px-2 py-1 rounded-lg z-10">جديد</span>)}
                                    <span className="absolute top-4 end-4 bg-white/90 text-gray-500 px-4 py-1.5 rounded-full text-xs font-semibold">قريباً</span>
                                    <div className="w-20 h-20 max-md:w-[70px] max-md:h-[70px] bg-white/25 rounded-full flex items-center justify-center text-3xl max-md:text-2xl mx-auto mb-5 backdrop-blur-md shadow-md">
                                        <i className="fas fa-video"></i>
                                    </div>
                                    <h3 className="text-white text-2xl max-md:text-xl font-bold m-0 shadow-[0_2px_4px_rgba(0,0,0,0.15)]">فيديو</h3>
                                    <p className="text-white/95 text-sm mt-1.5 font-medium mb-4">مقاطع فيديو إسلامية</p>
                                    <button className="bg-white text-gray-700 border-0 rounded-full px-5 py-3 font-semibold text-base shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50" type="button" disabled>
                                        <i className="fas fa-folder ms-2"></i>
                                        قريباً
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* بث مباشر */}
                        <div>
                            <div
                                className="transition-all duration-300 ease-out border-0 overflow-hidden h-full cursor-pointer group shadow bg-card rounded-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
                                onClick={() => handleSectionChange('live')}
                            >
                                <div className="p-10 max-md:p-8 border-0 relative text-center bg-gradient-to-br from-red-500 to-red-700">
                                    <div className="w-20 h-20 max-md:w-[70px] max-md:h-[70px] bg-white/25 rounded-full flex items-center justify-center text-3xl max-md:text-2xl mx-auto mb-5 backdrop-blur-md shadow-md">
                                        <i className="fas fa-video"></i>
                                    </div>
                                    <h3 className="text-white text-2xl max-md:text-xl font-bold m-0 shadow-[0_2px_4px_rgba(0,0,0,0.15)]">بث مباشر</h3>
                                </div>
                                <div className="media-card-body text-center p-4">
                                    <p className="media-description">الحرم المكي - بث مباشر</p>
                                    <button className="bg-white text-red-600 border-0 rounded-full px-5 py-3 font-semibold text-base shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50" type="button">
                                        مشاهدة <i className="fas fa-play-circle ms-2"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                /* Sub-views */
                <div className="animate__animated animate__fadeIn">
                    {/* Back Button */}
                    <Button
                        onClick={() => handleSectionChange(null)}
                        variant="outline"
                        className="rounded-full mb-4"
                    >
                        <i className="fas fa-arrow-right ms-2"></i>
                        رجوع للمكتبة
                    </Button>

                    {activeSection === 'dua' && (
                        <DuaLibrary onBack={() => handleSectionChange(null)} />
                    )}

                    {activeSection === 'asmaa' && (
                        <AsmaaPage />
                    )}

                    {activeSection === 'hadiths' && (
                        <HadithLibrary onBack={() => handleSectionChange(null)} />
                    )}

                    {activeSection === 'ruqyah' && (
                        <RuqyahPlayer onBack={() => handleSectionChange(null)} />
                    )}

                    {activeSection === 'audio' && (
                        <AudioQuran onBack={() => handleSectionChange(null)} />
                    )}

                    {activeSection === 'quran' && (
                        <QuranReader onBack={() => handleSectionChange(null)} />
                    )}

                    {activeSection === 'radio' && (
                        <RadioPlayer onBack={() => handleSectionChange(null)} />
                    )}

                    {activeSection === 'sahaba' && (
                        <SahabaPlayer onBack={() => handleSectionChange(null)} />
                    )}

                    {activeSection === 'live' && (
                        <LivePlayer onBack={() => handleSectionChange(null)} />
                    )}

                    {activeSection === 'surah-reader' && (
                        <SurahReader />
                    )}

                    {activeSection === 'surah-list' && (
                        <SurahList />
                    )}

                    {activeSection === 'mushaf' && (
                        <VectorMushaf onBack={() => handleSectionChange(null)} />
                    )}

                    {activeSection === 'podcast' && (
                        <PodcastPlayer onBack={() => handleSectionChange(null)} />
                    )}

                </div>
            )}
        </div>
    )
}
