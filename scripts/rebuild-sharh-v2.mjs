#!/usr/bin/env node
/**
 * rebuild-sharh-v2.mjs
 * 
 * الحل الجذري النهائي لإعادة بناء مطابقة المتن والشرح
 * 
 * يستخدم نصوص API الكاملة (من Sunnah.com) بدلاً من نصوص الشاملة المقتضبة
 * للمطابقة الدقيقة ضد نصوص شرح ابن عثيمين.
 * 
 * الاستراتيجية:
 * 1. استخدام النص العربي الكامل المشكول من API (riyad-api.json)
 * 2. استخراج جمل مميزة طويلة (15-20 كلمة) من النص
 * 3. البحث عن هذه الجمل في كل نصوص الشرح
 * 4. حساب درجة المطابقة بناءً على عدد الجمل الموجودة
 * 5. اختيار أفضل شرح لكل حديث
 * 6. تقييم وتحليل النتائج
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const API_FILE = path.join(__dirname, '..', 'public', 'data', 'riyad-api.json')
const SHAMELA_FILE = path.join(__dirname, '..', 'public', 'data', 'riyad-uthaymeen-shamela-final.json')
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'data', 'riyad-shamela-corrected.json')
const REPORT_FILE = path.join(__dirname, '..', 'public', 'data', 'sharh-final-report.json')

// ============================================================
// TEXT NORMALIZATION
// ============================================================

function stripHtml(text) {
  return text.replace(/<[^>]+>/g, '').trim()
}

function normalize(text) {
  return text
    .replace(/[ًٌٍَُِّ~ْٰٕٖٓٔٔ]/g, '')       // Remove tashkeel
    .replace(/[أإآٱ]/g, 'ا')                   // Normalize alef
    .replace(/[ؤ]/g, 'و')                      // Normalize waw with hamza
    .replace(/[ئ]/g, 'ي')                      // Normalize ya with hamza
    .replace(/[ة]/g, 'ه')                      // Normalize ta marbouta
    .replace(/[ىٰ]/g, 'ي')                     // Normalize alif maqsura
    .replace(/[\u200c\u200d\u200e\u200f]/g, '') // Remove ZWNJ, ZWJ, LRM, RLM
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeForSearch(text) {
  return normalize(text)
    .replace(/[^ا-ي0-9\s]/g, ' ')              // Keep only Arabic letters, digits, spaces
    .replace(/\s+/g, ' ')
    .trim()
}

// ============================================================
// FINGERPRINT EXTRACTION - Enhanced version
// ============================================================

const STOPWORDS = new Set([
  'عن', 'وعن', 'قال', 'وقال', 'رضي', 'الله', 'عنه', 'عنها', 'عنهم',
  'النبي', 'رسول', 'صلى', 'عليه', 'وسلم', 'رواه', 'متفق', 'عليه',
  'في', 'من', 'الى', 'علي', 'على', 'ان', 'انها', 'انه', 'كان',
  'كانت', 'ما', 'لا', 'ابي', 'ابو', 'بن', 'ابن', 'باب', 'كتاب',
  'هذا', 'هذه', 'ذلك', 'ذلكم', 'الذي', 'التي', 'الذين', 'اللواتي',
  'قد', 'لقد', 'إن', 'إنما', 'إذا', 'إذ', 'حين', 'بعد', 'قبل',
  'لم', 'لن', 'لما', 'هل', 'أ', 'هو', 'هي', 'هم', 'هن', 'أنت',
  'نحن', 'أنا', 'أن', 'ال', 'و', 'ف', 'ب', 'ل', 'ك', 'كما',
  'به', 'له', 'لها', 'لهم', 'بها', 'بهم', 'منه', 'منها', 'منهم',
  'فيه', 'فيها', 'فيهم', 'عند', 'عندما', 'كانوا', 'يكون', 'تكون',
])

function extractDistinctivePhrases(text, minWordLen = 3, maxPhrases = 40) {
  const normalized = normalizeForSearch(text)
  const words = normalized.split(/\s+/).filter(w => w.length >= minWordLen && !STOPWORDS.has(w))
  
  if (words.length < 3) return []
  
  const phrases = new Set()
  
  // Multi-length overlapping phrases
  // Start from the most distinctive (longest)
  for (const phraseLen of [15, 12, 10, 8, 6]) {
    const step = Math.max(1, Math.floor(phraseLen / 2))
    for (let i = 0; i + phraseLen <= words.length && phrases.size < maxPhrases; i += step) {
      const phrase = words.slice(i, i + phraseLen).join(' ')
      if (phrase.length > 25) phrases.add(phrase)
    }
  }
  
  // Also add individual long/significant words
  for (const word of words) {
    if (word.length > 6 && phrases.size < maxPhrases + 5) {
      phrases.add(word)
    }
  }
  
  return [...phrases].slice(0, maxPhrases + 5)
}

// ============================================================
// MATCHING ENGINE - Improved scoring
// ============================================================

function scoreMatch(phrases, normalizedSharh) {
  if (!normalizedSharh || phrases.length === 0) return 0
  
  let foundCount = 0
  let totalPhraseLength = 0
  let foundLength = 0
  
  for (const phrase of phrases) {
    totalPhraseLength += phrase.length
    if (normalizedSharh.includes(phrase)) {
      foundCount++
      foundLength += phrase.length
    }
  }
  
  if (foundCount === 0) return 0
  
  // Score based on:
  // 1. Ratio of found phrases (count)
  // 2. Ratio of found text volume (length)
  const countRatio = foundCount / phrases.length
  const lengthRatio = foundLength / Math.max(1, totalPhraseLength)
  
  // The first few phrases (longest/most distinctive) get extra weight
  let firstPhrasesFound = 0
  for (let i = 0; i < Math.min(5, phrases.length); i++) {
    if (normalizedSharh.includes(phrases[i])) firstPhrasesFound++
  }
  const firstBonus = firstPhrasesFound / 5
  
  return Math.min(1.0, countRatio * 0.4 + lengthRatio * 0.3 + firstBonus * 0.3)
}

// ============================================================
// MAIN LOGIC
// ============================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  الحل الجذري - إعادة بناء مطابقة المتن والشرح  ║')
  console.log('╚══════════════════════════════════════════════════╝')
  console.log()
  
  // Load data
  console.log('Loading data...')
  const apiData = JSON.parse(fs.readFileSync(API_FILE, 'utf8'))
  const shamelaData = JSON.parse(fs.readFileSync(SHAMELA_FILE, 'utf8'))
  
  const apiHadiths = apiData.hadiths
  const localEntries = shamelaData.entries
  const oldPool = shamelaData.sharhPool
  
  console.log(`  API hadiths: ${apiHadiths.length}`)
  console.log(`  Local entries: ${Object.keys(localEntries).length}`)
  console.log(`  Old sharh pool: ${oldPool.length} texts`)
  console.log()
  
  // ============================================================
  // STEP 1: Prepare API texts for matching
  // ============================================================
  console.log('STEP 1: Preparing API hadith texts...')
  
  const apiTexts = apiHadiths.map((h, idx) => ({
    idx,
    idInBook: h.idInBook,
    chapterId: h.chapterId,
    arabic: stripHtml(h.arabic || ''),
    normalized: normalizeForSearch(stripHtml(h.arabic || '')),
  }))
  
  console.log(`  Prepared ${apiTexts.length} hadith texts`)
  console.log()
  
  // ============================================================
  // STEP 2: Pre-analyze sharh pool
  // ============================================================
  console.log('STEP 2: Analyzing sharh pool...')
  
  const analyzedPool = oldPool.map((text, idx) => ({
    idx,
    text,
    normalized: text ? normalizeForSearch(text) : '',
    length: text ? text.length : 0,
  }))
  
  console.log(`  Analyzed ${analyzedPool.length} sharh texts`)
  console.log()
  
  // ============================================================
  // STEP 3: Find best sharh for each API hadith using full text
  // ============================================================
  console.log('STEP 3: Matching API hadiths to sharh texts...')
  
  const apiToSharh = [] // array of {apiIdx, bestSharhIdx, score}
  let matched = 0
  let unmatched = 0
  
  for (const api of apiTexts) {
    if (!api.arabic || api.arabic.length < 30) {
      apiToSharh.push({ apiIdx: api.idx, bestSharhIdx: -1, score: 0 })
      unmatched++
      continue
    }
    
    const phrases = extractDistinctivePhrases(api.arabic)
    if (phrases.length < 2) {
      apiToSharh.push({ apiIdx: api.idx, bestSharhIdx: -1, score: 0 })
      unmatched++
      continue
    }
    
    let bestScore = 0
    let bestIdx = -1
    
    for (const sharh of analyzedPool) {
      if (!sharh.text || sharh.text.length < 30) continue
      const score = scoreMatch(phrases, sharh.normalized)
      if (score > bestScore) {
        bestScore = score
        bestIdx = sharh.idx
      }
    }
    
    apiToSharh.push({ apiIdx: api.idx, bestSharhIdx: bestScore >= 0.15 ? bestIdx : -1, score: bestScore })
    if (bestScore >= 0.15) matched++
    else unmatched++
  }
  
  console.log(`  Matched: ${matched}`)
  console.log(`  Unmatched: ${unmatched}`)
  console.log()
  
  // ============================================================
  // STEP 4: Map API hadiths to local entries
  // ============================================================
  console.log('STEP 4: Mapping API hadiths to local entries...')
  
  // Build a map from local entry key to API index
  // Strategy: find the best API match for each local entry by comparing matn text
  
  const localKeys = Object.keys(localEntries).sort()
  const keyToApiMap = new Map() // localKey -> apiIdx
  let directMapped = 0
  let textMapped = 0
  
  for (const key of localKeys) {
    const entry = localEntries[key]
    const matn = normalizeForSearch(entry.matn || entry.text || '')
    
    if (!matn || matn.length < 20) {
      keyToApiMap.set(key, -1)
      continue
    }
    
    // Extract distinctive phrases from local matn
    const matnPhrases = extractDistinctivePhrases(matn, 3, 15)
    if (matnPhrases.length < 2) {
      keyToApiMap.set(key, -1)
      continue
    }
    
    // Find best matching API text
    let bestScore = 0
    let bestApiIdx = -1
    
    for (const api of apiTexts) {
      if (!api.arabic || api.arabic.length < 30) continue
      // Score: how many of the matn phrases appear in the API text
      let found = 0
      for (const phrase of matnPhrases) {
        if (api.normalized.includes(phrase)) found++
      }
      const score = found / matnPhrases.length
      if (score > bestScore) {
        bestScore = score
        bestApiIdx = api.idx
      }
    }
    
    if (bestScore > 0.5 && bestApiIdx >= 0) {
      keyToApiMap.set(key, bestApiIdx)
      textMapped++
    } else {
      keyToApiMap.set(key, -1)
    }
  }
  
  // Also try mapping by hadith number directly
  for (const key of localKeys) {
    if (keyToApiMap.get(key) >= 0) continue
    
    const match = key.match(/riyadussalihin:(\w+):(\d+)/)
    if (!match) continue
    
    const hadithNum = parseInt(match[2])
    // Try to find API hadith with matching text content
    const entry = localEntries[key]
    const matn = entry.matn || ''
    const firstWords = normalizeForSearch(matn).split(/\s+/).slice(0, 5).join(' ')
    
    if (firstWords.length < 10) continue
    
    for (const api of apiTexts) {
      const apiFirstWords = api.normalized.split(/\s+/).slice(0, 8).join(' ')
      const overlap = firstWords.length > 5 && apiFirstWords.includes(firstWords.slice(0, 20))
      if (overlap) {
        keyToApiMap.set(key, api.idx)
        directMapped++
        break
      }
    }
  }
  
  // ============================================================
  // STEP 5: Build corrected entries using BEST sharh
  // ============================================================
  console.log('STEP 5: Building corrected entries...')
  
  const newPool = []
  const newHashToIdx = new Map()
  
  function addToPool(text) {
    if (!text) return -1
    const h = crypto.createHash('md5').update(text).digest('hex')
    if (!newHashToIdx.has(h)) {
      newHashToIdx.set(h, newPool.length)
      newPool.push(text)
    }
    return newHashToIdx.get(h)
  }
  
  // Statistics
  let stats = {
    total: 0,
    withSharh: 0,
    noSharh: 0,
    corrected: 0,
    verified: 0,
    byBook: {},
  }
  
  const correctEntries = {}
  const correctionLog = [] // {key, oldSharh, newSharh, oldScore, newScore}
  
  // Process all entries
  for (const key of localKeys) {
    const entry = localEntries[key]
    const apiIdx = keyToApiMap.get(key)
    
    // Get old sharh
    const oldSharh = entry.sharh
    const isIntro = key.startsWith('riyadussalihin:introduction:')
    const bookMatch = key.match(/riyadussalihin:(\w+):(\d+)/)
    const bookNum = bookMatch ? bookMatch[1] : 'introduction'
    
    stats.total++
    stats.byBook[bookNum] = (stats.byBook[bookNum] || 0) + 1
    
    let bestSharhInfo = null
    
    if (apiIdx >= 0 && apiToSharh[apiIdx] && apiToSharh[apiIdx].bestSharhIdx >= 0) {
      // Use the API-matched sharh
      bestSharhInfo = {
        sharhIdx: apiToSharh[apiIdx].bestSharhIdx,
        score: apiToSharh[apiIdx].score,
        source: 'api_text_match',
      }
    } else if (!isIntro) {
      // Fall back to matching local matn against sharh pool
      const matn = entry.matn || entry.text || ''
      if (matn && matn.length > 20) {
        const phrases = extractDistinctivePhrases(matn, 3, 20)
        if (phrases.length >= 2) {
          let bestScore = 0
          let bestIdx = -1
          for (const sharh of analyzedPool) {
            if (!sharh.text || sharh.text.length < 30) continue
            const score = scoreMatch(phrases, sharh.normalized)
            if (score > bestScore) {
              bestScore = score
              bestIdx = sharh.idx
            }
          }
          if (bestScore >= 0.12 && bestIdx >= 0) {
            bestSharhInfo = { sharhIdx: bestIdx, score: bestScore, source: 'local_text_match' }
          }
        }
      }
    }
    
    if (bestSharhInfo && bestSharhInfo.sharhIdx >= 0 && bestSharhInfo.sharhIdx < oldPool.length) {
      const newSharhIdx = addToPool(oldPool[bestSharhInfo.sharhIdx])
      const oldScore = (typeof oldSharh === 'number' && oldSharh >= 0 && oldSharh < oldPool.length)
        ? scoreMatch(extractDistinctivePhrases(entry.matn || ''), normalizeForSearch(oldPool[oldSharh] || ''))
        : 0
      
      if (oldSharh !== newSharhIdx && newSharhIdx >= 0 && bestSharhInfo.score > oldScore * 1.15) {
        // Correction!
        correctEntries[key] = {
          ...entry,
          sharh: newSharhIdx,
          source: bestSharhInfo.source,
          matchConfidence: Math.round(bestSharhInfo.score * 100),
          oldSharhRef: oldSharh,
        }
        stats.corrected++
        correctionLog.push({
          key, oldSharh, newSharh: bestSharhInfo.sharhIdx,
          oldScore: Math.round(oldScore * 100), newScore: Math.round(bestSharhInfo.score * 100),
        })
      } else if (typeof oldSharh === 'number' && oldSharh >= 0 && oldSharh < oldPool.length) {
        // Keep original
        const existingPoolIdx = addToPool(oldPool[oldSharh])
        correctEntries[key] = {
          ...entry,
          sharh: existingPoolIdx,
          source: entry.source || 'original',
          matchConfidence: Math.round(oldScore * 100),
        }
        stats.verified++
      } else {
        correctEntries[key] = { ...entry, sharh: -1, source: 'no_sharh' }
        stats.noSharh++
      }
    } else if (typeof oldSharh === 'number' && oldSharh >= 0 && oldSharh < oldPool.length) {
      // Keep original
      const existingPoolIdx = addToPool(oldPool[oldSharh])
      correctEntries[key] = {
        ...entry,
        sharh: existingPoolIdx,
        source: entry.source || 'original',
        matchConfidence: 0,
      }
      stats.verified++
    } else {
      correctEntries[key] = { ...entry, sharh: -1, source: 'no_sharh' }
      stats.noSharh++
    }
  }
  
  // Remove unused items from pool (garbage collection)
  const usedIndices = new Set()
  for (const entry of Object.values(correctEntries)) {
    if (typeof entry.sharh === 'number' && entry.sharh >= 0) {
      usedIndices.add(entry.sharh)
    }
  }
  const compactPool = []
  const oldToNew = new Map()
  for (let i = 0; i < newPool.length; i++) {
    if (usedIndices.has(i)) {
      oldToNew.set(i, compactPool.length)
      compactPool.push(newPool[i])
    }
  }
  for (const entry of Object.values(correctEntries)) {
    if (typeof entry.sharh === 'number' && entry.sharh >= 0 && oldToNew.has(entry.sharh)) {
      entry.sharh = oldToNew.get(entry.sharh)
    } else if (typeof entry.sharh === 'number' && entry.sharh >= 0 && !oldToNew.has(entry.sharh)) {
      entry.sharh = -1
    }
  }
  
  const finalWithSharh = Object.values(correctEntries).filter(e => typeof e.sharh === 'number' && e.sharh >= 0).length
  const finalNoSharh = Object.values(correctEntries).filter(e => typeof e.sharh !== 'number' || e.sharh < 0).length
  
  console.log()
  console.log('  Statistics:')
  console.log(`    Total entries: ${stats.total}`)
  console.log(`    Corrected: ${stats.corrected}`)
  console.log(`    Verified (no change): ${stats.verified}`)
  console.log(`    No sharh: ${finalNoSharh}`)
  console.log(`    With sharh: ${finalWithSharh}`)
  console.log(`    Unique sharh texts: ${compactPool.length}`)
  console.log()
  
  // ============================================================
  // STEP 6: Verify specific examples
  // ============================================================
  console.log('STEP 6: Verifying specific examples...')
  console.log()
  
  // Example 1: Al-Bara' bedtime du'a (Book 4, hadith 814)
  const k814 = 'riyadussalihin:4:814'
  if (correctEntries[k814]) {
    const e = correctEntries[k814]
    const origEntry = localEntries[k814]
    console.log('--- Al-Bara bedtime dua (hadith 814) ---')
    console.log(`  Original sharh: ${origEntry.sharh}`)
    console.log(`  Corrected sharh: ${e.sharh}`)
    if (e.sharh >= 0 && compactPool[e.sharh]) {
      console.log(`  SHARH: ${compactPool[e.sharh].slice(0, 200)}`)
    }
    console.log()
  }
  
  // Example 2: The التوكل hadiths
  console.log('--- Hadiths mentioning التوكل ---')
  for (const [key, entry] of Object.entries(correctEntries)) {
    if (!key.includes('introduction') && entry.matn && entry.matn.includes('توكل') && entry.sharh >= 0 && compactPool[entry.sharh]) {
      console.log(`  ${key}:`)
      console.log(`    SHARH: ${compactPool[entry.sharh].slice(0, 120)}`)
    }
  }
  console.log()
  
  // ============================================================
  // STEP 7: Build and save
  // ============================================================
  console.log('STEP 7: Saving corrected data...')
  
  const correctedStats = {
    totalEntries: stats.total,
    withSharh: finalWithSharh,
    withoutSharh: finalNoSharh,
    corrected: stats.corrected,
    verified: stats.verified,
    uniqueSharhTexts: compactPool.length,
    oldUniqueSharhTexts: oldPool.length,
    schemaVersion: 23,
    buildDate: new Date().toISOString(),
    method: 'text_similarity_v2: API Arabic texts from Sunnah.com matched against sharh pool. Each hadith text is decomposed into overlapping phrases of 6-15 words, searched in all sharh texts.',
  }
  
  const output = {
    meta: {
      ...shamelaData.meta,
      ...correctedStats,
    },
    sharhPool: compactPool,
    entries: correctEntries,
  }
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8')
  const fileSize = (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(1)
  console.log(`  Written: ${OUTPUT_FILE} (${fileSize} MB)`)
  console.log()
  
  // ============================================================
  // STEP 8: Generate report
  // ============================================================
  console.log('STEP 8: Generating report...')
  
  // Corrections by book
  const correctionsByBook = {}
  for (const c of correctionLog) {
    const m = c.key.match(/riyadussalihin:(\w+):(\d+)/)
    if (m) correctionsByBook[m[1]] = (correctionsByBook[m[1]] || 0) + 1
  }
  
  const report = {
    summary: correctedStats,
    correctionsByBook,
    sampleCorrections: correctionLog.slice(0, 20),
  }
  
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8')
  console.log(`  Written: ${REPORT_FILE}`)
  console.log()
  
  // ============================================================
  // FINAL SUMMARY
  // ============================================================
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║  التقرير النهائي  ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log()
  console.log(`  إجمالي الأحاديث: ${stats.total}`)
  console.log(`  أحاديث مع شرح: ${finalWithSharh}`)
  console.log(`  أحاديث بدون شرح: ${finalNoSharh}`)
  console.log(`  تم تصحيح المطابقة: ${stats.corrected} حديثاً`)
  console.log(`  تم التحقق (دون تغيير): ${stats.verified} حديثاً`)
  console.log(`  نصوص شرح فريدة: ${compactPool.length} (كانت ${oldPool.length})`)
  console.log()
  console.log('التصحيحات حسب الكتاب:')
  for (const [bk, cnt] of Object.entries(correctionsByBook).sort((a, b) => b[1] - a[1])) {
    console.log(`  كتاب ${bk}: ${cnt} تصحيح`)
  }
  console.log()
  
  // Output examples of corrections
  if (correctionLog.length > 0) {
    console.log('نماذج من التصحيحات:')
    for (const c of correctionLog.slice(0, 10)) {
      const oldText = (c.oldSharh >= 0 && oldPool[c.oldSharh]) ? oldPool[c.oldSharh].slice(0, 100) : '(فارغ)'
      const newText = (c.newSharh >= 0 && oldPool[c.newSharh]) ? oldPool[c.newSharh].slice(0, 100) : '(فارغ)'
      console.log(`  ${c.key}:`)
      console.log(`    قبل [${c.oldScore}%]: ${oldText}...`)
      console.log(`    بعد [${c.newScore}%]: ${newText}...`)
      console.log()
    }
  }
  
  console.log('تم الانتهاء بنجاح! ✓')
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
