import type { Metadata } from "next"
import "./globals.css"
import { Cairo, Amiri } from "next/font/google"
import Script from "next/script"
import { Footer } from "@/components/footer"
import {
  ThemeProvider,
  themePreHydrationScript,
} from "@/components/theme-provider"

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
        {/*
          Pre-hydration theme bootstrap — adds the `.dark` class on <html>
          before first paint so dark-mode users never see a flash of light
          theme. React-side logic (persistence, cross-tab sync, meta updates,
          system-preference fallback) lives in <ThemeProvider>.
        */}
        <script dangerouslySetInnerHTML={{ __html: themePreHydrationScript }} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="طمأنينة" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>

      <body className={`${cairo.variable} ${amiri.variable} flex flex-col min-h-screen`} style={{ fontFamily: "var(--font-cairo), Arial, sans-serif" }}>
        <ThemeProvider>
          {/* Skip to content link for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-[99999] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
          >
            تخطّي إلى المحتوى الرئيسي
          </a>

          {/* المحتوى الرئيسي */}
          <main id="main-content" className="flex-1">
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
        </ThemeProvider>
      </body>
    </html>
  )
}
