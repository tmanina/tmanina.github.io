"use client"

import { useRouter, useSearchParams } from "next/navigation"

import * as React from "react"
import { Button } from "@/components/ui/button"

interface Hadith {
    hadith_number: number
    page: number
    text: string
}

interface HadithBookProps {
    onBack: () => void
}

export function HadithBook({ onBack }: HadithBookProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const initialPage = parseInt(searchParams.get("page") || "1")
    const initialQuery = searchParams.get("q") || ""

    const [hadiths, setHadiths] = React.useState<Hadith[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState(initialQuery)
    const [currentPage, setCurrentPage] = React.useState(initialPage)
    const itemsPerPage = 10

    // Sync URL helpers
    const updateUrl = (page: number, query: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (page > 1) params.set("page", page.toString())
        else params.delete("page")

        if (query) params.set("q", query)
        else params.delete("q")

        router.replace(`?${params.toString()}`)
    }

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
        updateUrl(newPage, searchQuery)
    }

    const handleSearchChange = (newQuery: string) => {
        setSearchQuery(newQuery)
        setCurrentPage(1) // Reset to page 1 on search
        updateUrl(1, newQuery)
    }

    // Fetch data with progressive loading
    React.useEffect(() => {
        let isMounted = true
        const fetchData = async () => {
            try {
                // 1. Fetch preview immediately
                const previewResponse = await fetch('/data/bukhari-preview.json')
                const previewData = await previewResponse.json()

                if (isMounted && previewData && previewData.hadiths) {
                    setHadiths(previewData.hadiths)
                    setLoading(false)
                }

                // 2. Fetch full data in background
                const fullResponse = await fetch('/data/bukhari.json')
                const fullData = await fullResponse.json()

                if (isMounted && fullData && fullData.hadiths) {
                    setHadiths(fullData.hadiths)
                }
            } catch (error) {
                console.error("Error fetching hadiths:", error)
                if (isMounted) setLoading(false)
            }
        }
        fetchData()
        return () => { isMounted = false }
    }, [])

    // Normalization helper
    const normalizeArabic = (text: string) => {
        return text
            .replace(/[\u064B-\u065F]/g, "") // Remove tashkeel
            .replace(/[\u0622\u0623\u0625\u0671]/g, "ا") // Normalize alef
            .replace("ة", "ه") // Normalize ta marbuta
    }

    // Filter and Pagination
    const filteredHadiths = React.useMemo(() => {
        if (!searchQuery || searchQuery.trim() === "") return hadiths

        const normalizedQuery = normalizeArabic(searchQuery)

        return hadiths.filter(h => {
            if (!h) return false
            const normalizedText = h.text ? normalizeArabic(h.text) : ""
            const textMatch = normalizedText.includes(normalizedQuery)
            const numberMatch = h.hadith_number && h.hadith_number.toString().includes(searchQuery)
            return textMatch || numberMatch
        })
    }, [hadiths, searchQuery])

    const totalPages = Math.ceil(filteredHadiths.length / itemsPerPage)
    const currentHadiths = filteredHadiths.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        // Could add toast here
    }

    return (
        <div className="pb-8 animate-fade-in">

            {/* Back Button */}
            <Button
                onClick={onBack}
                variant="outline"
                className="rounded-full mb-4"
            >
                <i className="fas fa-arrow-right ms-2"></i>
                رجوع للكتب
            </Button>

            {/* Header & Search */}
            <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-8 rounded-xl text-white mb-8 shadow-[0_10px_25px_rgba(245,158,11,0.2)] text-center">
                <div className="mb-3">
                    <i className="fas fa-book text-4xl mb-2 opacity-75 block"></i>
                    <h1 className="font-bold mb-1">صحيح البخاري</h1>
                    <p className="opacity-90">الجامع المسند الصحيح المختصر من أمور رسول الله ﷺ وسننه وأيامه</p>
                    <div className="text-xs opacity-50 mt-2" id="debug-info">
                        Debug: Total {hadiths.length} | Query "{searchQuery}"
                    </div>
                </div>

                <div className="relative max-w-lg mx-auto">
                    <i className="fas fa-search absolute start-4 top-1/2 -translate-y-1/2 text-amber-600 dark:text-amber-400"></i>
                    <input
                        type="text"
                        className="w-full ps-12 pe-12 py-4 rounded-full border-0 shadow-md text-lg bg-background text-foreground placeholder:text-muted-foreground"
                        placeholder="ابحث في الأحاديث (بالنص أو الرقم)..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer bg-transparent border-0 p-0 hover:text-amber-600 dark:hover:text-amber-400"
                            onClick={() => handleSearchChange("")}
                            title="مسح البحث"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="w-12 h-12 border-4 border-border border-t-amber-600 rounded-full animate-spin mx-auto mt-12"></div>
                    <p className="text-muted-foreground mt-3">جاري تحميل الأحاديث...</p>
                </div>
            ) : (
                <>
                    {/* Stats */}
                    <div className="flex justify-between items-center mb-4 px-2">
                        <span className="text-muted-foreground text-sm">
                            عرض {currentHadiths.length} من أصل {filteredHadiths.length} حديث
                        </span>
                        <span className="text-muted-foreground text-sm">
                            صفحة {currentPage} من {totalPages}
                        </span>
                    </div>

                    {/* Hadith List */}
                    {currentHadiths.length > 0 ? (
                        <div>
                            {currentHadiths.map((hadith) => (
                                <div key={hadith.hadith_number} className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm transition-transform duration-200 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-md">
                                    <div className="absolute top-0 end-0 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-4 py-2 rounded-bl-xl font-bold font-mono text-lg">
                                        #{hadith.hadith_number}
                                    </div>
                                    <p className="font-arabic-serif text-[1.4rem] leading-[2.2] text-foreground mt-6 text-justify">
                                        {hadith.text}
                                    </p>
                                    <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-border">
                                        <button
                                            className="text-muted-foreground bg-transparent border-0 p-2 transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-400"
                                            onClick={() => handleCopy(hadith.text)}
                                            title="نسخ الحديث"
                                        >
                                            <i className="fas fa-copy"></i>
                                        </button>
                                        <button className="text-gray-400 bg-transparent border-0 p-2 transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-400" title="مشاركة">
                                            <i className="fas fa-share-alt"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-5 text-muted-foreground">
                            <i className="fas fa-search text-4xl mb-3 opacity-25 block"></i>
                            <p>لا توجد نتائج للبحث</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-4">
                            <button
                                className="bg-background border border-input px-4 py-2 rounded-lg text-foreground transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-100 hover:border-amber-600 hover:text-amber-600 dark:hover:bg-amber-900/20"
                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                            >
                                <i className="fas fa-chevron-right"></i>
                            </button>
                            <select
                                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm mx-2"
                                value={currentPage}
                                onChange={(e) => handlePageChange(Number(e.target.value))}
                            >
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <option key={page} value={page}>صفحة {page}</option>
                                ))}
                            </select>

                            <button
                                className="bg-background border border-input px-4 py-2 rounded-lg text-foreground transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-100 hover:border-amber-600 hover:text-amber-600 dark:hover:bg-amber-900/20"
                                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                            >
                                <i className="fas fa-chevron-left"></i>
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
