export type DuaItem = {
  id: string
  text: string
  source: string
  reward?: string
}

export type DuaCategory = {
  id: string
  title: string
  icon: string
  gradient: string
  items: DuaItem[]
}
