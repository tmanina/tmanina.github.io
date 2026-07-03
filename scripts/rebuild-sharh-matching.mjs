#!/usr/bin/env node
/**
 * rebuild-sharh-matching.mjs
 * 
 * الحل الجذري لإعادة بناء مطابقة المتن مع الشرح
 * 
 * الفكرة: البحث عن نص المتن (أو أجزاء مميزة منه) داخل نصوص الشرح.
 * لأن ابن عثيمين عادةً يستشهد بالحديث الذي يشرحه، فإذا وجدنا المتن داخل
 * نص الشرح، فهذا يعني أن المطابقة صحيحة.
 * 
 * الاستراتيجية:
 * 1. تحميل الملف الحالي (riyad-uthaymeen-shamela-final.json)
 * 2. لكل حديث (680-1896)، استخراج المتن
 * 3. لكل متن، إنشاء "بصمة نصية" (جمل مميزة طويلة)
 * 4. البحث عن هذه البصمة في كل نصوص الشرح
 * 5. لكل حديث، اختيار أفضل شرح مطابق
 * 6. إعادة بناء الملف مع التصحيحات
 * 7. طباعة تقرير بالأخطاء التي تم إصلاحها
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.join(__dirname, '..', 'public', 'data', 'riyad-uthaymeen-shamela-final.json')
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'data', 'riyad-shamela-corrected.json')
const REPORT_FILE = path.join(__dirname, '..', 'public', 'data', 'sharh-correction-report.json')

// ============================================================
// TEXT NORMALIZATION
// ============================================================

function normalize(text) {
  return text
    .replace(/[ًٌٍَُِّ~ْٰٕٖٓٔٔ]/g, '')       // Remove tashkeel
    .replace(/[أإآٱ]/g, 'ا')                   // Normalize alef
    .replace(/[ؤ]/g, 'و')                      // Normalize waw with hamza
    .replace(/[ئ]/g, 'ي')                      // Normalize ya with hamza
    .replace(/[ة]/g, 'ه')                      // Normalize ta marbouta
    .replace(/[ىٰ]/g, 'ي')                     // Normalize alif maqsura
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)) // Arabic digits to Western
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
// FINGERPRINT EXTRACTION
// ============================================================

// Arabic stopwords to skip
const STOPWORDS = new Set([
  'عن', 'وعن', 'قال', 'وقال', 'رضي', 'الله', 'عنه', 'عنها', 'عنهم',
  'النبي', 'رسول', 'صلى', 'عليه', 'وسلم', 'رواه', 'متفق', 'عليه',
  'في', 'من', 'الى', 'علي', 'على', 'ان', 'انها', 'انه', 'كان',
  'كانت', 'ما', 'لا', 'ابي', 'ابو', 'بن', 'ابن', 'باب', 'كتاب',
  'هذا', 'هذه', 'ذلك', 'ذلكم', 'الذي', 'التي', 'الذين', 'اللواتي',
  'قد', 'لقد', 'إن', 'إنما', 'إذا', 'إذ', 'حين', 'بعد', 'قبل',
  'لم', 'لن', 'لما', 'هل', 'أ', 'هو', 'هي', 'هم', 'هن', 'أنت',
  'نحن', 'أنا', 'أن', 'ال', 'و', 'ف', 'ب', 'ل', 'ك', 'كما',
])

function extractDistinctivePhrases(text, minLen = 4, maxPhrases = 30) {
  const normalized = normalizeForSearch(text)
  const words = normalized.split(/\s+/).filter(w => w.length >= minLen && !STOPWORDS.has(w))
  
  // Extract overlapping phrases of different lengths
  const phrases = new Set()
  
  // Long phrases (8-12 words) - most distinctive
  for (const len of [12, 10, 8, 6]) {
    for (let i = 0; i + len <= words.length && phrases.size < maxPhrases; i += Math.max(1, Math.floor(len / 3))) {
      const phrase = words.slice(i, i + len).join(' ')
      if (phrase.length > 15) phrases.add(phrase)
    }
  }
  
  // Also add individual long words (names, places, etc.)
  for (const word of words) {
    if (word.length > 5 && phrases.size < maxPhrases + 10) {
      phrases.add(word)
    }
  }
  
  return [...phrases].slice(0, maxPhrases + 10)
}

// ============================================================
// MATCHING ENGINE
// ============================================================

function scoreMatch(phrases, sharhText, normalizedSharh) {
  if (!sharhText || sharhText.length < 30) return 0
  
  let foundPhrases = 0
  let totalScore = 0
  
  for (const phrase of phrases) {
    // Search in normalized text
    if (normalizedSharh.includes(phrase)) {
      foundPhrases++
      totalScore += phrase.length  // Longer phrases get more weight
    }
  }
  
  if (foundPhrases === 0) return 0
  
  // Base score: how many phrases found
  const phraseScore = foundPhrases / phrases.length
  
  // Bonus for finding the very first distinctive phrase (strong indicator)
  const firstPhrase = phrases[0]
  const firstFound = firstPhrase && normalizedSharh.includes(firstPhrase) ? 0.2 : 0
  
  return Math.min(1.0, phraseScore + firstFound)
}

// ============================================================
// SHARH POOL ANALYZER
// ============================================================

function analyzeSharhPool(pool) {
  // Pre-normalize all sharh texts for fast searching
  return pool.map((text, idx) => ({
    idx,
    text,
    normalized: text ? normalizeForSearch(text) : '',
    length: text ? text.length : 0,
  }))
}

// ============================================================
// FIND BEST SHARH MATCH FOR EACH HADITH
// ============================================================

function findBestSharh(phrases, analyzedPool, threshold = 0.15) {
  let bestScore = 0
  let bestIdx = -1
  let scores = []
  
  for (const sharh of analyzedPool) {
    const score = scoreMatch(phrases, sharh.text, sharh.normalized)
    if (score > 0) {
      scores.push({ idx: sharh.idx, score })
    }
    if (score > bestScore) {
      bestScore = score
      bestIdx = sharh.idx
    }
  }
  
  // Sort scores descending
  scores.sort((a, b) => b.score - a.score)
  
  return {
    bestIdx: bestScore >= threshold ? bestIdx : -1,
    bestScore,
    allScores: scores.slice(0, 5), // Top 5 scores
    foundPhrases: scores.filter(s => s.score > 0).length,
    totalScored: scores.length,
  }
}

// ============================================================
// MAIN LOGIC
// ============================================================

async function main() {
  console.log('╔═══════════════════════════════════════════════╗')
  console.log('║  إعادة بناء مطابقة المتن والشرح  ║')
  console.log('╚═══════════════════════════════════════════════╝')
  console.log()
  
  // Load data
  console.log('Loading current data...')
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
  const entries = data.entries
  const pool = data.sharhPool
  
  console.log(`  Entries: ${Object.keys(entries).length}`)
  console.log(`  Sharh pool: ${pool.length} texts`)
  console.log()
  
  // Pre-analyze all sharh texts
  console.log('Analyzing sharh pool...')
  const analyzedPool = analyzeSharhPool(pool)
  console.log(`  Analyzed ${analyzedPool.length} texts`)
  console.log()
  
  // ============================================================
  // STEP 1: Match BOOK hadiths (680-1896)
  // ============================================================
  console.log('═'.repeat(50))
  console.log('STEP 1: Matching book hadiths (680-1896)...')
  console.log()
  
  const BOOKS = [
    ['1', 680, 726], ['2', 727, 777], ['3', 778, 812], ['4', 813, 843],
    ['5', 844, 893], ['6', 894, 955], ['7', 956, 990], ['8', 991, 1267],
    ['9', 1268, 1270], ['10', 1271, 1284], ['11', 1285, 1375], ['12', 1376, 1392],
    ['13', 1393, 1396], ['14', 1397, 1407], ['15', 1408, 1464], ['16', 1465, 1510],
    ['17', 1511, 1807], ['18', 1808, 1868], ['19', 1869, 1896],
  ]
  
  const corrections = []  // { key, oldSharh, newSharh, score, wasError, newScore }
  let totalCorrected = 0
  let totalVerified = 0
  let totalNotFound = 0
  
  // Store results
  const newEntries = {}
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
  
  // First, copy introduction entries as-is
  for (const [key, entry] of Object.entries(entries)) {
    if (key.startsWith('riyadussalihin:introduction:')) {
      newEntries[key] = { ...entry }
    }
  }
  
  // Process book hadiths
  for (const [bookNum, start, end] of BOOKS) {
    for (let n = start; n <= end; n++) {
      const key = `riyadussalihin:${bookNum}:${n}`
      const entry = entries[key]
      if (!entry) continue
      
      const matn = entry.matn || entry.text || ''
      if (!matn || matn.length < 20) {
        newEntries[key] = { ...entry, sharh: -1, source: 'no_sharh' }
        totalNotFound++
        continue
      }
      
      // Extract distinctive phrases from matn
      const phrases = extractDistinctivePhrases(matn)
      
      // Find best matching sharh
      const result = findBestSharh(phrases, analyzedPool)
      
      const oldSharh = entry.sharh
      let isError = false
      
      if (result.bestIdx >= 0) {
        // A matching sharh was found
        if (oldSharh !== result.bestIdx) {
          isError = true
          
          // Check if old sharh also contains the hadith text
          let oldScore = 0
          if (typeof oldSharh === 'number' && oldSharh >= 0 && oldSharh < pool.length) {
            oldScore = scoreMatch(phrases, pool[oldSharh], analyzedPool[oldSharh]?.normalized || '')
          }
          
          // Only correct if new sharh is significantly better
          if (result.bestScore > oldScore * 1.3) {
            corrections.push({
              key,
              oldSharh,
              newSharh: result.bestIdx,
              oldScore: Math.round(oldScore * 100),
              newScore: Math.round(result.bestScore * 100),
              matnPreview: matn.slice(0, 80),
              sharhPreview: pool[result.bestIdx]?.slice(0, 100) || '',
            })
            
            // Add to new pool
            const poolIdx = addToPool(pool[result.bestIdx])
            newEntries[key] = {
              ...entry,
              sharh: poolIdx,
              source: 'text_match',
              matchConfidence: Math.round(result.bestScore * 100),
            }
            totalCorrected++
            continue
          }
        }
        
        // Keep original but verify
        if (oldSharh >= 0 && oldSharh < pool.length) {
          const poolIdx = addToPool(pool[oldSharh])
          newEntries[key] = {
            ...entry,
            sharh: poolIdx,
            source: entry.source || 'original',
            matchConfidence: result.bestScore > 0 ? Math.round(result.bestScore * 100) : 0,
          }
          totalVerified++
        } else {
          newEntries[key] = { ...entry, sharh: -1, source: 'no_sharh' }
          totalNotFound++
        }
      } else {
        // No matching sharh found at all
        if (typeof oldSharh === 'number' && oldSharh >= 0 && oldSharh < pool.length) {
          // Keep old sharh but note low confidence
          const poolIdx = addToPool(pool[oldSharh])
          newEntries[key] = {
            ...entry,
            sharh: poolIdx,
            source: 'low_confidence',
            matchConfidence: 0,
          }
          totalVerified++
        } else {
          newEntries[key] = { ...entry, sharh: -1, source: 'no_sharh' }
          totalNotFound++
        }
      }
    }
  }
  
  console.log(`  Total corrected: ${totalCorrected}`)
  console.log(`  Total verified (unchanged): ${totalVerified}`)
  console.log(`  Total not found: ${totalNotFound}`)
  console.log()
  
  // Store corrections in entries
  // (corrections is used for reporting)
  
  // ============================================================
  // STEP 2: Match INTRODUCTION entries (1-679)
  // ============================================================
  console.log('═'.repeat(50))
  console.log('STEP 2: Processing introduction entries...')
  console.log()
  
  let introMatched = 0
  let introUnchanged = 0
  
  // For introduction entries, the text field contains the page text.
  // Try to find which sharh text matches each entry.
  for (let i = 1; i <= 679; i++) {
    const key = `riyadussalihin:introduction:${i}`
    const entry = newEntries[key]
    if (!entry) continue
    
    const text = entry.text || entry.matn || ''
    if (!text || text.length < 30) continue
    
    // Extract distinctive phrases from the page text
    const phrases = extractDistinctivePhrases(text, 5, 20)
    
    // Find best matching sharh
    const result = findBestSharh(phrases, analyzedPool, 0.1)
    
    if (result.bestIdx >= 0 && result.bestScore > 0.2) {
      const oldSharh = entry.sharh
      if (oldSharh !== result.bestIdx) {
        // Check if old sharh is better
        let oldScore = 0
        if (typeof oldSharh === 'number' && oldSharh >= 0 && oldSharh < pool.length) {
          oldScore = scoreMatch(phrases, pool[oldSharh], analyzedPool[oldSharh]?.normalized || '')
        }
        if (result.bestScore > oldScore * 1.2) {
          const poolIdx = addToPool(pool[result.bestIdx])
          newEntries[key] = {
            ...entry,
            sharh: poolIdx,
            source: 'text_match_intro',
            matchConfidence: Math.round(result.bestScore * 100),
          }
          introMatched++
        } else {
          introUnchanged++
        }
      } else {
        introUnchanged++
      }
    } else {
      introUnchanged++
    }
  }
  
  console.log(`  Introduction entries matched: ${introMatched}`)
  console.log(`  Introduction entries unchanged: ${introUnchanged}`)
  console.log()
  
  // ============================================================
  // STEP 3: Check for hadiths whose sharh was NOT updated but DON'T contain the matn
  // ============================================================
  console.log('═'.repeat(50))
  console.log('STEP 3: Flagging remaining mismatches...')
  console.log()
  
  let remainingMismatches = 0
  const flaggedEntries = []
  
  for (const [key, entry] of Object.entries(newEntries)) {
    if (key.startsWith('riyadussalihin:introduction:')) continue
    if (typeof entry.sharh !== 'number' || entry.sharh < 0) continue
    if (entry.sharh >= newPool.length) continue
    
    const sharhText = newPool[entry.sharh]
    const matn = entry.matn || entry.text || ''
    
    if (!matn || matn.length < 30) continue
    if (!sharhText || sharhText.length < 30) continue
    
    // Check if distinctive phrases from matn appear in sharh
    const phrases = extractDistinctivePhrases(matn, 4, 15)
    const normalizedSharh = normalizeForSearch(sharhText)
    
    let foundCount = 0
    for (const phrase of phrases) {
      if (normalizedSharh.includes(phrase)) foundCount++
    }
    
    const ratio = foundCount / Math.max(1, phrases.length)
    if (ratio < 0.1 && foundCount < 2) {
      remainingMismatches++
      flaggedEntries.push({
        key,
        sharhIdx: entry.sharh,
        foundPhrases: foundCount,
        totalPhrases: phrases.length,
        ratio: Math.round(ratio * 100),
        matnPreview: matn.slice(0, 80),
        sharhPreview: sharhText.slice(0, 80),
      })
    }
  }
  
  console.log(`  Remaining potential mismatches: ${remainingMismatches}`)
  if (flaggedEntries.length > 0) {
    console.log('  First 10 flagged entries:')
    for (const f of flaggedEntries.slice(0, 10)) {
      console.log(`    ${f.key}: ${f.foundPhrases}/${f.totalPhrases} phrases found (${f.ratio}%)`)
      console.log(`      MATN: ${f.matnPreview}`)
      console.log(`      SHARH: ${f.sharhPreview}`)
    }
  }
  console.log()
  
  // ============================================================
  // STEP 4: Build report
  // ============================================================
  console.log('═'.repeat(50))
  console.log('STEP 4: Building report...')
  console.log()
  
  // Count corrections by book
  const correctionsByBook = {}
  for (const c of corrections) {
    const match = c.key.match(/riyadussalihin:(\w+):(\d+)/)
    if (match) {
      const book = match[1]
      correctionsByBook[book] = (correctionsByBook[book] || 0) + 1
    }
  }
  
  const report = {
    summary: {
      totalEntries: Object.keys(newEntries).length,
      corrected: totalCorrected,
      verified: totalVerified,
      notFound: totalNotFound,
      introMatched,
      remainingMismatches,
      uniqueSharhTexts: newPool.length,
      oldUniqueSharhTexts: pool.length,
    },
    correctionsByBook,
    corrections: corrections.slice(0, 200), // Cap at 200 for readability
    flaggedEntries: flaggedEntries.slice(0, 50),
    // Examples of corrections
    sampleCorrections: corrections.slice(0, 20).map(c => ({
      key: c.key,
      oldSharhPreview: pool[c.oldSharh]?.slice(0, 150) || 'N/A',
      newSharhPreview: pool[c.newSharh]?.slice(0, 150) || 'N/A',
      confidence: `${c.oldScore}% -> ${c.newScore}%`,
    })),
  }
  
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8')
  console.log(`  Wrote ${REPORT_FILE}`)
  console.log()
  
  // ============================================================
  // STEP 5: Build and save corrected data
  // ============================================================
  console.log('═'.repeat(50))
  console.log('STEP 5: Saving corrected data...')
  console.log()
  
  const correctedStats = {
    totalEntries: Object.keys(newEntries).length,
    withSharh: Object.values(newEntries).filter(e => typeof e.sharh === 'number' && e.sharh >= 0).length,
    withoutSharh: Object.values(newEntries).filter(e => typeof e.sharh !== 'number' || e.sharh < 0).length,
    correctedCount: totalCorrected,
    uniqueSharhTexts: newPool.length,
    schemaVersion: 22,
    buildDate: new Date().toISOString(),
    correctionPolicy: 'text_similarity: كل متن تم البحث عنه داخل كل نص شرح. المطابقة تعتمد على وجود جمل مميزة من المتن داخل الشرح.',
  }
  
  const output = {
    meta: {
      ...data.meta,
      ...correctedStats,
    },
    sharhPool: newPool,
    entries: newEntries,
  }
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8')
  
  const fileSize = (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(1)
  console.log(`  Written: ${OUTPUT_FILE} (${fileSize} MB)`)
  console.log()
  
  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('╔═══════════════════════════════════════════════╗')
  console.log('║  الملخص النهائي  ║')
  console.log('╚═══════════════════════════════════════════════╝')
  console.log()
  console.log(`  إجمالي الأحاديث: ${correctedStats.totalEntries}`)
  console.log(`  أحاديث مع شرح: ${correctedStats.withSharh}`)
  console.log(`  أحاديث بدون شرح: ${correctedStats.withoutSharh}`)
  console.log(`  تم تصحيح: ${totalCorrected} حديثاً`)
  console.log(`  تم التحقق (دون تغيير): ${totalVerified} حديثاً`)
  console.log(`  نصوص شرح فريدة: ${newPool.length} (كانت ${pool.length})`)
  console.log(`  مشاكل متبقية: ${remainingMismatches} حديثاً`)
  console.log()
  
  // Output specific examples
  if (corrections.length > 0) {
    console.log('أمثلة على التصحيحات:')
    for (const c of corrections.slice(0, 5)) {
      console.log(`  ${c.key}`)
      console.log(`    قبل: [${c.oldScore}%] ${(pool[c.oldSharh] || '').slice(0, 80)}...`)
      console.log(`    بعد: [${c.newScore}%] ${(pool[c.newSharh] || '').slice(0, 80)}...`)
      console.log()
    }
  }
  
  console.log('تم الانتهاء!')
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
