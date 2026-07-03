import { describe, it, expect } from "vitest"
import {
  toArabicNumeral,
  getJuzNumber,
  getSurahInfo,
  cleanText,
  TOTAL_PAGES,
  surahNames,
  surahPages,
} from "./utils"

describe("toArabicNumeral", () => {
  it("converts single digit", () => {
    expect(toArabicNumeral(0)).toBe("٠")
    expect(toArabicNumeral(5)).toBe("٥")
    expect(toArabicNumeral(9)).toBe("٩")
  })

  it("converts multi-digit numbers", () => {
    expect(toArabicNumeral(10)).toBe("١٠")
    expect(toArabicNumeral(123)).toBe("١٢٣")
    expect(toArabicNumeral(604)).toBe("٦٠٤")
  })

  it("converts zero", () => {
    expect(toArabicNumeral(0)).toBe("٠")
  })
})

describe("getJuzNumber", () => {
  it("returns juz 1 for page 1", () => {
    expect(getJuzNumber(1)).toBe(1)
  })

  it("returns juz 1 for pages before juz 2 start", () => {
    expect(getJuzNumber(21)).toBe(1)
  })

  it("returns juz 2 for page 22", () => {
    expect(getJuzNumber(22)).toBe(2)
  })

  it("returns juz 30 for last pages", () => {
    expect(getJuzNumber(604)).toBe(30)
    expect(getJuzNumber(582)).toBe(30)
  })

  it("returns juz 15 for page 282", () => {
    expect(getJuzNumber(282)).toBe(15)
  })
})

describe("getSurahInfo", () => {
  it("parses verse key correctly", () => {
    const info = getSurahInfo("2:255")
    expect(info.number).toBe(2)
    expect(info.name).toBe("البَقَرَة")
  })

  it("handles Al-Fatiha", () => {
    const info = getSurahInfo("1:1")
    expect(info.number).toBe(1)
    expect(info.name).toBe("الفَاتِحَة")
  })

  it("handles last surah", () => {
    const info = getSurahInfo("114:6")
    expect(info.number).toBe(114)
    expect(info.name).toBe("النَّاس")
  })

  it("handles unknown surah number gracefully", () => {
    const info = getSurahInfo("999:1")
    expect(info.number).toBe(999)
    expect(info.name).toContain("سورة")
  })
})

describe("cleanText", () => {
  it("removes asterisks", () => {
    expect(cleanText("hello*world*")).toBe("helloworld")
  })

  it("removes waqf marks (U+06D6 to U+06ED)", () => {
    expect(cleanText("نص\u06D6عربي\u06ED")).toBe("نصعربي")
  })

  it("handles empty string", () => {
    expect(cleanText("")).toBe("")
  })

  it("handles null/undefined safely", () => {
    expect(cleanText(null as unknown as string)).toBe("")
  })

  it("preserves regular Arabic text", () => {
    expect(cleanText("بِسْمِ اللَّهِ")).toBe("بِسْمِ اللَّهِ")
  })
})

describe("constants", () => {
  it("TOTAL_PAGES is 604", () => {
    expect(TOTAL_PAGES).toBe(604)
  })

  it("surahNames has 114 surahs", () => {
    expect(Object.keys(surahNames).length).toBe(114)
  })

  it("surahPages has 114 entries", () => {
    expect(Object.keys(surahPages).length).toBe(114)
  })

  it("surahPages starts at 1 for Al-Fatiha", () => {
    expect(surahPages[1]).toBe(1)
  })

  it("surahPages ends at 604 for An-Nas", () => {
    expect(surahPages[114]).toBe(604)
  })
})
