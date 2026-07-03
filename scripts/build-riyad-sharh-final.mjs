#!/usr/bin/env node

import crypto from "crypto"
import fs from "fs"

const REVIEWED_FILE = "public/data/riyad-uthaymeen-sharh.json"
const ADAB_OVERRIDES_FILE = "public/data/riyad-uthaymeen-adab-overrides.json"
const OUTPUT_FILE = "public/data/riyad-uthaymeen-shamela-final.json"
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

const TRUSTED_METHODS = new Set([
  "shamela_precise",
  "shamela_precise_v2",
  "shamela_precise_v3",
  "shamela_precise_v4",
  "manual",
  "manual-fix",
])

const CLOTHING_TERMS = [
  "كتاب اللباس",
  "اللباس",
  "لباس",
  "الثوب",
  "الثياب",
  "ثياب",
  "البياض",
  "سرابيل",
  "الحلة",
  "حلة",
  "العمامة",
  "عمامة",
  "القميص",
  "قميص",
  "الإزار",
  "إزار",
  "الكعبين",
  "الإسبال",
  "المسبل",
  "الحرير",
  "الذهب",
  "الحكة",
  "جلود",
  "السباع",
  "كسوتنيه",
]

const CLOTHING_FOREIGN_TERMS = [
  "باب المحافظة على ما اعتاده",
  "باب الوعظ والاقتصاد",
  "باب فضل السلام",
  "كتاب الأدب",
  "آداب النوم",
]

const ADAB_TERMS = [
  "كتاب الأدب",
  "الأدب",
  "الحياء",
  "الإيمان",
  "شعبة",
  "حفظ السر",
  "السر",
  "الكلمة",
  "الكلام",
  "طلاقة الوجه",
  "المنافق",
  "العهد",
  "الوعد",
  "المحافظة على ما اعتاده",
  "إصغاء",
  "استنصات",
  "الوعظ",
  "الوقار",
  "السكينة",
  "الضيف",
  "الضيافة",
  "إكرام الضيف",
  "التبشير",
  "التهنئة",
  "توديع",
  "المسافر",
  "الاستخارة",
  "المشاورة",
  "مخالفة الطريق",
  "التيامن",
  "اليمين",
  "البداءة باليمين",
  "اليسار",
]

const ADAB_FOREIGN_TERMS = [
  "كتاب أدب الطعام",
  "كتاب اللباس",
  "آداب النوم",
  "كتاب السلام",
]

function loadAdabOverrides() {
  if (!fs.existsSync(ADAB_OVERRIDES_FILE)) return {}
  const parsed = JSON.parse(fs.readFileSync(ADAB_OVERRIDES_FILE, "utf8"))
  return parsed.entries || {}
}

function splitReviewedParts(text) {
  const separator = /\n\s*---\s*\n\s*\*\*شرح ابن عثيمين:\*\*\s*/m
  const match = separator.exec(text)
  if (!match) {
    return { before: cleanSharh(text), after: "" }
  }

  return {
    before: cleanSharh(text.slice(0, match.index)),
    after: cleanSharh(text.slice(match.index + match[0].length)),
  }
}

function splitReviewedText(text, key) {
  const { before, after } = splitReviewedParts(text)
  const isIntroduction = key.includes(":introduction:")
  const isClothingBook = key.startsWith("riyadussalihin:3:")

  if (isIntroduction) {
    return {
      matn: "",
      sharh: before,
    }
  }

  if (isClothingBook) {
    const candidates = [after, before].map(trimClothingSharh).filter(Boolean)
    const sharh = candidates.find(isValidClothingSharh) || ""
    return { matn: before, sharh }
  }

  return {
    matn: before,
    sharh: after || before,
  }
}

function cleanSharh(text) {
  return String(text || "")
    .replace(/^\s*\[?الشَّرْحُ\]?\s*/u, "")
    .replace(/\s+[0-9٠-٩]+[_-]\s*$/u, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function isTrusted(entry) {
  const match = (entry && entry.match) || {}
  const confidence = Number(match.confidence || 0)
  return (
    match.reviewed === true &&
    confidence >= 0.9 &&
    TRUSTED_METHODS.has(match.method) &&
    !String(entry.text || "").includes("[شرح غير متاح")
  )
}

function isValidClothingSharh(text) {
  const value = String(text || "")
  if (value.length < 30) return false
  if (/[\u0660-\u0669]{3,4}\s*[-ـ]/u.test(value)) return false
  return (
    CLOTHING_TERMS.some((term) => value.includes(term)) &&
    !CLOTHING_FOREIGN_TERMS.some((term) => value.includes(term))
  )
}

function isValidAdabSharh(text) {
  const value = String(text || "")
  if (value.length < 30) return false
  if (/[\u0660-\u0669]{3,4}\s*[-ـ]/u.test(value)) return false
  return (
    ADAB_TERMS.some((term) => value.includes(term)) &&
    !ADAB_FOREIGN_TERMS.some((term) => value.includes(term))
  )
}

function trimClothingSharh(text) {
  let value = String(text || "").trim()
  const boundaries = [
    "كتاب آداب النوم",
    "باب آداب النوم",
  ]

  for (const boundary of boundaries) {
    const index = value.indexOf(boundary)
    if (index > 0) value = value.slice(0, index).trim()
  }

  return value
}

function extractClothingNewGarmentSharh(reviewedEntries) {
  const source = reviewedEntries["riyadussalihin:3:810"]
  if (!source) return ""
  const { before } = splitReviewedParts(source.text || "")
  const start = before.indexOf("وأما الباب الثالث")
  if (start < 0) return ""
  return trimClothingSharh(before.slice(start))
}

function extractClothingSkinsSharh(reviewedEntries) {
  const source = reviewedEntries["riyadussalihin:3:810"]
  if (!source) return ""
  const { before } = splitReviewedParts(source.text || "")
  const start = before.indexOf("أما الباب الثاني")
  if (start < 0) return ""
  const end = before.indexOf("وأما الباب الثالث", start)
  return trimClothingSharh(before.slice(start, end > start ? end : undefined))
}

function isTrustedForKey(key, entry, sharh) {
  if (key.startsWith("riyadussalihin:1:")) {
    const number = Number(key.split(":").slice(-1)[0])
    if (number >= 680 && number <= 726) {
      const match = (entry && entry.match) || {}
      const confidence = Number(match.confidence || 0)
      return confidence >= 0.9 && isValidAdabSharh(sharh)
    }
  }

  if (key.startsWith("riyadussalihin:3:")) {
    const match = (entry && entry.match) || {}
    const confidence = Number(match.confidence || 0)
    return confidence >= 0.8 && isValidClothingSharh(sharh)
  }

  return isTrusted(entry)
}

function getPoolIndex(text, pool, hashes) {
  if (!text || text.length < 30) return -1
  const hash = crypto.createHash("sha256").update(text).digest("hex")
  if (!hashes.has(hash)) {
    hashes.set(hash, pool.length)
    pool.push(text)
  }
  return hashes.get(hash)
}

function expectedKeys() {
  const keys = []
  for (const [book, start, end] of BOOKS) {
    for (let number = start; number <= end; number += 1) {
      keys.push(`riyadussalihin:${book}:${number}`)
    }
  }
  return keys
}

function main() {
  const reviewed = JSON.parse(fs.readFileSync(REVIEWED_FILE, "utf8"))
  const reviewedEntries = reviewed.entries || {}
  const adabOverrides = loadAdabOverrides()
  const pool = []
  const hashes = new Map()
  const entries = {}
  const stats = {
    trustedSharh: 0,
    untrustedHidden: 0,
    missingReviewedEntry: 0,
  }

  for (const key of expectedKeys()) {
    const reviewedEntry = reviewedEntries[key]
    if (!reviewedEntry) {
      entries[key] = {
        text: "",
        matn: "",
        sharh: -1,
        source: "no_sharh",
        scholar: "",
        bookName: "",
        attribution: "لا يوجد شرح موثق متاح حالياً",
        sourceHadithNumber: key.split(":").slice(-1)[0],
        match: {
          method: "placeholder",
          confidence: 0,
          reviewed: false,
        },
      }
      stats.missingReviewedEntry += 1
      continue
    }

    let { matn, sharh } = splitReviewedText(reviewedEntry.text || "", key)
    const adabOverride = adabOverrides[key]
    if (adabOverride) {
      sharh = cleanSharh(adabOverride.sharh || "")
    }
    if (key === "riyadussalihin:3:811") {
      sharh = extractClothingSkinsSharh(reviewedEntries)
    }
    if (key === "riyadussalihin:3:812") {
      sharh = extractClothingNewGarmentSharh(reviewedEntries)
    }
    const trusted = isTrustedForKey(key, adabOverride || reviewedEntry, sharh)
    const sharhIndex = trusted ? getPoolIndex(sharh, pool, hashes) : -1

    if (sharhIndex >= 0) stats.trustedSharh += 1
    else stats.untrustedHidden += 1

    const reviewedMatch = adabOverride?.match || reviewedEntry.match || {}
    entries[key] = {
      text: matn || reviewedMatch.matchedText || "",
      matn: matn || reviewedMatch.matchedText || "",
      sharh: sharhIndex,
      source: sharhIndex >= 0 ? "shamela_reviewed" : "no_sharh",
      scholar: sharhIndex >= 0 ? reviewedEntry.scholar || "ابن عثيمين" : "",
      sourceUrl: adabOverride?.sourceUrl || reviewedEntry.sourceUrl || SOURCE_URL,
      bookName: "شرح رياض الصالحين لابن عثيمين",
      attribution:
        sharhIndex >= 0
          ? "ابن عثيمين - شرح رياض الصالحين (المكتبة الشاملة، shamela.ws/book/9260)"
          : "لا يوجد شرح موثق متاح حالياً",
      sourceHadithNumber: reviewedEntry.sourceHadithNumber || key.split(":").slice(-1)[0],
      match: {
        method: reviewedMatch.method || "placeholder",
        confidence: Number(reviewedMatch.confidence || 0),
        reviewed: trusted || reviewedMatch.reviewed === true,
        matchedText: reviewedMatch.matchedText,
        reviewer: trusted && key.startsWith("riyadussalihin:1:")
          ? "book-adab-topic-validation"
          : trusted && key.startsWith("riyadussalihin:3:")
            ? "book-clothing-topic-validation"
            : reviewedMatch.reviewer,
      },
    }
  }

  const totalEntries = Object.keys(entries).length
  const output = {
    meta: {
      source: "shamela.ws",
      bookId: "9260",
      bookName: "شرح رياض الصالحين لابن عثيمين",
      scholar: "ابن عثيمين",
      totalEntries,
      entriesWithMatn: Object.values(entries).filter((entry) => (entry.matn || "").length > 20).length,
      entriesWithSharh: stats.trustedSharh,
      introSharh: Object.entries(entries).filter(([key, entry]) => key.includes(":introduction:") && entry.sharh >= 0).length,
      bookSharh: Object.entries(entries).filter(([key, entry]) => !key.includes(":introduction:") && entry.sharh >= 0).length,
      uniqueSharhTexts: pool.length,
      policy: "يعرض التطبيق شرح ابن عثيمين الموثق فقط من ملف المراجعة المبني على Shamela. المداخل غير المراجعة تخفى بدلاً من عرض شرح مشكوك فيه.",
      schemaVersion: 25,
      generatedAt: new Date().toISOString(),
      buildMethod: "compress-reviewed-shamela-entries",
      stats,
    },
    sharhPool: pool,
    entries,
  }

  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, "utf8")
  console.log(`Wrote ${OUTPUT_FILE}`)
  console.log(`Trusted sharh: ${stats.trustedSharh}/${totalEntries}`)
  console.log(`Hidden untrusted entries: ${stats.untrustedHidden}`)
  console.log(`Unique sharh texts: ${pool.length}`)
}

main()
