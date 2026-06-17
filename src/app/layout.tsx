import type { Metadata } from "next"
import "./globals.css"
import { Cairo, Amiri } from "next/font/google"
import Script from "next/script"
import { Footer } from "@/components/footer"

// Arabic fonts
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
})

const amiri = Amiri({
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-amiri",
  display: "swap",
})

export const metadata: Metadata = {
  title: "طمأنينة - رفيقك الروحاني",
  description: "تطبيقك الشامل للأذكار، مواقيت الصلاة، والتقويم الإسلامي. تقرّب إلى الله بالأذكار والعبادات في مكان واحد.",
  keywords: ["أذكار", "صلاة", "تقويم إسلامي", "قرآن", "دعاء", "تسبيح"],
  authors: [{ name: "طمأنينة" }],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* App utility styles - loaded separately for proper CSS cascade */}
        <link rel="stylesheet" href="/app.css" />

        {/* Font Awesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2b5a4b" id="theme-color-meta" />
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"){document.documentElement.classList.add("dark");var m=document.getElementById("theme-color-meta");if(m)m.setAttribute("content","#0d1515")}}catch(e){}})()`
        }} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="طمأنينة" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>

      <body className={`${cairo.variable} ${amiri.variable} flex flex-col min-h-screen`} style={{ fontFamily: "var(--font-cairo), Arial, sans-serif" }}>

        {/* المحتوى الرئيسي */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer يظهر فقط على الـ Desktop */}
        <div className="hidden md:block">
          <Footer />
        </div>

        {/* زر العودة للأعلى */}
        <button
          id="backToTopBtn"
          className="back-to-top-btn"
          aria-label="العودة للأعلى"
        >
          <i className="fas fa-arrow-up"></i>
        </button>

        {/* سكريبت زر العودة للأعلى */}
        <Script id="back-to-top-script" strategy="afterInteractive">
          {`
            const btn = document.getElementById('backToTopBtn');

            window.addEventListener('scroll', () => {
              if (window.scrollY > 300) {
                btn.style.display = 'flex';
              } else {
                btn.style.display = 'none';
              }
            });

            btn.addEventListener('click', () => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            });
          `}
        </Script>
      </body>
    </html>
  )
}
