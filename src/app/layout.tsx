import type { Metadata } from "next"
import "./globals.css"
import { Cairo, Amiri, Inter } from "next/font/google"
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

// Latin/UI font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" data-bs-theme="light">
      <head>
        {/* Bootstrap RTL */}
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.rtl.min.css"
          rel="stylesheet"
          integrity="sha384-nU14brUcp6StFntEOOEBvcJm4huWjB0OcIeQ3fltAfSmuZFrkAif0T+UtNGlKKQv"
          crossOrigin="anonymous"
        />

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
        <meta name="theme-color" content="#2b5a4b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="طمأنينة" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>

      <body className={`${cairo.variable} ${amiri.variable} ${inter.variable} d-flex flex-column min-vh-100`} style={{ fontFamily: "var(--font-cairo), Arial, sans-serif" }}>

        {/* المحتوى الرئيسي */}
        <main className="flex-fill">
          {children}
        </main>

        {/* Footer يظهر فقط على الـ Desktop */}
        <div className="d-none d-md-block">
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

        {/* Bootstrap JS */}
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"
          integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

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
