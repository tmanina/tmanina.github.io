#!/usr/bin/env node

import fs from "fs"
import path from "path"
import { execSync } from "child_process"

const { mkdir, readFile, writeFile, readdir } = fs.promises

const BOOK_ID = "9260"
const BASE_URL = `https://shamela.ws/ajax/pageContent/${BOOK_ID}`
const CACHE_DIR = ".cache/shamela-all"
const OUTPUT = "public/data/riyad-uthaymeen-shamela-full.json"
const DELAY_MS = 0
const LAST_PAGE = 3784

const FALLBACK_BOOK_RANGES = [
  ["introduction", 1, 679],
  ["1", 680, 726],
  ["2", 727, 777],
  ["3", 778, 812],
  ["4", 813, 843],
  ["5", 844, 893],
  ["6", 894, 955],
  ["7", 956, 990],
  ["8", 991, 1267],
  ["9", 1268, 1270],
  ["10", 1271, 1284],
  ["11", 1285, 1375],
  ["12", 1376, 1392],
  ["13", 1393, 1396],
  ["14", 1397, 1407],
  ["15", 1408, 1464],
  ["16", 1465, 1510],
  ["17", 1511, 1807],
  ["18", 1808, 1868],
  ["19", 1869, 1896],
]

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function toWesternDigits(value) {
  const digits = { "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9" }
  return String(value).replace(/[٠-٩]/g, (d) => digits[d])
}

function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
}

function htmlToText(html) {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<a[^>]*>#.*?<\/a>/gi, "")
    .replace(/<span[^>]*class="btn_tag"[^>]*>[\s\S]*?<\/span>/gi, "")
    .replace(/<p\b[^>]*>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<div\b[^>]*>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
  return decodeEntities(text)
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function fetchPageSync(pageId) {
  try {
    const result = execSync(
      `curl -s --max-time 15 "${BASE_URL}/${pageId}" -H "User-Agent: Mozilla/5.0" -H "X-Requested-With: XMLHttpRequest"`,
      { encoding: "utf8", timeout: 20000 }
    )
    return JSON.parse(result)
  } catch {
    return null
  }
}

async function fetchAllPages(from, to) {
  await mkdir(CACHE_DIR, { recursive: true })
  const pages = []
  let errors = 0

  for (let pageId = from; pageId <= to; pageId++) {
    const cacheFile = path.join(CACHE_DIR, `${pageId}.json`)
    let data = null

    try {
      data = JSON.parse(await readFile(cacheFile, "utf8"))
    } catch {
      data = fetchPageSync(pageId)
      if (data) {
        await writeFile(cacheFile, JSON.stringify(data))
      }
    }

    if (data) {
      pages.push(data)
    } else {
      errors++
    }

    if (pages.length % 200 === 0) {
      console.log(`Fetched ${pages.length}/${to - from + 1} (${errors} errors)`)
    }

    await sleep(DELAY_MS)
  }

  console.log(`Done: ${pages.length} pages (${errors} errors)`)
  return pages
}

function parseAllPages(allPages) {
  return allPages
    .filter(Boolean)
    .map((p) => ({
      pageId: p.pageId,
      pageNum: p.pageNum,
      title: p.title || "",
      text: htmlToText(p.nass || ""),
    }))
    .sort((a, b) => a.pageId - b.pageId)
}

function buildFullText(pages) {
  return pages.map((p) => p.text).join("\n\n")
}

function extractEntries(fullText) {
  const entries = {}

  // Find ALL hadith markers: Arabic-Indic number followed by dash
  const hadithPattern = /(?:^|\n)\s*([\u0660-\u0669]{1,3})\s*[-ـ]\s*/gm
  const hadithMarkers = []
  let m
  while ((m = hadithPattern.exec(fullText)) !== null) {
    const number = Number(toWesternDigits(m[1]))
    if (number >= 1 && number <= 1896) {
      hadithMarkers.push({ index: m.index, number, markerEnd: m.index + m[0].length })
    }
  }

  // Find ALL sharh markers
  const sharhPattern = /\[\s*الشَّرْحُ\s*\]|\[\s*الشرح\s*\]|(?:^|\n)\s*الشَّرْحُ\s|(?:^|\n)\s*الشرح\s/gi
  const sharhMarkers = []
  let s
  while ((s = sharhPattern.exec(fullText)) !== null) {
    sharhMarkers.push({ index: s.index, contentStart: s.index + s[0].length })
  }

  console.log(`Found ${hadithMarkers.length} hadith markers, ${sharhMarkers.length} sharh markers`)

  // For each hadith, extract:
  // - matn: from this marker to the next hadith marker (or next sharh marker if no more hadiths)
  // - sharh: from next sharh marker to the next hadith marker or end
  for (let i = 0; i < hadithMarkers.length; i++) {
    const marker = hadithMarkers[i]
    const nextMarker = hadithMarkers[i + 1]

    // Matn: from this marker to next marker or next sharh
    const nextSharh = sharhMarkers.find((s) => s.index > marker.index)
    const matnEnd = nextMarker
      ? (nextSharh && nextSharh.index < nextMarker.index ? nextSharh.index : nextMarker.index)
      : (nextSharh ? nextSharh.index : fullText.length)
    const matn = fullText.slice(marker.index, matnEnd).trim()

    // Sharh: from sharh marker to next hadith or end
    let sharh = ""
    if (nextSharh && nextSharh.index > marker.index && nextSharh.index < (nextMarker ? nextMarker.index : fullText.length)) {
      const sharhEnd = nextMarker ? nextMarker.index : fullText.length
      sharh = fullText.slice(nextSharh.contentStart, sharhEnd).trim()
    }

    const bookRange = FALLBACK_BOOK_RANGES.find(
      ([, start, end]) => marker.number >= start && marker.number <= end
    )
    const bookNumber = bookRange ? bookRange[0] : "unknown"

    entries[marker.number] = {
      shamelaNumber: marker.number,
      bookNumber,
      matn,
      sharh,
    }
  }

  return entries
}

async function main() {
  const args = process.argv.slice(2)
  const fromPage = args.includes("--from") ? Number(args[args.indexOf("--from") + 1]) : 1
  const toPage = args.includes("--to") ? Number(args[args.indexOf("--to") + 1]) : LAST_PAGE

  console.log(`Fetching Shamela pages ${fromPage} to ${toPage}...`)
  const startTime = Date.now()

  const allPages = await fetchAllPages(fromPage, toPage)
  const pages = parseAllPages(allPages)
  const fullText = buildFullText(pages)
  console.log(`Full text: ${fullText.length} chars`)

  const entries = extractEntries(fullText)
  console.log(`Extracted ${Object.keys(entries).length} hadith entries`)

  const withSharh = Object.values(entries).filter((e) => e.sharh.length > 50).length
  console.log(`Entries with sharh: ${withSharh}`)

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`Time: ${elapsed}s`)

  // Show sample entries
  for (const num of [680, 681, 682, 683, 685, 1200, 1500]) {
    const e = entries[num]
    if (e) {
      console.log(`\nH${num}: matn=${e.matn.length} sharh=${e.sharh.length} | ${e.matn.slice(0, 80)}`)
    }
  }

  const output = {
    meta: {
      source: "shamela.ws",
      bookId: BOOK_ID,
      bookName: "شرح رياض الصالحين لابن عثيمين",
      totalEntries: Object.keys(entries).length,
      entriesWithSharh: withSharh,
      fetchedAt: new Date().toISOString(),
      totalPages: allPages.length,
    },
    entries,
  }

  await writeFile(OUTPUT, JSON.stringify(output, null, 2), "utf8")
  console.log(`\nWrote ${OUTPUT}`)
}

main().catch((err) => {
  console.error("Error:", err.message)
  process.exit(1)
})
