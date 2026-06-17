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
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gradient-to-br from-[#2b5a4b] to-[#1a3830] text-white px-5 py-3 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] z-[10001] flex items-center gap-3 animate-slide-up-notification max-w-[90%]">
            <i className="fas fa-sync-alt text-2xl"></i>
            <div className="flex-1">
                <div className="font-semibold text-sm mb-0.5">تحديث جديد متاح {newVersion && `(${newVersion})`}</div>
                <div className="text-xs opacity-80">اضغط للتحديث الآن</div>
            </div>
            <div className="flex gap-2">
                <button className="border-0 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-transform duration-200 hover:scale-105 bg-white text-[#2b5a4b]" onClick={handleUpdate}>
                    تحديث
                </button>
                <button className="border-0 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-transform duration-200 hover:scale-105 bg-white/20 text-white" onClick={handleDismiss}>
                    لاحقاً
                </button>
            </div>
        </div>
    );
}

export default UpdateNotification;
