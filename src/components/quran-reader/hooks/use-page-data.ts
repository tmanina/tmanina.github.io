"use client"

import * as React from "react"
import type { Verse, Line, PrecacheStatus } from "../types"
import { TOTAL_PAGES } from "../utils"

/**
 * Fetches Quran page data from the API with in-memory caching.
 * Prefetches neighbor pages for faster navigation.
 */
export function usePageData(currentPage: number) {
  const [verses, setVerses] = React.useState<Verse[]>([])
  const [lines, setLines] = React.useState<Line[]>([])
  const [loading, setLoading] = React.useState(true)
  const pageCache = React.useRef(new Map<number, { verses: Verse[]; lines: Line[] }>())

  React.useEffect(() => {
    const ac = new AbortController()

    const fetchPageData = async (
      page: number,
      signal?: AbortSignal
    ): Promise<{ verses: Verse[]; lines: Line[] } | null> => {
      if (pageCache.current.has(page)) {
        return pageCache.current.get(page)!
      }
      try {
        const response = await fetch(
          `https://api.quran.com/api/v4/verses/by_page/${page}?words=true&word_fields=text_uthmani,text_imlaei,code_v1,code_v2,v1_page,v2_page&per_page=50`,
          { signal }
        )
        const data = await response.json()
        if (data.verses) {
          const processed = processPageData(data)
          pageCache.current.set(page, processed)
          return processed
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          console.error("Error fetching page:", e)
        }
      }
      return null
    }

    ;(async () => {
      setLoading(true)
      try {
        const pageData = await fetchPageData(currentPage, ac.signal)
        if (pageData) {
          setVerses(pageData.verses)
          setLines(pageData.lines)
          // Prefetch neighbors
          if (currentPage > 1) fetchPageData(currentPage - 1).catch(() => {})
          if (currentPage < TOTAL_PAGES) fetchPageData(currentPage + 1).catch(() => {})
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          console.error("Error in page fetch:", e)
        }
      } finally {
        setLoading(false)
      }
    })()

    return () => ac.abort()
  }, [currentPage])

  return { verses, lines, loading }
}

function processPageData(data: any) {
  const lineMap = new Map<number, any[]>()
  data.verses.forEach((verse: any) => {
    if (verse.words) {
      verse.words.forEach((word: any) => {
        const lineNum = word.line_number
        if (!lineMap.has(lineNum)) lineMap.set(lineNum, [])
        lineMap.get(lineNum)!.push(word)
      })
    }
  })
  const lineNumbers = Array.from(lineMap.keys()).sort((a, b) => a - b)
  const minLine = lineNumbers.length > 0 ? Math.min(lineNumbers[0], 1) : 1
  const sortedLines = Array.from({ length: 15 - minLine + 1 }, (_, i) => ({
    lineNumber: minLine + i,
    words: lineMap.get(minLine + i) || [],
  }))
  return { verses: data.verses, lines: sortedLines }
}

/**
 * Manages Quran page pre-caching via service worker.
 */
export function useQuranPrecache() {
  const [precacheStatus, setPrecacheStatus] = React.useState<PrecacheStatus>({
    downloading: false,
    current: 0,
    total: TOTAL_PAGES,
    complete: false,
    message: "",
  })

  React.useEffect(() => {
    const hasPreCached = localStorage.getItem("quran_precached")

    if (!hasPreCached && "serviceWorker" in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "QURAN_PRECACHE_PROGRESS") {
          setPrecacheStatus({
            downloading: event.data.status === "downloading" || event.data.status === "starting",
            current: event.data.current || 0,
            total: event.data.total || TOTAL_PAGES,
            complete: event.data.status === "complete",
            message: event.data.message || "",
          })
          if (event.data.status === "complete") {
            localStorage.setItem("quran_precached", "true")
          }
        }
      }

      navigator.serviceWorker.addEventListener("message", handleMessage)

      const timer = setTimeout(() => {
        navigator.serviceWorker.ready.then((registration) => {
          if (registration.active) {
            setPrecacheStatus((prev) => ({ ...prev, downloading: true, message: "جاري التحضير..." }))
            registration.active.postMessage({ type: "PRECACHE_QURAN" })
          }
        })
      }, 2000)

      return () => {
        clearTimeout(timer)
        navigator.serviceWorker.removeEventListener("message", handleMessage)
      }
    } else if (hasPreCached) {
      setPrecacheStatus((prev) => ({ ...prev, complete: true }))
    }
  }, [])

  return precacheStatus
}
