"use client"

import * as React from "react"

interface HadithBook {
    id: string
    name: string
    nameAr: string
    total: number
    color: string
}

interface HadithLibraryProps {
    onBack: () => void
}

export function HadithLibrary({ onBack }: HadithLibraryProps) {
    const [selectedBook, setSelectedBook] = React.useState<string | null>(null)
    const [hadiths, setHadiths] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(false)
    const [currentRange, setCurrentRange] = React.useState({ start: 1, end: 10 })
    const [perPage, setPerPage] = React.useState(10)

    const books: HadithBook[] = [
        { id: "bukhari", name: "Sahih Bukhari", nameAr: "صحيح البخاري", total: 7563, color: "#f59e0b" },
        { id: "muslim", name: "Sahih Muslim", nameAr: "صحيح مسلم", total: 7563, color: "#10b981" },
        { id: "tirmidzi", name: "Jami` at-Tirmidhi", nameAr: "جامع الترمذي", total: 3956, color: "#8b5cf6" },
        { id: "abudaud", name: "Sunan Abu Dawud", nameAr: "سنن أبي داود", total: 5274, color: "#06b6d4" },
        { id: "nasai", name: "Sunan an-Nasa'i", nameAr: "سنن النسائي", total: 5761, color: "#ec4899" },
        { id: "ibnumajah", name: "Sunan Ibn Majah", nameAr: "سنن ابن ماجه", total: 4341, color: "#f97316" },
        { id: "ahmad", name: "Musnad Ahmad", nameAr: "مسند أحمد", total: 27647, color: "#14b8a6" },
        { id: "malik", name: "Muwatta Malik", nameAr: "موطأ مالك", total: 1849, color: "#a855f7" },
        { id: "darimi", name: "Sunan ad-Darimi", nameAr: "سنن الدارمي", total: 3503, color: "#ef4444" },
    ]

    const loadHadiths = async (bookId: string, start: number, end: number) => {
        setLoading(true)
        try {
            const response = await fetch(`https://api.hadith.gading.dev/books/${bookId}?range=${start}-${end}`)
            const data = await response.json()

            if (data.data?.hadiths) {
                setHadiths(data.data.hadiths)
            }
        } catch (error) {
            console.error('Error loading hadiths:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleBookSelect = (bookId: string) => {
        setSelectedBook(bookId)
        setCurrentRange({ start: 1, end: perPage })
        loadHadiths(bookId, 1, perPage)
    }

    const handleNextPage = () => {
        const newStart = currentRange.end + 1
        const newEnd = Math.min(newStart + perPage - 1, 999999)
        setCurrentRange({ start: newStart, end: newEnd })
        if (selectedBook) {
            loadHadiths(selectedBook, newStart, newEnd)
        }
    }

    const handlePrevPage = () => {
        const newEnd = currentRange.start - 1
        const newStart = Math.max(newEnd - perPage + 1, 1)
        setCurrentRange({ start: newStart, end: newEnd })
        if (selectedBook) {
            loadHadiths(selectedBook, newStart, newEnd)
        }
    }

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage)
        setCurrentRange({ start: 1, end: newPerPage })
        if (selectedBook) {
            loadHadiths(selectedBook, 1, newPerPage)
        }
    }

    const selectedBookInfo = books.find(b => b.id === selectedBook)

    return (
        <div className="hadith-library animate__animated animate__fadeIn">
            <style jsx>{`
                .hadith-library {
                    padding-bottom: 2rem;
                }

                .library-header {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    padding: 2rem;
                    border-radius: 1rem;
                    color: white;
                    margin-bottom: 2rem;
                    box-shadow: 0 10px 25px rgba(245, 158, 11, 0.2);
                }

                .books-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .book-card {
                    background: white;
                    border-radius: 1rem;
                    padding: 1.5rem;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                    border: 2px solid transparent;
                    cursor: pointer;
                    transition: all 0.3s;
                    position: relative;
                    overflow: hidden;
                }

                .book-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: var(--book-color);
                }

                .book-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
                    border-color: var(--book-color);
                }

                .book-icon {
                    width: 60px;
                    height: 60px;
                    border-radius: 12px;
                    background: var(--book-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 1.8rem;
                    margin-bottom: 1rem;
                }

                .book-name-ar {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 0.25rem;
                    font-family: 'Traditional Arabic', 'Amiri', serif;
                }

                .book-name-en {
                    font-size: 0.9rem;
                    color: #6b7280;
                    margin-bottom: 0.5rem;
                }

                .book-total {
                    font-size: 0.85rem;
                    color: #9ca3af;
                }

                .hadith-view {
                    background: white;
                    border-radius: 1rem;
                    padding: 2rem;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                }

                .hadith-card {
                    background: #fafafa;
                    border-radius: 0.75rem;
                    padding: 1.5rem;
                    margin-bottom: 1.5rem;
                    border-right: 4px solid var(--book-color);
                }

                .hadith-number {
                    display: inline-block;
                    background: var(--book-color);
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    margin-bottom: 1rem;
                }

                .hadith-arabic {
                    font-family: 'Traditional Arabic', 'Amiri', serif;
                    font-size: 1.4rem;
                    line-height: 2.2;
                    color: #1f2937;
                    text-align: justify;
                    direction: rtl;
                    margin-bottom: 1rem;
                }

                .hadith-translation {
                    color: #4b5563;
                    line-height: 1.8;
                    font-size: 1rem;
                    font-style: italic;
                }

                .pagination {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                    margin-top: 2rem;
                    align-items: center;
                }

                .page-btn {
                    padding: 0.75rem 1.5rem;
                    background: white;
                    border: 2px solid #e5e7eb;
                    border-radius: 0.5rem;
                    color: #374151;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .page-btn:hover:not(:disabled) {
                    background: var(--book-color);
                    border-color: var(--book-color);
                    color: white;
                }

                .page-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .page-info {
                    color: #6b7280;
                    font-weight: 600;
                }

                .loading {
                    text-align: center;
                    padding: 3rem;
                }

                .spinner {
                    width: 3rem;
                    height: 3rem;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid var(--book-color);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1rem;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @media (max-width: 768px) {
                    .books-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .per-page-selector {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    margin-bottom: 1.5rem;
                    padding: 0.75rem 1rem;
                    background: #f9fafb;
                    border-radius: 0.5rem;
                }

                .per-page-label {
                    color: #6b7280;
                    font-weight: 600;
                    font-size: 0.95rem;
                }

                .per-page-select {
                    padding: 0.5rem 2.5rem 0.5rem 1rem;
                    background: white;
                    border: 2px solid #e5e7eb;
                    border-radius: 0.5rem;
                    color: #374151;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-size: 0.95rem;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23374151' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: left 0.75rem center;
                }

                .per-page-select:hover {
                    border-color: var(--book-color);
                }

                .per-page-select:focus {
                    outline: none;
                    border-color: var(--book-color);
                    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
                }
            `}</style>

            {/* Back Button */}
            <button
                className="btn btn-outline-secondary rounded-pill mb-4"
                onClick={() => selectedBook ? setSelectedBook(null) : onBack()}
                type="button"
            >
                <i className="fas fa-arrow-right me-2"></i>
                {selectedBook ? 'رجوع للكتب' : 'رجوع للمكتبة'}
            </button>

            {/* Header */}
            <div className="library-header text-center">
                <i className="fas fa-book-open fs-1 mb-2 opacity-75"></i>
                <h1 className="fw-bold mb-1">
                    {selectedBook ? selectedBookInfo?.nameAr : 'الموسوعة الحديثية'}
                </h1>
                <p className="opacity-90">
                    {selectedBook
                        ? `${selectedBookInfo?.name} - أحاديث نبوية شريفة`
                        : 'تسعة كتب من أهم كتب الحديث النبوي'
                    }
                </p>
            </div>

            {/* Books Grid or Hadiths View */}
            {!selectedBook ? (
                <div className="books-grid">
                    {books.map(book => (
                        <div
                            key={book.id}
                            className="book-card"
                            style={{ '--book-color': book.color } as any}
                            onClick={() => handleBookSelect(book.id)}
                        >
                            <div className="book-icon">
                                <i className="fas fa-book"></i>
                            </div>
                            <div className="book-name-ar">{book.nameAr}</div>
                            <div className="book-name-en">{book.name}</div>
                            <div className="book-total">
                                <i className="fas fa-list me-1"></i>
                                {book.total.toLocaleString()} حديث
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                selectedBookInfo && (
                    <div
                        className="hadith-view"
                        style={{ '--book-color': selectedBookInfo.color } as any}
                    >
                        {loading ? (
                            <div className="loading">
                                <div className="spinner"></div>
                                <p>جاري تحميل الأحاديث...</p>
                            </div>
                        ) : (
                            <>
                                {/* Per Page Selector */}
                                <div className="per-page-selector">
                                    <span className="per-page-label">عدد الأحاديث في الصفحة:</span>
                                    <select
                                        className="per-page-select"
                                        value={perPage}
                                        onChange={(e) => handlePerPageChange(Number(e.target.value))}
                                    >
                                        <option value={10}>10 أحاديث</option>
                                        <option value={20}>20 حديث</option>
                                        <option value={30}>30 حديث</option>
                                        <option value={40}>40 حديث</option>
                                        <option value={50}>50 حديث</option>
                                    </select>
                                </div>

                                {hadiths.map((hadith, index) => (
                                    <div key={index} className="hadith-card">
                                        <div className="hadith-number">
                                            الحديث رقم {hadith.number}
                                        </div>
                                        <div className="hadith-arabic">
                                            {hadith.arab}
                                        </div>
                                    </div>
                                ))}

                                {/* Pagination */}
                                <div className="pagination">
                                    <button
                                        className="page-btn"
                                        onClick={handlePrevPage}
                                        disabled={currentRange.start <= 1}
                                    >
                                        <i className="fas fa-chevron-right me-2"></i>
                                        السابق
                                    </button>
                                    <div className="page-info">
                                        الأحاديث {currentRange.start} - {currentRange.end}
                                    </div>
                                    <button
                                        className="page-btn"
                                        onClick={handleNextPage}
                                        disabled={currentRange.end >= selectedBookInfo.total}
                                    >
                                        التالي
                                        <i className="fas fa-chevron-left ms-2"></i>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )
            )}
        </div>
    )
}
