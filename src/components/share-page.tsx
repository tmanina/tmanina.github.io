"use client"

import * as React from "react"

export function SharePage() {
    const shareUrl = "https://tmanina.github.io"
    const shareText = "تطبيق طمأنينة - رفيقك في رحلة التقرب إلى الله"

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl)
        // Optional: Show a toast or feedback
        alert("تم نسخ الرابط بنجاح!")
    }

    const handleWhatsAppShare = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`
        window.open(url, "_blank")
    }

    const handleFacebookShare = () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        window.open(url, "_blank")
    }

    return (
        <div className="container py-4 animate__animated animate__fadeIn">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6 text-center">

                    {/* Icon & Title */}
                    <div className="mb-4">
                        <div className="d-inline-flex align-items-center justify-content-center rounded-circle gradient-bg text-white mb-3" style={{ width: '80px', height: '80px' }}>
                            <i className="fas fa-hand-holding-heart" style={{ fontSize: "2.5rem" }}></i>
                        </div>
                        <h2 className="fw-bold gradient-text mb-3">صدقة جارية</h2>
                        <p className="text-body-secondary fs-5 lh-lg">
                            شارك التطبيق لمن تعرف الان ليصبح "صدقة جارية" خاصة بك ! بحيث يتناقلة الاف الناس من بعدك !
                        </p>
                    </div>

                    {/* Sharing Buttons */}
                    <div className="d-flex flex-column align-items-center gap-3 mt-5">

                        {/* WhatsApp */}
                        <button
                            onClick={handleWhatsAppShare}
                            className="btn btn-lg rounded-pill d-flex align-items-center justify-content-center gap-3 shadow-sm card-hover"
                            style={{
                                width: '80%',
                                backgroundColor: '#25D366',
                                color: 'white',
                                border: 'none',
                                padding: '1rem'
                            }}
                        >
                            <i className="fab fa-whatsapp" style={{ fontSize: "1.5rem" }}></i>
                            <span className="fw-bold">شارك مع واتس اب</span>
                        </button>

                        {/* Facebook */}
                        <button
                            onClick={handleFacebookShare}
                            className="btn btn-lg rounded-pill d-flex align-items-center justify-content-center gap-3 shadow-sm card-hover"
                            style={{
                                width: '80%',
                                backgroundColor: '#1877F2',
                                color: 'white',
                                border: 'none',
                                padding: '1rem'
                            }}
                        >
                            <i className="fab fa-facebook-f" style={{ fontSize: "1.5rem" }}></i>
                            <span className="fw-bold">شارك مع فيسبوك</span>
                        </button>

                        {/* Copy Link */}
                        <button
                            onClick={handleCopyLink}
                            className="btn btn-lg rounded-pill d-flex align-items-center justify-content-center gap-3 shadow-sm card-hover"
                            style={{
                                width: '80%',
                                backgroundColor: '#e9ecef',
                                color: '#495057',
                                border: 'none',
                                padding: '1rem'
                            }}
                        >
                            <i className="fas fa-link" style={{ fontSize: "1.5rem" }}></i>
                            <span className="fw-bold">نسخ الرابط للمشاركة</span>
                        </button>

                    </div>

                </div>
            </div>
        </div>
    )
}
