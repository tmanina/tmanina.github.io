#!/usr/bin/env node

import fs from "fs"

const FILE = process.env.RIYAD_SHARH_FILE || "public/data/riyad-uthaymeen-shamela-final.json"

const BOOKS = [
  ["introduction", 1, 679],
  ["1", 680, 726],
  ["2", 727, 777],
  ["3", 778, 812],
  ["4", 813, 843],
  ["5", 844, 893],
  ["6", 894, 955],
  ["7", 956, 990],
  ["8", 991, 1267],
  ["9", 1268, 1270],
  ["10", 1271, 1284],
  ["11", 1285, 1375],
  ["12", 1376, 1392],
  ["13", 1393, 1396],
  ["14", 1397, 1407],
  ["15", 1408, 1464],
  ["16", 1465, 1510],
  ["17", 1511, 1807],
  ["18", 1808, 1868],
  ["19", 1869, 1896],
]

const REQUIRED_WITH_SHARH = {
  "riyadussalihin:introduction:2": ["يغزو جيش الكعبة", "ثم يبعثون علي"],
  "riyadussalihin:introduction:3": ["نفي رسول الله", "إذا استنفرتم فانفروا"],
  "riyadussalihin:introduction:4": ["نوي العمل الصالح", "حبسه عنه حابس"],
  "riyadussalihin:introduction:5": ["لك يا يزيد ما نويت", "الأعمال بالنيات"],
  "riyadussalihin:introduction:14": ["هذان الحديثان", "يا أيها الناس توبوا"],
  "riyadussalihin:introduction:15": ["خادم النبي", "فرح الله"],
}

const REQUIRED_WITHOUT_SHARH = [
  "riyadussalihin:introduction:13",
]

const ADAB_ALIGNMENT_CHECKS = {
  "riyadussalihin:1:680": {
    matn: ["ابن عمر", "الحياء"],
    sharh: ["كتاب الأدب", "الحياء"],
  },
  "riyadussalihin:1:682": {
    matn: ["الإيمان بضع"],
    sharh: ["الإيمان بضع", "شعبة"],
  },
  "riyadussalihin:1:684": {
    matn: ["شر الناس", "ينشر سرها"],
    sharh: ["باب حفظ السر", "أشر الناس"],
  },
  "riyadussalihin:1:687": {
    matn: ["ثابت عن أنس", "سر"],
    sharh: ["ثابت عن أنس", "سر"],
  },
  "riyadussalihin:1:718": {
    matn: ["خالف الطريق"],
    sharh: ["مخالفة الطريق"],
  },
}

function expectedKeys() {
  const keys = []
  for (const [book, start, end] of BOOKS) {
    for (let number = start; number <= end; number += 1) {
      keys.push(`riyadussalihin:${book}:${number}`)
    }
  }
  return keys
}

function getSharh(data, entry) {
  if (!entry || typeof entry.sharh !== "number" || entry.sharh < 0) return ""
  return (data.sharhPool && data.sharhPool[entry.sharh]) || ""
}

function fail(errors, message) {
  errors.push(message)
}

function isSafeSharhText(text) {
  if (!text || text.trim().length <= 30) return false
  if (/^\s*\]/.test(text)) return false
  if (/^[\s\n]*[0-9\u0660-\u0669]{1,4}\s*[-ـ]/u.test(text)) return false
  if (text.includes("[الشَّرْحُ]")) return false
  if (text.includes("**شرح ابن عثيمين:**")) return false
  return true
}

function main() {
  const data = JSON.parse(fs.readFileSync(FILE, "utf8"))
  const entries = data.entries || {}
  const errors = []
  const keys = expectedKeys()

  if (keys.length !== 1896) fail(errors, `Expected key list bug: got ${keys.length}`)
  if (Object.keys(entries).length !== 1896) {
    fail(errors, `Expected 1896 entries, got ${Object.keys(entries).length}`)
  }

  for (const key of keys) {
    const entry = entries[key]
    if (!entry) {
      fail(errors, `Missing entry ${key}`)
      continue
    }

    const expectedNumber = key.split(":").slice(-1)[0]
    if (String(entry.sourceHadithNumber || expectedNumber) !== expectedNumber) {
      fail(errors, `${key} sourceHadithNumber=${entry.sourceHadithNumber}, expected ${expectedNumber}`)
    }

    if (!entry.matn || entry.matn.length <= 20) {
      fail(errors, `${key} has no matn`)
    }

    const sharh = getSharh(data, entry)
    if (entry.sharh >= 0) {
      if (!isSafeSharhText(sharh)) fail(errors, `${key} exposes unsafe sharh`)
      if (!entry.match || entry.match.reviewed !== true || Number(entry.match.confidence || 0) < 0.9) {
        fail(errors, `${key} exposes untrusted sharh`)
      }
    } else if (entry.source !== "no_sharh") {
      fail(errors, `${key} has no sharh but source=${entry.source}`)
    }
  }

  for (const key of REQUIRED_WITHOUT_SHARH) {
    const entry = entries[key]
    if (!entry) continue
    const sharh = getSharh(data, entry)
    if (sharh) fail(errors, `${key} should not have direct sharh under direct-marker policy`)
  }

  for (const [key, phrases] of Object.entries(REQUIRED_WITH_SHARH)) {
    const entry = entries[key]
    const sharh = getSharh(data, entry)
    if (!isSafeSharhText(sharh)) {
      fail(errors, `${key} required sample has no safe sharh`)
      continue
    }
    for (const phrase of phrases) {
      if (!sharh.includes(phrase)) fail(errors, `${key} sharh missing expected phrase: ${phrase}`)
    }
  }

  for (const [key, checks] of Object.entries(ADAB_ALIGNMENT_CHECKS)) {
    const entry = entries[key]
    const sharh = getSharh(data, entry)
    for (const phrase of checks.matn) {
      if (!entry || !String(entry.matn || "").includes(phrase)) {
        fail(errors, `${key} adab matn missing expected phrase: ${phrase}`)
      }
    }
    for (const phrase of checks.sharh) {
      if (!sharh.includes(phrase)) {
        fail(errors, `${key} adab sharh missing expected phrase: ${phrase}`)
      }
    }
  }

  const exposedSharh = Object.values(entries).filter((entry) => getSharh(data, entry).length > 0).length
  const metaEntriesWithSharh = data.meta && data.meta.entriesWithSharh
  if (metaEntriesWithSharh !== exposedSharh) {
    fail(errors, `meta.entriesWithSharh=${metaEntriesWithSharh}, actual=${exposedSharh}`)
  }

  if (errors.length) {
    console.error(`Riyad sharh validation failed with ${errors.length} error(s):`)
    for (const error of errors.slice(0, 40)) console.error(`- ${error}`)
    process.exit(1)
  }

  console.log("Riyad sharh validation passed")
  console.log(`Entries: ${Object.keys(entries).length}`)
  console.log(`Displayable trusted sharh entries: ${exposedSharh}`)
  console.log(`Unique sharh texts: ${(data.sharhPool && data.sharhPool.length) || 0}`)
}

main()
