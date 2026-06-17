export interface Word {
  id: number
  position: number
  text: string
  text_uthmani: string
  text_imlaei: string
  code_v1: string
  code_v2: string
  v1_page?: number
  v2_page?: number
  line_number: number
  char_type_name: string
}

export interface Verse {
  id: number
  verse_key: string
  verse_number: number
  text_uthmani: string
  words?: Word[]
}

export interface Line {
  lineNumber: number
  words: Word[]
}

export type LineDeco =
  | { kind: "surah"; name: string; showBasmalaInline: boolean }
  | { kind: "basmala" }

export interface PageData {
  verses: Verse[]
  lines: Line[]
}

export interface PrecacheStatus {
  downloading: boolean
  current: number
  total: number
  complete: boolean
  message: string
}

export interface MushafLineProps {
  words: Word[]
  lineNumber: number
  surahHeader?: { name: string; showBasmalaInline?: boolean }
  basmala?: boolean
  isCentered?: boolean
  fontFamily?: string
}
