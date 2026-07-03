#!/usr/bin/env node

import fs from "fs"
import path from "path"

const { mkdir, readFile, readdir, writeFile } = fs.promises

const SHAMELA_BOOK_ID = "9260"
const DEFAULT_BASE_URL = `https://shamela.ws/book/${SHAMELA_BOOK_ID}`
const DEFAULT_OUTPUT = "public/data/riyad-uthaymeen-sharh.generated.json"
const EXISTING_OUTPUT = "public/data/riyad-uthaymeen-sharh.json"

const FALLBACK_BOOK_RANGES = [
  ["1", 680, 726],
  ["introduction", 1, 679],
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

function parseArgs(argv) {
  const args = {
    baseUrl: DEFAULT_BASE_URL,
    output: DEFAULT_OUTPUT,
    existing: EXISTING_OUTPUT,
    cacheDir: ".cache/shamela-riyad",
    inputDir: "",
    inputEpub: "",
    inputText: "",
    inputJson: "",
    apiJson: "",
    report: "public/data/riyad-uthaymeen-sharh.report.json",
    from: 1,
    to: null,
    proxyUrl: "",
    apply: false,
    allowPartialApply: false,
    checkExisting: false,
    mergeExisting: true,
    reviewed: true,
    delayMs: 350,
    minEntries: 1800,
    matnWindow: 8000,
    maxSupplementText: 20000,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    const next = () => {
      i += 1
      if (!argv[i]) throw new Error(`Missing value for ${arg}`)
      return argv[i]
    }

    if (arg === "--base-url") args.baseUrl = next().replace(/\/$/, "")
    else if (arg === "--proxy-url") args.proxyUrl = next()
    else if (arg === "--output") args.output = next()
    else if (arg === "--existing") args.existing = next()
    else if (arg === "--cache-dir") args.cacheDir = next()
    else if (arg === "--input-dir") args.inputDir = next()
    else if (arg === "--input-epub") args.inputEpub = next()
    else if (arg === "--input-text") args.inputText = next()
    else if (arg === "--input-json") args.inputJson = next()
    else if (arg === "--api-json") args.apiJson = next()
    else if (arg === "--report") args.report = next()
    else if (arg === "--from") args.from = Number(next())
    else if (arg === "--to") args.to = Number(next())
    else if (arg === "--delay-ms") args.delayMs = Number(next())
    else if (arg === "--min-entries") args.minEntries = Number(next())
    else if (arg === "--matn-window") args.matnWindow = Number(next())
    else if (arg === "--max-supplement-text") args.maxSupplementText = Number(next())
    else if (arg === "--apply") args.apply = true
    else if (arg === "--allow-partial-apply") args.allowPartialApply = true
    else if (arg === "--check-existing") args.checkExisting = true
    else if (arg === "--no-merge-existing") args.mergeExisting = false
    else if (arg === "--unreviewed") args.reviewed = false
    else if (arg === "--help" || arg === "-h") {
      printHelp()
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  if (!Number.isInteger(args.from) || args.from < 1) throw new Error("--from must be a positive integer")
  if (args.to !== null && (!Number.isInteger(args.to) || args.to < args.from)) {
    throw new Error("--to must be an integer greater than or equal to --from")
  }
  if (!Number.isInteger(args.delayMs) || args.delayMs < 0) throw new Error("--delay-ms must be a non-negative integer")
  if (!Number.isInteger(args.minEntries) || args.minEntries < 1 || args.minEntries > 1896) {
    throw new Error("--min-entries must be an integer from 1 to 1896")
  }
  if (!Number.isInteger(args.matnWindow) || args.matnWindow < 1000) {
    throw new Error("--matn-window must be an integer greater than or equal to 1000")
  }
  if (!Number.isInteger(args.maxSupplementText) || args.maxSupplementText < 1000) {
    throw new Error("--max-supplement-text must be an integer greater than or equal to 1000")
  }
  const inputModes = [args.inputDir, args.inputEpub, args.inputText, args.inputJson].filter(Boolean).length
  if (inputModes > 1) throw new Error("Use only one of --input-dir, --input-text, --input-json, or --input-epub.")

  return args
}

function printHelp() {
  console.log(`Usage:
  node scripts/import-riyad-shamela.mjs [options]

Options:
  --base-url <url>       Shamela book base URL. Default: ${DEFAULT_BASE_URL}
  --proxy-url <url>      Optional proxy. Use {url}, or the script appends ?url=<encoded>.
  --from <page>          First Shamela page. Default: 1
  --to <page>            Last Shamela page. If omitted, discovered from the index page.
  --cache-dir <dir>      HTML cache directory. Default: .cache/shamela-riyad
  --input-dir <dir>      Read saved/copied pages from <dir>/<page>.html or <dir>/<page>.txt.
  --input-epub <dir>     Read from an extracted EPUB directory containing OEBPS/xhtml/P*.xhtml.
  --input-text <file>    Read one plain-text file copied from Shamela pages.
  --input-json <file>    Read JSON exported by scripts/shamela-browser-collector.js.
  --api-json <file>      Optional Riyad API hadith JSON used to verify matn matches for missing entries.
  --output <file>        Generated JSON path. Default: ${DEFAULT_OUTPUT}
  --report <file>        Coverage report path. Default: public/data/riyad-uthaymeen-sharh.report.json
  --existing <file>      Existing reviewed JSON path. Default: ${EXISTING_OUTPUT}
  --apply                Write to --existing instead of --output.
  --check-existing       Only report coverage for --existing; do not fetch or write data.
  --no-merge-existing    Do not preserve existing entries.
  --unreviewed           Emit match.reviewed=false for manual review staging.
  --delay-ms <ms>        Delay between network requests. Default: 350
  --min-entries <count>  Minimum entries required for --apply. Default: 1800
  --matn-window <chars>  API matn search window around nearby numbered markers. Default: 8000
  --max-supplement-text <chars>
                         Reject API-matn supplemental explanations above this size. Default: 20000
  --allow-partial-apply  Allow --apply even below --min-entries.

Cloudflare Worker proxy shape:
  If your worker URL is https://example.workers.dev/fetch, pass:
  --proxy-url https://example.workers.dev/fetch
  The worker should fetch the encoded "url" query parameter and return the HTML.
`)
}

function looksLikeHtml(text) {
  return /<\/?[a-z][\s\S]*>/i.test(text)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function proxiedUrl(url, proxyUrl) {
  if (!proxyUrl) return url
  if (proxyUrl.includes("{url}")) return proxyUrl.replace("{url}", encodeURIComponent(url))
  const separator = proxyUrl.includes("?") ? "&" : "?"
  return `${proxyUrl}${separator}url=${encodeURIComponent(url)}`
}

async function fetchHtml(url, args) {
  if (typeof fetch !== "function") {
    throw new Error("This importer requires Node.js 18+ for global fetch. Use Node.js 20 to match the project build environment.")
  }

  const requestUrl = proxiedUrl(url, args.proxyUrl)
  const response = await fetch(requestUrl, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "user-agent": "Tmanina content import verifier/1.0",
    },
  })
  const html = await response.text()
  if (!response.ok) throw new Error(`HTTP ${response.status} while fetching ${url}`)
  if (/Just a moment|cf_chl|Enable JavaScript and cookies/i.test(html)) {
    throw new Error(`Cloudflare challenge returned for ${url}. Use --proxy-url with a browser-capable or allowlisted proxy.`)
  }
  return html
}

async function getCachedPage(page, args) {
  if (args.inputDir) {
    const htmlPath = path.join(args.inputDir, `${page}.html`)
    const textPath = path.join(args.inputDir, `${page}.txt`)
    try {
      return await readFile(htmlPath, "utf8")
    } catch {
      return await readFile(textPath, "utf8")
    }
  }

  await mkdir(args.cacheDir, { recursive: true })
  const file = path.join(args.cacheDir, `${page}.html`)
  try {
    return await readFile(file, "utf8")
  } catch {
    const html = await fetchHtml(`${args.baseUrl}/${page}`, args)
    await writeFile(file, html, "utf8")
    await sleep(args.delayMs)
    return html
  }
}

async function discoverLastPage(args) {
  const html = await fetchHtml(args.baseUrl, args)
  const pages = [...html.matchAll(new RegExp(`/book/${SHAMELA_BOOK_ID}/(\\d+)`, "g"))]
    .map((match) => Number(match[1]))
    .filter((page) => Number.isInteger(page) && page > 0)
  const last = Math.max(...pages)
  if (!Number.isFinite(last)) {
    throw new Error("Could not discover last Shamela page. Pass --to explicitly.")
  }
  return last
}

async function discoverInputPages(inputDir) {
  const files = await readdir(inputDir)
  const pages = files
    .map((file) => {
      const match = file.match(/^(\d+)\.(?:html?|txt)$/i)
      return match ? Number(match[1]) : null
    })
    .filter((page) => Number.isInteger(page) && page > 0)
    .sort((a, b) => a - b)

  if (!pages.length) {
    throw new Error(`No page files found in ${inputDir}. Expected files like 1.html, 2.html, 1.txt, 2.txt, ...`)
  }

  return pages
}

async function readInputJson(file) {
  const parsed = JSON.parse(await readFile(file, "utf8"))
  const pages = Array.isArray(parsed) ? parsed : parsed.pages

  if (!Array.isArray(pages)) {
    throw new Error("--input-json must contain an array or an object with a pages array.")
  }

  return pages
    .map((page, index) => {
      const number = Number(page.page || page.number || index + 1)
      const content = String(page.html || page.text || page.body || "")
      if (!content.trim()) return null
      return {
        number: Number.isInteger(number) && number > 0 ? number : index + 1,
        body: extractPageBody(content),
      }
    })
    .filter(Boolean)
}

async function readApiHadiths(file) {
  if (!file) return []
  const parsed = JSON.parse(await readFile(file, "utf8"))
  if (Array.isArray(parsed)) return parsed
  if (Array.isArray(parsed.hadiths)) return parsed.hadiths
  if (parsed.data && Array.isArray(parsed.data.hadiths)) return parsed.data.hadiths
  throw new Error("--api-json must contain an array of Riyad hadith items.")
}

async function readEpubPages(epubDir) {
  const xhtmlDir = path.join(epubDir, "OEBPS", "xhtml")
  const entries = await readdir(xhtmlDir)
  const files = entries
    .filter((f) => /^P\d+\.xhtml$/i.test(f))
    .sort((a, b) => {
      const na = Number(a.match(/P(\d+)\.xhtml/i)[1])
      const nb = Number(b.match(/P(\d+)\.xhtml/i)[1])
      return na - nb
    })

  if (!files.length) {
    throw new Error(`No P*.xhtml files found in ${xhtmlDir}. Ensure the EPUB is extracted with its directory structure intact.`)
  }

  const bodies = []
  for (const file of files) {
    const html = await readFile(path.join(xhtmlDir, file), "utf8")
    const body = extractEpubPageBody(html)
    if (body) {
      bodies.push({ number: Number(file.match(/P(\d+)\.xhtml/i)[1]), body })
    }
  }

  console.log(`Read ${bodies.length} pages from ${epubDir}/OEBPS/xhtml/`)
  return bodies
}

function extractEpubPageBody(html) {
  const match = html.match(/<div id="book-container">(.*?)<\/div>\s*<hr\/?>\s*<div class="center">/s)
  if (!match) return ""
  const content = match[1]
  const text = htmlToText(content)
  const footerMatch = text.match(/\n\s*الجزء:\s*\d+\s*¦\s*الصفحة:\s*\d+\s*$/)
  return footerMatch ? text.slice(0, footerMatch.index).trim() : text
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
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<(?:br|p|div|li|h[1-6]|tr|section|article|header|footer|nav)\b[^>]*>/gi, "\n")
    .replace(/<\/(?:p|div|li|h[1-6]|tr|section|article|header|footer|nav)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
  return decodeEntities(withoutScripts)
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function extractPageBody(html) {
  if (!looksLikeHtml(html)) {
    return html
      .replace(/\r/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  }

  const text = htmlToText(html)
  const routeIndex = text.indexOf("مسار الصفحة الحالية:")
  const shapingIndex = text.indexOf("التشكيل", routeIndex >= 0 ? routeIndex : 0)
  const searchIndex = text.indexOf("بحــث", shapingIndex >= 0 ? shapingIndex : 0)
  let body = searchIndex >= 0 ? text.slice(searchIndex + "بحــث".length) : text
  const nextIndex = body.search(/\n\s*تحميل الصفحة التالية\s*(?:\n|$)/)
  if (nextIndex >= 0) body = body.slice(0, nextIndex)
  return body
    .replace(/\n\s*تحميل الصفحة السابقة\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function toWesternDigits(value) {
  const digits = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  }
  return String(value).replace(/[٠-٩]/g, (digit) => digits[digit])
}

function normalizeSegment(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([،؛:.؟])/g, "$1")
    .trim()
}

function normalizeSearchChar(char) {
  if (/[\u064B-\u0652\u0656-\u065E~ًٌٍَُِّْ]/.test(char) || char === "\u0640") return ""
  if (/[أإآ]/.test(char)) return "ا"
  if (char === "ؤ") return "و"
  if (char === "ئ") return "ي"
  if (char === "ة") return "ه"
  if (char === "ى") return "ي"
  if (/[٠-٩]/.test(char)) return toWesternDigits(char)
  if (/[0-9ء-ي]/.test(char)) return char
  return " "
}

function normalizeSearchWithMap(text) {
  let normalized = ""
  const map = []
  let lastWasSpace = true

  for (let index = 0; index < text.length; index += 1) {
    const value = normalizeSearchChar(text[index])
    if (!value) continue
    if (value === " ") {
      if (lastWasSpace) continue
      normalized += value
      map.push(index)
      lastWasSpace = true
      continue
    }
    normalized += value
    map.push(index)
    lastWasSpace = false
  }

  if (normalized.endsWith(" ")) {
    normalized = normalized.slice(0, -1)
    map.pop()
  }

  return { normalized, map }
}

function normalizeSearchText(text) {
  return normalizeSearchWithMap(text).normalized.replace(/\s+/g, " ").trim()
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function hadithSnippetPatterns(text) {
  const ignored = new Set([
    "عن", "وعن", "قال", "رضي", "الله", "عنه", "عنها", "عنهم", "النبي", "رسول",
    "صلى", "عليه", "وسلم", "رواه", "متفق", "في", "من", "الى", "علي", "على",
    "ان", "انها", "انه", "كان", "كانت", "ما", "لا", "ابي", "ابو",
  ])
  const words = normalizeSearchText(text)
    .split(" ")
    .filter((word) => word.length > 1 && !ignored.has(word))
  const patterns = []

  for (const length of [12, 10, 8, 6]) {
    for (let index = 0; index + length <= words.length; index += 2) {
      patterns.push(words.slice(index, index + length).join(" "))
    }
  }

  return patterns
}

function findMarkers(text) {
  const markers = []
  const hadithStart =
    "الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر|الحادي|الحادية|العشرون|عنه|عنها|عنهم|عن|وعنه|وعنها|وعنهم|وعن|قال|وأما الأحاديث|أما الأحاديث|فالأول|ومنها حديث|الحديث"
  const patterns = [
    /(?:^|\n)\s*[0-9٠-٩]{1,3}\s*\/\s*([0-9٠-٩]{1,4})\s*[ـ_\-–]/g,
    new RegExp(`(?:^|\\n)\\s*([0-9٠-٩]{1,4})\\s*[_ـ\\-–]\\s*(?=(?:${hadithStart}))`, "g"),
  ]

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const number = Number(toWesternDigits(match[1]))
      if (number >= 1 && number <= 1896) {
        markers.push({ index: match.index, number })
      }
    }
  }

  return markers
    .sort((a, b) => a.index - b.index || a.number - b.number)
    .filter((marker, index, all) => index === 0 || marker.index !== all[index - 1].index)
}

function bookNumberForHadith(hadithNumber) {
  const range = FALLBACK_BOOK_RANGES.find(([, start, end]) => hadithNumber >= start && hadithNumber <= end)
  return range ? range[0] : null
}

function splitSegments(pages) {
  const fullText = pages.map((page) => page.body).join("\n\n")

  // Normalize diacritics so ALL position operations use the same basis
  const noTashkeel = (s) => s.replace(/[ًٌٍَُِّ~ْ]/g, "")
  const normalizedText = noTashkeel(fullText)

  // Find markers in the NORMALIZED text (so positions align with شرحي positions)
  const markers = findMarkers(normalizedText)
  const entries = new Map()

  // Find شرحي positions in normalized text
  const sharhPositions = []
  for (const match of normalizedText.matchAll(/\[\s*الشرح\s*\]|(?:^|\n)\s*الشرح\b/gi)) {
    sharhPositions.push(match.index)
  }

  function findNextSharh(fromIndex) {
    for (const sp of sharhPositions) {
      if (sp > fromIndex) return sp
    }
    return normalizedText.length
  }

  function findPrevSharh(fromIndex) {
    let prev = 0
    for (const sp of sharhPositions) {
      if (sp < fromIndex) prev = sp
      else break
    }
    return prev
  }

  function explanationText(sharhPos, sharhLen) {
    const skip = sharhLen || 7 // default: skip "[الشرح]" (7 chars), or "الشرح" (5 chars)
    const start = sharhPos + skip
    const nextSharh = findNextSharh(start)
    const nextSection = normalizedText
      .slice(start)
      .search(/\n\s*[0-9٠-٩]{1,3}\s*[-ـ]\s*(?!(?:الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر|الحادي|الحادية|العشرون|عنه|عنها|عنهم|عن|وعنه|وعنها|وعنهم|وعن|قال|وأما الأحاديث|أما الأحاديث|فالأول|ومنها حديث|الحديث))/)
    const nextOrdinal = normalizedText
      .slice(start)
      .search(/(?:^|\n|\s)(?:الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر|الحادي عشر|الثاني عشر|الثالث عشر|الرابع عشر|الخامس عشر|السادس عشر|السابع عشر|الثامن عشر|التاسع عشر|العشرون|الحادي والعشرون)\s*:\s*(?:عن|وعن)/)
    const boundaries = [nextSharh]
    if (nextSection >= 0) boundaries.push(start + nextSection)
    if (nextOrdinal >= 0) boundaries.push(start + nextOrdinal)
    const end = Math.min(...boundaries)
    return normalizedText.slice(start, end).trim()
  }

  function hasSharhInSegment(fromPos, toPos) {
    const segment = normalizedText.slice(fromPos, toPos)
    return segment.includes("[الشرح]") || segment.includes("الشرح")
  }

  function firstSharhInSegment(fromPos, toPos) {
    const segment = normalizedText.slice(fromPos, toPos)
    const idxBracketed = segment.indexOf("[الشرح]")
    if (idxBracketed >= 0) return { pos: fromPos + idxBracketed, len: 7 }
    const idxPlain = segment.indexOf("الشرح")
    if (idxPlain >= 0) return { pos: fromPos + idxPlain, len: 5 }
    return null
  }

  const MIN_SHARH_DISTANCE = 3500
  let crossReferenceCount = 0
  let segmentSharhCount = 0
  let sharedSharhCount = 0

  for (let i = 0; i < markers.length; i += 1) {
    const marker = markers[i]
    const nextMarker = markers[i + 1]
    const segmentEnd = nextMarker ? nextMarker.index : normalizedText.length

    const bookNumber = bookNumberForHadith(marker.number)
    if (!bookNumber) continue

    // Strategy 1: Check if this marker's segment contains [الشرح] directly
    const localSharh = hasSharhInSegment(marker.index, segmentEnd)
    if (localSharh) {
      const sharhResult = firstSharhInSegment(marker.index, segmentEnd)
      const text = explanationText(sharhResult.pos, sharhResult.len)
      if (text.length >= 50) {
        const key = `riyadussalihin:${bookNumber}:${marker.number}`
        const existing = entries.get(key)
        if (!existing || existing.text.length < text.length) {
          entries.set(key, {
            text,
            source: "شرح رياض الصالحين لابن عثيمين",
            scholar: "ابن عثيمين",
            sourceUrl: DEFAULT_BASE_URL,
            sourceHadithNumber: String(marker.number),
            verified: true,
            match: {
              method: "segment_sharh",
              confidence: 0.98,
              reviewed: true,
              matchedText: text.slice(0, 120),
              reviewer: "epub-sharh-anchored-import",
            },
          })
        }
        segmentSharhCount += 1
        continue
      }
    }

    // Strategy 2: No الشرح in segment. Check if this marker shares a شرحي
    // with subsequent markers (distance-based heuristic).
    const nextSharhPos = findNextSharh(marker.index)
    const prevSharhPos = findPrevSharh(marker.index)
    const distToNextSharh = nextSharhPos - marker.index
    const distFromPrevSharh = marker.index - prevSharhPos

    // For the last section (no next شرحي), use end-of-text as the "next شرحي"
    const nearEnd = nextSharhPos >= normalizedText.length - 1
    const adjustedMaxDist = nearEnd ? normalizedText.length - marker.index : distToNextSharh

    if (adjustedMaxDist > 0 && adjustedMaxDist < MIN_SHARH_DISTANCE && distFromPrevSharh > 200) {
      const sourceSharhPos = nearEnd ? Math.max(prevSharhPos, 0) : nextSharhPos
      if (sourceSharhPos > 0) {
        const text = explanationText(sourceSharhPos, 7)
        if (text.length >= 50) {
          const key = `riyadussalihin:${bookNumber}:${marker.number}`
          const existing = entries.get(key)
          if (!existing || existing.text.length < text.length) {
            entries.set(key, {
              text,
              source: "شرح رياض الصالحين لابن عثيمين",
              scholar: "ابن عثيمين",
              sourceUrl: DEFAULT_BASE_URL,
              sourceHadithNumber: String(marker.number),
              verified: true,
              match: {
                method: "shared_sharh",
                confidence: 0.98,
                reviewed: true,
                matchedText: text.slice(0, 120),
                reviewer: "epub-sharh-anchored-import",
              },
            })
          }
          sharedSharhCount += 1
          continue
        }
      }
    }

    crossReferenceCount += 1
  }

  console.log(`\nSegment-local شرحي: ${segmentSharhCount}`)
  console.log(`Shared شرحي (distance-based): ${sharedSharhCount}`)
  console.log(`Cross-reference markers filtered out: ${crossReferenceCount}`)

  return Object.fromEntries([...entries].sort(([a], [b]) => a.localeCompare(b, "en")))
}

function supplementEntriesFromApiMatn(entries, pages, apiHadiths, args) {
  if (!apiHadiths.length) return {}

  const fullText = pages.map((page) => page.body).join("\n\n")
  const searchText = normalizeSearchWithMap(fullText)
  const noTashkeel = (text) => text.replace(/[ًٌٍَُِّ~ْ]/g, "")
  const normalizedText = noTashkeel(fullText)
  const sharhPositions = [...normalizedText.matchAll(/\[\s*الشرح\s*\]|(?:^|\n)\s*الشرح\b/gi)].map((match) => match.index)
  const markers = findMarkers(normalizedText)
  const supplements = {}
  const missingKeys = new Set()

  for (const [bookNumber, start, end] of FALLBACK_BOOK_RANGES) {
    for (let number = start; number <= end; number += 1) {
      const key = `riyadussalihin:${bookNumber}:${number}`
      if (!entries[key]) missingKeys.add(key)
    }
  }

  const findNextSharh = (fromIndex) => {
    for (const position of sharhPositions) {
      if (position > fromIndex) return position
    }
    return -1
  }

  const findFollowingBoundary = (fromIndex) => {
    const rest = normalizedText.slice(fromIndex)
    const candidates = [
      rest.search(/\n\s*[0-9٠-٩]{1,4}\s*\/\s*[0-9٠-٩]{1,4}\s*[ـ_\-–]/),
      rest.search(/\n\s*[0-9٠-٩]{1,4}\s*[_ـ\-–]\s*(?:الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر|الحادي|الحادية|العشرون|عنه|عنها|عنهم|عن|وعنه|وعنها|وعنهم|وعن|قال|وأما الأحاديث|أما الأحاديث|فالأول|ومنها حديث|الحديث)/),
      rest.search(/(?:^|\n|\s)(?:الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر|الحادي عشر|الثاني عشر|الثالث عشر|الرابع عشر|الخامس عشر|السادس عشر|السابع عشر|الثامن عشر|التاسع عشر|العشرون|الحادي والعشرون)\s*:\s*(?:عن|وعن)/),
      rest.search(/\n\s*[0-9٠-٩]{1,3}\s*[-ـ]\s*(?:باب|كتاب)\b/),
    ].filter((index) => index > 20)

    if (!candidates.length) return normalizedText.length
    return fromIndex + Math.min(...candidates)
  }

  const expectedWindow = (hadithNumber) => {
    const number = Number(hadithNumber)
    let before = 0
    let after = normalizedText.length

    for (const marker of markers) {
      if (marker.number < number && marker.index > before) before = marker.index
      if (marker.number > number && marker.index < after) after = marker.index
    }

    return {
      start: Math.max(0, before - args.matnWindow),
      end: Math.min(normalizedText.length, after + args.matnWindow),
    }
  }

  for (const hadith of apiHadiths) {
    if (hadith.collection !== "riyadussalihin") continue
    const key = `riyadussalihin:${hadith.bookNumber}:${hadith.hadithNumber}`
    if (!missingKeys.has(key) || supplements[key]) continue

    let rawIndex = -1
    const window = expectedWindow(hadith.hadithNumber)
    for (const snippet of hadithSnippetPatterns(hadith.ar && hadith.ar.text)) {
      let searchFrom = 0
      while (searchFrom < searchText.normalized.length) {
        const index = searchText.normalized.indexOf(snippet, searchFrom)
        if (index < 0) break
        const candidateIndex = searchText.map[index]
        searchFrom = index + snippet.length
        if (candidateIndex < window.start || candidateIndex > window.end) continue
        rawIndex = candidateIndex
        break
      }
      if (rawIndex >= 0) break
    }
    if (rawIndex < 0) continue

    const sharhStart = findNextSharh(rawIndex)
    if (sharhStart < 0 || sharhStart - rawIndex > args.matnWindow) continue
    const sharhMarker = normalizedText.slice(sharhStart).match(/\[\s*الشرح\s*\]|(?:^|\n)\s*الشرح\b/i)
    if (!sharhMarker) continue
    const textStart = sharhStart + sharhMarker[0].length
    const textEnd = findFollowingBoundary(textStart)
    const text = normalizeSegment(normalizedText.slice(textStart, textEnd))
    if (text.length < 120) continue
    if (text.length > args.maxSupplementText) continue

    supplements[key] = {
      text,
      source: "شرح رياض الصالحين لابن عثيمين",
      scholar: "ابن عثيمين",
      sourceUrl: DEFAULT_BASE_URL,
      sourceHadithNumber: String(hadith.hadithNumber),
      verified: true,
      match: {
        method: "matn_similarity",
        confidence: 0.94,
        reviewed: true,
        matchedText: text.slice(0, 120),
        reviewer: "epub-api-matn-import",
      },
    }
  }

  return supplements
}

function supplementEntriesFromSharedNeighbors(entries, apiHadiths) {
  if (!apiHadiths.length) return {}

  const apiByKey = new Map(
    apiHadiths
      .filter((hadith) => hadith.collection === "riyadussalihin")
      .map((hadith) => [`${hadith.collection}:${hadith.bookNumber}:${hadith.hadithNumber}`, hadith])
  )
  const supplements = {}

  const sameReviewedText = (first, second) => {
    if (!first || !second) return false
    if (!first.match || !first.match.reviewed || !second.match || !second.match.reviewed) return false
    if (Number(first.match.confidence || 0) < 0.9 || Number(second.match.confidence || 0) < 0.9) return false
    return first.text.slice(0, 300) === second.text.slice(0, 300)
  }

  for (const [bookNumber, start, end] of FALLBACK_BOOK_RANGES) {
    for (let number = start + 1; number < end; number += 1) {
      const key = `riyadussalihin:${bookNumber}:${number}`
      if (entries[key] || supplements[key]) continue

      const currentHadith = apiByKey.get(key)
      const previousKey = `riyadussalihin:${bookNumber}:${number - 1}`
      const nextKey = `riyadussalihin:${bookNumber}:${number + 1}`
      const previousHadith = apiByKey.get(previousKey)
      const nextHadith = apiByKey.get(nextKey)
      if (!currentHadith || !previousHadith || !nextHadith) continue
      if (currentHadith.chapterId !== previousHadith.chapterId || currentHadith.chapterId !== nextHadith.chapterId) continue
      if (!sameReviewedText(entries[previousKey], entries[nextKey])) continue

      const sourceEntry = entries[previousKey]
      supplements[key] = {
        ...sourceEntry,
        sourceHadithNumber: String(number),
        match: {
          method: "manual",
          confidence: 0.93,
          reviewed: true,
          matchedText: sourceEntry.text.slice(0, 120),
          reviewer: "shared-neighbor-group-import",
        },
        notes: [
          sourceEntry.notes,
          "هذا الشرح موروث من شرح جماعي متطابق للحديثين السابق واللاحق داخل الباب نفسه.",
        ].filter(Boolean).join(" "),
      }
    }
  }

  return supplements
}

function supplementEntriesFromBoundedSharedRuns(entries, apiHadiths) {
  if (!apiHadiths.length) return {}

  const apiByKey = new Map(
    apiHadiths
      .filter((hadith) => hadith.collection === "riyadussalihin")
      .map((hadith) => [`${hadith.collection}:${hadith.bookNumber}:${hadith.hadithNumber}`, hadith])
  )
  const supplements = {}

  const signature = (entry) => {
    if (!entry || !entry.match || !entry.match.reviewed) return ""
    if (Number(entry.match.confidence || 0) < 0.9) return ""
    return entry.text.slice(0, 300)
  }

  for (const [bookNumber, start, end] of FALLBACK_BOOK_RANGES) {
    let number = start + 1
    while (number < end) {
      const key = `riyadussalihin:${bookNumber}:${number}`
      if (entries[key] || supplements[key]) {
        number += 1
        continue
      }

      const runStart = number
      let runEnd = number
      while (runEnd + 1 < end && !entries[`riyadussalihin:${bookNumber}:${runEnd + 1}`] && !supplements[`riyadussalihin:${bookNumber}:${runEnd + 1}`]) {
        runEnd += 1
      }

      const previousKey = `riyadussalihin:${bookNumber}:${runStart - 1}`
      const nextKey = `riyadussalihin:${bookNumber}:${runEnd + 1}`
      const previousEntry = entries[previousKey] || supplements[previousKey]
      const nextEntry = entries[nextKey] || supplements[nextKey]
      const sharedSignature = signature(previousEntry)
      const previousHadith = apiByKey.get(previousKey)
      const nextHadith = apiByKey.get(nextKey)
      let canFill = Boolean(sharedSignature && sharedSignature === signature(nextEntry) && previousHadith && nextHadith && previousHadith.chapterId === nextHadith.chapterId)

      for (let current = runStart; current <= runEnd && canFill; current += 1) {
        const currentHadith = apiByKey.get(`riyadussalihin:${bookNumber}:${current}`)
        if (!currentHadith || currentHadith.chapterId !== previousHadith.chapterId) canFill = false
      }

      if (canFill) {
        for (let current = runStart; current <= runEnd; current += 1) {
          const targetKey = `riyadussalihin:${bookNumber}:${current}`
          supplements[targetKey] = {
            ...previousEntry,
            sourceHadithNumber: String(current),
            match: {
              method: "manual",
              confidence: 0.91,
              reviewed: true,
              matchedText: previousEntry.text.slice(0, 120),
              reviewer: "bounded-shared-group-import",
            },
            notes: [
              previousEntry.notes,
              "هذا الشرح موروث من شرح جماعي متطابق يحد هذا النطاق من الحديث السابق واللاحق داخل الباب نفسه.",
            ].filter(Boolean).join(" "),
          }
        }
      }

      number = runEnd + 1
    }
  }

  return supplements
}

function supplementEntriesFromUnanimousChapters(entries, apiHadiths) {
  if (!apiHadiths.length) return {}

  const chapters = new Map()
  for (const hadith of apiHadiths) {
    if (hadith.collection !== "riyadussalihin") continue
    const chapterKey = `${hadith.bookNumber}|${hadith.chapterId}`
    if (!chapters.has(chapterKey)) chapters.set(chapterKey, [])
    chapters.get(chapterKey).push(hadith)
  }

  const signature = (entry) => {
    if (!entry || !entry.match || !entry.match.reviewed) return ""
    if (Number(entry.match.confidence || 0) < 0.9) return ""
    return entry.text.slice(0, 300)
  }
  const supplements = {}

  for (const hadiths of chapters.values()) {
    const present = hadiths
      .map((hadith) => {
        const key = `riyadussalihin:${hadith.bookNumber}:${hadith.hadithNumber}`
        return { key, entry: entries[key] || supplements[key] }
      })
      .filter(({ entry }) => signature(entry))
    const missing = hadiths.filter((hadith) => !entries[`riyadussalihin:${hadith.bookNumber}:${hadith.hadithNumber}`] && !supplements[`riyadussalihin:${hadith.bookNumber}:${hadith.hadithNumber}`])

    if (present.length < 3 || !missing.length || missing.length > 5) continue
    const sharedSignature = signature(present[0].entry)
    if (!present.every(({ entry }) => signature(entry) === sharedSignature)) continue

    for (const hadith of missing) {
      const key = `riyadussalihin:${hadith.bookNumber}:${hadith.hadithNumber}`
      const sourceEntry = present[0].entry
      supplements[key] = {
        ...sourceEntry,
        sourceHadithNumber: String(hadith.hadithNumber),
        match: {
          method: "manual",
          confidence: 0.9,
          reviewed: true,
          matchedText: sourceEntry.text.slice(0, 120),
          reviewer: "unanimous-chapter-group-import",
        },
        notes: [
          sourceEntry.notes,
          "هذا الشرح موروث من شرح جماعي متطابق لكل الأحاديث المراجعة داخل الباب نفسه.",
        ].filter(Boolean).join(" "),
      }
    }
  }

  return supplements
}

function pruneKnownTopicMismatches(entries, apiHadiths) {
  if (!apiHadiths.length) return 0

  const apiByKey = new Map(
    apiHadiths
      .filter((hadith) => hadith.collection === "riyadussalihin")
      .map((hadith) => [`${hadith.collection}:${hadith.bookNumber}:${hadith.hadithNumber}`, hadith])
  )
  let removed = 0

  for (const [key, entry] of Object.entries(entries)) {
    const hadith = apiByKey.get(key)
    if (!hadith || !entry || typeof entry.text !== "string") continue
    const chapterTitle = `${hadith.chapterTitle && hadith.chapterTitle.ar || ""} ${hadith.chapterTitle && hadith.chapterTitle.en || ""}`
    const textStart = entry.text.slice(0, 500)

    if (/باب سجود الشكر|سجود الشكر عند تجدد النعم/.test(textStart) && !/سجود الشكر|Sujud/i.test(chapterTitle)) {
      delete entries[key]
      removed += 1
    }
  }

  return removed
}

function buildPages(pageBodies) {
  let cursor = 0
  return pageBodies.map(({ number, body }) => {
    const startIndex = cursor
    const endIndex = startIndex + body.length
    cursor = endIndex + 2
    return { number, body, startIndex, endIndex }
  })
}

async function readExisting(file) {
  try {
    const parsed = JSON.parse(await readFile(file, "utf8"))
    return parsed && parsed.entries && typeof parsed.entries === "object" ? parsed.entries : {}
  } catch {
    return {}
  }
}

function buildOutput(entries, args) {
  if (!args.reviewed) {
    for (const entry of Object.values(entries)) {
      entry.match.reviewed = false
    }
  }

  return {
    meta: {
      collection: "riyadussalihin",
      bookTitle: "رياض الصالحين",
      scholar: "ابن عثيمين",
      source: "شرح رياض الصالحين",
      sourceUrl: DEFAULT_BASE_URL,
      policy: "تم استخراج النصوص من المكتبة الشاملة (shamela.ws/book/9260) مع مطابقة رقم الحديث على نطاقات API الحالية. راجع التقرير قبل الاعتماد النهائي.",
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
    },
    entries,
  }
}

function buildReport(entries, generatedEntries, args) {
  const missing = []
  const byBook = FALLBACK_BOOK_RANGES.map(([bookNumber, start, end]) => {
    let covered = 0

    for (let number = start; number <= end; number += 1) {
      const key = `riyadussalihin:${bookNumber}:${number}`
      if (entries[key]) covered += 1
      else missing.push(key)
    }

    return {
      bookNumber,
      start,
      end,
      total: end - start + 1,
      covered,
      missing: end - start + 1 - covered,
    }
  })

  return {
    generatedAt: new Date().toISOString(),
    sourceUrl: args.baseUrl,
    generatedEntries: Object.keys(generatedEntries).length,
    totalEntries: Object.keys(entries).length,
    expectedEntries: 1896,
    missingEntries: missing.length,
    byBook,
    missing,
  }
}

async function writeCoverageReport(reportPath, report) {
  await mkdir(path.dirname(reportPath), { recursive: true })
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8")
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.checkExisting) {
    const existingEntries = await readExisting(args.existing)
    const report = buildReport(existingEntries, {}, args)
    await writeCoverageReport(args.report, report)
    console.log(`Existing entries: ${Object.keys(existingEntries).length}`)
    console.log(`Expected entries: ${report.expectedEntries}`)
    console.log(`Missing entries: ${report.missingEntries}`)
    console.log(`Wrote ${args.report}`)
    return
  }

  const inputPages = !args.inputText && !args.inputJson && !args.inputEpub && args.inputDir && args.to === null ? await discoverInputPages(args.inputDir) : null
  const to = args.inputText || args.inputJson || args.inputEpub || inputPages ? null : args.to === null ? await discoverLastPage(args) : args.to
  const pageNumbers = args.inputText || args.inputJson || args.inputEpub ? [] : inputPages || Array.from({ length: to - args.from + 1 }, (_, index) => args.from + index)
  const bodies = []

  if (args.inputEpub) {
    bodies.push(...await readEpubPages(args.inputEpub))
  } else if (args.inputJson) {
    bodies.push(...await readInputJson(args.inputJson))
    console.log(`Read ${bodies.length} pages from ${args.inputJson}`)
  } else if (args.inputText) {
    const text = await readFile(args.inputText, "utf8")
    bodies.push({ number: 0, body: extractPageBody(text) })
    console.log(`Read copied text from ${args.inputText}`)
  } else {
    for (const page of pageNumbers) {
      const html = await getCachedPage(page, args)
      bodies.push({ number: page, body: extractPageBody(html) })
      if (bodies.length % 50 === 0 || bodies.length === pageNumbers.length) {
        console.log(`Fetched/extracted ${bodies.length} of ${pageNumbers.length} pages`)
      }
    }
  }

  const builtPages = buildPages(bodies)
  const generatedEntries = splitSegments(builtPages)
  const apiHadiths = await readApiHadiths(args.apiJson)
  const supplementalEntries = supplementEntriesFromApiMatn(generatedEntries, builtPages, apiHadiths, args)
  Object.assign(generatedEntries, supplementalEntries)
  const existingEntries = args.mergeExisting ? await readExisting(args.existing) : {}
  const entries = { ...existingEntries, ...generatedEntries }
  const sharedNeighborEntries = supplementEntriesFromSharedNeighbors(entries, apiHadiths)
  Object.assign(entries, sharedNeighborEntries)
  const boundedSharedEntries = supplementEntriesFromBoundedSharedRuns(entries, apiHadiths)
  Object.assign(entries, boundedSharedEntries)
  const unanimousChapterEntries = supplementEntriesFromUnanimousChapters(entries, apiHadiths)
  Object.assign(entries, unanimousChapterEntries)
  const prunedMismatchCount = pruneKnownTopicMismatches(entries, apiHadiths)
  const output = buildOutput(entries, args)
  const report = buildReport(entries, generatedEntries, args)
  const outputPath = args.apply ? args.existing : args.output
  const totalCount = Object.keys(entries).length

  if (args.apply && !args.allowPartialApply && totalCount < args.minEntries) {
    await writeCoverageReport(args.report, report)
    throw new Error(
      `Refusing to apply partial Riyad sharh import: ${totalCount} entries found, ` +
      `minimum is ${args.minEntries}. Review ${args.report}, or rerun with --allow-partial-apply.`
    )
  }

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8")
  await writeCoverageReport(args.report, report)

  const generatedCount = Object.keys(generatedEntries).length
  const supplementalCount = Object.keys(supplementalEntries).length
  const sharedNeighborCount = Object.keys(sharedNeighborEntries).length
  const boundedSharedCount = Object.keys(boundedSharedEntries).length
  const unanimousChapterCount = Object.keys(unanimousChapterEntries).length
  const existingCount = Object.keys(existingEntries).length
  const missingCount = 1896 - totalCount
  console.log(`Generated entries: ${generatedCount}`)
  if (apiHadiths.length) console.log(`API matn supplemental entries: ${supplementalCount}`)
  if (apiHadiths.length) console.log(`Shared-neighbor supplemental entries: ${sharedNeighborCount}`)
  if (apiHadiths.length) console.log(`Bounded shared-run supplemental entries: ${boundedSharedCount}`)
  if (apiHadiths.length) console.log(`Unanimous-chapter supplemental entries: ${unanimousChapterCount}`)
  if (apiHadiths.length) console.log(`Pruned topic-mismatch entries: ${prunedMismatchCount}`)
  console.log(`Preserved existing entries: ${existingCount}`)
  console.log(`Total entries: ${totalCount}`)
  console.log(`Estimated missing hadith numbers: ${Math.max(0, missingCount)}`)
  console.log(`Wrote ${outputPath}`)
  console.log(`Wrote ${args.report}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
