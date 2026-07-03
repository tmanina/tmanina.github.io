#!/usr/bin/env node
/**
 * rebuild-sharh-v3-topic.mjs
 *
 * المطابقة الذكية - التحقق من تطابق الموضوع بين المتن والشرح
 *
 * الاستراتيجية:
 * 1. استخدام بيانات API لمعرفة الباب (chapterId) لكل حديث
 * 2. بناء خريطة موضوعات فقهية من نصوص الأبواب
 * 3. تحليل موضوع كل شرح من خلال كلماته المفتاحية
 * 4. التحقق: هل موضوع الحديث يطابق موضوع الشرح؟
 * 5. إذا لم يطابق، البحث عن الشرح الصحيح ذي الموضوع المطابق
 * 6. بناء الملف المصحح النهائي
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const API_FILE = path.join(__dirname, '..', 'public', 'data', 'riyad-api.json')
const SHAMELA_FILE = path.join(__dirname, '..', 'public', 'data', 'riyad-uthaymeen-shamela-final.json')
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'data', 'riyad-shamela-corrected.json')
const REPORT_FILE = path.join(__dirname, '..', 'public', 'data', 'sharh-v3-report.json')

// ============================================================
// TOPIC KEYWORD MAP - خريطة الموضوعات الفقهية
// ============================================================

// Each topic has:
// - keywords: words that strongly indicate this topic
// - babKeywords: words from the باب title
// - hadithExamples: distinctive phrases that appear in hadiths of this topic

const TOPIC_MAP = {
  'الايمان': {
    keywords: ['الإيمان', 'الإسلام', 'الإحسان', 'شهادة', 'توحيد', 'عبادة', 'إخلاص', 'نية'],
    babKeywords: ['إيمان', 'توحيد', 'عبادة', 'إخلاص'],
  },
  'الصلاة': {
    keywords: ['صلاة', 'الصلاة', 'صلوا', 'ركعة', 'سجود', 'ركوع', 'وضوء', 'طهارة', 'الوضوء', 'أذان', 'المسجد', 'القبلة'],
    babKeywords: ['صلاة', 'صلاة', 'مسجد', 'وضوء'],
  },
  'الزكاة': {
    keywords: ['زكاة', 'الزكاة', 'صدقة', 'الصدقة', 'زكوة'],
    babKeywords: ['زكاة', 'صدقة'],
  },
  'الصيام': {
    keywords: ['صيام', 'صوم', 'الصوم', 'رمضان', 'صائم', 'صام'],
    babKeywords: ['صوم', 'صيام', 'رمضان'],
  },
  'الحج': {
    keywords: ['حج', 'الحج', 'عمرة', 'العمرة', 'مكة', 'المدينة', 'البيت', 'الكعبة', 'مزدلفة', 'عرفة', 'منى'],
    babKeywords: ['حج', 'عمرة', 'مناسك'],
  },
  'الجهاد': {
    keywords: ['جهاد', 'الجهاد', 'غزو', 'غزوة', 'قتال', 'القتال', 'هجرة', 'الهجرة', 'غاز', 'ربيطة', 'رباط'],
    babKeywords: ['جهاد', 'غزو', 'قتال', 'هجرة'],
  },
  'العلم': {
    keywords: ['علم', 'العلم', 'تعلم', 'يتعلم', 'معلم', 'فتوى', 'يفتي', 'مجتهد'],
    babKeywords: ['علم', 'تعلم', 'فتوى'],
  },
  'الذكر والدعاء': {
    keywords: ['ذكر', 'الذكر', 'دعاء', 'الدعاء', 'يدعو', 'ادع', 'سبحان', 'الحمد', 'الله أكبر', 'استغفر'],
    babKeywords: ['ذكر', 'دعاء', 'دعوات', 'استغفار'],
  },
  'التوبة': {
    keywords: ['توبة', 'التوبة', 'تبت', 'تائب', 'ندم', 'استغفار'],
    babKeywords: ['توبة', 'استغفار'],
  },
  'الصبر': {
    keywords: ['صبر', 'الصبر', 'اصبر', 'صابر', 'صبراً', 'احتساب', 'ابتلاء'],
    babKeywords: ['صبر', 'ابتلاء'],
  },
  'الآداب والأخلاق': {
    keywords: ['أدب', 'أخلاق', 'بر', 'صلة', 'رحم', 'والدين', 'جيران', 'الحياء', 'الكرم', 'الصدق', 'الكذب'],
    babKeywords: ['أدب', 'أخلاق', 'بر', 'صلة'],
  },
  'الطعام والشراب': {
    keywords: ['طعام', 'الطعام', 'أكل', 'الأكل', 'شرب', 'الشراب', 'بسمل', 'يمين', 'شمال', 'لقمة'],
    babKeywords: ['طعام', 'أكل', 'شرب'],
  },
  'اللباس والزينة': {
    keywords: ['لباس', 'اللباس', 'كُسوة', 'ثياب', 'ثوب', 'نعال', 'خف', 'عمامة', 'لبس', 'يرتدي'],
    babKeywords: ['لباس', 'زينة', 'ثياب'],
  },
  'النكاح': {
    keywords: ['نكاح', 'النكاح', 'زواج', 'تزوج', 'زوج', 'زوجة', 'خطبة', 'مهر', 'وليمة'],
    babKeywords: ['نكاح', 'زواج'],
  },
  'الطلاق': {
    keywords: ['طلاق', 'الطلاق', 'مطلقة', 'عدة', 'خلع'],
    babKeywords: ['طلاق'],
  },
  'البيوع': {
    keywords: ['بيع', 'البيع', 'شراء', 'تجارة', 'ربا', 'الربا', 'كيل', 'ميزان', 'دين'],
    babKeywords: ['بيع', 'شراء', 'تجارة'],
  },
  'اليمين والنذر': {
    keywords: ['يمين', 'أيمان', 'حلف', 'الحلف', 'نذر', 'النذر', 'قسم'],
    babKeywords: ['يمين', 'نذر'],
  },
  'الحدود والجنايات': {
    keywords: ['حد', 'الحد', 'جلد', 'رجم', 'قطع', 'سارق', 'زاني', 'قاتل', 'قصاص'],
    babKeywords: ['حدود', 'جنايات', 'قصاص'],
  },
  'السفر': {
    keywords: ['سفر', 'السفر', 'مسافر', 'سائق', 'ركوب', 'دابة', 'سيارة'],
    babKeywords: ['سفر', 'سير'],
  },
  'عيادة المريض والموت': {
    keywords: ['مريض', 'مرض', 'عيادة', 'موت', 'الموت', 'وفاة', 'مات', 'قبر', 'الدفن', 'الجنازة', 'احتضار'],
    babKeywords: ['عيادة', 'مريض', 'موت', 'جنازة', 'دفن'],
  },
  'الفتن': {
    keywords: ['فتنة', 'الفتن', 'دجال', 'المسيخ', 'الساعة', 'القيامة', 'أشراط'],
    babKeywords: ['فتنة', 'دجال', 'ساعة'],
  },
  'الرقاق والزهد': {
    keywords: ['زهد', 'الزهد', 'رقاق', 'توكل', 'التوكل', 'يقين', 'خوف', 'الخوف', 'رجاء', 'الرجاء'],
    babKeywords: ['زهد', 'توكل', 'يقين', 'خوف'],
  },
}

// Companion names that can help identify hadiths
const COMPANIONS = [
  'أبو هريرة', 'ابن عمر', 'أنس', 'عائشة', 'ابن عباس', 'جابر', 'أبو سعيد',
  'أبو موسى', 'ابن مسعود', 'عمر', 'علي', 'أبو ذر', 'معاوية', 'سعد',
  'سلمان', 'بلال', 'صهيب', 'خالد', 'أبو أيوب', 'أبو بكرة',
  'البراء', 'حذيفة', 'أبو أمامة', 'عبد الله بن عمرو', 'أبو الدرداء',
  'أبو طلحة', 'أبو هريرة', 'أبو هريرة', 'زيد بن أرقم', 'النعمان بن بشير',
]

// ============================================================
// TEXT PROCESSING
// ============================================================

function stripHtml(text) {
  return text ? text.replace(/<[^>]+>/g, '').trim() : ''
}

function normalize(text) {
  if (!text) return ''
  return text
    .replace(/[ًٌٍَُِّ~ْٰٕٖٓٔٔ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ؤ]/g, 'و')
    .replace(/[ئ]/g, 'ي')
    .replace(/[ة]/g, 'ه')
    .replace(/[ىٰ]/g, 'ي')
    .replace(/[\u200c-\u200f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeForSearch(text) {
  return normalize(text)
    .replace(/[^ا-ي0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ============================================================
// TOPIC DETECTION
// ============================================================

function detectTopic(text, defaultTopic = 'غير معروف') {
  if (!text || text.length < 10) return defaultTopic
  
  const normalized = normalizeForSearch(text)
  const scores = {}
  
  for (const [topic, data] of Object.entries(TOPIC_MAP)) {
    let score = 0
    for (const kw of data.keywords) {
      const kwNorm = normalizeForSearch(kw)
      const regex = new RegExp(kwNorm.replace(/\s+/g, '\\s+'), 'gi')
      const matches = (normalized.match(regex) || []).length
      score += matches * 2 // Keyword match = 2 points
    }
    for (const kw of data.babKeywords) {
      const kwNorm = normalizeForSearch(kw)
      const regex = new RegExp(kwNorm.replace(/\s+/g, '\\s+'), 'gi')
      const matches = (normalized.match(regex) || []).length
      score += matches * 3 // باب keyword = 3 points (stronger)
    }
    if (score > 0) scores[topic] = score
  }
  
  if (Object.keys(scores).length === 0) return defaultTopic
  
  // Return the topic with highest score
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]
}

function detectTopics(text) {
  // Returns ALL topics found with scores
  if (!text || text.length < 10) return []
  
  const normalized = normalizeForSearch(text)
  const results = []
  
  for (const [topic, data] of Object.entries(TOPIC_MAP)) {
    let score = 0
    let matches = []
    
    for (const kw of data.keywords) {
      const kwNorm = normalizeForSearch(kw)
      const regex = new RegExp(kwNorm.replace(/\s+/g, '\\s+'), 'gi')
      const found = (normalized.match(regex) || [])
      if (found.length > 0) {
        score += found.length * 2
        matches.push(kw)
      }
    }
    for (const kw of data.babKeywords) {
      const kwNorm = normalizeForSearch(kw)
      const regex = new RegExp(kwNorm.replace(/\s+/g, '\\s+'), 'gi')
      const found = (normalized.match(regex) || [])
      if (found.length > 0) {
        score += found.length * 3
        matches.push('[' + kw + ']')
      }
    }
    
    if (score > 0) {
      results.push({ topic, score, matches: matches.slice(0, 5) })
    }
  }
  
  return results.sort((a, b) => b.score - a.score)
}

function topicCompatibility(hadithTopics, sharhTopics) {
  // Score how well the hadith's topics match the sharh's topics
  if (hadithTopics.length === 0 || sharhTopics.length === 0) return 0
  
  let matchScore = 0
  let totalHadithScore = 0
  
  for (const ht of hadithTopics) {
    totalHadithScore += ht.score
    for (const st of sharhTopics) {
      if (ht.topic === st.topic) {
        // Same topic = strong match
        matchScore += ht.score * st.score
      }
    }
  }
  
  // Normalize
  if (totalHadithScore === 0) return 0
  const baseScore = matchScore / (totalHadithScore * 100)
  
  // Bonus for top topic match
  if (hadithTopics[0] && sharhTopics[0] && hadithTopics[0].topic === sharhTopics[0].topic) {
    return Math.min(1.0, baseScore + 0.3)
  }
  
  return Math.min(1.0, baseScore)
}

// ============================================================
// MAIN LOGIC
// ============================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  المطابقة الذكية - التحقق من تطابق الموضوع    ║')
  console.log('╚══════════════════════════════════════════════════╝')
  console.log()
  
  // Load data
  console.log('Loading data...')
  const apiData = JSON.parse(fs.readFileSync(API_FILE, 'utf8'))
  const shamelaData = JSON.parse(fs.readFileSync(SHAMELA_FILE, 'utf8'))
  const localEntries = shamelaData.entries
  const oldPool = shamelaData.sharhPool
  
  console.log(`  API hadiths: ${apiData.hadiths.length}`)
  console.log(`  Local entries: ${Object.keys(localEntries).length}`)
  console.log(`  Old sharh pool: ${oldPool.length}`)
  console.log()
  
  // ============================================================
  // STEP 1: Build API lookup by text
  // ============================================================
  console.log('STEP 1: Building API hadith lookup...')
  
  const apiByText = []
  for (const h of apiData.hadiths) {
    const text = stripHtml(h.arabic || '')
    if (text.length > 30) {
      apiByText.push({
        idInBook: h.idInBook,
        chapterId: h.chapterId,
        chapterTitle: (apiData.chapters.find(c => c.id === h.chapterId) || {}).arabic || '',
        text,
        normalized: normalizeForSearch(text),
        topics: detectTopics(text),
      })
    }
  }
  
  console.log(`  Analyzed ${apiByText.length} API hadiths`)
  console.log()
  
  // ============================================================
  // STEP 2: Analyze sharh pool topics
  // ============================================================
  console.log('STEP 2: Analyzing sharh pool topics...')
  
  const analyzedSharh = oldPool.map((text, idx) => ({
    idx,
    text: text || '',
    normalized: text ? normalizeForSearch(text) : '',
    length: text ? text.length : 0,
    topics: text ? detectTopics(text) : [],
    topic: text ? detectTopic(text) : 'غير معروف',
  }))
  
  // Statistics
  const topicCounts = {}
  for (const s of analyzedSharh) {
    if (s.topic !== 'غير معروف') {
      topicCounts[s.topic] = (topicCounts[s.topic] || 0) + 1
    }
  }
  
  console.log('  Sharh topics:')
  for (const [topic, count] of Object.entries(topicCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${topic}: ${count}`)
  }
  console.log()
  
  // ============================================================
  // STEP 3: Map each local entry to API hadith
  // ============================================================
  console.log('STEP 3: Mapping local entries to API hadiths...')
  
  const localToApi = new Map()
  let mappedByText = 0
  let mappedByNumber = 0
  let notMapped = 0
  
  for (const [key, entry] of Object.entries(localEntries)) {
    const matn = normalizeForSearch(entry.matn || entry.text || '')
    if (!matn || matn.length < 20) {
      localToApi.set(key, null)
      notMapped++
      continue
    }
    
    // Extract key phrases from matn for matching
    const matnWords = matn.split(/\s+/).filter(w => w.length > 2)
    const firstWords = matnWords.slice(0, 8).join(' ')
    
    let bestScore = 0
    let bestApi = null
    
    for (const api of apiByText) {
      // Score: how many of the first words appear in API text
      let matchCount = 0
      for (const word of matnWords.slice(0, 5)) {
        if (api.normalized.includes(word)) matchCount++
      }
      const score = matchCount / Math.min(5, matnWords.length)
      if (score > bestScore) {
        bestScore = score
        bestApi = api
      }
    }
    
    if (bestScore > 0.5 && bestApi) {
      localToApi.set(key, bestApi)
      mappedByText++
    } else {
      // Try matching by hadith number
      const match = key.match(/:(\d+)$/)
      if (match) {
        const num = parseInt(match[1])
        // Look for API hadith with similar first words
        for (const api of apiByText) {
          const apiFirstWords = api.normalized.split(/\s+/).slice(0, 5).join(' ')
          if (firstWords.length > 5 && firstWords === apiFirstWords.slice(0, firstWords.length)) {
            localToApi.set(key, api)
            mappedByNumber++
            break
          }
        }
      }
      
      if (!localToApi.has(key)) {
        localToApi.set(key, null)
        notMapped++
      }
    }
  }
  
  console.log(`  Mapped by text: ${mappedByText}`)
  console.log(`  Mapped by number: ${mappedByNumber}`)
  console.log(`  Not mapped: ${notMapped}`)
  console.log()
  
  // ============================================================
  // STEP 4: SMART MATCHING - topic-aware
  // ============================================================
  console.log('STEP 4: Smart topic-aware matching...')
  
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
  
  let stats = { total: 0, matched: 0, corrected: 0, topicMismatch: 0, noSharh: 0 }
  const corrections = []
  const mismatches = []
  const correctEntries = {}
  
  // Process all entries using smart matching
  for (const [key, entry] of Object.entries(localEntries)) {
    stats.total++
    const apiInfo = localToApi.get(key)
    const matn = entry.matn || entry.text || ''
    const oldSharh = entry.sharh
    const isIntro = key.startsWith('riyadussalihin:introduction:')
    
    // Get hadith topic from API
    let hadithTopic = null
    let hadithTopics = []
    if (apiInfo) {
      hadithTopic = apiInfo.chapterTitle || detectTopic(matn)
      hadithTopics = apiInfo.topics.length > 0 
        ? apiInfo.topics 
        : detectTopics(matn)
    } else if (matn.length > 20) {
      hadithTopics = detectTopics(matn)
      hadithTopic = hadithTopics[0]?.topic || 'غير معروف'
    }
    
    // Find best sharh by topic compatibility
    let bestSharhIdx = -1
    let bestCompatibility = 0
    
    for (const sharh of analyzedSharh) {
      if (!sharh.text || sharh.text.length < 30) continue
      
      // Calculate topic compatibility
      const compat = topicCompatibility(hadithTopics, sharh.topics)
      
      // Bonus: same chapter title phrases
      let chapterBonus = 0
      if (apiInfo && sharh.text.includes('باب')) {
        const chapterWords = normalizeForSearch(apiInfo.chapterTitle).split(/\s+/)
        for (const w of chapterWords) {
          if (w.length > 3 && sharh.normalized.includes(w)) {
            chapterBonus += 0.05
          }
        }
      }
      
      const totalScore = compat + chapterBonus
      
      if (totalScore > bestCompatibility) {
        bestCompatibility = totalScore
        bestSharhIdx = sharh.idx
      }
    }
    
    // Decision
    const oldIsValid = typeof oldSharh === 'number' && oldSharh >= 0 && oldSharh < oldPool.length
    const newIsBetter = bestSharhIdx >= 0 && bestCompatibility > 0.4
    
    if (newIsBetter) {
      if (oldIsValid) {
        // Check if old sharh is compatible
        const oldSharhInfo = analyzedSharh[oldSharh]
        const oldCompat = topicCompatibility(hadithTopics, oldSharhInfo?.topics || [])
        
        if (bestSharhIdx !== oldSharh && bestCompatibility > oldCompat * 1.3) {
          // Correction!
          const poolIdx = addToPool(oldPool[bestSharhIdx])
          correctEntries[key] = {
            ...entry,
            sharh: poolIdx,
            source: 'topic_match_v3',
            topicMatch: Math.round(bestCompatibility * 100),
            hadithTopic: hadithTopic,
            sharhTopic: analyzedSharh[bestSharhIdx]?.topic || 'غير معروف',
          }
          stats.corrected++
          corrections.push({
            key, oldSharh, newSharh: bestSharhIdx,
            oldCompat: Math.round(oldCompat * 100),
            newCompat: Math.round(bestCompatibility * 100),
            hadithTopic,
            oldSharhTopic: analyzedSharh[oldSharh]?.topic || 'غير معروف',
            newSharhTopic: analyzedSharh[bestSharhIdx]?.topic || 'غير معروف',
          })
        } else {
          // Keep original
          const poolIdx = addToPool(oldPool[oldSharh])
          correctEntries[key] = { ...entry, sharh: poolIdx, source: 'original' }
          stats.matched++
        }
      } else {
        // Hadith had no sharh, now found one
        const poolIdx = addToPool(oldPool[bestSharhIdx])
        correctEntries[key] = {
          ...entry,
          sharh: poolIdx,
          source: 'topic_match_v3',
          topicMatch: Math.round(bestCompatibility * 100),
          hadithTopic,
          sharhTopic: analyzedSharh[bestSharhIdx]?.topic || 'غير معروف',
        }
        stats.corrected++
        corrections.push({
          key, oldSharh: -1, newSharh: bestSharhIdx,
          oldCompat: 0, newCompat: Math.round(bestCompatibility * 100),
          hadithTopic, newSharhTopic: analyzedSharh[bestSharhIdx]?.topic || 'غير معروف',
        })
      }
    } else if (oldIsValid) {
      // Check if old sharh is compatible with hadith topic
      const oldCompat = topicCompatibility(
        hadithTopics,
        analyzedSharh[oldSharh]?.topics || []
      )
      
      if (oldCompat < 0.1 && matn.length > 30) {
        // Old sharh is incompatible but no better alternative
        stats.topicMismatch++
        mismatches.push({
          key, oldSharh,
          compat: Math.round(oldCompat * 100),
          hadithTopic,
          sharhTopic: analyzedSharh[oldSharh]?.topic || 'غير معروف',
          matnPreview: matn.slice(0, 60),
          sharhPreview: oldPool[oldSharh]?.slice(0, 80),
        })
        
        // Still keep the old sharh (no better alternative)
        const poolIdx = addToPool(oldPool[oldSharh])
        correctEntries[key] = { ...entry, sharh: poolIdx, source: 'topic_mismatch_kept' }
        stats.matched++
      } else {
        const poolIdx = addToPool(oldPool[oldSharh])
        correctEntries[key] = { ...entry, sharh: poolIdx, source: 'original' }
        stats.matched++
      }
    } else {
      correctEntries[key] = { ...entry, sharh: -1, source: 'no_sharh' }
      stats.noSharh++
    }
  }
  
  // Compact pool
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
    } else if (typeof entry.sharh === 'number' && entry.sharh >= 0) {
      entry.sharh = -1
    }
  }
  
  const finalWithSharh = Object.values(correctEntries).filter(e => typeof e.sharh === 'number' && e.sharh >= 0).length
  
  console.log('  Results:')
  console.log(`    Total: ${stats.total}`)
  console.log(`    Corrected (topic improvement): ${stats.corrected}`)
  console.log(`    Matched (unchanged): ${stats.matched}`)
  console.log(`    Topic mismatches flagged: ${stats.topicMismatch}`)
  console.log(`    No sharh: ${stats.noSharh}`)
  console.log(`    With sharh: ${finalWithSharh}`)
  console.log(`    Unique sharh texts: ${compactPool.length}`)
  console.log()
  
  // ============================================================
  // STEP 5: Verify specific examples
  // ============================================================
  console.log('STEP 5: Verifying specific examples...')
  console.log()
  
  // Check the Fatimah hadith
  console.log('--- Looking for Fatimah/Anas hadith ---')
  for (const [key, entry] of Object.entries(correctEntries)) {
    const text = entry.matn || ''
    if (text.includes('أنس') && (text.includes('فاطمة') || text.includes('ثقل')) && !key.includes('introduction')) {
      console.log(`  Found: ${key}`)
      console.log(`  MATN: ${text.slice(0, 120)}`)
      console.log(`  SHARH IDX: ${entry.sharh}`)
      if (entry.sharh >= 0 && compactPool[entry.sharh]) {
        console.log(`  SHARH: ${compactPool[entry.sharh].slice(0, 200)}`)
        const topics = detectTopics(compactPool[entry.sharh])
        console.log(`  SHARH TOPICS: ${topics.map(t => t.topic + '(' + t.score + ')').join(', ')}`)
      }
      console.log()
    }
  }
  
  // Check the "لا هجرة" sharh
  console.log('--- Checking لاهجرة sharh ---')
  for (let i = 0; i < compactPool.length; i++) {
    if (compactPool[i].includes('لا هجرة') || compactPool[i].includes('الهجرة')) {
      const users = Object.entries(correctEntries).filter(([k, e]) => e.sharh === i).length
      console.log(`  Sharh [${i}]: used by ${users} hadiths`)
      if (users > 0) {
        console.log(`  FIRST 200: ${compactPool[i].slice(0, 200)}`)
      }
    }
  }
  console.log()
  
  // ============================================================
  // STEP 6: Save
  // ============================================================
  console.log('STEP 6: Saving corrected data...')
  
  const output = {
    meta: {
      ...shamelaData.meta,
      totalEntries: stats.total,
      withSharh: finalWithSharh,
      withoutSharh: stats.noSharh,
      corrected: stats.corrected,
      topicMismatches: stats.topicMismatch,
      uniqueSharhTexts: compactPool.length,
      schemaVersion: 24,
      buildDate: new Date().toISOString(),
      method: 'topic_matching_v3: Topic-aware matching using API chapter titles + keyword analysis.',
    },
    sharhPool: compactPool,
    entries: correctEntries,
  }
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8')
  const fileSize = (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(1)
  console.log(`  Written: ${OUTPUT_FILE} (${fileSize} MB)`)
  console.log()
  
  // Report
  const report = {
    summary: {
      total: stats.total,
      corrected: stats.corrected,
      matched: stats.matched,
      topicMismatches: stats.topicMismatch,
      noSharh: stats.noSharh,
      withSharh: finalWithSharh,
      uniqueSharhTexts: compactPool.length,
    },
    corrections: corrections.slice(0, 50),
    mismatches: mismatches.slice(0, 50),
  }
  
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8')
  console.log(`  Written: ${REPORT_FILE}`)
  console.log()
  
  // ============================================================
  // FINAL SUMMARY
  // ============================================================
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║  التقرير النهائي - المطابقة الذكية         ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log()
  console.log(`  إجمالي الأحاديث: ${stats.total}`)
  console.log(`  مع شرح: ${finalWithSharh}`)
  console.log(`  بدون شرح: ${stats.noSharh}`)
  console.log(`  تم تصحيح المطابقة: ${stats.corrected}`)
  console.log(`  عدم تطابق موضوعي مكتشف: ${stats.topicMismatch}`)
  console.log(`  نصوص شرح فريدة: ${compactPool.length}`)
  console.log()
  
  if (corrections.length > 0) {
    console.log('نماذج التصحيحات:')
    for (const c of corrections.slice(0, 5)) {
      console.log(`  ${c.key}`)
      console.log(`    الحديث: ${c.hadithTopic}`)
      console.log(`    قبل: [${c.oldCompat}%] ${c.oldSharhTopic}`)
      console.log(`    بعد: [${c.newCompat}%] ${c.newSharhTopic}`)
      console.log()
    }
  }
  
  if (mismatches.length > 0) {
    console.log('نماذج من حالات عدم التطابق (لم نجد بديلاً أفضل):')
    for (const m of mismatches.slice(0, 5)) {
      console.log(`  ${m.key}`)
      console.log(`    حديث عن: ${m.hadithTopic}`)
      console.log(`    شرح عن: ${m.sharhTopic} (توافق: ${m.compat}%)`)
      console.log()
    }
  }
  
  console.log('تم الانتهاء بنجاح! ✓')
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
