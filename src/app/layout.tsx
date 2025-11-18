import type { Metadata } from "next"
import "./globals.css"
import { Inter } from "next/font/google"
import Script from "next/script"
import { Footer } from "@/components/footer"
import { Navigation } from "@/components/navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "طمانينة",
  description: "تطبيقك الشامل للأذكار والتقويم الإسلامي",
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

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>

      <body className={`${inter.className} d-flex flex-column min-vh-100`}>
        {/* الـ Navigation (أعلى الصفحة + Bottom Nav للموبايل) */}
        <Navigation />

        {/* المحتوى الرئيسي */}
        <main className="flex-fill">
          {/* مسافة أسفل للموبايل عشان الـ Bottom Nav ما يغطيش المحتوى */}
          <div style={{ paddingBottom: "70px" }}>
            {children}
          </div>
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
