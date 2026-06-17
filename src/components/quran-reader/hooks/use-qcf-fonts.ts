"use client"

import * as React from "react"

const pad3 = (n: number) => String(n).padStart(3, "0")
const QCF_DIR = "/fonts/qcf/mushaf-woff2"
const QCF_BSML_URL = `${QCF_DIR}/QCF_BSML.woff2`

function qcfPageUrl(page: number) {
  return `${QCF_DIR}/QCF_P${pad3(page)}.woff2`
}

function qcfFamily(page: number) {
  return `QCF_P${pad3(page)}`
}

async function ensureFontLoaded(family: string, url: string): Promise<void> {
  if (typeof window === "undefined") return
  const styleId = `font-${family}`
  if (document.getElementById(styleId)) return

  const style = document.createElement("style")
  style.id = styleId
  style.textContent = `
    @font-face {
      font-family: "${family}";
      src: url("${url}") format("woff2");
      font-display: swap;
    }
  `
  document.head.appendChild(style)

  try {
    await document.fonts.load(`48px "${family}"`)
  } catch (e) {
    console.warn(`[QCF] Font load failed for ${family}:`, e)
  }
}

function requestIdleWork(work: () => void) {
  if (typeof window === "undefined") return

  if ("requestIdleCallback" in window) {
    const idleCallback = window.requestIdleCallback as (callback: () => void, options?: { timeout: number }) => number
    idleCallback(work, { timeout: 1500 })
    return
  }

  globalThis.setTimeout(work, 250)
}

/**
 * Loads QCF page-specific fonts when the page changes.
 * Prefetches prev/next page fonts for smoother navigation.
 */
export function useQcfFonts(currentPage: number) {
  const [pageFontFamily, setPageFontFamily] = React.useState<string>("KFGQPC")

  React.useEffect(() => {
    let cancelled = false

    const loadPageFont = async () => {
      try {
        await ensureFontLoaded("QCF_BSML", QCF_BSML_URL)
        const fam = qcfFamily(currentPage)
        await ensureFontLoaded(fam, qcfPageUrl(currentPage))
        if (!cancelled) setPageFontFamily(fam)

        requestIdleWork(() => {
          if (cancelled) return
          if (currentPage > 1) {
            ensureFontLoaded(qcfFamily(currentPage - 1), qcfPageUrl(currentPage - 1)).catch(() => {})
          }
          if (currentPage < 604) {
            ensureFontLoaded(qcfFamily(currentPage + 1), qcfPageUrl(currentPage + 1)).catch(() => {})
          }
        })
      } catch (e) {
        console.error("QCF font load failed:", e)
        if (!cancelled) setPageFontFamily("KFGQPC")
      }
    }

    loadPageFont()
    return () => { cancelled = true }
  }, [currentPage])

  return pageFontFamily
}
