export interface KeyVerse {
  text: string
  surah: string
  ayah: string
}

export interface ProphetHadith {
  text: string
  source: string
  narrator?: string
}

export interface StoryMilestone {
  stage: string
  title: string
  story: string
}

export type ProphetCategory = "ulul-azm" | "early" | "arab" | "israel" | "final" | "all"

export interface ProphetStory {
  id: string
  name: string
  title: string
  period: string
  order: number
  quranMentionCount: number
  category: ProphetCategory
  brief: string
  heritageSources: string[]
  hadiths: ProphetHadith[]
  milestones: StoryMilestone[]
  lessons: string[]
  miracles: string[]
  keyVerses: KeyVerse[]
  color: string
  gradient: string
  icon: string
}
