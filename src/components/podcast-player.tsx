"use client"

import * as React from "react"
import "./podcast-player.css"

interface Episode {
    id: number
    title: string
    embedUrl: string
}

interface Book {
    id: number
    name: string
    description: string
    episodes: Episode[]
}

interface PodcastPlayerProps {
    onBack?: () => void
}

export function PodcastPlayer({ onBack }: PodcastPlayerProps) {
    const [selectedBook, setSelectedBook] = React.useState<Book | null>(null)
    const [playingEpisode, setPlayingEpisode] = React.useState<Episode | null>(null)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [favorites, setFavorites] = React.useState<string[]>([])
    const [showFavoritesOnly, setShowFavoritesOnly] = React.useState(false)

    // Load favorites from localStorage on mount
    React.useEffect(() => {
        const savedFavorites = localStorage.getItem('podcast-favorites')
        if (savedFavorites) {
            setFavorites(JSON.parse(savedFavorites))
        }
    }, [])

    // Save favorites to localStorage
    const saveFavorites = (newFavorites: string[]) => {
        localStorage.setItem('podcast-favorites', JSON.stringify(newFavorites))
        setFavorites(newFavorites)
    }

    const toggleFavorite = (bookId: number, episodeId: number) => {
        const key = `${bookId}-${episodeId}`
        if (favorites.includes(key)) {
            saveFavorites(favorites.filter(f => f !== key))
        } else {
            saveFavorites([...favorites, key])
        }
    }

    const isFavorite = (bookId: number, episodeId: number) => {
        return favorites.includes(`${bookId}-${episodeId}`)
    }

    // كتاب البداية و النهاية - Episodes from Audiomack playlist
    const bidayaWaNihayaEpisodes: Episode[] = [
        { id: 1, title: "1- البداية والنهايه", embedUrl: "https://audiomack.com/embed/githubx25/song/6958188317e05" },
        { id: 2, title: "2- اللوح المحفوظ وأيام الخلق الستة", embedUrl: "https://audiomack.com/embed/githubx25/song/2" },
        { id: 3, title: "3- الأرض قبل السماء وقوة صدقة السر", embedUrl: "https://audiomack.com/embed/githubx25/song/69582746aeee4" },
        { id: 4, title: "4- حكمة ملوحة البحر وسر أنهار الجنة الأربعة", embedUrl: "https://audiomack.com/embed/githubx25/song/69581bc6f0b3d" },
        { id: 5, title: "5- ابن كثير كيف رأى الكون", embedUrl: "https://audiomack.com/embed/githubx25/song/69581d3a941b7" },
        { id: 6, title: "6- صورة الكون من المجرة للملائكة", embedUrl: "https://audiomack.com/embed/githubx25/song/6" },
        { id: 7, title: "7- من سدرة المنتهى إلى كاتب حسناتك", embedUrl: "https://audiomack.com/embed/githubx25/song/695820735cbfe" },
        { id: 8, title: "8- أصل العداوة الأزلية إبليس والجن قبل آدم", embedUrl: "https://audiomack.com/embed/githubx25/song/695820c66ffc0" },
        { id: 9, title: "9- عرش إبليس واستراتيجية الحرب اليومية", embedUrl: "https://audiomack.com/embed/githubx25/song/695821090e6fb" },
        { id: 10, title: "10- قصة آدم للمغفرة والخليفة", embedUrl: "https://audiomack.com/embed/githubx25/song/695821540d48a" },
        { id: 11, title: "11- حجة آدم على موسى وخلق البشر", embedUrl: "https://audiomack.com/embed/githubx25/song/6958219841ff4" },
        { id: 12, title: "12- تصميم الطبيعة البشرية الميثاق النسيان الشقاء", embedUrl: "https://audiomack.com/embed/githubx25/song/69582212404f1" },
        { id: 13, title: "13- قابيل وهابيل - أول جريمة", embedUrl: "https://audiomack.com/embed/githubx25/song/69582ad3bbdcb" },
        { id: 14, title: "14- شيث هبة الله ونبوءة الطوفان", embedUrl: "https://audiomack.com/embed/githubx25/song/69582b1a27aaa" },
    ]

    // List of books (كتب التراث)
    const booksList: Book[] = [
        {
            id: 1,
            name: "كتاب البداية و النهاية لابن كثير",
            description: "موسوعة تاريخية شاملة تأخذك في رحلة من بدء الخلق، مروراً بقصص الأنبياء والأمم السابقة، وصولاً إلى أحداث آخر الزمان وأهوال يوم القيامة",
            episodes: bidayaWaNihayaEpisodes
        }
    ]

    const handleBookSelect = (book: Book) => {
        setSelectedBook(book)
        setPlayingEpisode(null)
    }

    const handleBackToBooks = () => {
        setSelectedBook(null)
        setPlayingEpisode(null)
    }

    const handleEpisodeClick = (episode: Episode) => {
        if (playingEpisode?.id === episode.id) {
            setPlayingEpisode(null)
        } else {
            setPlayingEpisode(episode)
        }
    }

    const filteredEpisodes = selectedBook?.episodes.filter(episode => {
        const matchesSearch = episode.title.includes(searchQuery)
        const matchesFavorite = !showFavoritesOnly || isFavorite(selectedBook.id, episode.id)
        return matchesSearch && matchesFavorite
    }) || []

    return (
        <div className="podcast-player">
            {/* Header */}
            <div className="podcast-header">
                <div className="podcast-header-content">
                    <div>
                        <h2 className="podcast-title">
                            <i className="fas fa-podcast"></i>
                            بودكاست
                        </h2>
                        <p className="podcast-subtitle">
                            في هذا القسم سنبدأ بمناقشة و تبسيط بعض كتب التراث الديني
                        </p>
                    </div>
                </div>
            </div>

            {!selectedBook ? (
                /* Books Grid */
                <div className="books-grid">
                    {booksList.map((book) => (
                        <div
                            key={book.id}
                            className="book-card"
                            onClick={() => handleBookSelect(book)}
                        >
                            <div className="book-card-header">
                                <div className="book-icon">
                                    <i className="fas fa-book"></i>
                                </div>
                                <div className="book-info">
                                    <h3 className="book-name">{book.name}</h3>
                                    <p className="book-description">{book.description}</p>
                                    <div className="book-meta">
                                        <span className="meta-item">
                                            <i className="fas fa-list"></i>
                                            {book.episodes.length} حلقة
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="book-actions">
                                <button className="book-btn play-btn" type="button">
                                    <i className="fas fa-play"></i>
                                    استماع الآن
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Episodes View */
                <div className="episodes-view">
                    <button
                        className="back-to-books-btn"
                        onClick={handleBackToBooks}
                        type="button"
                    >
                        <i className="fas fa-arrow-right"></i>
                        رجوع للكتب
                    </button>

                    <div className="current-book-header">
                        <div className="current-book-icon">
                            <i className="fas fa-book"></i>
                        </div>
                        <div className="current-book-info">
                            <h3 className="current-book-name">{selectedBook.name}</h3>
                            <p className="current-book-description">{selectedBook.description}</p>
                            <div className="current-book-meta">
                                <span className="meta-item">
                                    <i className="fas fa-list"></i>
                                    {selectedBook.episodes.length} حلقة
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Search Box & Favorites Filter */}
                    <div className="search-box">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="ابحث عن حلقة..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button
                            className={`favorites-filter-btn ${showFavoritesOnly ? 'active' : ''}`}
                            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                            type="button"
                            title={showFavoritesOnly ? 'عرض الكل' : 'المفضلة فقط'}
                        >
                            <i className={`fas ${showFavoritesOnly ? 'fa-heart' : 'fa-heart'}`}></i>
                            {showFavoritesOnly ? 'المفضلة' : 'المفضلة'}
                        </button>
                    </div>

                    {/* Episodes Grid */}
                    <div className="episodes-grid">
                        {filteredEpisodes.map((episode) => (
                            <div
                                key={episode.id}
                                className={`episode-card ${playingEpisode?.id === episode.id ? 'playing' : ''}`}
                            >
                                <div
                                    className="episode-header"
                                    onClick={() => handleEpisodeClick(episode)}
                                >
                                    <div className="episode-number">{episode.id}</div>
                                    <div className="episode-info">
                                        <h4 className="episode-title">{episode.title}</h4>
                                    </div>
                                    <button
                                        className={`episode-favorite-btn ${isFavorite(selectedBook!.id, episode.id) ? 'active' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            toggleFavorite(selectedBook!.id, episode.id)
                                        }}
                                        type="button"
                                        title={isFavorite(selectedBook!.id, episode.id) ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                                    >
                                        <i className={`fas fa-heart`}></i>
                                    </button>
                                    <button className="episode-play-btn" type="button">
                                        <i className={`fas ${playingEpisode?.id === episode.id ? 'fa-times' : 'fa-play'}`}></i>
                                    </button>
                                </div>

                                {/* Embedded Player - Shows when episode is selected */}
                                {playingEpisode?.id === episode.id && (
                                    <div className="episode-player">
                                        <iframe
                                            src={episode.embedUrl}
                                            scrolling="no"
                                            width="100%"
                                            height="252"
                                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                            style={{ border: 'none' }}
                                            title={episode.title}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <p className="player-hint">
                        <i className="fas fa-calendar-alt"></i>
                        ترقبوا تحديثاً أسبوعياً بحلقات جديدة إن شاء الله
                    </p>
                </div>
            )}
        </div>
    )
}

export default PodcastPlayer
