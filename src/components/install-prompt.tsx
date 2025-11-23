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

        if (!isStandalone) {
            // Always show prompt after delay if not installed, even if event didn't fire
            // This ensures users see the install option
            console.log('Scheduling install prompt to show in 3 seconds')
            setTimeout(() => {
                console.log('Setting showPrompt to true')
                setShowPrompt(true)
            }, 3000)
        } else {
            console.log('App already in standalone mode, not showing prompt')
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
        console.log('🔘 Install button clicked')
        console.log('📦 deferredPrompt:', deferredPrompt)

        if (!deferredPrompt) {
            console.log('⚠️ No deferredPrompt available - showing manual instructions')

            // Show manual instructions if native prompt is not available
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
            const isAndroid = /Android/.test(navigator.userAgent)

            // Provide more helpful message based on why it might not work
            let message = ''

            if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                message = '⚠️ التطبيق يجب أن يكون على HTTPS للتثبيت التلقائي\n\n'
            }

            if (isIOS) {
                message += '📱 لتثبيت التطبيق على iPhone/iPad:\n\n1. اضغط على زر المشاركة ⬆️ في شريط الأدوات\n2. اختر "إضافة إلى الشاشة الرئيسية"\n3. اضغط "إضافة"'
            } else if (isAndroid) {
                message += '📱 لتثبيت التطبيق على Android:\n\n1. اضغط على القائمة ⋮ في المتصفح\n2. اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"\n3. اضغط "تثبيت"\n\nملاحظة: تأكد أنك تستخدم Chrome أو Brave المحدث'
            } else {
                message += '💻 لتثبيت التطبيق:\n\n1. ابحث عن أيقونة التثبيت في شريط العنوان\n2. أو افتح قائمة المتصفح واختر "تثبيت التطبيق"\n\nملاحظة: يعمل التثبيت على متصفحات Chrome وEdge وSafari الحديثة'
            }

            alert(message)
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
