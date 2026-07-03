#!/usr/bin/env node
import crypto from "crypto"
import fs from "fs"
import path from "path"
import { RIYAD_MANUAL_OVERRIDES } from "./riyad-manual-overrides.mjs"

const { readFile, writeFile } = fs.promises

const CACHE_DIR = ".cache/shamela-all"
const FINAL_OUTPUT = "public/data/riyad-uthaymeen-shamela-final.json"
const REPORT_OUTPUT = "public/data/riyad-uthaymeen-sharh.report.json"
const MATN_FALLBACK_FILE = "public/data/riyad-api.json"
const ADAB_OVERRIDES_FILE = "public/data/riyad-uthaymeen-adab-overrides.json"
const SOURCE_URL = "https://shamela.ws/book/9260"

const BOOKS = [
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

const NUMBER_TO_BOOK = new Map()
for (const [book, start, end] of BOOKS) {
  for (let number = start; number <= end; number += 1) {
    NUMBER_TO_BOOK.set(number, book)
  }
}

const HADITH_RE = /(?:^|\n)\s*([0-9\u0660-\u0669]{1,4})\s*[-ـ]/gu
const SHARH_RE = /(?:^|\n)\s*(?:\[?\s*الشَّرْحُ\s*\]?|الشرح)\s*/u
const PAGE_BREAK_RE = /\n*@@PAGE:\d+@@\n*/g
const ADAB_SHARH_KEY_OVERRIDES = {
  684: 685,
  686: 685,
  687: 686,
  718: 719,
}

function decodeEntities(text) {
  return String(text || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'")
}

function htmlToText(html) {
  const text = String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p\b[^>]*>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")

  return decodeEntities(text)
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
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
  return String(value).replace(/[٠-٩]/g, (char) => digits[char])
}

function cleanText(text) {
  return String(text || "")
    .replace(PAGE_BREAK_RE, "\n\n")
    .replace(/\n\s*\*\s*\*\s*\*\s*\n/g, "\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function cleanMatn(text) {
  return cleanText(text)
}

function cleanSharh(text) {
  return cleanText(text)
    .replace(/^\s*\[?\s*الشَّرْحُ\s*\]?\s*/u, "")
    .replace(/^\s*الشرح\s*/u, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function isSafeSharh(text) {
  const value = String(text || "").trim()
  if (value.length <= 30) return false
  if (/^\s*\]/.test(value)) return false
  if (/^[\s\n]*[0-9\u0660-\u0669]{1,4}\s*[-ـ]/u.test(value)) return false
  if (value.includes("**شرح ابن عثيمين:**")) return false
  if (value.includes("[الشَّرْحُ]")) return false
  return true
}

function getExpectedKeys() {
  const keys = []
  for (const [book, start, end] of BOOKS) {
    for (let number = start; number <= end; number += 1) {
      keys.push(`riyadussalihin:${book}:${number}`)
    }
  }
  return keys
}

function getKey(number) {
  const book = NUMBER_TO_BOOK.get(number)
  return book ? `riyadussalihin:${book}:${number}` : null
}

function getPoolIndex(text, pool, hashes) {
  if (!text) return -1
  const hash = crypto.createHash("sha256").update(text).digest("hex")
  if (!hashes.has(hash)) {
    hashes.set(hash, pool.length)
    pool.push(text)
  }
  return hashes.get(hash)
}

async function loadPages() {
  const pages = []
  for (let pageId = 1; pageId <= 3784; pageId += 1) {
    try {
      const raw = JSON.parse(await readFile(path.join(CACHE_DIR, `${pageId}.json`), "utf8"))
      const text = htmlToText(raw.nass || "")
      if (text) pages.push({ pageId, text })
    } catch {
      // Missing cache pages are reported through final coverage checks.
    }
  }
  return pages
}

async function loadMatnFallback() {
  const fallback = new Map()
  try {
    const data = JSON.parse(await readFile(MATN_FALLBACK_FILE, "utf8"))
    const hadiths = Array.isArray(data.hadiths) ? data.hadiths : []
    for (const hadith of hadiths) {
      const idInBook = Number(hadith.idInBook || 0)
      const number = idInBook <= 1217 ? idInBook + 679 : idInBook - 1217
      if (!NUMBER_TO_BOOK.has(number)) continue
      const text = cleanMatn(hadith.arabic || "")
      if (text) fallback.set(number, text)
    }
  } catch {
    // The report and validation will expose missing matn if this file is absent.
  }
  return fallback
}

async function loadAdabOverrides() {
  try {
    const data = JSON.parse(await readFile(ADAB_OVERRIDES_FILE, "utf8"))
    return data.entries || {}
  } catch {
    return {}
  }
}

function buildCorpus(pages) {
  let text = ""
  const pageOffsets = []
  for (const page of pages) {
    const marker = `\n@@PAGE:${page.pageId}@@\n`
    text += marker
    pageOffsets.push({ pageId: page.pageId, start: text.length })
    text += page.text
    text += "\n"
  }
  return { text, pageOffsets }
}

function pageForOffset(pageOffsets, offset) {
  let current = (pageOffsets[0] && pageOffsets[0].pageId) || 0
  for (const page of pageOffsets) {
    if (page.start > offset) break
    current = page.pageId
  }
  return current
}

function collectHadithMarkers(corpusText, pageOffsets) {
  const seen = new Set()
  const markers = []
  let match
  while ((match = HADITH_RE.exec(corpusText)) !== null) {
    const number = Number(toWesternDigits(match[1]))
    if (!NUMBER_TO_BOOK.has(number)) continue
    if (seen.has(number)) continue

    seen.add(number)
    markers.push({
      number,
      start: match.index,
      numberEnd: match.index + match[0].length,
      pageId: pageForOffset(pageOffsets, match.index),
    })
  }

  return markers.sort((a, b) => a.start - b.start)
}

function compactSharhPool(entries, pool) {
  const compacted = []
  const oldToNew = new Map()
  for (const entry of Object.values(entries)) {
    if (typeof entry.sharh !== "number" || entry.sharh < 0) continue
    const text = pool[entry.sharh]
    if (!text) {
      entry.sharh = -1
      continue
    }
    if (!oldToNew.has(entry.sharh)) {
      oldToNew.set(entry.sharh, compacted.length)
      compacted.push(text)
    }
    entry.sharh = oldToNew.get(entry.sharh)
  }
  return compacted
}

function buildEntries(corpusText, markers, matnFallback, adabOverrides) {
  let pool = []
  const hashes = new Map()
  const entries = {}
  const warnings = []
  const numberSet = new Set(markers.map((marker) => marker.number))

  for (let index = 0; index < markers.length; index += 1) {
    const marker = markers[index]
    const next = markers[index + 1]
    const end = next ? next.start : corpusText.length
    const segment = corpusText.slice(marker.start, end)
    const sharhMatch = SHARH_RE.exec(segment)

    const matnEnd = sharhMatch ? marker.start + sharhMatch.index : end
    const extractedMatn = cleanMatn(corpusText.slice(marker.start, matnEnd))
    const matn = extractedMatn || matnFallback.get(marker.number) || ""
    const rawSharh = sharhMatch ? segment.slice(sharhMatch.index + sharhMatch[0].length) : ""
    const sharhText = cleanSharh(rawSharh)
    const hasSharh = isSafeSharh(sharhText)
    const sharhIndex = hasSharh ? getPoolIndex(sharhText, pool, hashes) : -1
    const key = getKey(marker.number)

    if (!key) continue
    if (sharhMatch && !hasSharh) {
      warnings.push({
        key,
        type: "unsafe-sharh-hidden",
        reason: "A sharh marker was found but the extracted text failed safety checks.",
        preview: sharhText.slice(0, 160),
      })
    }

    entries[key] = {
      text: matn,
      matn,
      sharh: sharhIndex,
      source: hasSharh ? "shamela_direct_marker" : "no_sharh",
      scholar: hasSharh ? "ابن عثيمين" : "",
      sourceUrl: SOURCE_URL,
      bookName: "شرح رياض الصالحين لابن عثيمين",
      attribution: hasSharh
        ? "ابن عثيمين - شرح رياض الصالحين (المكتبة الشاملة، shamela.ws/book/9260)"
        : "لا يوجد شرح موثق متاح حالياً",
      sourceHadithNumber: String(marker.number),
      match: {
        method: hasSharh ? "shamela_direct_marker" : "no_direct_sharh_marker",
        confidence: hasSharh ? 0.98 : 0,
        reviewed: hasSharh,
        sourcePage: marker.pageId,
        policy: "direct-marker-only",
      },
    }
  }

  for (const key of getExpectedKeys()) {
    const number = Number(key.split(":").slice(-1)[0])
    if (entries[key]) {
      if ((!entries[key].matn || entries[key].matn.length <= 20) && matnFallback.has(number)) {
        entries[key].text = matnFallback.get(number)
        entries[key].matn = matnFallback.get(number)
      }
      continue
    }
    const fallbackMatn = matnFallback.get(number) || ""
    entries[key] = {
      text: fallbackMatn,
      matn: fallbackMatn,
      sharh: -1,
      source: fallbackMatn ? "no_sharh" : "missing_matn",
      scholar: "",
      sourceUrl: SOURCE_URL,
      bookName: "شرح رياض الصالحين لابن عثيمين",
      attribution: "لا يوجد شرح موثق متاح حالياً",
      sourceHadithNumber: String(number),
      match: {
        method: fallbackMatn ? "matn_fallback_no_direct_sharh_marker" : "missing_matn",
        confidence: 0,
        reviewed: false,
        policy: "direct-marker-only",
      },
    }
    if (!numberSet.has(number)) warnings.push({ key, type: "missing-hadith-marker" })
  }

  for (const [key, override] of Object.entries(RIYAD_MANUAL_OVERRIDES)) {
    const number = key.split(":").slice(-1)[0]
    const matn = cleanMatn(override.matn || "")
    const sharhText = cleanSharh(override.sharh || "")
    const sharhIndex = isSafeSharh(sharhText) ? getPoolIndex(sharhText, pool, hashes) : -1

    entries[key] = {
      text: matn,
      matn,
      sharh: sharhIndex,
      source: sharhIndex >= 0 ? "manual_override" : "no_sharh",
      scholar: sharhIndex >= 0 ? "ابن عثيمين" : "",
      sourceUrl: SOURCE_URL,
      bookName: "شرح رياض الصالحين لابن عثيمين",
      attribution: sharhIndex >= 0
        ? "ابن عثيمين - شرح رياض الصالحين (تصحيح يدوي من نص مراجع)"
        : "لا يوجد شرح موثق متاح حالياً",
      sourceHadithNumber: number,
      match: {
        method: sharhIndex >= 0 ? "manual_override" : "manual_override_no_safe_sharh",
        confidence: sharhIndex >= 0 ? 1 : 0,
        reviewed: sharhIndex >= 0,
        policy: "direct-marker-only",
      },
    }

    if (sharhIndex < 0) {
      warnings.push({
        key,
        type: "manual-override-hidden",
        reason: "A manual override was present but the sharh failed safety checks.",
        preview: sharhText.slice(0, 160),
      })
    }
  }

  for (let number = 680; number <= 726; number += 1) {
    const key = `riyadussalihin:1:${number}`
    const sharhNumber = ADAB_SHARH_KEY_OVERRIDES[number] || number
    const override = adabOverrides[`riyadussalihin:1:${sharhNumber}`]
    const matn = matnFallback.get(number) || (entries[key] && entries[key].matn) || ""
    const sharhText = cleanSharh((override && override.sharh) || "")
    const sharhIndex = isSafeSharh(sharhText) ? getPoolIndex(sharhText, pool, hashes) : -1

    entries[key] = {
      text: matn,
      matn,
      sharh: sharhIndex,
      source: sharhIndex >= 0 ? "adab_manual_override" : "no_sharh",
      scholar: sharhIndex >= 0 ? "ابن عثيمين" : "",
      sourceUrl: (override && override.sourceUrl) || SOURCE_URL,
      bookName: "شرح رياض الصالحين لابن عثيمين",
      attribution: sharhIndex >= 0
        ? "ابن عثيمين - شرح رياض الصالحين (تصحيح كتاب الأدب من ملف مراجعة موثق)"
        : "لا يوجد شرح موثق متاح حالياً",
      sourceHadithNumber: String(number),
      match: {
        method: sharhIndex >= 0 ? "adab_manual_override" : "adab_override_missing_sharh",
        confidence: sharhIndex >= 0 ? Number((override && override.match && override.match.confidence) || 0.92) : 0,
        reviewed: sharhIndex >= 0,
        reviewer: "book-adab-topic-validation",
        policy: "adab-book-corrected-only",
        sourceHadithNumber: String(sharhNumber),
      },
    }

    if (sharhIndex < 0) {
      warnings.push({
        key,
        type: "adab-override-hidden",
        reason: "كتاب الأدب يحتاج تصحيحاً، لكن لم يوجد شرح آمن لهذا المدخل.",
        preview: sharhText.slice(0, 160),
      })
    }
  }

  pool = compactSharhPool(entries, pool)
  return { entries, pool, warnings }
}

function buildReport(entries, pool, warnings, markers, pages) {
  const samples = {}
  for (const key of [
    "riyadussalihin:introduction:2",
    "riyadussalihin:introduction:3",
    "riyadussalihin:introduction:4",
    "riyadussalihin:introduction:5",
    "riyadussalihin:introduction:13",
    "riyadussalihin:introduction:14",
    "riyadussalihin:introduction:15",
    "riyadussalihin:1:680",
    "riyadussalihin:1:681",
    "riyadussalihin:1:682",
    "riyadussalihin:1:685",
    "riyadussalihin:1:688",
    "riyadussalihin:1:718",
  ]) {
    const entry = entries[key]
    const sharhText = entry && entry.sharh >= 0 ? pool[entry.sharh] : ""
    samples[key] = {
      matnPreview: ((entry && entry.matn) || "").slice(0, 220),
      sharhLength: sharhText.length,
      sharhPreview: sharhText.slice(0, 220),
      source: entry && entry.source,
      match: entry && entry.match,
    }
  }

  const entriesList = Object.entries(entries)
  const entriesWithMatn = entriesList.filter(([, entry]) => (entry.matn || "").length > 20).length
  const entriesWithSharh = entriesList.filter(([, entry]) => entry.sharh >= 0).length
  const unsafeStarts = entriesList
    .filter(([, entry]) => {
      const sharh = entry.sharh >= 0 ? pool[entry.sharh] || "" : ""
      return /^[\s\n]*[0-9\u0660-\u0669]{1,4}\s*[-ـ]/u.test(sharh)
    })
    .map(([key]) => key)

  return {
    generatedAt: new Date().toISOString(),
    source: SOURCE_URL,
    policy: "شرح كل حديث يؤخذ فقط من علامة الشرح الواقعة داخل حدوده قبل الحديث التالي. الشرح المشترك يعرض على آخر حديث قبل العلامة فقط.",
    pagesRead: pages.length,
    hadithMarkers: markers.length,
    totalEntries: entriesList.length,
    entriesWithMatn,
    entriesWithSharh,
    entriesWithoutSharh: entriesList.length - entriesWithSharh,
    uniqueSharhTexts: pool.length,
    warnings,
    unsafeStarts,
    samples,
  }
}

async function main() {
  console.log("Building Riyad sharh with direct-marker policy...")
  const pages = await loadPages()
  const matnFallback = await loadMatnFallback()
  const adabOverrides = await loadAdabOverrides()
  const corpus = buildCorpus(pages)
  const markers = collectHadithMarkers(corpus.text, corpus.pageOffsets)
  const { entries, pool, warnings } = buildEntries(corpus.text, markers, matnFallback, adabOverrides)
  const report = buildReport(entries, pool, warnings, markers, pages)

  const output = {
    meta: {
      source: "shamela.ws",
      bookId: "9260",
      bookName: "شرح رياض الصالحين لابن عثيمين",
      scholar: "ابن عثيمين",
      totalEntries: report.totalEntries,
      entriesWithMatn: report.entriesWithMatn,
      entriesWithSharh: report.entriesWithSharh,
      introSharh: Object.entries(entries).filter(([key, entry]) => key.includes(":introduction:") && entry.sharh >= 0).length,
      bookSharh: Object.entries(entries).filter(([key, entry]) => !key.includes(":introduction:") && entry.sharh >= 0).length,
      uniqueSharhTexts: pool.length,
      policy: report.policy,
      schemaVersion: 26,
      generatedAt: report.generatedAt,
      buildMethod: "direct-marker-per-hadith",
      stats: {
        entriesWithoutSharh: report.entriesWithoutSharh,
        warnings: warnings.length,
      },
    },
    sharhPool: pool,
    entries,
  }

  await writeFile(FINAL_OUTPUT, `${JSON.stringify(output, null, 2)}\n`, "utf8")
  await writeFile(REPORT_OUTPUT, `${JSON.stringify(report, null, 2)}\n`, "utf8")

  console.log(`Wrote ${FINAL_OUTPUT}`)
  console.log(`Wrote ${REPORT_OUTPUT}`)
  console.log(`Entries: ${report.totalEntries}`)
  console.log(`Matn: ${report.entriesWithMatn}`)
  console.log(`Sharh: ${report.entriesWithSharh}`)
  console.log(`No sharh: ${report.entriesWithoutSharh}`)
  console.log(`Warnings: ${warnings.length}`)
}

main().catch((error) => {
  console.error("Error:", error)
  process.exit(1)
})
