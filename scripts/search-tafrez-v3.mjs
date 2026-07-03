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

function normalize(s) {
  return stripDiacritics(s)
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
  // Load book 21543
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

  // Load data (restore from v18 first)
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

  let foundCount = 0
  const notFound = []

  for (const { key, entry } of missing) {
    const matnClean = normalize(
      entry.matn.replace(/^[\u0660-\u0669]{1,4}\s*[-ـ]\s*/, "")
    )
    const words = matnClean.split(/\s+/).filter((w) => w.length >= 3)

    let sharh = null

    // Search with phrases of decreasing length
    for (const phraseLen of [7, 6, 5, 4, 3]) {
      if (sharh) break
      for (let i = 0; i <= words.length - phraseLen; i++) {
        const phrase = words.slice(i, i + phraseLen).join(" ")
        if (phrase.length < 15) continue

        // Search pages
        let matchedPid = null
        for (const pid of pageList) {
          if (pages[pid].includes(phrase)) {
            matchedPid = pid
            break
          }
        }
        if (!matchedPid) continue

        // Extract sharh from matched page + following pages
        const startIdx = pageList.indexOf(matchedPid)
        const endIdx = Math.min(startIdx + 8, pageList.length - 1)

        let text = ""
        for (let pi = startIdx; pi <= endIdx; pi++) {
          text += "\n\n" + pages[pageList[pi]]
        }

        // Find hadith in text
        const searchStart = normalize(matnClean.slice(0, 60))
        const hadithIdx = text.indexOf(searchStart)
        if (hadithIdx < 0) continue

        const after = text.slice(hadithIdx + searchStart.length)

        // Look for sharh markers
        const markers = [
          /في هذا الحديث/,
          /فيه /,
          /في الحديث/,
          /مئنة/,
          /الحديث دليل/,
          /من فوائد/,
          /فائدة/,
          /وجهان/,
          /قوله/,
          /أقوال/,
          /معنى/,
          /بيان/,
          /وفيه/,
          /المقصود/,
          /شرح/,
          /اختلف/,
          /قال الشارح/,
          /في سبب/,
          /من أنواع/,
        ]

        let bestStart = -1
        for (const m of markers) {
          const mi = after.search(m)
          if (mi >= 10 && mi < 800) {
            if (bestStart < 0 || mi < bestStart) bestStart = mi
          }
        }

        if (bestStart >= 0) {
          let s = after.slice(bestStart).trim()
          // End at next Arabic-Indic number [١٢٣] or Western [123] or chapter heading
          const endPatterns = [
            /[\u0660-\u0669]{3,4}]\s/,
            /\[\d{3,4}\]/,
            /\nباب\s/,
            /\nكتاب\s/,
            /\n-\s*باب/,
            /اللهم صل/,
            /اللهم صلى/,
          ]
          for (const ep of endPatterns) {
            const ei = s.search(ep)
            if (ei > 50 && ei < 3000) {
              s = s.slice(0, ei).trim()
            }
          }
          // Remove [number] markers
          s = s.replace(/\[[\u0660-\u0669\d]{3,4}\]/g, "").trim()

          if (s.length > 80) {
            sharh = s
            break
          }
        }
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
  console.log("\nExamples:")
  let ex = 0
  for (const { key, entry } of missing) {
    if (typeof entry.sharh === "number" && entry.sharh >= 0) {
      console.log(`  ${key}: ${pool[entry.sharh].slice(0, 200)}`)
      if (++ex >= 5) break
    }
  }

  console.log("\nNot found (first 10):")
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
