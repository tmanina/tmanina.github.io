import "./globals.css"
import { Inter } from "next/font/google"
import type { Metadata } from "next"
import Script from "next/script"   // ✅ FIX — Use Next.js Script

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
        {/* Bootstrap RTL CSS */}
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.rtl.min.css"
          rel="stylesheet"
          integrity="sha384-nU14brUcp6StFntEOOEBvcJm4huWjB0OcIeQ3fltAfSmuZFrkAif0T+UtNGlKKQv"
          crossOrigin="anonymous"
        />
  <link rel="icon" href="/favicon.ico" sizes="any" />

        {/* Font Awesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>

      <body className={inter.className}>
        {children}

        {/* Load Bootstrap JS the correct way */}
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"
          integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL"
          crossOrigin="anonymous"
          strategy="afterInteractive"   // ✅ Loads after page is interactive
        />
      </body>
    </html>
  )
}
