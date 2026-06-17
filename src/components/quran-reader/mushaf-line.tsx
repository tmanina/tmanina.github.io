"use client"

import * as React from "react"
import type { Word } from "./types"
import { cleanText } from "./utils"

interface MushafLineProps {
  words: Word[]
  lineNumber: number
  surahHeader?: { name: string; showBasmalaInline?: boolean }
  basmala?: boolean
  isCentered?: boolean
  fontFamily?: string
}

/**
 * Renders a single line of the Mushaf (Quran page).
 * Supports text_uthmani display (glyph mode disabled).
 * Memoized for performance since the same line content rarely changes.
 */
const MushafLine = React.memo(function MushafLine({
  words,
  surahHeader,
  basmala = false,
  isCentered = false,
  fontFamily,
}: MushafLineProps) {
  const glyphMode = false

  const fontStyle =
    glyphMode && fontFamily
      ? { fontFamily: `"${fontFamily}", serif` }
      : undefined

  if (basmala) {
    return (
      <div className="line-outer" dir="rtl">
        <div className="line-inner centered basmala-inner">﷽</div>
      </div>
    )
  }

  if (surahHeader) {
    return (
      <div className="line-outer surah-header-line" dir="rtl">
        <div className="surah-title">سُورَةُ {surahHeader.name}</div>
        {surahHeader.showBasmalaInline ? (
          <div className="surah-basmala-inline">﷽</div>
        ) : null}
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div className="line-outer" dir="rtl">
        <div className={`line-inner ${glyphMode ? "glyph" : ""}`} />
      </div>
    )
  }

  return (
    <div className="line-outer" dir="rtl">
      <div
        className={`line-inner ${glyphMode ? "glyph" : isCentered ? "centered" : "justified"}`}
        style={fontStyle}
      >
        {words.map((word, idx) => (
          <React.Fragment key={`${word.id}-${idx}`}>
            <span
              className={`mushaf-word ${word.char_type_name === "end" ? "verse-number-ornament" : ""}`}
            >
              {glyphMode
                ? word.code_v1 || word.code_v2
                : word.char_type_name === "end"
                  ? `\u2068﴾${cleanText(word.text_uthmani)}﴿\u2069`
                  : cleanText(word.text_uthmani)}
            </span>
            {!glyphMode && idx < words.length - 1 ? " " : null}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
})

export default MushafLine
