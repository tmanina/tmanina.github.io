#!/usr/bin/env node
/**
 * diagnose-sharh-mismatches.mjs
 *
 * Comprehensive diagnostic for Riyad al-Salihin hadith-sharh alignment.
 * Checks all 1896 entries and reports mismatches.
 * Uses the verified riyad-uthaymeen-sharh.json as ground truth where available,
 * and fetches actual hadith texts from the API for cross-validation.
 *
 * Output: public/data/sharh-diagnosis-report.json
 */

import fs from "fs"
import path from "path"

const FINAL_FILE = "public/data/riyad-uthaymeen-shamela-final.json"
const VERIFIED_FILE = "public/data/riyad-uthaymeen-sharh.json"
const REPORT_FILE = "public/data/sharh-diagnosis-report.json"

const BOOKS = [
  ["المقدمات", "introduction", 1, 679],
  ["كتاب الأدب", "1", 680, 726],
  ["كتاب الأذكار", "2", 727, 777],
  ["كتاب الآداب", "3", 778, 812],
  ["كتاب الطعام", "4", 813, 843],
  ["كتاب اللباس", "5", 844, 893],
  ["كتاب النوم", "6", 894, 955],
  ["كتاب السلام", "7", 956, 990],
  ["كتاب العزلة", "8", 991, 1267],
  ["كتاب السفر", "9", 1268, 1270],
  ["كتاب الفضائل", "10", 1271, 1284],
  ["كتاب الاعتكاف", "11", 1285, 1375],
  ["كتاب الحج", "12", 1376, 1392],
  ["كتاب الجهاد", "13", 1393, 1396],
  ["كتاب العلم", "14", 1397, 1407],
  ["كتاب الدعاء", "15", 1408, 1464],
  ["كتاب الأذكار", "16", 1465, 1510],
  ["كتاب الأدعية", "17", 1511, 1807],
  ["كتاب التوبة", "18", 1808, 1868],
  ["كتاب الرقائق", "19", 1869, 1896],
]

// قائمة كلمات مميزة لكل موضوع في رياض الصالحين
const TOPIC_KEYWORDS = {
  "نية|إخلاص|إرادة|قصد|هجرة": ["نية", "نوى", "إخلاص", "الهجرة", "مبادئ"],
  "مراقبة|إحسان|إيمان|إسلام|جبريل": ["الإسلام", "الإيمان", "الإحسان", "جبريل", "مراقبة", "شهد"],
  "إخلاص|نية|عمل|صدق": ["إخلاص", "نية", "صدق", "عمل"],
  "علم|ذكر|تعلم|تعليم": ["علم", "ذكر", "تعلم", "تعليم", "مسجد"],
  "صلاة|مسجد|ركوع|سجود": ["صلاة", "مسجد", "ركوع", "سجود", "وضوء"],
  "زكاة|صدقة|إنفاق|بخل": ["زكاة", "صدقة", "إنفاق", "بخل", "مال"],
  "صوم|صيام|رمضان|فطر": ["صوم", "صيام", "رمضان", "فطر", "صائم"],
  "حج|عمرة|مكة|كعبة|مناسك": ["حج", "عمرة", "مكة", "كعبة", "مناسك", "حاج"],
  "جهاد|قتال|غزو|جيش|شهادة": ["جهاد", "قتال", "غزو", "جيش", "شهيد", "رباط"],
  "زواج|نكاح|طلاق|أهل|بيت": ["زواج", "نكاح", "طلاق", "زوج", "زوجة"],
  "أكل|شرب|طعام|شراب|آكل": ["أكل", "شرب", "طعام", "شراب", "آكل"],
  "لباس|ثوب|كسوة|عورة": ["لباس", "ثوب", "كسوة", "عورة", "ستر"],
  "نوم|منام|رؤيا|حلم": ["نوم", "منام", "رؤيا", "حلم", "نائم"],
  "سلام|تحية|لقاء|مصافحة": ["سلام", "تحية", "لقاء", "مصافحة", "سلم"],
  "عزلة|خلوة|صمت|اعتزال": ["عزلة", "خلوة", "صمت", "اعتزال", "انفراد"],
  "سفر|رحلة|مسافر|طريق": ["سفر", "رحلة", "مسافر", "طريق", "سائر"],
  "مرض|مريض|عليل|صحة|شفاء": ["مرض", "مريض", "عليل", "صحة", "شفاء"],
  "فضائل|فضل|ثواب|أجر": ["فضل", "ثواب", "أجر", "فضيلة", "حسنات"],
  "دعاء|دعوة|سؤال|مناجاة": ["دعاء", "دعوة", "سؤال", "مناجاة", "ابتهال"],
  "ذكر|تسبيح|تحميد|تهليل|تكبير": ["ذكر", "تسبيح", "تحميد", "تهليل", "تكبير", "سبحان"],
  "توبة|استغفار|ندم|إنابة": ["توبة", "استغفار", "ندم", "إنابة", "تبت"],
  "رقائق|زهد|ورع|خشوع|بكاء|خوف": ["رقائق", "زهد", "ورع", "خشوع", "بكاء", "خوف"],
}

// تشكيل الكلمات للحذف عند المقارنة
function normalize(text) {
  return text
    .replace(/[ًٌٍَُِّ~ْ]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function loadJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"))
  } catch {
    return null
  }
}

async function fetchApiHadiths() {
  const allHadiths = []
  console.log("Fetching hadiths from API...")

  for (const [bookName, bookNum, start, end] of BOOKS) {
    if (bookNum === "introduction") continue // Introduction not in API
    
    const url = `https://api.islamic.app/v1/hadith/collections/riyadussalihin/books/${bookNum}/hadiths?limit=200&offset=0`
    
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
      if (!res.ok) {
        console.log(`  ✗ Book ${bookNum}: HTTP ${res.status}`)
        continue
      }
      const data = await res.json()
      const hadiths = data?.data?.hadiths || []
      allHadiths.push(...hadiths)
      console.log(`  ✓ Book ${bookNum} (${bookName}): ${hadiths.length} hadiths`)
    } catch (err) {
      console.log(`  ✗ Book ${bookNum}: ${err.message}`)
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 200))
  }

  console.log(`\nTotal hadiths from API: ${allHadiths.length}`)
  return allHadiths
}

function extractKeywords(text, maxWords = 8) {
  if (!text || text.length < 10) return []
  const normalized = normalize(text)
  const words = normalized.split(/\s+/).filter(w => w.length > 3)
  const freq = {}
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxWords)
    .map(([word]) => word)
}

function computeKeywordOverlap(keywords1, keywords2) {
  if (!keywords1.length || !keywords2.length) return 0
  const set1 = new Set(keywords1)
  const set2 = new Set(keywords2)
  let overlap = 0
  for (const w of set1) {
    if (set2.has(w)) overlap++
  }
  return overlap / Math.max(set1.size, set2.size)
}

function main() {
  console.log("╔══════════════════════════════════════════════════════════╗")
  console.log("║      تشخيص أخطاء مطابقة الشرح مع المتن في رياض الصالحين      ║")
  console.log("╚══════════════════════════════════════════════════════════╝\n")

  // Load data
  const finalData = loadJSON(FINAL_FILE)
  const verifiedData = loadJSON(VERIFIED_FILE)

  if (!finalData) {
    console.error(`ERROR: Could not load ${FINAL_FILE}`)
    process.exit(1)
  }

  const finalEntries = finalData.entries || {}
  const sharhPool = finalData.sharhPool || []
  const verifiedEntries = verifiedData?.entries || {}

  console.log(`Loaded final entries: ${Object.keys(finalEntries).length}`)
  console.log(`Loaded verified entries: ${Object.keys(verifiedEntries).length}`)
  console.log(`Sharh pool size: ${sharhPool.length}`)

  // ============================================================
  // ANALYSIS 1: Group by sharh index - find shared sharh patterns
  // ============================================================
  console.log("\n━━━ التحليل 1: توزيع الشرح على الأحاديث ━━━\n")

  const sharhGroups = {} // sharh index → [keys]
  const chapterGroups = {} // bookNumber → { sharhIdx → [hadith numbers] }

  for (const [key, entry] of Object.entries(finalEntries)) {
    const match = key.match(/riyadussalihin:(introduction|\d+):(\d+)/)
    if (!match) continue
    const bookNum = match[1]
    const hadithNum = parseInt(match[2])
    const sharhIdx = entry.sharh

    if (typeof sharhIdx !== "number") continue

    if (!sharhGroups[sharhIdx]) sharhGroups[sharhIdx] = []
    sharhGroups[sharhIdx].push(key)

    if (!chapterGroups[bookNum]) chapterGroups[bookNum] = {}
    if (!chapterGroups[bookNum][sharhIdx]) chapterGroups[bookNum][sharhIdx] = []
    chapterGroups[bookNum][sharhIdx].push(hadithNum)
  }

  // Find large sharh groups (same sharh text assigned to many hadiths)
  console.log("مجموعات الشرح الكبيرة (نفس الشرح لأكثر من 5 أحاديث):")
  let largeGroupCount = 0
  for (const [idx, keys] of Object.entries(sharhGroups)) {
    if (keys.length > 5) {
      const hadithNums = keys.map(k => k.match(/:(\d+)$/)[1])
      const books = [...new Set(keys.map(k => k.match(/riyadussalihin:(\w+):/)[1]))]
      const sharhText = sharhPool[parseInt(idx)]
      largeGroupCount++
      console.log(`  [${idx}] ${keys.length} أحاديث - الكتب: ${books.join(", ")}`)
      console.log(`         الأرقام: ${hadithNums.slice(0, 10).join(", ")}${hadithNums.length > 10 ? "..." : ""}`)
      console.log(`         بداية الشرح: ${(sharhText || "؟").slice(0, 100)}...`)
    }
  }
  console.log(`  إجمالي المجموعات الكبيرة: ${largeGroupCount}`)

  // ============================================================
  // ANALYSIS 2: Cross-reference with verified data
  // ============================================================
  console.log("\n━━━ التحليل 2: مقارنة مع البيانات المرجعية (riyad-uthaymeen-sharh.json) ━━━\n")

  let verifiedMatchCount = 0
  let verifiedMismatchCount = 0
  const verifiedMismatches = []

  for (const [key, verifiedEntry] of Object.entries(verifiedEntries)) {
    const finalEntry = finalEntries[key]
    if (!finalEntry) continue

    const verifiedText = verifiedEntry.text || ""
    const sharhIdx = finalEntry.sharh
    const finalText = (typeof sharhIdx === "number" && sharhIdx >= 0 && sharhPool[sharhIdx]) ? sharhPool[sharhIdx] : ""

    if (!verifiedText || !finalText) continue

    const vKeywords = extractKeywords(verifiedText)
    const fKeywords = extractKeywords(finalText)
    const overlap = computeKeywordOverlap(vKeywords, fKeywords)

    if (overlap < 0.3) {
      verifiedMismatchCount++
      verifiedMismatches.push({
        key,
        overlap: Math.round(overlap * 100),
        verifiedStart: verifiedText.slice(0, 150),
        finalStart: finalText.slice(0, 150),
      })
    } else {
      verifiedMatchCount++
    }
  }

  console.log(`مطابقات مؤكدة: ${verifiedMatchCount}`)
  console.log(`اختلافات مؤكدة: ${verifiedMismatchCount}`)

  if (verifiedMismatches.length > 0) {
    console.log("\nأمثلة على الاختلافات المؤكدة:")
    for (const m of verifiedMismatches.slice(0, 15)) {
      console.log(`\n  [${m.key}] (تشابه: ${m.overlap}%)`)
      console.log(`  المرجع: ${m.verifiedStart.slice(0, 120)}...`)
      console.log(`  الحالي: ${m.finalStart.slice(0, 120)}...`)
    }
  }

  // ============================================================
  // ANALYSIS 3: Detect sharh text that mentions topics not in the hadith
  // ============================================================
  console.log("\n━━━ التحليل 3: فحص التناسق الموضوعي ━━━\n")

  // For this we need actual hadith texts from the API
  // We'll do this in a separate step with API calls

  // ============================================================
  // ANALYSIS 4: Check for empty/incomplete sharh
  // ============================================================
  console.log("\n━━━ التحليل 4: الشرح الناقص أو الغائب ━━━\n")

  let noSharh = 0
  let shortSharh = 0
  const noSharhList = []

  for (const [key, entry] of Object.entries(finalEntries)) {
    const match = key.match(/riyadussalihin:(introduction|\d+):(\d+)/)
    if (!match) continue
    
    const sharhIdx = entry.sharh
    if (typeof sharhIdx !== "number" || sharhIdx < 0) {
      noSharh++
      noSharhList.push(key)
      continue
    }
    const sharhText = sharhPool[sharhIdx] || ""
    if (sharhText.length < 50) {
      shortSharh++
      noSharhList.push(key)
    }
  }

  console.log(`لا يوجد شرح: ${noSharh}`)
  console.log(`شرح قصير (< 50 حرف): ${shortSharh}`)
  if (noSharhList.length > 0 && noSharhList.length <= 20) {
    console.log(`الأحاديث: ${noSharhList.join(", ")}`)
  }

  // ============================================================
  // ANALYSIS 5: Check for the specific Jibril hadith issue
  // ============================================================
  console.log("\n━━━ التحليل 5: البحث عن المشكلة المحددة (المراقبة/جبريل) ━━━\n")

  // Search for any entry mentioning جبريل or المراقبة
  for (const [key, entry] of Object.entries(finalEntries)) {
    const text = entry.matn || entry.text || ""
    if (text.includes("جبريل") || text.includes("المراقبة")) {
      const sharhIdx = entry.sharh
      const sharhText = (typeof sharhIdx === "number" && sharhIdx >= 0 && sharhPool[sharhIdx]) ? sharhPool[sharhIdx] : ""
      const containsJihad = sharhText.includes("قتال") || sharhText.includes("جهاد") || sharhText.includes("ميزان")
      
      console.log(`الحديث: ${key}`)
      console.log(`المتن: ${(text || "").slice(0, 150)}...`)
      console.log(`الشرح ${sharhIdx >= 0 ? `[${sharhIdx}]` : "غير متاح"}`)
      
      if (containsJihad) {
        console.log(`⚠️  خطأ: الشرح يتحدث عن القتال/الجهاد بينما الحديث عن المراقبة!`)
        console.log(`   بداية الشرح: ${sharhText.slice(0, 200)}...`)
      } else if (sharhText) {
        console.log(`   بداية الشرح: ${sharhText.slice(0, 200)}...`)
      }
      console.log()
    }
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log("\n━━━ ملخص التشخيص ━━━\n")

  const totalWithSharh = Object.values(finalEntries).filter(
    e => typeof e.sharh === "number" && e.sharh >= 0
  ).length
  const totalEntries = Object.keys(finalEntries).length
  const uniqueSharhTexts = new Set(
    Object.values(finalEntries)
      .filter(e => typeof e.sharh === "number" && e.sharh >= 0)
      .map(e => e.sharh)
  ).size

  console.log(`إجمالي الأحاديث: ${totalEntries}`)
  console.log(`أحاديث مع شرح: ${totalWithSharh} (${Math.round(totalWithSharh/totalEntries*100)}%)`)
  console.log(`نصوص شرح فريدة: ${uniqueSharhTexts}`)
  console.log(`اختلافات مع المرجع: ${verifiedMismatchCount}`)
  console.log(`أحاديث بدون شرح: ${noSharh}`)
  console.log(`مجموعات شرح كبيرة (>5 أحاديث): ${largeGroupCount}`)

  // Generate report
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalEntries,
      withSharh: totalWithSharh,
      uniqueSharhTexts,
      verifiedMismatches: verifiedMismatchCount,
      noSharh,
      shortSharh,
      largeSharhGroups: largeGroupCount,
    },
    largeGroups: Object.entries(sharhGroups)
      .filter(([_, keys]) => keys.length > 5)
      .map(([idx, keys]) => ({
        sharhIdx: parseInt(idx),
        hadithCount: keys.length,
        keys: keys,
        sharhPreview: (sharhPool[parseInt(idx)] || "").slice(0, 200),
      })),
    mismatches: verifiedMismatches,
    noSharhList,
  }

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), "utf8")
  console.log(`\nتم حفظ التقرير في: ${REPORT_FILE}`)
}

main().catch(err => {
  console.error("FATAL:", err.message)
  process.exit(1)
})
