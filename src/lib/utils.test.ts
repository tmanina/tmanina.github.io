import { describe, it, expect } from "vitest"
import { cn } from "./utils"

describe("cn utility", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("handles conditional classes", () => {
    expect(cn("base", true && "active", false && "hidden")).toBe("base active")
  })

  it("handles undefined and null", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end")
  })

  it("deduplicates Tailwind classes via twMerge", () => {
    expect(cn("p-4", "p-6")).toBe("p-6")
  })

  it("handles empty input", () => {
    expect(cn()).toBe("")
  })

  it("handles arrays", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz")
  })

  it("handles objects", () => {
    expect(cn({ active: true, hidden: false }, "base")).toBe("active base")
  })
})
