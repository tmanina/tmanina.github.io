"use client"

import * as React from "react"

interface RuqyahPlayerProps {
    onBack: () => void
}

interface RuqyahTrack {
    title: string
    description: string
    url: string
    reciter?: string
}

export function RuqyahPlayer({ onBack }: RuqyahPlayerProps) {
    const tracks: RuqyahTrack[] = [
        {
            title: "رقية شرعية - تحصين",
            description: "رقية شرعية للتحصين والحفظ من الشياطين",
            url: "https://soundcloud.com/islamic-media/tahseen",
            reciter: "Islamic Media"
        },
        {
            title: "رقية شرعية شاملة",
            description: "رقية شرعية كاملة للحفظ والشفاء",
            url: "https://soundcloud.com/muslimsaleh/rokyashar3ya",
            reciter: "مسلم صالح"
        },
        {
            title: "رقية شرعية - محمد جودة",
            description: "رقية شرعية بصوت الشيخ محمد جودة",
            url: "https://soundcloud.com/goda-al-king/mohamedgoda",
            reciter: "محمد جودة"
        },
        {
            title: "رقية شرعية للعين والحسد",
            description: "رقية متخصصة للعين والحسد",
            url: "https://soundcloud.com/abo-alazz-971975426/256k-mp3",
            reciter: "رقية شرعية"
        },
        {
            title: "رقية شرعية - محمد عمرو",
            description: "رقية شرعية قوية ومؤثرة",
            url: "https://soundcloud.com/mohamed-amr-915443934/8tkblixnxmx5",
            reciter: "محمد عمرو"
        },
        {
            title: "رقية شرعية للسحر والمس",
            description: "رقية متخصصة للسحر والمس",
            url: "https://soundcloud.com/0c6x6akylngp/mgkslttunqb0",
            reciter: "رقية شرعية"
        }
    ]

    return (
        <div className="ruqyah-player animate__animated animate__fadeIn">
            <style jsx>{`
                .ruqyah-player {
                    padding-bottom: 2rem;
                }
                
                .player-header {
                    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                    padding: 2rem;
                    border-radius: 1rem;
                    color: white;
                    margin-bottom: 2rem;
                    box-shadow: 0 10px 25px rgba(139, 92, 246, 0.2);
                }

                .tracks-grid {
                    display: grid;
                    gap: 1.5rem;
                }

                .track-card {
                    background: white;
                    border-radius: 1rem;
                    padding: 1.5rem;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                    border: 2px solid transparent;
                    transition: all 0.3s ease;
                }

                .track-card:hover {
                    border-color: #8b5cf6;
                    box-shadow: 0 8px 16px rgba(139, 92, 246, 0.15);
                    transform: translateY(-2px);
                }

                .track-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                .track-icon {
                    width: 50px;
                    height: 50px;
                    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 1.5rem;
                    flex-shrink: 0;
                }

                .track-info {
                    flex: 1;
                }

                .track-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin: 0 0 0.25rem 0;
                }

                .track-description {
                    font-size: 0.9rem;
                    color: #6b7280;
                    margin: 0;
                }

                .track-reciter {
                    font-size: 0.85rem;
                    color: #8b5cf6;
                    font-weight: 600;
                    margin-top: 0.25rem;
                }

                .soundcloud-embed {
                    width: 100%;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .info-section {
                    background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
                    border-radius: 1rem;
                    padding: 1.5rem;
                    margin-top: 2rem;
                }

                .info-title {
                    color: #6b21a8;
                    font-weight: 700;
                    font-size: 1.2rem;
                    margin-bottom: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .info-text {
                    color: #581c87;
                    line-height: 1.8;
                    font-size: 1rem;
                }

                @media (max-width: 768px) {
                    .track-card {
                        padding: 1.25rem;
                    }

                    .track-icon {
                        width: 45px;
                        height: 45px;
                        font-size: 1.3rem;
                    }

                    .track-title {
                        font-size: 1rem;
                    }
                }
            `}</style>

            {/* Back Button */}
            <button
                className="btn btn-outline-secondary rounded-pill mb-4"
                onClick={onBack}
                type="button"
            >
                <i className="fas fa-arrow-right me-2"></i>
                رجوع للمكتبة
            </button>

            {/* Header */}
            <div className="player-header text-center">
                <div className="mb-3">
                    <i className="fas fa-book-medical fs-1 mb-2 opacity-75"></i>
                    <h1 className="fw-bold mb-1">رقية شرعية</h1>
                    <p className="opacity-90">آيات وأدعية الرقية الشرعية - مجموعة متنوعة</p>
                </div>
            </div>

            {/* Tracks Grid */}
            <div className="tracks-grid">
                {tracks.map((track, index) => (
                    <div key={index} className="track-card">
                        <div className="track-header">
                            <div className="track-icon">
                                <i className="fas fa-play"></i>
                            </div>
                            <div className="track-info">
                                <h3 className="track-title">{track.title}</h3>
                                <p className="track-description">{track.description}</p>
                                {track.reciter && (
                                    <div className="track-reciter">
                                        <i className="fas fa-microphone-alt me-1"></i>
                                        {track.reciter}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SoundCloud Embed */}
                        <div className="soundcloud-embed">
                            <iframe
                                width="100%"
                                height="166"
                                scrolling="no"
                                frameBorder="no"
                                allow="autoplay"
                                src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(track.url)}&color=%238b5cf6&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`}
                            ></iframe>
                        </div>
                    </div>
                ))}
            </div>

            {/* Info Section */}
            <div className="info-section">
                <div className="info-title">
                    <i className="fas fa-info-circle"></i>
                    <span>عن الرقية الشرعية</span>
                </div>
                <div className="info-text">
                    الرقية الشرعية هي التعوذ بالله من الشيطان والاستعانة به في دفع ما يضر العبد، وتكون بقراءة آيات من القرآن الكريم والأدعية المأثورة عن النبي ﷺ. يُنصح بالاستماع في مكان هادئ والتركيز على معاني الآيات.
                </div>

                <div className="mt-3 text-center">
                    <small className="text-muted">
                        <i className="fas fa-volume-up me-1"></i>
                        استمع للرقية التي تناسبك وكررها حسب الحاجة
                    </small>
                </div>
            </div>
        </div>
    )
}
