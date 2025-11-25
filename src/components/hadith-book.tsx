"use client"

import { useRouter, useSearchParams } from "next/navigation"

import * as React from "react"

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
        <div className="hadith-book animate__animated animate__fadeIn">
            <style jsx>{`
                .hadith-book {
                    padding-bottom: 2rem;
                }
                
                .book-header {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    padding: 2rem;
                    border-radius: 1rem;
                    color: white;
                    margin-bottom: 2rem;
                    box-shadow: 0 10px 25px rgba(245, 158, 11, 0.2);
                }

                .search-input-wrapper {
                    position: relative;
                    max-width: 600px;
                    margin: 0 auto;
                }

                .search-input {
                    width: 100%;
                    padding: 1rem 3rem 1rem 1rem;
                    border-radius: 50px;
                    border: none;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    font-size: 1.1rem;
                }

                .search-icon {
                    position: absolute;
                    right: 1.2rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #d97706;
                }
                
                .clear-icon {
                    position: absolute;
                    left: 1.2rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #9ca3af;
                    cursor: pointer;
                    background: none;
                    border: none;
                    padding: 0;
                }
                
                .clear-icon:hover {
                    color: #d97706;
                }

                .hadith-card {
                    background: white;
                    border-radius: 1rem;
                    padding: 2rem;
                    margin-bottom: 1.5rem;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                    border: 1px solid rgba(0,0,0,0.05);
                    transition: transform 0.2s;
                    position: relative;
                    overflow: hidden;
                }

                .hadith-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 15px rgba(0,0,0,0.08);
                }

                .hadith-number-badge {
                    position: absolute;
                    top: 0;
                    right: 0;
                    background: #fef3c7;
                    color: #d97706;
                    padding: 0.5rem 1.5rem;
                    border-bottom-left-radius: 1rem;
                    font-weight: bold;
                    font-family: monospace;
                    font-size: 1.1rem;
                }

                .hadith-text {
                    font-family: 'Amiri', 'Traditional Arabic', serif;
                    font-size: 1.4rem;
                    line-height: 2.2;
                    color: #1f2937;
                    margin-top: 1.5rem;
                    text-align: justify;
                }

                .action-btn {
                    color: #9ca3af;
                    background: transparent;
                    border: none;
                    padding: 0.5rem;
                    transition: color 0.2s;
                }

                .action-btn:hover {
                    color: #d97706;
                }

                .pagination-btn {
                    background: white;
                    border: 1px solid #e5e7eb;
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    color: #374151;
                    transition: all 0.2s;
                }

                .pagination-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .pagination-btn:not(:disabled):hover {
                    background: #fef3c7;
                    border-color: #d97706;
                    color: #d97706;
                }

                .loading-spinner {
                    width: 3rem;
                    height: 3rem;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #d97706;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 3rem auto;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>

            {/* Back Button */}
            <button
                className="btn btn-outline-secondary rounded-pill mb-4"
                onClick={onBack}
                type="button"
            >
                <i className="fas fa-arrow-right me-2"></i>
                رجوع للكتب
            </button>

            {/* Header & Search */}
            <div className="book-header text-center">
                <div className="mb-3">
                    <i className="fas fa-book fs-1 mb-2 opacity-75"></i>
                    <h1 className="fw-bold mb-1">صحيح البخاري</h1>
                    <p className="opacity-90">الجامع المسند الصحيح المختصر من أمور رسول الله ﷺ وسننه وأيامه</p>
                    <div className="small opacity-50 mt-2" id="debug-info">
                        Debug: Total {hadiths.length} | Query "{searchQuery}"
                    </div>
                </div>

                <div className="search-input-wrapper">
                    <i className="fas fa-search search-icon"></i>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="ابحث في الأحاديث (بالنص أو الرقم)..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            className="clear-icon"
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
                    <div className="loading-spinner"></div>
                    <p className="text-muted mt-3">جاري تحميل الأحاديث...</p>
                </div>
            ) : (
                <>
                    {/* Stats */}
                    <div className="d-flex justify-content-between align-items-center mb-4 px-2">
                        <span className="text-muted">
                            عرض {currentHadiths.length} من أصل {filteredHadiths.length} حديث
                        </span>
                        <span className="text-muted">
                            صفحة {currentPage} من {totalPages}
                        </span>
                    </div>

                    {/* Hadith List */}
                    {currentHadiths.length > 0 ? (
                        <div className="hadith-list">
                            {currentHadiths.map((hadith) => (
                                <div key={hadith.hadith_number} className="hadith-card">
                                    <div className="hadith-number-badge">
                                        #{hadith.hadith_number}
                                    </div>
                                    <p className="hadith-text">
                                        {hadith.text}
                                    </p>
                                    <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top border-light">
                                        <button
                                            className="action-btn"
                                            onClick={() => handleCopy(hadith.text)}
                                            title="نسخ الحديث"
                                        >
                                            <i className="fas fa-copy"></i>
                                        </button>
                                        <button className="action-btn" title="مشاركة">
                                            <i className="fas fa-share-alt"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-5 text-muted">
                            <i className="fas fa-search fs-1 mb-3 opacity-25"></i>
                            <p>لا توجد نتائج للبحث</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center align-items-center gap-2 mt-4 dir-ltr">
                            <button
                                className="pagination-btn"
                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                            >
                                <i className="fas fa-chevron-right"></i>
                            </button>

                            <select
                                className="form-select w-auto mx-2"
                                value={currentPage}
                                onChange={(e) => handlePageChange(Number(e.target.value))}
                            >
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <option key={page} value={page}>صفحة {page}</option>
                                ))}
                            </select>

                            <button
                                className="pagination-btn"
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
