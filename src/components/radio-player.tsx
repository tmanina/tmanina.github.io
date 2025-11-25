"use client"

import * as React from "react"

interface Radio {
    id: number
    name: string
    url: string
    recent_date: string
}

interface Category {
    id: string
    name: string
    icon: string
    gradient: string
    description: string
}

interface RadioPlayerProps {
    onBack?: () => void
}

export function RadioPlayer({ onBack }: RadioPlayerProps) {
    const [radios, setRadios] = React.useState<Radio[]>([])
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)
    const [playingRadio, setPlayingRadio] = React.useState<Radio | null>(null)
    const [isPlaying, setIsPlaying] = React.useState(false)
    const [volume, setVolume] = React.useState(0.7)
    const [searchQuery, setSearchQuery] = React.useState("")

    const audioRef = React.useRef<HTMLAudioElement>(null)

    // Category definitions
    const categories: Category[] = [
        {
            id: "reciters",
            name: "القراء",
            icon: "fa-user-tie",
            gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            description: "استمع لأشهر القراء"
        },
        {
            id: "translations",
            name: "ترجمة معاني القرآن",
            icon: "fa-language",
            gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
            description: "القرآن بلغات مختلفة"
        },
        {
            id: "tafsir",
            name: "التفسير وعلوم القرآن",
            icon: "fa-book-open",
            gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            description: "تفسير وعلوم القرآن"
        },
        {
            id: "seerah",
            name: "السيرة والقصص",
            icon: "fa-mosque",
            gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            description: "السيرة النبوية والقصص"
        },
        {
            id: "distinguished",
            name: "تلاوات متميزة",
            icon: "fa-star",
            gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            description: "تلاوات خاشعة مميزة"
        },
        {
            id: "ruqyah",
            name: "الرقية الشرعية",
            icon: "fa-book-medical",
            gradient: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
            description: "آيات الرقية الشرعية"
        },
        {
            id: "fatwas",
            name: "الفتاوى",
            icon: "fa-gavel",
            gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
            description: "فتاوى وأحكام شرعية"
        },
        {
            id: "athkar",
            name: "الأدعية والأذكار",
            icon: "fa-hands-praying",
            gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
            description: "أذكار الصباح والمساء"
        },
        {
            id: "seasons",
            name: "مواسم الخير",
            icon: "fa-moon",
            gradient: "linear-gradient(135deg, #a855f7 0%, #9333ea 100%)",
            description: "رمضان والمناسبات"
        },
        {
            id: "general",
            name: "الإذاعة العامة",
            icon: "fa-broadcast-tower",
            gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            description: "إذاعات متنوعة"
        },
        {
            id: "hadith",
            name: "صحيح البخاري ومسلم",
            icon: "fa-book-quran",
            gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            description: "أحاديث نبوية شريفة"
        }
    ]

    React.useEffect(() => {
        fetchRadios()
    }, [])

    React.useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume
        }
    }, [volume])

    const fetchRadios = async () => {
        try {
            setLoading(true)
            const response = await fetch("https://mp3quran.net/api/v3/radios")
            if (!response.ok) throw new Error("فشل تحميل الإذاعات")
            const data = await response.json()
            setRadios(data.radios || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ ما")
        } finally {
            setLoading(false)
        }
    }

    const categorizeRadio = (radio: Radio): string => {
        const name = radio.name.toLowerCase()

        // Translations
        if (name.includes("ترجمة")) return "translations"

        // Tafsir
        if (name.includes("تفسير") || name.includes("المختصر في تفسير")) return "tafsir"

        // Seerah & Stories
        if (name.includes("السيرة") || name.includes("قصص الأنبياء") || name.includes("في ظلال السيرة") || name.includes("صور من حياة الصحابة")) return "seerah"

        // Ruqyah
        if (name.includes("الرقية")) return "ruqyah"

        // Fatwas
        if (name.includes("الفتاوى") || name.includes("فتاوى")) return "fatwas"

        // Athkar
        if (name.includes("أذكار") || name.includes("آيات السكينة") || name.includes("الأدعية")) return "athkar"

        // Seasons
        if (name.includes("رمضان") || name.includes("العيد") || name.includes("تكبيرات")) return "seasons"

        // Hadith
        if (name.includes("صحيح البخاري") || name.includes("صحيح مسلم") || name.includes("رياض الصالحين")) return "hadith"

        // Distinguished recitations
        if (name.includes("تراتيل") || name.includes("خاشعة") || name.includes("متميزة") || name.includes("سورة البقرة") || name.includes("سورة الملك")) return "distinguished"

        // General/Mix
        if (name.includes("الإذاعة العامة") || name.includes("متنوعة") || name.includes("mix")) return "general"

        // Default to reciters
        return "reciters"
    }

    const getRadiosByCategory = (categoryId: string): Radio[] => {
        return radios.filter(radio => categorizeRadio(radio) === categoryId)
    }

    const getCategoryRadios = (): Radio[] => {
        if (!selectedCategory) return []
        return getRadiosByCategory(selectedCategory)
    }

    const filteredRadios = getCategoryRadios().filter(radio =>
        radio.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const playRadio = (radio: Radio) => {
        if (playingRadio?.id === radio.id) {
            togglePlayPause()
        } else {
            setPlayingRadio(radio)
            setIsPlaying(true)
            if (audioRef.current) {
                audioRef.current.src = radio.url
                audioRef.current.play().catch(() => setIsPlaying(false))
            }
        }
    }

    const togglePlayPause = () => {
        if (!audioRef.current) return

        if (isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
        } else {
            audioRef.current.play().catch(() => setIsPlaying(false))
            setIsPlaying(true)
        }
    }

    const stopRadio = () => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.src = ""
        }
        setPlayingRadio(null)
        setIsPlaying(false)
    }

    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategory(categoryId)
        setSearchQuery("")
    }

    const handleBackToCategories = () => {
        setSelectedCategory(null)
        setSearchQuery("")
    }

    const selectedCategoryObj = categories.find(c => c.id === selectedCategory)

    return (
        <div className="radio-player">
            <style jsx>{`
                .radio-player {
                    padding: 1rem 0;
                }

                .radio-header {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                    padding: 2.5rem 2rem;
                    border-radius: 20px;
                    margin-bottom: 2rem;
                    box-shadow: 0 10px 30px rgba(236, 72, 153, 0.3);
                }

                .radio-title {
                    font-size: 2rem;
                    font-weight: 700;
                    margin: 0 0 0.5rem 0;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .radio-subtitle {
                    font-size: 1rem;
                    opacity: 0.95;
                    margin: 0;
                }

                .breadcrumb-nav {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1.5rem;
                    padding: 1rem 1.5rem;
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
                }

                .breadcrumb-link {
                    color: #6b7280;
                    text-decoration: none;
                    font-weight: 500;
                    transition: color 0.3s ease;
                    cursor: pointer;
                }

                .breadcrumb-link:hover {
                    color: #3b82f6;
                }

                .breadcrumb-separator {
                    color: #d1d5db;
                }

                .breadcrumb-current {
                    color: #1f2937;
                    font-weight: 600;
                }

                .categories-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .category-card {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    transition: all 0.3s ease;
                    cursor: pointer;
                    border: 2px solid transparent;
                    position: relative;
                    overflow: hidden;
                }

                .category-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 5px;
                    background: var(--gradient);
                }

                .category-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
                    border-color: rgba(236, 72, 153, 0.3);
                }

                .category-header {
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                    margin-bottom: 1rem;
                }

                .category-icon {
                    width: 60px;
                    height: 60px;
                    background: var(--gradient);
                    border-radius: 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 1.5rem;
                    flex-shrink: 0;
                }

                .category-info {
                    flex: 1;
                }

                .category-name {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin: 0 0 0.25rem 0;
                }

                .category-count {
                    font-size: 0.9rem;
                    color: #6b7280;
                    font-weight: 500;
                }

                .category-description {
                    font-size: 0.9rem;
                    color: #9ca3af;
                    margin: 0;
                    line-height: 1.5;
                }

                .search-box {
                    background: white;
                    border-radius: 15px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                }

                .search-input {
                    border: 2px solid #e5e7eb;
                    border-radius: 50px;
                    padding: 0.85rem 1.5rem;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                }

                .search-input:focus {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.1);
                    outline: none;
                }

                .radio-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .radio-card {
                    background: white;
                    border-radius: 15px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    transition: all 0.3s ease;
                    cursor: pointer;
                    border: 2px solid transparent;
                }

                .radio-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
                    border-color: #3b82f6;
                }

                .radio-card.playing {
                    border-color: #3b82f6;
                    background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
                }

                .radio-card-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                .radio-icon {
                    width: 50px;
                    height: 50px;
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 1.3rem;
                    flex-shrink: 0;
                }

                .radio-card.playing .radio-icon {
                    animation: pulse 2s ease-in-out infinite;
                }

                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }

                .radio-name {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #1f2937;
                    margin: 0;
                    line-height: 1.4;
                }

                .radio-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .radio-btn {
                    flex: 1;
                    padding: 0.75rem;
                    border-radius: 10px;
                    border: none;
                    font-weight: 600;
                    font-size: 0.9rem;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .play-btn {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                }

                .play-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(236, 72, 153, 0.4);
                }

                .player-bar {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: white;
                    border-top: 2px solid #3b82f6;
                    padding: 1.25rem 2rem;
                    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
                    z-index: 1000;
                    animation: slideUp 0.3s ease-out;
                }

                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }

                .player-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }

                .now-playing {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .playing-icon {
                    width: 50px;
                    height: 50px;
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 1.3rem;
                    animation: pulse 2s ease-in-out infinite;
                }

                .playing-info h4 {
                    margin: 0;
                    font-size: 1rem;
                    font-weight: 600;
                    color: #1f2937;
                }

                .playing-info p {
                    margin: 0.25rem 0 0 0;
                    font-size: 0.85rem;
                    color: #6b7280;
                }

                .player-controls {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .control-btn {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    border: none;
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                    font-size: 1.2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .control-btn:hover {
                    transform: scale(1.1);
                    box-shadow: 0 4px 12px rgba(236, 72, 153, 0.4);
                }

                .volume-control {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .volume-slider {
                    width: 100px;
                    height: 6px;
                    border-radius: 3px;
                    background: #e5e7eb;
                    outline: none;
                    -webkit-appearance: none;
                }

                .volume-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #3b82f6;
                    cursor: pointer;
                }

                .volume-slider::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #3b82f6;
                    cursor: pointer;
                    border: none;
                }

                .loading-container,
                .error-container {
                    text-align: center;
                    padding: 3rem 1rem;
                }

                .spinner {
                    width: 60px;
                    height: 60px;
                    border: 4px solid #fce7f3;
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1.5rem;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .error-icon {
                    font-size: 4rem;
                    color: #ef4444;
                    margin-bottom: 1rem;
                }

                .retry-btn {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 0.85rem 2rem;
                    border-radius: 50px;
                    font-weight: 600;
                    margin-top: 1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .retry-btn:hover {
                    background: #2563eb;
                    transform: translateY(-2px);
                }

                .empty-category {
                    text-align: center;
                    padding: 4rem 1rem;
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                }

                .empty-icon {
                    font-size: 4rem;
                    color: #d1d5db;
                    margin-bottom: 1.5rem;
                }

                @media (max-width: 768px) {
                    .categories-grid,
                    .radio-grid {
                        grid-template-columns: 1fr;
                    }

                    .radio-header {
                        padding: 2rem 1.5rem;
                    }

                    .radio-title {
                        font-size: 1.6rem;
                    }

                    .player-bar {
                        padding: 1rem;
                    }

                    .player-content {
                        flex-direction: column;
                        gap: 1rem;
                    }

                    .now-playing {
                        width: 100%;
                    }

                    .volume-control {
                        display: none;
                    }

                    .category-card {
                        padding: 1.5rem;
                    }
                }
            `}</style>

            {/* Hidden audio element */}
            <audio ref={audioRef} onEnded={stopRadio} />

            {/* Header */}
            <div className="radio-header">
                <h2 className="radio-title">
                    <i className="fas fa-broadcast-tower"></i>
                    {selectedCategoryObj ? selectedCategoryObj.name : "مكتبة الإذاعات"}
                </h2>
                <p className="radio-subtitle">
                    {selectedCategoryObj ? selectedCategoryObj.description : "اختر التصنيف المناسب لك"}
                </p>
            </div>

            {/* Breadcrumb Navigation */}
            {selectedCategory && (
                <div className="breadcrumb-nav">
                    <span className="breadcrumb-link" onClick={handleBackToCategories}>
                        <i className="fas fa-home me-2"></i>
                        راديو
                    </span>
                    <span className="breadcrumb-separator">
                        <i className="fas fa-chevron-left"></i>
                    </span>
                    <span className="breadcrumb-current">{selectedCategoryObj?.name}</span>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <h3>جاري تحميل الإذاعات...</h3>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="error-container">
                    <div className="error-icon">
                        <i className="fas fa-exclamation-circle"></i>
                    </div>
                    <h3>حدث خطأ في تحميل الإذاعات</h3>
                    <p className="text-muted">{error}</p>
                    <button className="retry-btn" onClick={fetchRadios}>
                        <i className="fas fa-redo me-2"></i>
                        إعادة المحاولة
                    </button>
                </div>
            )}

            {/* Categories Grid - Level 1 */}
            {!loading && !error && !selectedCategory && (
                <div className="categories-grid">
                    {categories.map((category) => {
                        const count = getRadiosByCategory(category.id).length
                        if (count === 0) return null

                        return (
                            <div
                                key={category.id}
                                className="category-card"
                                style={{ '--gradient': category.gradient } as React.CSSProperties}
                                onClick={() => handleCategorySelect(category.id)}
                            >
                                <div className="category-header">
                                    <div className="category-icon" style={{ background: category.gradient }}>
                                        <i className={`fas ${category.icon}`}></i>
                                    </div>
                                    <div className="category-info">
                                        <h3 className="category-name">{category.name}</h3>
                                        <p className="category-count">
                                            <i className="fas fa-broadcast-tower me-1"></i>
                                            {count} إذاعة
                                        </p>
                                    </div>
                                </div>
                                <p className="category-description">{category.description}</p>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Station List - Level 2 */}
            {!loading && !error && selectedCategory && (
                <>
                    {/* Search Box */}
                    <div className="search-box">
                        <div className="position-relative">
                            <i className="fas fa-search position-absolute" style={{ right: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}></i>
                            <input
                                type="text"
                                className="form-control search-input"
                                placeholder="ابحث عن إذاعة..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ paddingRight: '3.5rem' }}
                            />
                        </div>
                    </div>

                    {/* Radio Grid */}
                    {filteredRadios.length > 0 ? (
                        <div className="radio-grid">
                            {filteredRadios.map((radio) => (
                                <div
                                    key={radio.id}
                                    className={`radio-card ${playingRadio?.id === radio.id ? 'playing' : ''}`}
                                    onClick={() => playRadio(radio)}
                                >
                                    <div className="radio-card-header">
                                        <div className="radio-icon">
                                            <i className={playingRadio?.id === radio.id && isPlaying ? "fas fa-volume-up" : "fas fa-radio"}></i>
                                        </div>
                                        <h3 className="radio-name">{radio.name}</h3>
                                    </div>
                                    <div className="radio-actions">
                                        <button className="radio-btn play-btn" type="button">
                                            <i className={`fas ${playingRadio?.id === radio.id && isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                                            {playingRadio?.id === radio.id && isPlaying ? 'إيقاف مؤقت' : 'استماع'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-category">
                            <div className="empty-icon">
                                <i className="fas fa-search"></i>
                            </div>
                            <h4 className="text-muted">لا توجد نتائج</h4>
                            <p className="text-muted">جرب البحث بكلمات أخرى</p>
                        </div>
                    )}
                </>
            )}

            {/* Player Bar */}
            {playingRadio && (
                <div className="player-bar">
                    <div className="player-content">
                        <div className="now-playing">
                            <div className="playing-icon">
                                <i className="fas fa-broadcast-tower"></i>
                            </div>
                            <div className="playing-info">
                                <h4>{playingRadio.name}</h4>
                                <p>
                                    <i className={`fas ${isPlaying ? 'fa-circle text-danger' : 'fa-pause-circle text-muted'} me-1`}></i>
                                    {isPlaying ? 'يتم البث الآن' : 'متوقف مؤقتاً'}
                                </p>
                            </div>
                        </div>
                        <div className="player-controls">
                            <button
                                className="control-btn"
                                onClick={togglePlayPause}
                                type="button"
                                title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                            >
                                <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                            </button>
                            <button
                                className="control-btn"
                                onClick={stopRadio}
                                type="button"
                                title="إيقاف"
                            >
                                <i className="fas fa-stop"></i>
                            </button>
                            <div className="volume-control">
                                <i className="fas fa-volume-up text-muted"></i>
                                <input
                                    type="range"
                                    className="volume-slider"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
