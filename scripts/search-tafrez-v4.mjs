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

function normalize(s) {
  return s
    .replace(
      /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g,
      ""
    )
    .replace(/[-–—]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

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
      if (raw.nass) pages[pid] = normalize(htmlToText(raw.nass))
    } catch {}
  }
  const pageList = Object.keys(pages).map(Number).sort((a, b) => a - b)
  console.log(`Loaded ${pageList.length} pages`)

  // Load data
  const d = JSON.parse(
    await readFile("public/data/riyad-uthaymeen-shamela-final.json", "utf8")
  )

  // Find missing
  const missing = []
  for (const [key, entry] of Object.entries(d.entries)) {
    if (key.includes(":introduction:")) continue
    if (typeof entry.sharh === "number" && entry.sharh >= 0) continue
    if (!entry.matn || entry.matn.length < 20) continue
    missing.push({ key, entry })
  }
  console.log(`Missing: ${missing.length}`)

  // Pool
  const pool = [...d.sharhPool]
  const hashToIdx = new Map()
  for (let i = 0; i < pool.length; i++) {
    hashToIdx.set(crypto.createHash("md5").update(pool[i]).digest("hex"), i)
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

  // Extract distinctive phrases from hadith (skip common words)
  function getDistinctivePhrases(matnClean) {
    const words = matnClean.split(/\s+/).filter((w) => w.length >= 3)
    const phrases = []

    // Use 4-word sliding window, skip common openings
    for (let i = 0; i <= words.length - 4; i++) {
      const phrase = words.slice(i, i + 4).join(" ")
      if (phrase.length < 15) continue
      // Skip phrases starting with common hadith openings
      if (i === 0 && /^(عن|وعن|أن|قال)/.test(phrase)) continue
      phrases.push(phrase)
    }

    // Also try longer phrases for better specificity
    for (let i = 0; i <= words.length - 6; i++) {
      const phrase = words.slice(i, i + 6).join(" ")
      if (phrase.length >= 25) phrases.push(phrase)
    }

    return phrases
  }

  // Extract sharh from a page context
  function extractSharhFromContext(pages, startPid, matchedPhrase) {
    const startIdx = pageList.indexOf(startPid)
    if (startIdx < 0) return null

    // Only use this page and next 2 pages (sharh is usually on same page or next)
    const endIdx = Math.min(startIdx + 2, pageList.length - 1)
    let text = ""
    for (let pi = startIdx; pi <= endIdx; pi++) {
      text += "\n\n" + pages[pageList[pi]]
    }

    // Find the matched phrase
    const phraseIdx = text.indexOf(matchedPhrase)
    if (phraseIdx < 0) return null

    // Look for sharh AFTER the phrase (within 800 chars - sharh should be close)
    const afterPhrase = text.slice(phraseIdx + matchedPhrase.length, phraseIdx + matchedPhrase.length + 800)

    // Sharh markers - look for the first one after the hadith
    const markers = [
      /الحديث[:\s]+/,
      /في هذا الحديث/,
      /فيه[:\s]+/,
      /في الحديث/,
      /مئنة/,
      /من فوائد/,
      /فائدة/,
      /وجهان/,
      /قوله[:\s]+/,
      /أقوال/,
      /معنى/,
      /بيان/,
      /وفيه/,
      /المقصود/,
      /قال الشارح/,
      /في سبب/,
      /من أنواع/,
      /المراد/,
      /الشرح/,
      /التفسير/,
      /رواه/,
      /متفق عليه/,
      /روي/,
      /وهو/,
      /وهو بفتح/,
      /وإنما/,
    ]

    let bestStart = -1
    for (const m of markers) {
      const mi = afterPhrase.search(m)
      if (mi >= 5 && mi < 400) {
        if (bestStart < 0 || mi < bestStart) bestStart = mi
      }
    }

    if (bestStart < 0) return null

    let sharh = afterPhrase.slice(bestStart).trim()

    // Find the end - next Arabic-Indic number [١٢٣] or Western number
    const endPatterns = [
      /[\u0660-\u0669]{3,4}]\s/,
      /\[\d{3,4}\]/,
      /\nباب\s/,
      /\nكتاب\s/,
      /اللهم صل/,
      /اللهم صلى/,
    ]
    for (const ep of endPatterns) {
      const ei = sharh.search(ep)
      if (ei > 30 && ei < 2000) {
        sharh = sharh.slice(0, ei).trim()
      }
    }
    // Remove [number] markers
    sharh = sharh.replace(/\[[\u0660-\u0669\d]{3,4}\]/g, "").trim()

    // Remove trailing "رواه X" if it's a narration reference (keep it if it's part of sharh)
    // Clean up
    sharh = sharh.replace(/\s+/g, " ").trim()

    return sharh.length > 50 ? sharh : null
  }

  let foundCount = 0
  const notFound = []

  for (const { key, entry } of missing) {
    const matnClean = normalize(
      entry.matn.replace(/^[\u0660-\u0669]{1,4}\s*[-ـ]\s*/, "")
    )
    const phrases = getDistinctivePhrases(matnClean)

    let sharh = null

    for (const phrase of phrases) {
      if (sharh) break

      // Search all pages for this phrase
      for (const pid of pageList) {
        if (!pages[pid].includes(phrase)) continue

        // Found the phrase on this page - try to extract sharh
        sharh = extractSharhFromContext(pages, pid, phrase)
        if (sharh) break
      }
    }

    if (sharh) {
      foundCount++
      entry.sharh = getIdx(sharh)
      entry.source = "tafrez_21543"
    } else {
      notFound.push(key)
    }

    if ((foundCount + notFound.length) % 50 === 0) {
      console.log(
        `  Processed ${foundCount + notFound.length}/${missing.length} (found: ${foundCount})`
      )
    }
  }

  console.log(`\nResults: found=${foundCount}, not found=${notFound.length}`)

  // Show examples
  console.log("\nExamples of newly found:")
  let ex = 0
  for (const { key, entry } of missing) {
    if (typeof entry.sharh === "number" && entry.sharh >= 0) {
      console.log(`  ${key}: ${pool[entry.sharh].slice(0, 200)}`)
      if (++ex >= 5) break
    }
  }

  console.log("\nStill not found (first 10):")
  notFound.slice(0, 10).forEach((k) => {
    console.log(`  ${k}: ${d.entries[k].matn?.slice(0, 80)}`)
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

  // Update meta
  d.sharhPool = pool
  d.meta.sharhPool = pool
  d.meta.uniqueSharhTexts = pool.length
  d.meta.schemaVersion = 19

  let totalWithSharh = 0
  for (const e of Object.values(d.entries)) {
    if (typeof e.sharh === "number" && e.sharh >= 0) totalWithSharh++
  }
  d.meta.entriesWithSharh = totalWithSharh

  await writeFile(
    "public/data/riyad-uthaymeen-shamela-final.json",
    JSON.stringify(d, null, 2),
    "utf8"
  )
  console.log(`\nWrote data. Total with sharh: ${totalWithSharh}`)
}

main().catch((e) => {
  console.error("Error:", e.message)
  process.exit(1)
})
