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

// Convert Arabic-Indic numerals to Western
function aiToWestern(s) {
  return s.replace(/[\u0660-\u0669]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x0660 + 48))
}

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

  // Build full text with page markers
  const fullText = pageList.map((pid) => `\n[PAGE:${pid}]\n${pages[pid]}`).join("")

  // Load data
  const d = JSON.parse(
    await readFile("public/data/riyad-uthaymeen-shamela-final.json", "utf8")
  )

  // Find entries that need better sharh (currently from tafrez or no_sharh)
  const needsReplacement = []
  for (const [key, entry] of Object.entries(d.entries)) {
    if (key.includes(":introduction:")) continue
    if (entry.source === "tafrez_21543" || entry.source === "no_sharh" || entry.sharh < 0) {
      if (!entry.matn || entry.matn.length < 20) continue
      needsReplacement.push({ key, entry })
    }
  }
  console.log(`Entries needing replacement: ${needsReplacement.length}`)

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

  function extractBestSharh(matnClean, phrases) {
    for (const phrase of phrases) {
      // Find all occurrences of this phrase in fullText
      let searchFrom = 0
      while (searchFrom < fullText.length) {
        const phraseIdx = fullText.indexOf(phrase, searchFrom)
        if (phraseIdx < 0) break

        // Find the page
        const before = fullText.slice(0, phraseIdx)
        const pageMatches = [...before.matchAll(/\[PAGE:(\d+)\]/g)]
        if (pageMatches.length === 0) {
          searchFrom = phraseIdx + 1
          continue
        }
        const matchPid = +pageMatches[pageMatches.length - 1][1]

        // Get context: from the phrase to end of current page + next 3 pages
        const startPidIdx = pageList.indexOf(matchPid)
        const endPidIdx = Math.min(startPidIdx + 3, pageList.length - 1)
        let context = ""
        for (let pi = startPidIdx; pi <= endPidIdx; pi++) {
          context += " " + pages[pageList[pi]]
        }

        // Find phrase in context
        const ctxPhraseIdx = context.indexOf(phrase)
        if (ctxPhraseIdx < 0) {
          searchFrom = phraseIdx + 1
          continue
        }

        // Take text AFTER the phrase
        const after = context.slice(ctxPhraseIdx)

        // Find the end of the hadith - look for narration markers
        // Common patterns: "رواه X" or "متفق عليه" or "متفق عليهما"
        const hadithEndPatterns = [
          /\.\s*رواه\s+(المسلم|البخاري|أبو داود|الترمذي|النسائي|ابن ماجه|أحمد|مالك|الدارمي|البيهقي)/,
          /\.\s*متفق\s+عليه/,
          /\.\s*متفق\s+عليهما/,
          /\.\s*وفي\s+رواية/,
          /\.\s*وقد\s+رواه/,
          /\.\s*ورواه/,
          /\.\s*وفي\s+روايته/,
          /\.\s*رواه\s+أيضا/,
        ]

        let hadithEndIdx = -1
        for (const p of hadithEndPatterns) {
          const m = after.search(p)
          if (m >= 10 && m < 600) {
            if (hadithEndIdx < 0 || m < hadithEndIdx) hadithEndIdx = m
          }
        }

        if (hadithEndIdx < 0) {
          // Try to find a period followed by text that looks like sharh
          const periodIdx = after.search(/\.\s/)
          if (periodIdx > 20 && periodIdx < 400) {
            hadithEndIdx = periodIdx + 1
          }
        }

        if (hadithEndIdx < 0) {
          searchFrom = phraseIdx + 1
          continue
        }

        // Now extract sharh - text between hadith end and next [number] or chapter
        const sharhStart = after.slice(hadithEndIdx).trim()

        // Find the end of the sharh
        const endPatterns = [
          /[\u0660-\u0669]{3,4}]\s/,
          /\[\d{3,4}\]/,
          /\nباب\s/,
          /\nكتاب\s/,
          /اللهم صل/,
          /اللهم صلى/,
        ]

        let sharh = sharhStart
        for (const ep of endPatterns) {
          const ei = sharh.search(ep)
          if (ei > 30 && ei < 2000) {
            sharh = sharh.slice(0, ei).trim()
          }
        }

        // Clean up
        sharh = sharh.replace(/\[[\u0660-\u0669\d]{3,4}\]/g, "").trim()
        sharh = sharh.replace(/\s+/g, " ").trim()

        if (sharh.length > 50) return sharh

        searchFrom = phraseIdx + 1
      }
    }
    return null
  }

  let foundCount = 0
  let notFoundCount = 0
  const notFound = []

  for (const { key, entry } of needsReplacement) {
    const matnClean = normalize(
      entry.matn.replace(/^[\u0660-\u0669]{1,4}\s*[-ـ]\s*/, "")
    )
    const words = matnClean.split(/\s+/).filter((w) => w.length >= 3)

    // Build distinctive phrases - prefer the unique part of the hadith
    const phrases = []

    // Try to find the hadith text (after narrator, before grading)
    // Look for "قال:" or "يقول:" or the actual hadith content
    const contentStart = matnClean.search(/(قال[:\s]|يقول[:\s])/)
    if (contentStart >= 0) {
      const contentWords = matnClean.slice(contentStart).split(/\s+/).filter((w) => w.length >= 3)
      // Use 5-word phrases from the hadith content
      for (let i = 0; i <= contentWords.length - 5; i++) {
        phrases.push(contentWords.slice(i, i + 5).join(" "))
      }
      for (let i = 0; i <= contentWords.length - 3; i++) {
        phrases.push(contentWords.slice(i, i + 3).join(" "))
      }
    }

    // Also try general 4-word phrases
    for (let i = 0; i <= words.length - 4; i++) {
      const phrase = words.slice(i, i + 4).join(" ")
      if (phrase.length >= 15) phrases.push(phrase)
    }

    const sharh = extractBestSharh(matnClean, phrases)

    if (sharh) {
      foundCount++
      entry.sharh = getIdx(sharh)
      entry.source = "tafrez_21543_v2"
    } else {
      notFoundCount++
      notFound.push(key)
      // Keep existing sharh if any
    }

    if ((foundCount + notFoundCount) % 50 === 0) {
      console.log(
        `  Processed ${foundCount + notFoundCount}/${needsReplacement.length} (found: ${foundCount})`
      )
    }
  }

  console.log(`\nResults: found=${foundCount}, not found=${notFoundCount}`)

  // Verify a few
  console.log("\nVerification:")
  for (const key of ["riyadussalihin:1:689", "riyadussalihin:1:690", "riyadussalihin:1:694", "riyadussalihin:1:700", "riyadussalihin:1:706"]) {
    const e = d.entries[key]
    const sharh = e.sharh >= 0 ? pool[e.sharh] : "none"
    console.log(`\n${key} (${e.source}):`)
    console.log(`  matn: ${e.matn?.slice(0, 80)}`)
    console.log(`  sharh: ${sharh.slice(0, 200)}`)
  }

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
  d.meta.schemaVersion = 20

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
