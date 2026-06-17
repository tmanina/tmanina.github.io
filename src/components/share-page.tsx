"use client"

import * as React from "react"
import { FloatingToast } from "@/components/floating-toast"
import type { ToastVariant } from "@/components/floating-toast"
import { shareTextAsImage } from "@/lib/share-image"

const sharePresets = [
    {
        id: "ayah-raad",
        type: "آية",
        title: "آية كريمة",
        text: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
        source: "الرعد: 28",
    },
    {
        id: "ayah-sharh",
        type: "آية",
        title: "آية كريمة",
        text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
        source: "الشرح: 6",
    },
    {
        id: "dua-beneficial",
        type: "دعاء",
        title: "دعاء",
        text: "اللهم إني أسألك علمًا نافعًا، ورزقًا طيبًا، وعملًا متقبلًا",
        source: "دعاء مأثور",
    },
]

export function SharePage() {
    const [toastMsg, setToastMsg] = React.useState("")
    const [toastVariant, setToastVariant] = React.useState<ToastVariant>("success")
    const [toastVisible, setToastVisible] = React.useState(false)
    const [selectedPresetId, setSelectedPresetId] = React.useState(sharePresets[0].id)
    const [isCreatingImage, setIsCreatingImage] = React.useState(false)
    const shareUrl = "https://tmanina.github.io"
    const shareText = "تطبيق طمأنينة - رفيقك في رحلة التقرب إلى الله"
    const selectedPreset = sharePresets.find((preset) => preset.id === selectedPresetId) || sharePresets[0]

    const showToast = (message: string, variant: ToastVariant = "success") => {
        setToastMsg(message)
        setToastVariant(variant)
        setToastVisible(true)
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl)
        showToast("تم نسخ الرابط بنجاح!")
    }

    const handleWhatsAppShare = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`
        window.open(url, "_blank")
    }

    const handleShareImage = async () => {
        try {
            setIsCreatingImage(true)
            const result = await shareTextAsImage({
                title: selectedPreset.title,
                text: selectedPreset.text,
                source: selectedPreset.source,
                filename: `${selectedPreset.id}.png`,
            })
            showToast(result === "shared" ? "تم فتح نافذة المشاركة." : "تم حفظ الصورة.", "success")
        } catch {
            showToast("تعذّر إنشاء الصورة الآن.", "error")
        } finally {
            setIsCreatingImage(false)
        }
    }

    const handleFacebookShare = () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        window.open(url, "_blank")
    }

    return (
        <>
            <div className="max-w-5xl mx-auto py-4 px-4 animate-fade-in">
                <div className="flex justify-center">
                    <div className="w-full max-w-2xl text-center">
                        <div className="mb-4">
                            <div className="inline-flex items-center justify-center rounded-full gradient-bg text-white mb-3" style={{ width: '80px', height: '80px' }}>
                                <i className="fas fa-hand-holding-heart" style={{ fontSize: "2.5rem" }}></i>
                            </div>
                            <h2 className="font-bold gradient-text mb-3">صدقة جارية</h2>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                شارك التطبيق لمن تعرف الآن ليصبح صدقة جارية خاصة بك، بحيث يتناقله الناس من بعدك.
                            </p>
                        </div>

                        <div className="flex flex-col items-center gap-3 mt-5">
                            <div className="w-full rounded-2xl border border-border bg-card p-4 text-right shadow-sm">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="mb-1 text-base font-bold">مشاركة كصورة</h3>
                                        <p className="mb-0 text-sm text-muted-foreground">اختر آية أو دعاء وأنشئ بطاقة جاهزة للمشاركة</p>
                                    </div>
                                    <i className="fas fa-image text-2xl text-primary" />
                                </div>

                                <div className="grid gap-2 sm:grid-cols-3">
                                    {sharePresets.map((preset) => (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => setSelectedPresetId(preset.id)}
                                            className={`rounded-xl border px-3 py-2 text-right text-sm transition-colors ${selectedPresetId === preset.id
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border bg-background hover:bg-accent"
                                                }`}
                                        >
                                            <span className="mb-1 block text-xs font-semibold text-muted-foreground">{preset.type}</span>
                                            <span className="block overflow-hidden text-ellipsis whitespace-nowrap font-semibold">{preset.text}</span>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleShareImage}
                                    disabled={isCreatingImage}
                                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border-0 bg-gradient-to-r from-[#2b5a4b] to-[#d4a574] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    <i className={`fas ${isCreatingImage ? "fa-spinner fa-spin" : "fa-image"}`} />
                                    <span>{isCreatingImage ? "جاري إنشاء الصورة..." : "إنشاء ومشاركة الصورة"}</span>
                                </button>
                            </div>

                            <button
                                onClick={handleWhatsAppShare}
                                className="rounded-full flex items-center justify-center gap-3 shadow-sm card-hover transition-all hover:-translate-y-1"
                                style={{
                                    width: '80%',
                                    backgroundColor: '#25D366',
                                    color: 'white',
                                    border: 'none',
                                    padding: '1rem'
                                }}
                            >
                                <i className="fab fa-whatsapp" style={{ fontSize: "1.5rem" }}></i>
                                <span className="font-bold">شارك مع واتس اب</span>
                            </button>

                            <button
                                onClick={handleFacebookShare}
                                className="rounded-full flex items-center justify-center gap-3 shadow-sm card-hover transition-all hover:-translate-y-1"
                                style={{
                                    width: '80%',
                                    backgroundColor: '#1877F2',
                                    color: 'white',
                                    border: 'none',
                                    padding: '1rem'
                                }}
                            >
                                <i className="fab fa-facebook-f" style={{ fontSize: "1.5rem" }}></i>
                                <span className="font-bold">شارك مع فيسبوك</span>
                            </button>

                            <button
                                onClick={handleCopyLink}
                                className="rounded-full flex items-center justify-center gap-3 shadow-sm card-hover transition-all hover:-translate-y-1"
                                style={{
                                    width: '80%',
                                    backgroundColor: '#e9ecef',
                                    color: '#495057',
                                    border: 'none',
                                    padding: '1rem'
                                }}
                            >
                                <i className="fas fa-link" style={{ fontSize: "1.5rem" }}></i>
                                <span className="font-bold">نسخ الرابط للمشاركة</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <FloatingToast
                message={toastMsg}
                variant={toastVariant}
                isVisible={toastVisible}
                onClose={() => setToastVisible(false)}
                autoCloseMs={3000}
            />
        </>
    )
}
