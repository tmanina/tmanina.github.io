"use client"

import * as React from "react"

/**
 * PWA Update Notification Component
 * Listens for service worker updates and shows a notification to the user
 */
export function UpdateNotification() {
    const [showUpdate, setShowUpdate] = React.useState(false)
    const [newVersion, setNewVersion] = React.useState<string>('');

    React.useEffect(() => {
        // Listen for SW update messages
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'SW_UPDATED') {
                setNewVersion(event.data.version || 'جديد');
                setShowUpdate(true);
            }
        };

        navigator.serviceWorker?.addEventListener('message', handleMessage);

        // Also check for waiting service worker on page load
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                if (registration.waiting) {
                    setShowUpdate(true);
                }

                // Listen for new SW installing
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                setShowUpdate(true);
                            }
                        });
                    }
                });
            });
        }

        return () => {
            navigator.serviceWorker?.removeEventListener('message', handleMessage);
        };
    }, []);

    const handleUpdate = () => {
        // Tell SW to skip waiting and take over
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                if (registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
            });
        }

        // Reload the page to get the new version
        window.location.reload();
    };

    const handleDismiss = () => {
        setShowUpdate(false);
    };

    if (!showUpdate) return null;

    return (
        <>
            <style jsx>{`
                .update-notification {
                    position: fixed;
                    bottom: 80px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(135deg, #2b5a4b 0%, #1a3830 100%);
                    color: white;
                    padding: 12px 20px;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    z-index: 10001;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    animation: slideUp 0.3s ease-out;
                    max-width: 90%;
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }

                .update-icon {
                    font-size: 1.5rem;
                }

                .update-text {
                    flex: 1;
                }

                .update-title {
                    font-weight: 600;
                    font-size: 0.95rem;
                    margin-bottom: 2px;
                }

                .update-subtitle {
                    font-size: 0.8rem;
                    opacity: 0.8;
                }

                .update-actions {
                    display: flex;
                    gap: 8px;
                }

                .update-btn {
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s;
                }

                .update-btn:hover {
                    transform: scale(1.05);
                }

                .update-btn-primary {
                    background: white;
                    color: #2b5a4b;
                }

                .update-btn-secondary {
                    background: rgba(255,255,255,0.2);
                    color: white;
                }
            `}</style>

            <div className="update-notification">
                <i className="fas fa-sync-alt update-icon"></i>
                <div className="update-text">
                    <div className="update-title">تحديث جديد متاح {newVersion && `(${newVersion})`}</div>
                    <div className="update-subtitle">اضغط للتحديث الآن</div>
                </div>
                <div className="update-actions">
                    <button className="update-btn update-btn-primary" onClick={handleUpdate}>
                        تحديث
                    </button>
                    <button className="update-btn update-btn-secondary" onClick={handleDismiss}>
                        لاحقاً
                    </button>
                </div>
            </div>
        </>
    );
}

export default UpdateNotification;
