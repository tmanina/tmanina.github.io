#!/usr/bin/env node

import crypto from "crypto"
import fs from "fs"

const TARGET_FILE = "public/data/riyad-shamela-corrected.json"
const OVERRIDES_FILE = "public/data/riyad-uthaymeen-adab-overrides.json"

function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex")
}

function buildPoolIndex(pool) {
  const hashes = new Map()
  for (let index = 0; index < pool.length; index += 1) {
    hashes.set(hashText(pool[index]), index)
  }
  return hashes
}

function getPoolIndex(text, pool, hashes) {
  const value = String(text || "").trim()
  if (value.length < 30) return -1
  const hash = hashText(value)
  if (!hashes.has(hash)) {
    hashes.set(hash, pool.length)
    pool.push(value)
  }
  return hashes.get(hash)
}

function main() {
  const target = JSON.parse(fs.readFileSync(TARGET_FILE, "utf8"))
  const overrides = JSON.parse(fs.readFileSync(OVERRIDES_FILE, "utf8"))
  const entries = target.entries || {}
  const pool = target.sharhPool || []
  const hashes = buildPoolIndex(pool)
  let applied = 0

  for (const [key, override] of Object.entries(overrides.entries || {})) {
    const entry = entries[key]
    if (!entry) throw new Error(`Missing target entry: ${key}`)

    const sharhIndex = getPoolIndex(override.sharh, pool, hashes)
    if (sharhIndex < 0) throw new Error(`Invalid override sharh: ${key}`)

    entry.sharh = sharhIndex
    entry.source = "shamela_reviewed"
    entry.scholar = entry.scholar || "ابن عثيمين"
    entry.sourceUrl = override.sourceUrl || entry.sourceUrl
    entry.sourceHadithNumber = override.sourceHadithNumber || key.split(":").slice(-1)[0]
    entry.bookName = entry.bookName || "شرح رياض الصالحين لابن عثيمين"
    entry.attribution = "ابن عثيمين - شرح رياض الصالحين (المكتبة الشاملة، shamela.ws/book/9260)"
    entry.match = {
      ...(entry.match || {}),
      ...(override.match || {}),
      method: "manual-fix",
      confidence: 0.92,
      reviewed: true,
      reviewer: "book-adab-topic-validation",
    }
    applied += 1
  }

  target.sharhPool = pool
  if (target.meta) {
    target.meta.uniqueSharhTexts = pool.length
    target.meta.entriesWithSharh = Object.values(entries).filter((entry) => (
      typeof entry.sharh === "number" && entry.sharh >= 0 && pool[entry.sharh]
    )).length
    target.meta.adabOverridesApplied = applied
  }

  fs.writeFileSync(TARGET_FILE, `${JSON.stringify(target, null, 2)}\n`, "utf8")
  console.log(`Applied ${applied} adab overrides to ${TARGET_FILE}`)
  console.log(`Unique sharh texts: ${pool.length}`)
}

main()
