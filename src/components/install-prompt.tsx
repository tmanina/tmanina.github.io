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
            e.preventDefault()
            setDeferredPrompt(e)
            // Show prompt after a delay
            setTimeout(() => setShowPrompt(true), 3000)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowPrompt(false)
        } else if (isDev) {
            // In development, show the prompt for testing
            setTimeout(() => setShowPrompt(true), 3000)
        }

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
        if (!deferredPrompt) {
            alert("عذراً، المتصفح لا يدعم التثبيت المباشر حالياً أو أن التطبيق مثبت بالفعل.\n\nيمكنك التثبيت يدوياً من شريط العنوان (أيقونة التثبيت) أو القائمة.")
            return
        }

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt')
        }

        setDeferredPrompt(null)
        setShowPrompt(false)
    }

    if (!showPrompt && !isIOS) return null

    return (
        <>
            {/* Install prompt for Android & Desktop */}
            {showPrompt && !isIOS && (
                <div
                    className="position-fixed start-0 end-0 p-3 animate__animated animate__slideInUp"
                    style={{ zIndex: 9998, bottom: isMobile ? '90px' : '20px' }}
                >
                    <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
                        <div className="gradient-bg text-white p-4">
                            <div className="d-flex align-items-center gap-3">
                                <div className="rounded-circle bg-white bg-opacity-25 p-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                                    <i className="fas fa-download fs-4"></i>
                                </div>
                                <div className="flex-grow-1">
                                    <h6 className="mb-1 fw-bold">تثبيت تطبيق طمأنينة</h6>
                                    <p className="mb-0 small opacity-75">احصل على تجربة أفضل مع التطبيق المثبت</p>
                                </div>
                            </div>
                            <div className="d-flex gap-2 mt-3">
                                <button
                                    onClick={handleInstallClick}
                                    className="btn btn-light flex-grow-1 fw-bold"
                                >
                                    <i className="fas fa-check me-2"></i>
                                    تثبيت
                                </button>
                                <button
                                    onClick={() => setShowPrompt(false)}
                                    className="btn btn-outline-light"
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
                    className="position-fixed start-0 end-0 p-2 animate__animated animate__slideInUp"
                    style={{ zIndex: 9998, bottom: '90px' }}
                >
                    <div className="card border-0 shadow-lg rounded-3">
                        <div className="card-body p-3 text-center bg-body">
                            <div className="mb-2">
                                <i className="fas fa-mobile-screen-button fs-3 text-primary"></i>
                            </div>
                            <h6 className="fw-bold mb-2">تثبيت طمأنينة على iPhone</h6>
                            <p className="small text-body-secondary mb-3">
                                اضغط على <i className="fas fa-arrow-up-from-bracket text-primary"></i> ثم اختر "إضافة إلى الشاشة الرئيسية"
                            </p>
                            <button
                                onClick={() => setShowPrompt(false)}
                                className="btn btn-sm btn-primary"
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
