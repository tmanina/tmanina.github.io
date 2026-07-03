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
    .replace(/&#x([0-9a-f]+);/gi, (_, c) => String.fromCodePoint(parseInt(c, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

async function main() {
  console.log("Loading book 21543 (تطريز) pages...")
  const pages = {}
  for (let pid = 1; pid <= 1200; pid++) {
    try {
      const raw = JSON.parse(
        await readFile(path.join(".cache/shamela-21543", `${pid}.json`), "utf8")
      )
      if (raw.nass) {
        pages[pid] = htmlToText(raw.nass)
      }
    } catch {}
  }
  console.log(`Loaded ${Object.keys(pages).length} pages from book 21543`)

  // Build full text with page markers
  const pageList = Object.keys(pages).map(Number).sort((a, b) => a - b)
  const fullText = pageList.map(pid => `[PAGE:${pid}]${pages[pid]}`).join("\n")

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

  // Extract distinctive phrases from each missing hadith
  function extractPhrases(matn) {
    // Remove the hadith number prefix
    const clean = matn.replace(/^[\u0660-\u0669]{1,4}\s*[-ـ]\s*/, "")
    // Extract key phrases (words of 4+ chars)
    const words = clean.split(/\s+/).filter(w => w.length >= 4)
    // Create search phrases of 3-4 consecutive words
    const phrases = []
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = words.slice(i, i + 3).join(" ").replace(/[():،.]/g, "")
      if (phrase.length > 10) phrases.push(phrase)
    }
    // Also try 4-word phrases
    for (let i = 0; i < words.length - 3; i++) {
      const phrase = words.slice(i, i + 4).join(" ").replace(/[():،.]/g, "")
      if (phrase.length > 15) phrases.push(phrase)
    }
    return phrases
  }

  // Search for a phrase in the full text
  function searchPhrase(phrase) {
    const idx = fullText.indexOf(phrase)
    if (idx < 0) return null
    // Find which page this is on
    const before = fullText.slice(0, idx)
    const pageMatch = [...before.matchAll(/\[PAGE:(\d+)\]/g)].pop()
    if (!pageMatch) return null
    return +pageMatch[1]
  }

  // Extract sharh for a hadith from the book
  // The sharh appears around where the hadith text is mentioned
  function extractSharh(pageNum, hadithText) {
    // Get pages around the match
    const startPage = Math.max(pageNum - 1, pageList[0])
    const endPage = Math.min(pageNum + 5, pageList[pageList.length - 1])
    
    let text = ""
    for (let pid = startPage; pid <= endPage; pid++) {
      if (pages[pid]) text += "\n\n" + pages[pid]
    }

    // Find the sharh - it usually starts with "في هذا الحديث" or similar
    // or comes right after the hadith text
    const markers = [
      /في هذا الحديث[:\s]/,
      /فيه[:\s]/,
      /في الحديث[:\s]/,
      /معنى[:\s]/,
      /بيان[:\s]/,
      /وفيه[:\s]/,
      /المقصود[:\s]/,
      /شرح[:\s]/,
    ]

    // Find the hadith mention and extract text after it
    const hadithClean = hadithText.replace(/^[\u0660-\u0669]{1,4}\s*[-ـ]\s*/, "")
    const hadithIdx = text.indexOf(hadithClean.slice(0, 50))
    
    if (hadithIdx >= 0) {
      // Extract text after the hadith
      const after = text.slice(hadithIdx)
      
      // Find the sharh marker
      for (const marker of markers) {
        const markerIdx = after.search(marker)
        if (markerIdx >= 0 && markerIdx < 500) {
          let sharh = after.slice(markerIdx).trim()
          // Clean up - take up to next hadith marker or significant break
          const endMarkers = [
            /\[\d{3,4}\]/, // [number] - next hadith in book
            /باب\s/,
            /كتاب\s/,
          ]
          for (const end of endMarkers) {
            const endIdx = sharh.search(end)
            if (endIdx > 50 && endIdx < 2000) {
              sharh = sharh.slice(0, endIdx).trim()
            }
          }
          if (sharh.length > 50) return sharh
        }
      }

      // If no marker found, try to extract a reasonable chunk
      let sharh = after.slice(0, 2000).trim()
      // Find a good stopping point
      const stopPatterns = [
        /\[\d{3,4}\]/,
        /\nباب\s/,
        /\nكتاب\s/,
        /قال\s+(?:الشيخ|المؤلف|الحافظ|القاضي|ابن)/,
      ]
      for (const stop of stopPatterns) {
        const stopIdx = sharh.search(stop)
        if (stopIdx > 100) {
          sharh = sharh.slice(0, stopIdx).trim()
        }
      }
      if (sharh.length > 100) return sharh
    }

    return null
  }

  // For each missing hadith, search and extract sharh
  const found = []
  const notFound = []
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

  let searchCount = 0
  for (const { key, entry } of missing) {
    const phrases = extractPhrases(entry.matn)
    let sharh = null
    let matchPage = null

    for (const phrase of phrases) {
      const page = searchPhrase(phrase)
      if (page) {
        sharh = extractSharh(page, entry.matn)
        matchPage = page
        if (sharh) break
      }
    }

    if (sharh) {
      found.push({ key, sharh, page: matchPage })
      // Update entry
      d.entries[key].sharh = getIdx(sharh)
      d.entries[key].source = "tafrez_21543"
    } else {
      notFound.push(key)
    }

    searchCount++
    if (searchCount % 50 === 0) {
      console.log(`  Searched ${searchCount}/${missing.length} (found: ${found.length})`)
    }
  }

  console.log(`\nResults:`)
  console.log(`  Found sharh: ${found.length}/${missing.length}`)
  console.log(`  Not found: ${notFound.length}`)

  // Update pool and meta
  d.sharhPool = pool
  d.meta.sharhPool = pool
  d.meta.uniqueSharhTexts = pool.length
  d.meta.schemaVersion = 19

  // Recount
  let totalWithSharh = 0
  for (const entry of Object.values(d.entries)) {
    if (typeof entry.sharh === "number" && entry.sharh >= 0) totalWithSharh++
  }
  d.meta.entriesWithSharh = totalWithSharh

  // Show some examples
  console.log("\nExamples:")
  for (const f of found.slice(0, 5)) {
    console.log(`  ${f.key} (page ${f.page}): ${f.sharh.slice(0, 150)}...`)
  }

  // Coverage by book
  console.log("\nCoverage by book:")
  const BOOKS = [
    ["1", 680, 726], ["2", 727, 777], ["3", 778, 812], ["4", 813, 843],
    ["5", 844, 893], ["6", 894, 955], ["7", 956, 990], ["8", 991, 1267],
    ["9", 1268, 1270], ["10", 1271, 1284], ["11", 1285, 1375], ["12", 1376, 1392],
    ["13", 1393, 1396], ["14", 1397, 1407], ["15", 1408, 1464], ["16", 1465, 1510],
    ["17", 1511, 1807], ["18", 1808, 1868], ["19", 1869, 1896],
  ]
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
  console.log(`\nWrote updated data file`)
}

main().catch((e) => {
  console.error("Error:", e.message)
  process.exit(1)
})
