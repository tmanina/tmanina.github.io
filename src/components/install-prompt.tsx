'use client'

import * as React from 'react'

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null)
    const [showPrompt, setShowPrompt] = React.useState(false)
    const [isIOS, setIsIOS] = React.useState(false)
    const [isMobile, setIsMobile] = React.useState(false)

    React.useEffect(() => {
        // Check if in development mode
        const isDev = process.env.NODE_ENV === 'development'

        // Check if user is on mobile device
        const checkMobile = () => {
            const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            const smallScreen = window.innerWidth <= 768
            return mobileCheck || smallScreen
        }

        const mobile = checkMobile()
        setIsMobile(mobile)

        // Check if user is on iOS (iPhone/iPad)
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
        setIsIOS(isIosDevice)

        // Listen for the 'beforeinstallprompt' event (Android/Desktop)
        const handleBeforeInstallPrompt = (e: Event) => {
            console.log('✅ beforeinstallprompt event fired!')
            e.preventDefault()
            setDeferredPrompt(e)
            // Show prompt after a delay
            setTimeout(() => setShowPrompt(true), 3000)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        console.log('📱 Install prompt listener registered')

        // Check if already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches

        console.log('InstallPrompt Debug:', {
            isStandalone,
            isMobile: mobile,
            isIOS: isIosDevice,
            userAgent: navigator.userAgent
        })

        // Install prompt disabled - users can use browser's native install option
        // if (!isStandalone) {
        //     // Always show prompt after delay if not installed, even if event didn't fire
        //     // This ensures users see the install option
        //     console.log('Scheduling install prompt to show in 3 seconds')
        //     setTimeout(() => {
        //         console.log('Setting showPrompt to true')
        //         setShowPrompt(true)
        //     }, 3000)
        // } else {
        //     console.log('App already in standalone mode, not showing prompt')
        // }

        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then(registration => console.log('SW registered: ', registration))
                .catch(registrationError => console.log('SW registration failed: ', registrationError))
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        }
    }, [])

    const handleInstallClick = async () => {
        console.log('🔘 Install button clicked')
        console.log('📦 deferredPrompt:', deferredPrompt)

        if (!deferredPrompt) {
            console.log('⚠️ No deferredPrompt available - browser does not support auto-install')

            // Just close the banner without showing alert
            // The manual install option is available in the menu instead
            setShowPrompt(false)
            return
        }

        try {
            console.log('✅ Showing native install prompt')
            deferredPrompt.prompt()
            const { outcome } = await deferredPrompt.userChoice
            console.log('📊 User choice:', outcome)

            if (outcome === 'accepted') {
                console.log('✅ User accepted the install prompt')
            } else {
                console.log('❌ User dismissed the install prompt')
            }
        } catch (error) {
            console.error('❌ Error during install:', error)
        }

        setDeferredPrompt(null)
        setShowPrompt(false)
    }

    if (!showPrompt) return null

    return (
        <>
            {/* Install prompt for Android & Desktop */}
            {showPrompt && !isIOS && (
                <div
                    className="fixed left-0 right-0 p-3 animate__animated animate__slideInUp"
                    style={{ zIndex: 9998, bottom: isMobile ? '90px' : '20px' }}
                >
                    <div className="shadow-lg rounded-xl overflow-hidden bg-card border border-border">
                        <div className="gradient-bg text-white p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-white/25 p-3 flex items-center justify-center" style={{ width: '60px', height: '60px' }}>
                                    <i className="fas fa-download text-xl"></i>
                                </div>
                                <div className="flex-1">
                                    <h6 className="mb-1 font-bold">تثبيت تطبيق طمأنينة</h6>
                                    <p className="mb-0 text-xs opacity-75">احصل على تجربة أفضل مع التطبيق المثبت</p>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={handleInstallClick}
                                    className="flex-1 font-bold bg-white text-gray-900 hover:bg-white/90 rounded-lg px-4 py-2"
                                >
                                    <i className="fas fa-check ms-2"></i>
                                    تثبيت
                                </button>
                                <button
                                    onClick={() => setShowPrompt(false)}
                                    className="border border-white/30 text-white hover:bg-white/10 rounded-lg px-4 py-2"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* iOS Install Instructions */}
            {isIOS && showPrompt && (
                <div
                    className="fixed left-0 right-0 p-2 animate__animated animate__slideInUp"
                    style={{ zIndex: 9998, bottom: '90px' }}
                >
                    <div className="shadow-lg rounded-xl bg-card">
                        <div className="p-3 text-center bg-background rounded-xl">
                            <div className="mb-2">
                                <i className="fas fa-mobile-screen-button text-2xl text-primary"></i>
                            </div>
                            <h6 className="font-bold mb-2">تثبيت طمأنينة على iPhone</h6>
                            <p className="text-xs text-muted-foreground mb-3">
                                اضغط على <i className="fas fa-arrow-up-from-bracket text-primary"></i> ثم اختر "إضافة إلى الشاشة الرئيسية"
                            </p>
                            <button
                                onClick={() => setShowPrompt(false)}
                                className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-sm font-medium transition-colors"
                            >
                                فهمت
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
