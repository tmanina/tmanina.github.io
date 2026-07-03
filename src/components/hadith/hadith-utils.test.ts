import { describe, it, expect, beforeEach } from "vitest"
import {
  colorOf,
  hKey,
  normalizeArabic,
  normalizeGrade,
  gradeBadgeCls,
  gradeAr,
  arBookName,
  isPlaceholderEntry,
  isApiHadithTextEntry,
  isTrustedReviewedSharhEntry,
  isSafeReviewedSharhText,
  extractDorarHtmlResults,
  resolveSharhEntry,
  hasSharhAvailable,
  getFavs,
  toggleFav,
  FAV_KEY,
} from "./hadith-utils"
import type { ReviewedSharhEntry, HadithItem, SharhEntry, DorarApiResponse } from "./hadith-utils"

beforeEach(() => {
  localStorage.clear()
})

describe("colorOf", () => {
  it("returns correct color for bukhari", () => {
    expect(colorOf("bukhari").color).toBe("#f59e0b")
  })

  it("returns correct color for muslim", () => {
    expect(colorOf("muslim").color).toBe("#10b981")
  })

  it("returns default gray for unknown slug", () => {
    const result = colorOf("unknown")
    expect(result.color).toBe("#6b7280")
  })

  it("returns gradient string for all known slugs", () => {
    expect(colorOf("bukhari").gradient).toContain("linear-gradient")
  })
})

describe("hKey", () => {
  it("builds key from hadith fields", () => {
    const h: HadithItem = {
      collection: "bukhari",
      bookNumber: "1",
      hadithNumber: "5",
      chapterTitle: { en: null, ar: null },
      ar: { text: "", grades: [] },
      en: { text: "", grades: [] },
    }
    expect(hKey(h)).toBe("bukhari:1:5")
  })

  it("handles multi-part numbers", () => {
    const h = { collection: "muslim", bookNumber: "12", hadithNumber: "100a" }
    expect(hKey(h)).toBe("muslim:12:100a")
  })
})

describe("normalizeArabic", () => {
  it("removes diacritics (tashkeel)", () => {
    expect(normalizeArabic("بِسْمِ")).toBe("بسم")
  })

  it("normalizes alef variants", () => {
    expect(normalizeArabic("أإآ")).toBe("ااا")
  })

  it("normalizes hamza forms", () => {
    expect(normalizeArabic("ؤ")).toBe("و")
    expect(normalizeArabic("ئ")).toBe("ي")
  })

  it("normalizes taa marbuta to haa", () => {
    expect(normalizeArabic("ة")).toBe("ه")
  })

  it("normalizes alif maqsura to yaa", () => {
    expect(normalizeArabic("ى")).toBe("ي")
  })

  it("removes tatweel (kashida)", () => {
    expect(normalizeArabic("ا\u0640ل")).toBe("ال")
  })

  it("preserves regular letters", () => {
    expect(normalizeArabic("سلام")).toBe("سلام")
  })

  it("handles empty string", () => {
    expect(normalizeArabic("")).toBe("")
  })
})

describe("normalizeGrade", () => {
  it("lowercases and trims", () => {
    expect(normalizeGrade("  Sahih  ")).toBe("sahih")
  })

  it("removes quotes and backticks", () => {
    expect(normalizeGrade("Sahih 'al-Bukhari`")).toBe("sahih al-bukhari")
  })
})

describe("gradeBadgeCls", () => {
  it("returns emerald classes for sahih", () => {
    expect(gradeBadgeCls("Sahih")).toContain("emerald")
  })

  it("returns amber classes for hasan", () => {
    expect(gradeBadgeCls("Hasan")).toContain("amber")
  })

  it("returns red classes for daif", () => {
    expect(gradeBadgeCls("Daif")).toContain("red")
  })

  it("returns default gray for unknown grade", () => {
    expect(gradeBadgeCls("unknown")).toContain("gray")
  })
})

describe("gradeAr", () => {
  it("translates sahih", () => {
    expect(gradeAr("Sahih")).toBe("صحيح")
  })

  it("translates hasan", () => {
    expect(gradeAr("Hasan")).toBe("حسن")
  })

  it("translates daif", () => {
    expect(gradeAr("Daif")).toBe("ضعيف")
  })

  it("translates sahih hasan combination", () => {
    expect(gradeAr("Sahih Hasan")).toBe("حسن صحيح")
  })

  it("translates hasan daif combination", () => {
    expect(gradeAr("Hasan Daif")).toBe("حسن ضعيف")
  })

  it("returns original for unrecognized grade", () => {
    expect(gradeAr("Mawdu'")).toBe("Mawdu'")
  })
})

describe("arBookName", () => {
  it("returns Arabic name when available", () => {
    expect(arBookName({ name: { en: "Book 1", ar: "كتاب الإيمان" } })).toBe("كتاب الإيمان")
  })

  it("parses English Book number format", () => {
    expect(arBookName({ name: { en: "Book 1", ar: null } })).toBe("الكتاب 1")
  })

  it("parses English Book number with title", () => {
    expect(arBookName({ name: { en: "Book 1: Faith", ar: null } })).toBe("الكتاب 1: Faith")
  })

  it("returns English name as fallback", () => {
    expect(arBookName({ name: { en: "Custom Name", ar: null } })).toBe("Custom Name")
  })
})

describe("isPlaceholderEntry", () => {
  const baseEntry: ReviewedSharhEntry = {
    text: "نص الشرح",
    source: "test",
    scholar: "test",
    sourceHadithNumber: "1",
    match: { method: "manual", confidence: 1, reviewed: true },
  }

  it("returns true for placeholder method", () => {
    expect(isPlaceholderEntry({ ...baseEntry, match: { ...baseEntry.match, method: "placeholder" } })).toBe(true)
  })

  it("returns true for placeholder text markers", () => {
    expect(isPlaceholderEntry({ ...baseEntry, text: "[نص الحديث والشرح غير متاحين حالياً" })).toBe(true)
    expect(isPlaceholderEntry({ ...baseEntry, text: "[شرح غير متاح حالياً" })).toBe(true)
    expect(isPlaceholderEntry({ ...baseEntry, text: "[سيتم إضافة المحتوى لاحقاً" })).toBe(true)
  })

  it("returns false for valid entries", () => {
    expect(isPlaceholderEntry(baseEntry)).toBe(false)
  })
})

describe("isApiHadithTextEntry", () => {
  it("returns true for api-hadith-text method", () => {
    const entry: ReviewedSharhEntry = {
      text: "x",
      source: "x",
      scholar: "x",
      sourceHadithNumber: "1",
      match: { method: "api-hadith-text", confidence: 1, reviewed: true },
    }
    expect(isApiHadithTextEntry(entry)).toBe(true)
  })

  it("returns false for other methods", () => {
    const entry: ReviewedSharhEntry = {
      text: "x",
      source: "x",
      scholar: "x",
      sourceHadithNumber: "1",
      match: { method: "manual", confidence: 1, reviewed: true },
    }
    expect(isApiHadithTextEntry(entry)).toBe(false)
  })
})

describe("isTrustedReviewedSharhEntry", () => {
  it("returns true for reviewed with high confidence", () => {
    const entry: ReviewedSharhEntry = {
      text: "x",
      source: "x",
      scholar: "x",
      sourceHadithNumber: "1",
      match: { method: "manual", confidence: 0.95, reviewed: true },
    }
    expect(isTrustedReviewedSharhEntry(entry)).toBe(true)
  })

  it("returns false for unreviewed", () => {
    const entry: ReviewedSharhEntry = {
      text: "x",
      source: "x",
      scholar: "x",
      sourceHadithNumber: "1",
      match: { method: "manual", confidence: 0.95, reviewed: false },
    }
    expect(isTrustedReviewedSharhEntry(entry)).toBe(false)
  })

  it("returns false for low confidence", () => {
    const entry: ReviewedSharhEntry = {
      text: "x",
      source: "x",
      scholar: "x",
      sourceHadithNumber: "1",
      match: { method: "manual", confidence: 0.8, reviewed: true },
    }
    expect(isTrustedReviewedSharhEntry(entry)).toBe(false)
  })
})

describe("isSafeReviewedSharhText", () => {
  it("rejects importer fragments that start with a bracket", () => {
    expect(isSafeReviewedSharhText("] قال المؤلف في باب آخر نص طويل يتجاوز ثلاثين حرفاً")).toBe(false)
  })

  it("rejects text that starts with another numbered matn", () => {
    expect(isSafeReviewedSharhText("١٨٩٣ - وعن أبي هريرة رضي الله عنه نص طويل يتجاوز ثلاثين حرفاً")).toBe(false)
  })

  it("accepts normal reviewed sharh text", () => {
    expect(isSafeReviewedSharhText("قال المؤلف رحمه الله في شرح هذا الحديث كلاماً واضحاً")).toBe(true)
  })
})

describe("extractDorarHtmlResults", () => {
  it("extracts from array response", () => {
    const data: DorarApiResponse = { ahadith: [{ th: "<p>hadith 1</p>" }, { th: "<p>hadith 2</p>" }] }
    expect(extractDorarHtmlResults(data)).toEqual(["<p>hadith 1</p>", "<p>hadith 2</p>"])
  })

  it("extracts from result string response", () => {
    const data: DorarApiResponse = {
      ahadith: { result: "text1--------------<br />text2" },
    }
    const results = extractDorarHtmlResults(data)
    expect(results.length).toBe(2)
    expect(results[0]).toBe("text1")
    expect(results[1]).toBe("text2")
  })

  it("returns empty for null response", () => {
    expect(extractDorarHtmlResults({})).toEqual([])
  })
})

describe("getFavs / toggleFav", () => {
  it("returns empty set when no favs stored", () => {
    expect(getFavs().size).toBe(0)
  })

  it("adds a favorite", () => {
    const result = toggleFav("bukhari:1:1")
    expect(result.has("bukhari:1:1")).toBe(true)
    expect(getFavs().has("bukhari:1:1")).toBe(true)
  })

  it("removes an existing favorite", () => {
    toggleFav("bukhari:1:1")
    const result = toggleFav("bukhari:1:1")
    expect(result.has("bukhari:1:1")).toBe(false)
  })

  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem(FAV_KEY, "invalid-json")
    expect(getFavs().size).toBe(0)
  })
})

describe("resolveSharhEntry", () => {
  const mockHadith: HadithItem = {
    collection: "riyadussalihin",
    bookNumber: "1",
    hadithNumber: "5",
    chapterTitle: { en: null, ar: null },
    ar: { text: "text", grades: [] },
    en: { text: "", grades: [] },
  }

  it("returns null for non-riyadussalihin without sharhData", () => {
    const h: HadithItem = { ...mockHadith, collection: "bukhari" }
    expect(resolveSharhEntry(h, {}, {}, [])).toBe(null)
  })

  it("returns entry from sharhData for non-riyadussalihin", () => {
    const h: HadithItem = { ...mockHadith, collection: "bukhari" }
    const sharhData: Record<string, SharhEntry> = {
      "bukhari:1:5": { text: "شرح", source: "src", scholar: "sch" },
    }
    const result = resolveSharhEntry(h, {}, sharhData, [])
    expect(result).not.toBe(null)
    expect(result?.text).toBe("شرح")
  })

  it("resolves Shamela pool index format", () => {
    const entry: ReviewedSharhEntry = {
      text: "",
      source: "",
      scholar: "",
      sourceHadithNumber: "5",
      sharh: 0,
      match: { method: "shamela_aligned", confidence: 0.98, reviewed: true },
    }
    const riyadData: Record<string, ReviewedSharhEntry> = { "riyadussalihin:1:5": entry }
    const sharhPool = ["هذا شرح مفصل للحديث يتجاوز ثلاثين حرفاً للتحقق"]
    const result = resolveSharhEntry(mockHadith, riyadData, {}, sharhPool)
    expect(result).not.toBe(null)
    expect(result?.text).toBe(sharhPool[0])
  })

  it("returns null for unsafe Shamela importer fragments", () => {
    const entry: ReviewedSharhEntry = {
      text: "",
      source: "",
      scholar: "",
      sourceHadithNumber: "5",
      sharh: 0,
      match: { method: "shamela_aligned", confidence: 0.98, reviewed: true },
    }
    const riyadData: Record<string, ReviewedSharhEntry> = { "riyadussalihin:1:5": entry }
    const sharhPool = ["] قال المؤلف في باب مختلف نص طويل يتجاوز ثلاثين حرفاً"]
    expect(resolveSharhEntry(mockHadith, riyadData, {}, sharhPool)).toBe(null)
  })

  it("returns null for placeholder entries", () => {
    const entry: ReviewedSharhEntry = {
      text: "[شرح غير متاح حالياً",
      source: "",
      scholar: "",
      sourceHadithNumber: "5",
      match: { method: "placeholder", confidence: 1, reviewed: true },
    }
    const riyadData: Record<string, ReviewedSharhEntry> = { "riyadussalihin:1:5": entry }
    expect(resolveSharhEntry(mockHadith, riyadData, {}, [])).toBe(null)
  })

  it("returns null for untrusted entries", () => {
    const entry: ReviewedSharhEntry = {
      text: "شرح",
      source: "",
      scholar: "",
      sourceHadithNumber: "5",
      match: { method: "manual", confidence: 0.5, reviewed: false },
    }
    const riyadData: Record<string, ReviewedSharhEntry> = { "riyadussalihin:1:5": entry }
    expect(resolveSharhEntry(mockHadith, riyadData, {}, [])).toBe(null)
  })
})

describe("hasSharhAvailable", () => {
  const mockHadith: HadithItem = {
    collection: "bukhari",
    bookNumber: "1",
    hadithNumber: "5",
    chapterTitle: { en: null, ar: null },
    ar: { text: "text", grades: [] },
    en: { text: "", grades: [] },
  }

  it("returns true when sharhData has the key", () => {
    const sharhData: Record<string, SharhEntry> = {
      "bukhari:1:5": { text: "شرح", source: "src", scholar: "sch" },
    }
    expect(hasSharhAvailable(mockHadith, {}, sharhData, [])).toBe(true)
  })

  it("returns false when no sharh available", () => {
    expect(hasSharhAvailable(mockHadith, {}, {}, [])).toBe(false)
  })
})
