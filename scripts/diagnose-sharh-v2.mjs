#!/usr/bin/env node
/**
 * diagnose-sharh-v2.mjs
 *
 * Refined diagnostic: finds SPECIFIC misalignment errors by:
 * 1. Detecting sharh groups that span across different book chapters
 * 2. Detecting sharh texts that reference topics not in the hadith
 * 3. Cross-referencing with riyad-uthaymeen-sharh.json for specific example cases
 * 4. Searching for known problematic patterns
 */

import fs from "fs"

const FINAL_FILE = "public/data/riyad-uthaymeen-shamela-final.json"
const VERIFIED_FILE = "public/data/riyad-uthaymeen-sharh.json"

const BOOK_NAMES = {
  "introduction": "المقدمات", "1": "كتاب الأدب", "2": "كتاب الأذكار",
  "3": "كتاب الآداب", "4": "كتاب الطعام", "5": "كتاب اللباس",
  "6": "كتاب النوم", "7": "كتاب السلام", "8": "كتاب العزلة",
  "9": "كتاب السفر", "10": "كتاب الفضائل", "11": "كتاب الاعتكاف",
  "12": "كتاب الحج", "13": "كتاب الجهاد", "14": "كتاب العلم",
  "15": "كتاب الدعاء", "16": "كتاب الأذكار", "17": "كتاب الأدعية",
  "18": "كتاب التوبة", "19": "كتاب الرقائق",
}

function loadJSON(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")) }
  catch { return null }
}

function normalize(text) {
  if (!text) return ""
  return text
    .replace(/[ًٌٍَُِّ~ْ]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ؤ/g, "و").replace(/ئ/g, "ي")
    .replace(/ة/g, "ه").replace(/ى/g, "ي")
    .replace(/[^\u0600-\u06FF\s]/g, " ")
    .replace(/\s+/g, " ").trim()
}

function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗")
  console.log("║  تشخيص دقيق لأخطاء مطابقة الشرح - رياض الصالحين        ║")
  console.log("╚══════════════════════════════════════════════════════════════╝\n")

  const finalData = loadJSON(FINAL_FILE)
  if (!finalData) { console.error(`ERROR: Could not load ${FINAL_FILE}`); process.exit(1) }

  const finalEntries = finalData.entries || {}
  const sharhPool = finalData.sharhPool || []
  const verifiedData = loadJSON(VERIFIED_FILE)
  const verifiedEntries = verifiedData?.entries || {}

  console.log(`إجمالي الأحاديث: ${Object.keys(finalEntries).length}`)
  console.log(`نصوص الشرح الفريدة: ${sharhPool.length}`)
  console.log(`الإدخالات المرجعية: ${Object.keys(verifiedEntries).length}\n`)

  // ==============================================================
  // ANALYSIS 1: Sharh groups that cross book boundaries
  // ==============================================================
  console.log("━━━ [1] مجموعات الشرح التي تعبر حدود الكتب ━━━\n")

  const sharhToBooks = {} // sharhIdx → Set of book numbers
  const sharhToKeys = {} // sharhIdx → [keys]

  for (const [key, entry] of Object.entries(finalEntries)) {
    const match = key.match(/riyadussalihin:(introduction|\d+):(\d+)/)
    if (!match) continue
    const bookNum = match[1]
    const sharhIdx = entry.sharh
    if (typeof sharhIdx !== "number" || sharhIdx < 0) continue

    if (!sharhToBooks[sharhIdx]) sharhToBooks[sharhIdx] = new Set()
    sharhToBooks[sharhIdx].add(bookNum)

    if (!sharhToKeys[sharhIdx]) sharhToKeys[sharhIdx] = []
    sharhToKeys[sharhIdx].push({ key, bookNum, num: parseInt(match[2]) })
  }

  let crossBookCount = 0
  for (const [idx, books] of Object.entries(sharhToBooks)) {
    if (books.size > 1) {
      crossBookCount++
      const keys = sharhToKeys[idx]
      const hashes = [...keys]
      const sharhText = sharhPool[parseInt(idx)] || ""
      console.log(`  [${idx}] ${keys.length} أحاديث في ${books.size} كتب مختلفة:`)
      console.log(`       الكتب: ${[...books].map(b => `${b} (${BOOK_NAMES[b] || b})`).join(", ")}`)
      console.log(`       الأرقام: ${keys.map(k => k.num).slice(0, 8).join(", ")}${keys.length > 8 ? "..." : ""}`)
      console.log(`       بداية الشرح: ${sharhText.slice(0, 120)}...\n`)
    }
  }
  console.log(`  إجمالي مجموعات الشرح العابرة للكتب: ${crossBookCount}\n`)

  // ==============================================================
  // ANALYSIS 2: Check for specific known misalignment patterns
  // ==============================================================
  console.log("━━━ [2] البحث عن أخطاء المطابقة المعروفة ━━━\n")

  // Find the introduction entries and check their sharh
  const introSharhIssues = []
  for (const [key, entry] of Object.entries(finalEntries)) {
    if (!key.includes(":introduction:")) continue
    const sharhIdx = entry.sharh
    if (typeof sharhIdx !== "number" || sharhIdx < 0) continue
    const sharhText = sharhPool[sharhIdx] || ""

    // Check if the matn mentions a specific topic but the sharh is about something else
    const matn = entry.matn || entry.text || ""

    // Known problematic patterns
    if (matn.includes("جبريل") || matn.includes("المراقبة") || matn.includes("الإيمان") && matn.includes("الإسلام") && matn.includes("الإحسان")) {
      if (sharhText.includes("قتال") || sharhText.includes("جهاد") || sharhText.includes("ميزان")) {
        console.log(`⚠️  مشكلة المراقبة/جبريل:`)
        console.log(`   الحديث: ${key}`)
        console.log(`   المتن: ${matn.slice(0, 100)}...`)
        console.log(`   الشرح حالياً: ${sharhText.slice(0, 200)}...\n`)
        introSharhIssues.push({ key, type: "jibril-fighting-mismatch", sharhIdx })
      }
    }

    // Check for باب in matn vs sharh topic
    if (matn.includes("باب") && !sharhText.includes("باب")) {
      // Could be okay, but check more carefully
    }
  }

  // ==============================================================
  // ANALYSIS 3: Check the verified entries to find specific mismatches
  // ==============================================================
  console.log("━━━ [3] مقارنة مع المرجع اليدوي (riyad-uthaymeen-sharh.json) ━━━\n")

  let totalCompared = 0
  let clearMismatches = 0
  const mismatchExamples = []

  for (const [key, vEntry] of Object.entries(verifiedEntries)) {
    const fEntry = finalEntries[key]
    if (!fEntry) continue

    const sharhIdx = fEntry.sharh
    if (typeof sharhIdx !== "number" || sharhIdx < 0) continue

    const verifiedText = vEntry.text || ""
    const finalText = sharhPool[sharhIdx] || ""
    if (!verifiedText || !finalText) continue

    totalCompared++

    // Normalize and compare
    const vNorm = normalize(verifiedText).slice(0, 200)
    const fNorm = normalize(finalText).slice(0, 200)

    // Extract key content words (ignore common words)
    const stopWords = new Set([
      "قال", "على", "الى", "عن", "في", "من", "هذا", "هذه", "كان", "كانت",
      "الله", "رسول", "النبي", "صلى", "عليه", "وسلم", "رضي", "عنه",
      "الحديث", "باب", "كتاب", "ان", "ما", "لا", "الا", "أو", "انما",
      "فيه", "علي", "الى", "حتى", "اذا", "اذا", "ذلك", "تلك", "هل",
      "بعد", "قبل", "عند", "مع", "بين", "كل", "بعض", "نفس", "غير",
    ])

    const vWords = vNorm.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w))
    const fWords = fNorm.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w))

    const vSet = new Set(vWords)
    const fSet = new Set(fWords)

    let overlap = 0
    for (const w of vSet) {
      if (fSet.has(w)) overlap++
    }

    const similarity = overlap / Math.max(vSet.size, fSet.size)

    // If less than 10% overlap, it's likely a mismatch
    if (similarity < 0.08 && vSet.size > 5 && fSet.size > 5) {
      clearMismatches++
      if (mismatchExamples.length < 30) {
        const match = key.match(/riyadussalihin:(introduction|\d+):(\d+)/)
        const bookNum = match?.[1] || "?"
        mismatchExamples.push({
          key,
          book: bookNum,
          bookName: BOOK_NAMES[bookNum] || "",
          similarity: Math.round(similarity * 100),
          verifiedKeywords: [...vSet].slice(0, 8).join("، "),
          finalKeywords: [...fSet].slice(0, 8).join("، "),
          verifiedStart: verifiedText.slice(0, 150),
          finalStart: finalText.slice(0, 150),
        })
      }
    }
  }

  console.log(`  تمت المقارنة: ${totalCompared} حديث`)
  console.log(`  اختلافات واضحة: ${clearMismatches} حديث\n`)

  if (mismatchExamples.length > 0) {
    console.log("  أمثلة على الاختلافات:")
    for (const m of mismatchExamples.slice(0, 20)) {
      console.log(`  [${m.key}]`)
      console.log(`    الكتاب: ${m.bookName} (${m.book}) - التشابه: ${m.similarity}%`)
      console.log(`    كلمات المرجع: ${m.verifiedKeywords}`)
      console.log(`    كلمات الحالي: ${m.finalKeywords}`)
      console.log(`    المرجع: ${m.verifiedStart.slice(0, 120)}`)
      console.log(`    الحالي: ${m.finalStart.slice(0, 120)}`)
      console.log()
    }
  }

  // ==============================================================
  // ANALYSIS 4: Summary by book
  // ==============================================================
  console.log("━━━ [4] إحصاءات حسب الكتاب ━━━\n")

  const bookStats = {}
  for (const [key, entry] of Object.entries(finalEntries)) {
    const match = key.match(/riyadussalihin:(introduction|\d+):(\d+)/)
    if (!match) continue
    const bookNum = match[1]

    if (!bookStats[bookNum]) {
      bookStats[bookNum] = { total: 0, withSharh: 0, uniqueSharh: new Set(), verifiedMismatches: 0 }
    }
    bookStats[bookNum].total++
    if (typeof entry.sharh === "number" && entry.sharh >= 0) {
      bookStats[bookNum].withSharh++
      bookStats[bookNum].uniqueSharh.add(entry.sharh)
    }

    // Check with verified data
    const vEntry = verifiedEntries[key]
    if (vEntry) {
      const sharhIdx = entry.sharh
      if (typeof sharhIdx === "number" && sharhIdx >= 0) {
        const verifiedText = vEntry.text || ""
        const finalText = sharhPool[sharhIdx] || ""
        if (verifiedText && finalText) {
          const vNorm = normalize(verifiedText).slice(0, 200)
          const fNorm = normalize(finalText).slice(0, 200)
          const vWords = vNorm.split(/\s+/).filter(w => w.length > 3)
          const fWords = fNorm.split(/\s+/).filter(w => w.length > 3)
          const vSet = new Set(vWords)
          const fSet = new Set(fWords)
          let overlap = 0
          for (const w of vSet) if (fSet.has(w)) overlap++
          const similarity = overlap / Math.max(vSet.size, fSet.size)
          if (similarity < 0.08 && vSet.size > 5 && fSet.size > 5) {
            bookStats[bookNum].verifiedMismatches++
          }
        }
      }
    }
  }

  for (const [bookNum, stats] of Object.entries(bookStats).sort((a, b) => {
    const order = ["introduction", "1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19"]
    return order.indexOf(a[0]) - order.indexOf(b[0])
  })) {
    const pct = Math.round(stats.withSharh / stats.total * 100)
    const mm = stats.verifiedMismatches
    console.log(`  ${BOOK_NAMES[bookNum] || bookNum}: ${stats.withSharh}/${stats.total} (${pct}%) - ${stats.uniqueSharh.size} شرح فريد - ${mm} اختلاف`)
  }

  // ==============================================================
  // FINAL SUMMARY
  // ==============================================================
  console.log("\n━━━ الخلاصة ━━━\n")
  console.log(`  إجمالي الأحاديث: ${Object.keys(finalEntries).length}`)
  console.log(`  أحاديث مع شرح: ${Object.values(finalEntries).filter(e => typeof e.sharh === "number" && e.sharh >= 0).length}`)
  console.log(`  نصوص شرح فريدة: ${sharhPool.length}`)
  console.log(`  مجموعات شرح عابرة للكتب: ${crossBookCount}`)
  console.log(`  اختلافات واضحة مع المرجع: ${clearMismatches}`)

  // Generate JSON report
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalHadiths: Object.keys(finalEntries).length,
      withSharh: Object.values(finalEntries).filter(e => typeof e.sharh === "number" && e.sharh >= 0).length,
      uniqueSharhTexts: sharhPool.length,
      crossBookGroups: crossBookCount,
      clearMismatches: clearMismatches,
      totalCompared: totalCompared,
    },
    crossBookGroups: Object.entries(sharhToBooks)
      .filter(([_, books]) => books.size > 1)
      .map(([idx, books]) => ({
        sharhIdx: parseInt(idx),
        books: [...books],
        bookNames: [...books].map(b => BOOK_NAMES[b] || b),
        hadithCount: sharhToKeys[idx].length,
        hadithNumbers: sharhToKeys[idx].map(k => k.num),
        sharhPreview: (sharhPool[parseInt(idx)] || "").slice(0, 200),
      })),
    mismatchExamples: mismatchExamples,
    bookStats: Object.entries(bookStats).map(([bn, st]) => ({
      bookNumber: bn,
      bookName: BOOK_NAMES[bn] || bn,
      total: st.total,
      withSharh: st.withSharh,
      uniqueSharh: st.uniqueSharh.size,
      verifiedMismatches: st.verifiedMismatches,
    })),
  }

  fs.writeFileSync("public/data/sharh-diagnosis-v2-report.json", JSON.stringify(report, null, 2), "utf8")
  console.log(`\nتم حفظ التقرير الكامل في: public/data/sharh-diagnosis-v2-report.json`)
}

main().catch(err => {
  console.error("ERROR:", err.message)
  process.exit(1)
})
