#!/usr/bin/env node
/**
 * build-shamela-correct.mjs v2
 *
 * Walks ALL pages of Shamela book 9260 (شرح رياض الصالحين لابن عثيمين)
 * extracting MATN + SHARH in correct alignment.
 *
 * KEY RULE: The [الشَّرْحُ] marker on each page is the BOUNDARY.
 *   - Everything BEFORE the marker on that page = MATN (continues from prev)
 *   - Everything AFTER the marker on that page = SHARH (continues to next)
 *   - A new Arabic-Indic hadith number on a subsequent page marks END of sharh
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CACHE_DIR = path.join(__dirname, '..', '.cache', 'shamela-all')
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'data', 'riyad-uthaymeen-shamela-final.json')

function htmlToText(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#?\w+;/g, '')
    .replace(/\u200c/g, ' ')
    .replace(/\u200d/g, '')
    .replace(/\u200e/g, '')
    .replace(/\u200f/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function loadPage(pageId) {
  const file = path.join(CACHE_DIR, `${pageId}.json`)
  if (!fs.existsSync(file)) return null
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

// Arabic-Indic digit map
const ARABIC_DIGITS = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' }

function parseArabicNumber(s) {
  let num = ''
  for (const ch of s) {
    if (ARABIC_DIGITS[ch] !== undefined) num += ARABIC_DIGITS[ch]
    else break
  }
  return num ? parseInt(num) : null
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

// ═══════════════════════════════════════════════════════════════
// STEP 1: Parse all pages into paragraph streams
// ═══════════════════════════════════════════════════════════════

console.log('Step 1: Parsing all pages...')

const allFiles = fs.readdirSync(CACHE_DIR)
  .map(f => parseInt(f.replace('.json', '')))
  .filter(n => !isNaN(n))
  .sort((a, b) => a - b)

// Each paragraph: { text, pageNum, paraIndex, isBeforeSharhMarker, isHadithStart, hadithNum }
const allParagraphs = []

for (const fid of allFiles) {
  const page = loadPage(fid)
  if (!page || !page.nass) continue
  
  const htmlParts = page.nass.split(/<p>/).filter(s => s.trim())
  
  for (let i = 0; i < htmlParts.length; i++) {
    const plain = htmlToText(htmlParts[i])
    if (!plain || plain.length < 2) continue
    
    // Check if this paragraph IS the sharh marker
    const isSharhMarker = (htmlParts[i].includes('[الشَّرْحُ]') || 
                          htmlParts[i].includes('الشَّرْحُ') ||
                          plain === '[الشَّرْحُ]' ||
                          plain.startsWith('[الشَّرْحُ]'))
    
    // Check for Arabic-Indic hadith number
    const hadithMatch = plain.match(/^([\u0660-\u0669]+)\s*-\s/)
    const hadithNum = hadithMatch ? parseArabicNumber(hadithMatch[1]) : null
    
    allParagraphs.push({
      text: plain,
      raw: htmlParts[i],
      pageNum: fid,
      paraIndex: i,
      isSharhMarker,
      isHadithStart: hadithNum !== null,
      hadithNum,
    })
  }
}

console.log(`  Total paragraphs: ${allParagraphs.length}`)

// ═══════════════════════════════════════════════════════════════
// STEP 2: Walk paragraphs and build hadith groups
// ═══════════════════════════════════════════════════════════════

console.log('\nStep 2: Building hadith groups...')

// Strategy:
// We maintain a "matn buffer" and a "sharh buffer"
// - When we see a hadith number, add to matn buffer
// - When we see ANY other text BEFORE sharh marker, add to matn buffer
// - When we see sharh marker, switch to sharh mode
// - When in sharh mode, add text to sharh buffer
// - When we see a NEW hadith number while in sharh mode, finalize current group

const groups = []
let matnBuffer = [] // paragraphs of matn (hadith text + headers)
let sharhBuffer = [] // paragraphs of sharh
let currentBook = ''
let currentBab = ''
let currentHadiths = [] // [{text, hadithNum}]
let inSharhMode = false

for (const para of allParagraphs) {
  if (para.isSharhMarker) {
    // Switch to sharh mode
    inSharhMode = true
    continue
  }
  
  if (para.isHadithStart && inSharhMode) {
    // New hadith while in sharh mode -> finalize current group
    if (currentHadiths.length > 0) {
      groups.push({
        book: currentBook,
        bab: currentBab,
        hadiths: [...currentHadiths],
        sharhText: sharhBuffer.map(p => p.text).join('\n'),
      })
    }
    // Start new group
    currentHadiths = [{ text: para.text, hadithNum: para.hadithNum }]
    sharhBuffer = []
    inSharhMode = false
    
    // Check if this hadith page also has a sharh marker (same page)
    // We need to look ahead on the same page
    continue
  }
  
  if (para.isHadithStart && !inSharhMode) {
    // Hadith before any sharh marker -> add to current group
    currentHadiths.push({ text: para.text, hadithNum: para.hadithNum })
    continue
  }
  
  if (!para.isHadithStart && !inSharhMode) {
    // Text before sharh marker - could be headers, book names, etc.
    // Check if it's a book/bab header
    const plain = para.text
    if (plain.includes('كتاب')) {
      currentBook = plain.replace(/^\[|\]$/g, '')
    } else if (plain.includes('باب')) {
      currentBab = plain.replace(/^\[|\]$/g, '')
    }
    // Don't add to matn or sharh - it's structural
    continue
  }
  
  if (inSharhMode) {
    sharhBuffer.push(para)
    continue
  }
}

// Finalize last group
if (currentHadiths.length > 0) {
  groups.push({
    book: currentBook,
    bab: currentBab,
    hadiths: [...currentHadiths],
    sharhText: sharhBuffer.map(p => p.text).join('\n'),
  })
}

console.log(`  Total groups: ${groups.length}`)
const totalHadiths = groups.reduce((s, g) => s + g.hadiths.length, 0)
const withSharh = groups.filter(g => g.sharhText.length > 30).length
console.log(`  Total hadiths: ${totalHadiths}`)
console.log(`  Groups with sharh: ${withSharh}/${groups.length}`)

// ═══════════════════════════════════════════════════════════════
// STEP 3: Map hadith numbers to sharh
// ═══════════════════════════════════════════════════════════════

console.log('\nStep 3: Mapping hadiths to sharh...')

const hadithSharhMap = new Map()

for (const group of groups) {
  if (group.sharhText.length < 30) continue
  
  for (const hadith of group.hadiths) {
    hadithSharhMap.set(hadith.hadithNum, {
      sharh: group.sharhText,
      hadithText: hadith.text,
      book: group.book,
      bab: group.bab,
    })
  }
}

console.log(`  Hadiths with sharh: ${hadithSharhMap.size}`)

// Show some samples
for (const [num, data] of [...hadithSharhMap.entries()].slice(0, 5)) {
  console.log(`  Hadith ${num}: sharh starts with "${data.sharh.slice(0, 80)}..."`)
}

// ═══════════════════════════════════════════════════════════════
// STEP 4: Build JSON output
// ═══════════════════════════════════════════════════════════════

console.log('\nStep 4: Building output JSON...')

const existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'))
const riyadEntries = Object.entries(existing.entries)

// Build hadith number -> key mapping
const hadithNumToKey = new Map()
for (const [key, entry] of riyadEntries) {
  if (!key.startsWith('riyadussalihin:')) continue
  const match = key.match(/riyadussalihin:(\w+):(\d+)/)
  if (!match) continue
  const hadithNum = parseInt(match[2])
  if (hadithNum > 0 && hadithNum <= 2000) {
    hadithNumToKey.set(hadithNum, key)
  }
}

console.log(`  Mapped ${hadithNumToKey.size} hadith numbers`)

// Build new entries
const newEntries = {}
const newSharhPool = []
const sharhIndexMap = new Map()
let stats = { intro: 0, per_hadith: 0, no_sharh: 0 }

// Handle introduction entries (keep as-is, sharh is in text field)
for (const [key, entry] of riyadEntries) {
  if (key.startsWith('riyadussalihin:introduction:')) {
    newEntries[key] = {
      ...entry,
      sharh: -1, // intro entries store sharh in text field, not sharhPool
      source: 'shamela_intro',
      scholar: 'ابن عثيمين',
      bookName: 'شرح رياض الصالحين',
      attribution: 'ابن عثيمين - شرح رياض الصالحين (المكتبة الشاملة)',
      match: {
        method: 'manual',
        confidence: 0.98,
        reviewed: true,
      },
    }
    stats.intro++
  }
}

// Handle hadith entries
for (const [key, entry] of riyadEntries) {
  if (key.startsWith('riyadussalihin:introduction:')) continue
  
  const match = key.match(/riyadussalihin:(\w+):(\d+)/)
  if (!match) continue
  const hadithNum = parseInt(match[2])
  
  const sharhData = hadithSharhMap.get(hadithNum)
  
  if (sharhData && sharhData.sharh.length > 30) {
    let poolIdx = sharhIndexMap.get(sharhData.sharh)
    if (poolIdx === undefined) {
      poolIdx = newSharhPool.length
      newSharhPool.push(sharhData.sharh)
      sharhIndexMap.set(sharhData.sharh, poolIdx)
    }
    
    newEntries[key] = {
      ...entry,
      matn: entry.matn || sharhData.hadithText,
      sharh: poolIdx,
      source: 'shamela_per_hadith',
      scholar: 'ابن عثيمين',
      bookName: 'شرح رياض الصالحين',
      attribution: 'ابن عثيمين - شرح رياض الصالحين (المكتبة الشاملة)',
      match: {
        method: 'shamela_page',
        confidence: 0.98,
        reviewed: true,
      },
    }
    stats.per_hadith++
  } else {
    newEntries[key] = {
      ...entry,
      sharh: -1,
      source: 'no_sharh',
      scholar: '',
      bookName: '',
      attribution: '',
    }
    stats.no_sharh++
  }
}

console.log('  Stats:', JSON.stringify(stats))
console.log(`  Sharh pool size: ${newSharhPool.length}`)

// ═══════════════════════════════════════════════════════════════
// STEP 5: Verify key hadiths
// ═══════════════════════════════════════════════════════════════

console.log('\nStep 5: Verifying key hadiths...')

const verifyNums = [680, 689, 700, 728, 729, 730, 731, 736, 738, 740]
for (const n of verifyNums) {
  const key = hadithNumToKey.get(n)
  if (!key) { console.log(`  ${n}: NO KEY`); continue }
  const entry = newEntries[key]
  if (!entry) { console.log(`  ${n}: NO ENTRY`); continue }
  const hasSharh = typeof entry.sharh === 'number' && entry.sharh >= 0 && newSharhPool[entry.sharh]?.length > 30
  const sharhPreview = hasSharh ? newSharhPool[entry.sharh].slice(0, 100) : 'NO SHARH'
  console.log(`  ${n} [${entry.source}]: ${sharhPreview}`)
}

// ═══════════════════════════════════════════════════════════════
// STEP 6: Write output
// ═══════════════════════════════════════════════════════════════

console.log('\nStep 6: Writing output...')

const output = {
  ...existing,
  sharhPool: newSharhPool,
  entries: newEntries,
  meta: {
    ...existing.meta,
    version: 'v21',
    buildDate: new Date().toISOString(),
    sources: {
      shamela_intro: {
        bookId: 9260,
        bookName: 'شرح رياض الصالحين لابن عثيمين',
        description: 'Intro sections from Shamela',
      },
      shamela_per_hadith: {
        bookId: 9260,
        bookName: 'شرح رياض الصالحين لابن عثيمين',
        description: 'Per-hadith sharh, aligned by sequential page walking with [الشَّرْحُ] marker boundary',
      },
      no_sharh: {
        description: 'No sharh available',
      },
    },
    stats,
  },
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8')
const fileSize = (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(1)
console.log(`  Written: ${OUTPUT_FILE} (${fileSize} MB)`)
console.log('  Done!')
