"use client"

import * as React from "react"
import { useRadioContext } from "@/contexts/radio-context"

const RADIOS = [
    {
        id: 90000,
        name: "إذاعة القرأن الكريم من القاهرة",
        url: "https://stream.zeno.fm/ru2hqnplhk7uv",
    },
    {
        id: 90029,
        name: "المنشاوي - اذاعة القران الكريم",
        url: "https://radio.alhuwayni.com/listen/alminshawi/radio.mp3",
    },
]

export function MiniRadioPlayer() {
    const [isPlaying, setIsPlaying] = React.useState(false)
    const [hasInteracted, setHasInteracted] = React.useState(false)
    const [volume, setVolume] = React.useState(0.7)
    const [audioError, setAudioError] = React.useState(false)
    const [isBuffering, setIsBuffering] = React.useState(true)
    const [currentRadioIndex, setCurrentRadioIndex] = React.useState(0)

    const currentRadio = RADIOS[currentRadioIndex]
    const audioRef = React.useRef<HTMLAudioElement>(null)
    const retryCountRef = React.useRef(0)
    const { activeRadioId, activeIsPlaying, setActiveRadio } = useRadioContext()
    const activeRadioIdRef = React.useRef(activeRadioId)
    activeRadioIdRef.current = activeRadioId

    // Set audio source on mount only (no auto-play)
    React.useEffect(() => {
        if (audioRef.current && !audioRef.current.src) {
            audioRef.current.volume = volume
            audioRef.current.src = currentRadio.url
            audioRef.current.load()
        }
    }, [])

    // Handle volume changes
    React.useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume
        }
    }, [volume])

    // Sync with RadioContext: pause if another component starts playing a different radio
    React.useEffect(() => {
        if (activeRadioId !== null && activeRadioId !== currentRadio.id && activeIsPlaying) {
            if (audioRef.current && isPlaying) {
                audioRef.current.pause()
                setIsPlaying(false)
            }
        }
    }, [activeRadioId, activeIsPlaying, currentRadio.id])

    const togglePlay = () => {
        if (!audioRef.current) return

        if (isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
            setActiveRadio(currentRadio.id, false)
        } else {
            // Announce to context that we're taking over
            setActiveRadio(currentRadio.id, true)

            setAudioError(false)
            setIsBuffering(true)
            // If audio errored out, reload the source
            if (audioError) {
                audioRef.current.src = currentRadio.url
                audioRef.current.load()
            }
            audioRef.current.play()
                .then(() => {
                    setIsPlaying(true)
                    setIsBuffering(false)
                    setHasInteracted(true)
                    setAudioError(false)
                    retryCountRef.current = 0
                })
                .catch((err) => {
                    console.error('Play failed:', err)
                    setIsPlaying(false)
                    setIsBuffering(false)
                    setAudioError(true)
                })
        }
    }

    // Refs for Media Session handlers (defined after togglePlay to avoid TDZ)
    const togglePlayRef = React.useRef(togglePlay)
    togglePlayRef.current = togglePlay
    const isPlayingRef = React.useRef(isPlaying)
    isPlayingRef.current = isPlaying

    // Media Session API - show playing info in mobile notification/lock screen
    React.useEffect(() => {
        if (!('mediaSession' in navigator)) return

        // Always set metadata while MiniRadioPlayer is mounted (even when paused)
        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentRadio.name,
            artist: 'إذاعة القرآن الكريم',
            album: 'راديو القرآن',
            artwork: [
                { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
                { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
            ]
        })

        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'

        // Register handlers — they use refs to always have fresh state
        navigator.mediaSession.setActionHandler('play', () => {
            if (audioRef.current && !isPlayingRef.current) {
                togglePlayRef.current()
            }
        })

        navigator.mediaSession.setActionHandler('pause', () => {
            if (audioRef.current && isPlayingRef.current) {
                togglePlayRef.current()
            }
        })

        navigator.mediaSession.setActionHandler('stop', () => {
            if (audioRef.current) {
                audioRef.current.pause()
                setIsPlaying(false)
                setActiveRadio(currentRadio.id, false)
            }
        })

        return () => {
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = null
                navigator.mediaSession.setActionHandler('play', null)
                navigator.mediaSession.setActionHandler('pause', null)
                navigator.mediaSession.setActionHandler('stop', null)
            }
        }
    }, [isPlaying, currentRadio])

    const handleAudioError = () => {
        console.error('Audio stream error')
        setIsPlaying(false)
        setIsBuffering(false)
        setAudioError(true)
        setActiveRadio(null, false)

        // Auto-retry up to 3 times
        if (retryCountRef.current < 3) {
            retryCountRef.current++
            setTimeout(() => {
                if (audioRef.current) {
                    audioRef.current.src = currentRadio.url
                    audioRef.current.load()
                    audioRef.current.play()
                        .then(() => {
                            setIsPlaying(true)
                            setAudioError(false)
                            setIsBuffering(false)
                            setActiveRadio(currentRadio.id, true)
                        })
                        .catch(() => {})
                }
            }, 2000 * retryCountRef.current)
        }
    }

    const handleCanPlay = () => {
        setIsBuffering(false)
        retryCountRef.current = 0
    }

    const handleWaiting = () => {
        setIsBuffering(true)
    }

    const handlePlaying = () => {
        setIsBuffering(false)
        setIsPlaying(true)
        setAudioError(false)
    }

    return (
        <>
            <style jsx>{`
                .mini-radio-container {
                    background: linear-gradient(135deg, #1a3a2a 0%, #2d5a4b 50%, #1a3a2a 100%);
                    border-radius: 20px;
                    padding: 1.25rem 1.5rem;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 8px 32px rgba(26, 58, 42, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }

                .mini-radio-container::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(
                        circle at 30% 50%,
                        rgba(255, 215, 0, 0.03) 0%,
                        transparent 50%
                    );
                    pointer-events: none;
                }

                .radio-wave {
                    position: absolute;
                    top: 50%;
                    left: 1.5rem;
                    width: 40px;
                    height: 40px;
                    transform: translateY(-50%);
                    pointer-events: none;
                }

                .radio-wave-bar {
                    position: absolute;
                    bottom: 0;
                    width: 4px;
                    background: linear-gradient(to top, #ffd700, #ffa500);
                    border-radius: 2px;
                    transition: height 0.3s ease;
                }

                .radio-wave.playing .radio-wave-bar {
                    animation: wave 1.2s ease-in-out infinite;
                }

                .radio-wave-bar:nth-child(1) {
                    left: 0;
                    height: ${isPlaying ? '60%' : '30%'};
                    animation-delay: 0s;
                }

                .radio-wave-bar:nth-child(2) {
                    left: 8px;
                    height: ${isPlaying ? '80%' : '30%'};
                    animation-delay: 0.2s;
                }

                .radio-wave-bar:nth-child(3) {
                    left: 16px;
                    height: ${isPlaying ? '50%' : '30%'};
                    animation-delay: 0.4s;
                }

                .radio-wave-bar:nth-child(4) {
                    left: 24px;
                    height: ${isPlaying ? '70%' : '30%'};
                    animation-delay: 0.6s;
                }

                .radio-wave-bar:nth-child(5) {
                    left: 32px;
                    height: ${isPlaying ? '45%' : '30%'};
                    animation-delay: 0.8s;
                }

                @keyframes wave {
                    0%, 100% { height: 30%; }
                    50% { height: 85%; }
                }

                .radio-wave.playing .radio-wave-bar {
                    animation: wave 1.2s ease-in-out infinite;
                }

                .radio-info {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .radio-icon-wrap {
                    width: 44px;
                    height: 44px;
                    background: rgba(255, 215, 0, 0.15);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    border: 1px solid rgba(255, 215, 0, 0.2);
                }

                .radio-icon-wrap i {
                    color: #ffd700;
                    font-size: 1.2rem;
                }

                .radio-text {
                    flex: 1;
                    min-width: 0;
                }

                .radio-label {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.6);
                    margin-bottom: 0.15rem;
                }

                .radio-name {
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: white;
                    margin: 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .radio-status {
                    font-size: 0.7rem;
                    color: rgba(255, 255, 255, 0.5);
                    margin-top: 0.1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                }

                .status-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    display: inline-block;
                }

                .status-dot.playing {
                    background: #22c55e;
                    animation: pulse-dot 1.5s ease-in-out infinite;
                }

                .status-dot.paused {
                    background: #9ca3af;
                }

                .status-dot.error {
                    background: #ef4444;
                }

                .status-dot.buffering {
                    background: #f59e0b;
                    animation: pulse-dot 0.8s ease-in-out infinite;
                }

                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }

                .radio-controls {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex-shrink: 0;
                }

                .play-btn-mini {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: none;
                    background: linear-gradient(135deg, #ffd700, #f59e0b);
                    color: #1a3a2a;
                    font-size: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    flex-shrink: 0;
                    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
                }

                .play-btn-mini:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5);
                }

                .play-btn-mini:active {
                    transform: scale(0.95);
                }

                .volume-wrap {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .volume-wrap i {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 0.85rem;
                }

                .volume-slider-mini {
                    width: 70px;
                    height: 4px;
                    border-radius: 2px;
                    background: rgba(255, 255, 255, 0.15);
                    outline: none;
                    -webkit-appearance: none;
                    cursor: pointer;
                }

                .volume-slider-mini::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: #ffd700;
                    cursor: pointer;
                    box-shadow: 0 2px 6px rgba(255, 215, 0, 0.4);
                }

                .volume-slider-mini::-moz-range-thumb {
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: #ffd700;
                    cursor: pointer;
                    border: none;
                }

                .retry-indicator {
                    font-size: 0.65rem;
                    color: rgba(255, 255, 255, 0.4);
                    margin-top: 0.15rem;
                }

                .station-switch {
                    display: flex;
                    gap: 0;
                    background: rgba(255, 255, 255, 0.08);
                    border-radius: 10px;
                    padding: 2px;
                    margin-bottom: 0.4rem;
                    direction: ltr;
                }

                .station-switch button {
                    flex: 1;
                    border: none;
                    background: transparent;
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 0.7rem;
                    font-weight: 600;
                    padding: 0.25rem 0.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.25s ease;
                    white-space: nowrap;
                }

                .station-switch button.active {
                    background: rgba(255, 215, 0, 0.2);
                    color: #ffd700;
                    box-shadow: 0 2px 8px rgba(255, 215, 0, 0.15);
                }

                .station-switch button:not(.active):hover {
                    color: rgba(255, 255, 255, 0.8);
                }

                @media (max-width: 576px) {
                    .mini-radio-container {
                        padding: 1rem;
                    }

                    .volume-slider-mini {
                        width: 50px;
                    }

                    .volume-wrap {
                        display: none;
                    }

                    .radio-wave {
                        display: none;
                    }

                    .radio-name {
                        font-size: 0.85rem;
                    }
                }

                @media (max-width: 400px) {
                    .radio-controls {
                        gap: 0.5rem;
                    }

                    .play-btn-mini {
                        width: 36px;
                        height: 36px;
                        font-size: 0.85rem;
                    }
                }
            `}</style>

            <audio
                ref={audioRef}
                onError={handleAudioError}
                onCanPlay={handleCanPlay}
                onWaiting={handleWaiting}
                onPlaying={handlePlaying}
                onPause={() => setIsPlaying(false)}
                crossOrigin="anonymous"
                preload="auto"
            />

            <div className="mini-radio-container">
                <div className="d-flex align-items-center justify-content-between gap-3 position-relative">
                    {/* Wave Visualization */}
                    <div className={`radio-wave ${isPlaying ? 'playing' : ''}`}>
                        <div className="radio-wave-bar"></div>
                        <div className="radio-wave-bar"></div>
                        <div className="radio-wave-bar"></div>
                        <div className="radio-wave-bar"></div>
                        <div className="radio-wave-bar"></div>
                    </div>

                    {/* Radio Info */}
                    <div className="radio-info" style={{ marginRight: '3rem' }}>
                        <div className="radio-icon-wrap">
                            <i className="fas fa-broadcast-tower"></i>
                        </div>
                        <div className="radio-text">
                            <p className="radio-label">راديو القرآن</p>
                            <div className="station-switch">
                                <button
                                    type="button"
                                    className={currentRadioIndex === 0 ? 'active' : ''}
                                    onClick={() => {
                                        if (currentRadioIndex === 0) return
                                        setCurrentRadioIndex(0)
                                        const radio = RADIOS[0]
                                        if (audioRef.current) {
                                            audioRef.current.pause()
                                            audioRef.current.src = radio.url
                                            audioRef.current.load()
                                            setActiveRadio(radio.id, true)
                                            setIsBuffering(true)
                                            setAudioError(false)
                                            audioRef.current.play().then(() => {
                                                setIsPlaying(true)
                                                setIsBuffering(false)
                                                setHasInteracted(true)
                                                setAudioError(false)
                                                retryCountRef.current = 0
                                            }).catch(() => {
                                                setIsPlaying(false)
                                                setIsBuffering(false)
                                            })
                                        }
                                    }}
                                >
                                    القاهرة
                                </button>
                                <button
                                    type="button"
                                    className={currentRadioIndex === 1 ? 'active' : ''}
                                    onClick={() => {
                                        if (currentRadioIndex === 1) return
                                        setCurrentRadioIndex(1)
                                        const radio = RADIOS[1]
                                        if (audioRef.current) {
                                            audioRef.current.pause()
                                            audioRef.current.src = radio.url
                                            audioRef.current.load()
                                            setActiveRadio(radio.id, true)
                                            setIsBuffering(true)
                                            setAudioError(false)
                                            audioRef.current.play().then(() => {
                                                setIsPlaying(true)
                                                setIsBuffering(false)
                                                setHasInteracted(true)
                                                setAudioError(false)
                                                retryCountRef.current = 0
                                            }).catch(() => {
                                                setIsPlaying(false)
                                                setIsBuffering(false)
                                            })
                                        }
                                    }}
                                >
                                    المنشاوي
                                </button>
                            </div>
                            <h4 className="radio-name">{currentRadio.name}</h4>
                            <div className="radio-status">
                                <span className={`status-dot ${audioError ? 'error' : isBuffering ? 'buffering' : isPlaying ? 'playing' : 'paused'}`}></span>
                                {audioError
                                    ? 'تعذر الاتصال - اضغط لإعادة المحاولة'
                                    : isBuffering
                                        ? 'جاري التحميل...'
                                        : isPlaying
                                            ? 'يتم البث الآن'
                                            : 'محتاج تفاعل للتشغيل'
                                }
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="radio-controls">
                        <button
                            className="play-btn-mini"
                            onClick={togglePlay}
                            type="button"
                            title={isPlaying ? 'إيقاف' : 'تشغيل'}
                            aria-label={isPlaying ? 'إيقاف الراديو' : 'تشغيل الراديو'}
                        >
                            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`} style={{ marginRight: isPlaying ? 0 : '2px' }}></i>
                        </button>
                        <div className="volume-wrap">
                            <i className="fas fa-volume-up"></i>
                            <input
                                type="range"
                                className="volume-slider-mini"
                                min="0"
                                max="1"
                                step="0.05"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                title="مستوى الصوت"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
