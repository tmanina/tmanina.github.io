"use client"

import * as React from "react"

interface LivePlayerProps {
    onBack?: () => void
}

export function LivePlayer({ onBack }: LivePlayerProps) {
    return (
        <div className="live-player">
            <style jsx>{`
                .live-player {
                    padding: 1rem 0;
                }

                .live-header {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    color: white;
                    padding: 2.5rem 2rem;
                    border-radius: 20px;
                    margin-bottom: 2rem;
                    box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);
                }

                .live-title {
                    font-size: 2rem;
                    font-weight: 700;
                    margin: 0 0 0.5rem 0;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .live-indicator {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 1rem;
                    background: rgba(255, 255, 255, 0.2);
                    padding: 0.4rem 1rem;
                    border-radius: 50px;
                }

                .live-dot {
                    width: 10px;
                    height: 10px;
                    background: white;
                    border-radius: 50%;
                    animation: pulse-dot 1.5s ease-in-out infinite;
                }

                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                .live-subtitle {
                    font-size: 1rem;
                    opacity: 0.95;
                    margin: 0;
                }

                .video-container {
                    background: white;
                    border-radius: 15px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                }

                .video-wrapper {
                    position: relative;
                    padding-bottom: 56.25%; /* 16:9 aspect ratio */
                    height: 0;
                    overflow: hidden;
                    border-radius: 10px;
                }

                .video-wrapper iframe {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    border: none;
                }

                @media (max-width: 768px) {
                    .live-title {
                        font-size: 1.5rem;
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .video-container {
                        padding: 1rem;
                    }
                }
            `}</style>

            {/* Header */}
            <div className="live-header">
                <h2 className="live-title">
                    <i className="fas fa-video"></i>
                    بث مباشر
                    <span className="live-indicator">
                        <span className="live-dot"></span>
                        مباشر
                    </span>
                </h2>
                <p className="live-subtitle">الحرم المكي - بث مباشر</p>
            </div>

            {/* Video Player */}
            <div className="video-container">
                <div className="video-wrapper">
                    <iframe
                        src="https://www.youtube.com/embed/PfrBk8tPF7c?autoplay=1&mute=1"
                        title="بث مباشر || قناة القرآن الكريم Makkah Live"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                    ></iframe>
                </div>
            </div>
        </div>
    )
}
