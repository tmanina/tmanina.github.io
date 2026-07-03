#!/usr/bin/env node
import fs from "fs"
import path from "path"
import crypto from "crypto"

const { readFile, writeFile } = fs.promises

function htmlToText(h) {
  return h
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p\b[^>]*>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, c) => String.fromCodePoint(+c))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function stripDiacritics(s) {
  return s.replace(
    /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g,
    ""
  )
}

// BOOKS array for reference
const BOOKS = [
  ["1", 680, 726], ["2", 727, 777], ["3", 778, 812], ["4", 813, 843],
  ["5", 844, 893], ["6", 894, 955], ["7", 956, 990], ["8", 991, 1267],
  ["9", 1268, 1270], ["10", 1271, 1284], ["11", 1285, 1375], ["12", 1376, 1392],
  ["13", 1393, 1396], ["14", 1397, 1407], ["15", 1408, 1464], ["16", 1465, 1510],
  ["17", 1511, 1807], ["18", 1808, 1868], ["19", 1869, 1896],
]

async function main() {
  console.log("Loading book 21543 (تطريز رياض الصالحين)...")
  const pages = {}
  for (let pid = 1; pid <= 1200; pid++) {
    try {
      const raw = JSON.parse(
        await readFile(path.join(".cache/shamela-21543", `${pid}.json`), "utf8")
      )
      if (raw.nass) pages[pid] = htmlToText(raw.nass)
    } catch {}
  }
  console.log(`Loaded ${Object.keys(pages).length} pages`)

  // Build page list and text index with diacritics stripped
  const pageList = Object.keys(pages).map(Number).sort((a, b) => a - b)

  // Build a map: hadith_number_in_book -> page
  // Book 21543 uses [number] format
  const hadithToPage = new Map()
  for (const pid of pageList) {
    const text = pages[pid]
    const matches = text.match(/\[(\d{3,4})\]/g)
    if (matches) {
      for (const m of matches) {
        const num = parseInt(m.replace(/[\[\]]/g, ""))
        if (num >= 1 && num <= 2000 && !hadithToPage.has(num)) {
          hadithToPage.set(num, pid)
        }
      }
    }
  }
  console.log(`Found ${hadithToPage.size} hadith numbers in book 21543`)

  // Load current data
  const d = JSON.parse(
    await readFile("public/data/riyad-uthaymeen-shamela-final.json", "utf8")
  )

  // Find missing hadiths
  const missing = []
  for (const [key, entry] of Object.entries(d.entries)) {
    if (key.includes(":introduction:")) continue
    if (typeof entry.sharh === "number" && entry.sharh >= 0) continue
    if (!entry.matn || entry.matn.length < 20) continue
    missing.push({ key, entry })
  }
  console.log(`\nMissing sharh: ${missing.length} hadiths`)

  // Strategy 1: Match by hadith number in book 21543
  // The numbers in book 21543 may not match our Riyadh numbers directly
  // But some do (like [700], [715])

  // Strategy 2: Match by text search with stripped diacritics
  // Build a full text with page markers
  const fullText = pageList
    .map((pid) => `[PAGE:${pid}]${stripDiacritics(pages[pid])}`)
    .join("\n")

  // Extract sharh for a hadith
  function extractSharh(pageNum, hadithCleanText) {
    // Get a window of pages
    const startIdx = pageList.indexOf(pageNum)
    const endIdx = Math.min(startIdx + 6, pageList.length - 1)

    let text = ""
    for (let i = startIdx; i <= endIdx; i++) {
      text += "\n\n" + stripDiacritics(pages[pageList[i]])
    }

    // Find the hadith text
    const hadithStart = hadithCleanText.slice(0, 60)
    const idx = text.indexOf(hadithStart)

    if (idx >= 0) {
      const after = text.slice(idx)

      // Look for sharh markers
      const sharhMarkers = [
        /في هذا الحديث/,
        /فيه[:\s]/,
        /في الحديث/,
        /معنى/,
        /بيان/,
        /وفيه/,
        /المقصود/,
        /شرح/,
        /فائدة/,
        /من فوائد/,
        /اختلف العلماء/,
        /وجهان/,
        /مذهب/,
        /قوله/,
        /أقوال/,
      ]

      for (const marker of sharhMarkers) {
        const markerIdx = after.search(marker)
        if (markerIdx >= 20 && markerIdx < 800) {
          let sharh = after.slice(markerIdx).trim()

          // Find the end - next [number] marker or chapter heading
          const endPatterns = [
            /\[\d{3,4}\]/,
            /\nباب\s/,
            /\nكتاب\s/,
            /\n-[ \t]*باب/,
            /اللهم صل/,
          ]
          for (const end of endPatterns) {
            const endIdx = sharh.search(end)
            if (endIdx > 50 && endIdx < 3000) {
              sharh = sharh.slice(0, endIdx).trim()
            }
          }

          // Remove [number] markers
          sharh = sharh.replace(/\[\d{3,4}\]/g, "").trim()

          if (sharh.length > 80) return sharh
        }
      }
    }

    return null
  }

  // Search for each missing hadith
  const pool = [...d.sharhPool]
  const hashToIdx = new Map()
  for (let i = 0; i < pool.length; i++) {
    const h = crypto.createHash("md5").update(pool[i]).digest("hex")
    hashToIdx.set(h, i)
  }
  function getIdx(text) {
    if (!text) return -1
    const h = crypto.createHash("md5").update(text).digest("hex")
    if (!hashToIdx.has(h)) {
      hashToIdx.set(h, pool.length)
      pool.push(text)
    }
    return hashToIdx.get(h)
  }

  let foundCount = 0
  let notFoundCount = 0
  const notFoundKeys = []

  for (const { key, entry } of missing) {
    const matnClean = stripDiacritics(
      entry.matn.replace(/^[\u0660-\u0669]{1,4}\s*[-ـ]\s*/, "")
    )

    // Try to find distinctive phrase from the hadith
    const words = matnClean.split(/\s+/).filter((w) => w.length >= 3)

    let sharh = null

    // Try multiple phrase lengths
    for (const phraseLen of [8, 6, 5, 4, 3]) {
      if (sharh) break
      for (let i = 0; i <= words.length - phraseLen; i++) {
        const phrase = words.slice(i, i + phraseLen).join(" ")
        if (phrase.length < 15) continue

        const idx = fullText.indexOf(phrase)
        if (idx < 0) continue

        // Find which page
        const before = fullText.slice(0, idx)
        const pageMatches = [...before.matchAll(/\[PAGE:(\d+)\]/g)]
        if (pageMatches.length === 0) continue
        const pageNum = +pageMatches[pageMatches.length - 1][1]

        sharh = extractSharh(pageNum, matnClean)
        if (sharh) {
          foundCount++
          entry.sharh = getIdx(sharh)
          entry.source = "tafrez_21543"
          break
        }
      }
    }

    if (!sharh) {
      notFoundCount++
      notFoundKeys.push(key)
    }
  }

  console.log(`\nResults:`)
  console.log(`  Found: ${foundCount}/${missing.length}`)
  console.log(`  Not found: ${notFoundCount}`)

  // Update meta
  d.sharhPool = pool
  d.meta.sharhPool = pool
  d.meta.uniqueSharhTexts = pool.length
  d.meta.schemaVersion = 19

  let totalWithSharh = 0
  for (const entry of Object.values(d.entries)) {
    if (typeof entry.sharh === "number" && entry.sharh >= 0) totalWithSharh++
  }
  d.meta.entriesWithSharh = totalWithSharh

  // Show examples
  console.log("\nExamples of newly found:")
  let exCount = 0
  for (const { key, entry } of missing) {
    if (typeof entry.sharh === "number" && entry.sharh >= 0) {
      console.log(`  ${key}: ${pool[entry.sharh].slice(0, 150)}...`)
      if (++exCount >= 8) break
    }
  }

  console.log("\nStill missing (first 10):")
  notFoundKeys.slice(0, 10).forEach((k) => {
    const e = d.entries[k]
    console.log(`  ${k}: ${e.matn?.slice(0, 80)}`)
  })

  // Coverage
  console.log("\nCoverage by book:")
  for (const [bn, s, e] of BOOKS) {
    let withSharh = 0
    for (let n = s; n <= e; n++) {
      const entry = d.entries[`riyadussalihin:${bn}:${n}`]
      if (entry && typeof entry.sharh === "number" && entry.sharh >= 0) withSharh++
    }
    console.log(`  ${bn}: ${withSharh}/${e - s + 1}`)
  }

  await writeFile(
    "public/data/riyad-uthaymeen-shamela-final.json",
    JSON.stringify(d, null, 2),
    "utf8"
  )
  console.log(`\nWrote updated data (pool: ${pool.length} texts)`)
}

main().catch((e) => {
  console.error("Error:", e.message)
  process.exit(1)
})
