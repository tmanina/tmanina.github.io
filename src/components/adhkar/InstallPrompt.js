'use client';
import { useState, useEffect } from 'react';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // 1. Check if user is on iOS (iPhone/iPad)
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(isIosDevice);

        // 2. Listen for the 'beforeinstallprompt' event (Android/Desktop)
        const handleBeforeInstallPrompt = (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Show your custom UI
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowPrompt(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        // Clear the prompt
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    if (!showPrompt && !isIOS) return null;

    return (
        <>
            {/* رسالة الاندرويد والكمبيوتر */}
            {showPrompt && (
                <div className="fixed bottom-4 left-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg flex flex-col gap-3 border border-gray-700 z-50">
                    <p className="font-bold text-lg">Install App?</p>
                    <p className="text-sm text-gray-300">Get a better experience with our app.</p>
                    <div className="flex gap-3">
                        <button
                            onClick={handleInstallClick}
                            className="bg-blue-600 px-4 py-2 rounded font-bold flex-1"
                        >
                            Install
                        </button>
                        <button
                            onClick={() => setShowPrompt(false)}
                            className="bg-gray-700 px-4 py-2 rounded flex-1"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* رسالة خاصة للايفون فقط لو عايز تظهرها */}
            {/* {isIOS && (
         <div className="fixed bottom-0 w-full bg-white p-4 text-black text-center">
            To install: Tap <span className="text-xl">share icon</span> then "Add to Home Screen"
         </div>
      )} 
      */}
        </>
    );
}