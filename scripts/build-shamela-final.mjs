#!/usr/bin/env node

import fs from "fs"
import path from "path"
import crypto from "crypto"

const { readFile, writeFile } = fs.promises

const CACHE_DIR = ".cache/shamela-all"
const FINAL_OUTPUT = "public/data/riyad-uthaymeen-shamela-final.json"

const BOOKS = [
  ["1", 680, 726], ["2", 727, 777], ["3", 778, 812], ["4", 813, 843],
  ["5", 844, 893], ["6", 894, 955], ["7", 956, 990], ["8", 991, 1267],
  ["9", 1268, 1270], ["10", 1271, 1284], ["11", 1285, 1375], ["12", 1376, 1392],
  ["13", 1393, 1396], ["14", 1397, 1407], ["15", 1408, 1464], ["16", 1465, 1510],
  ["17", 1511, 1807], ["18", 1808, 1868], ["19", 1869, 1896],
]

const validNumbers = new Set()
for (const [, start, end] of BOOKS) {
  for (let n = start; n <= end; n++) validNumbers.add(n)
}

const HADITH_RE = /(?:^|\n)\s*([\u0660-\u0669]{1,4})\s*[-ـ]/g

function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
}

function htmlToText(html) {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p\b[^>]*>/gi, "\n").replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
  return decodeEntities(text)
    .replace(/\r/g, "").replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n").replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n").trim()
}

function toWesternDigits(value) {
  const digits = { "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9" }
  return String(value).replace(/[٠-٩]/g, (d) => digits[d])
}

async function readPageRaw(pageId) {
  try { return JSON.parse(await readFile(path.join(CACHE_DIR, `${pageId}.json`), "utf8")) }
  catch { return null }
}

async function main() {
  console.log("Building Shamela data v17 (full sharh with dedup)...")

  // Load all pages
  console.log("Loading pages...")
  const pages = {}
  for (let pid = 1; pid <= 3784; pid++) {
    const raw = await readPageRaw(pid)
    if (raw) {
      pages[pid] = {
        text: htmlToText(raw.nass || ""),
        nextId: raw.nextId ? Number(raw.nextId) : null,
      }
    }
  }
  console.log(`Loaded ${Object.keys(pages).length} pages`)

  // Sharh pool
  const sharhPool = []
  const sharhHashToIdx = new Map()
  function getSharhIdx(text) {
    if (!text) return -1
    const h = crypto.createHash("md5").update(text).digest("hex")
    if (!sharhHashToIdx.has(h)) {
      sharhHashToIdx.set(h, sharhPool.length)
      sharhPool.push(text)
    }
    return sharhHashToIdx.get(h)
  }

  // Introduction sharh
  console.log("Introduction sharh...")
  const introMarkers = []
  for (let pid = 1; pid < 680; pid++) {
    if (pages[pid]?.text.includes("الشَّرْحُ")) introMarkers.push(pid)
  }
  console.log(`  Markers: ${introMarkers.length}`)

  const introEntryToIdx = {}
  for (let mi = 0; mi < introMarkers.length; mi++) {
    const startPid = introMarkers[mi]
    const page = pages[startPid]
    if (!page) continue
    const pos = page.text.indexOf("الشَّرْحُ")
    if (pos < 0) continue
    let sharh = page.text.slice(pos).replace(/^\[?الشَّرْحُ\]?\s*/i, "").trim()

    const endPid = mi + 1 < introMarkers.length ? introMarkers[mi + 1] - 1 : 679
    let cur = startPid
    while (cur < endPid) {
      const nxt = pages[cur]?.nextId
      if (!nxt || nxt > endPid) break
      const np = pages[nxt]
      if (!np) break
      sharh += "\n\n" + np.text
      cur = nxt
    }
    const idx = getSharhIdx(sharh)
    for (let p = startPid; p <= cur; p++) introEntryToIdx[p] = idx
  }
  console.log(`  Entries: ${Object.keys(introEntryToIdx).length}`)

  // Book sharh
  console.log("Book sharh...")
  const bookSharhPages = []
  for (let pid = 680; pid <= 3784; pid++) {
    if (pages[pid]?.text.includes("الشَّرْحُ")) bookSharhPages.push(pid)
  }

  const bookSections = []
  for (const startPid of bookSharhPages) {
    const page = pages[startPid]
    if (!page) continue
    const pos = page.text.indexOf("الشَّرْحُ")
    if (pos < 0) continue
    const before = page.text.slice(0, pos)
    const hadithsBefore = []
    const re = /(?:^|\n)\s*([\u0660-\u0669]{1,4})\s*[-ـ]/g
    let m
    while ((m = re.exec(before)) !== null) {
      const num = Number(toWesternDigits(m[1]))
      if (validNumbers.has(num)) hadithsBefore.push(num)
    }
    if (!hadithsBefore.length) continue
    const lastHadith = Math.max(...hadithsBefore)
    let sharh = page.text.slice(pos).replace(/^\[?الشَّرْحُ\]?\s*/i, "").trim()

    let cur = startPid
    while (true) {
      const curPage = pages[cur]
      if (!curPage?.nextId) break
      const nxt = pages[curPage.nextId]
      if (!nxt) break
      if (nxt.text.includes("الشَّرْحُ")) {
        const nPos = nxt.text.indexOf("الشَّرْحُ")
        const beforeNxt = nxt.text.slice(0, nPos).trim()
        if (beforeNxt) sharh += "\n\n" + beforeNxt
        break
      }
      const stripped = nxt.text.trimStart()
      const fm = /^[\u0660-\u0669]{1,4}\s*[-ـ]/.exec(stripped)
      if (fm) {
        const fn = Number(toWesternDigits(fm[1]))
        if (validNumbers.has(fn)) break
      }
      sharh += "\n\n" + nxt.text
      cur = curPage.nextId
    }
    bookSections.push({ sharhIdx: getSharhIdx(sharh), lastHadith, startPage: startPid })
  }

  bookSections.sort((a, b) => a.lastHadith - b.lastHadith)
  const hadithToIdx = new Map()
  for (let i = 0; i < bookSections.length; i++) {
    const start = i > 0 ? bookSections[i - 1].lastHadith + 1 : 680
    for (let n = start; n <= bookSections[i].lastHadith; n++) {
      hadithToIdx.set(n, bookSections[i].sharhIdx)
    }
  }
  console.log(`  Sections: ${bookSections.length}, Hadiths: ${hadithToIdx.size}`)

  // Extract matn
  console.log("Extracting matn...")
  const shamelaHadiths = new Map()
  for (let pid = 680; pid <= 3784; pid++) {
    const page = pages[pid]
    if (!page) continue
    const re = /(?:^|\n)\s*([\u0660-\u0669]{1,4})\s*[-ـ]/g
    const markers = []
    let m
    while ((m = re.exec(page.text)) !== null) markers.push(m)
    for (let i = 0; i < markers.length; i++) {
      const num = Number(toWesternDigits(markers[i][1]))
      if (!validNumbers.has(num)) continue
      const start = markers[i].index
      const end = i + 1 < markers.length ? markers[i + 1].index : page.text.length
      shamelaHadiths.set(num, page.text.slice(start, end).trim())
    }
  }
  console.log(`  Matn: ${shamelaHadiths.size}`)

  // Build entries
  console.log("Building entries...")
  const entries = {}

  for (let i = 1; i <= 679; i++) {
    const text = pages[i]?.text || ""
    entries[`riyadussalihin:introduction:${i}`] = {
      text, matn: text, sharh: introEntryToIdx[i] ?? -1, source: "shamela_intro",
    }
  }

  for (const [bookNum, start, end] of BOOKS) {
    for (let n = start; n <= end; n++) {
      entries[`riyadussalihin:${bookNum}:${n}`] = {
        text: shamelaHadiths.get(n) || "",
        matn: shamelaHadiths.get(n) || "",
        sharh: hadithToIdx.get(n) ?? -1,
        source: "section",
      }
    }
  }

  // Stats
  const total = Object.keys(entries).length
  const withMatn = Object.values(entries).filter(e => e.matn?.length > 20).length
  const withSharh = Object.values(entries).filter(e => typeof e.sharh === "number" && e.sharh >= 0).length
  const introSharh = Object.entries(entries).filter(([k, e]) => k.includes(":introduction:") && typeof e.sharh === "number" && e.sharh >= 0).length
  const bookSharh = Object.entries(entries).filter(([k, e]) => !k.includes(":introduction:") && typeof e.sharh === "number" && e.sharh >= 0).length

  console.log(`\nFINAL: Total=${total}, Matn=${withMatn}, Sharh=${withSharh} (intro=${introSharh}/679, books=${bookSharh}/1217)`)
  console.log(`Unique sharh texts: ${sharhPool.length}`)

  const totalChars = sharhPool.reduce((s, t) => s + t.length, 0)
  console.log(`Total sharh text: ${totalChars.toLocaleString()} chars (${Math.round(totalChars / 1024)} KB)`)

  console.log("\nBy book:")
  for (const [bn, s, e] of BOOKS) {
    let bm = 0, bs = 0
    for (let n = s; n <= e; n++) {
      const entry = entries[`riyadussalihin:${bn}:${n}`]
      if (entry?.matn?.length > 20) bm++
      if (typeof entry?.sharh === "number" && entry.sharh >= 0) bs++
    }
    console.log(`  ${bn}: ${bm}/${e - s + 1} matn, ${bs} sharh`)
  }

  const output = {
    meta: {
      source: "shamela.ws",
      bookId: "9260",
      bookName: "شرح رياض الصالحين لابن عثيمين",
      scholar: "ابن عثيمين",
      totalEntries: total,
      entriesWithMatn: withMatn,
      entriesWithSharh: withSharh,
      introSharh,
      bookSharh,
      uniqueSharhTexts: sharhPool.length,
      policy: "المتن والشرح الكامل من Shamela. الشرح يتبع حتى بداية الحديث/الباب التالي.",
      schemaVersion: 17,
      generatedAt: new Date().toISOString(),
    },
    sharhPool,
    entries,
  }

  await writeFile(FINAL_OUTPUT, JSON.stringify(output, null, 2), "utf8")
  console.log(`\nWrote ${FINAL_OUTPUT}`)
}

main().catch((err) => { console.error("Error:", err.message); process.exit(1) })
