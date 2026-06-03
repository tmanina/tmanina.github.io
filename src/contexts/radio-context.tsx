"use client"

import * as React from "react"

interface RadioContextType {
  activeRadioId: number | null
  activeIsPlaying: boolean
  setActiveRadio: (id: number | null, playing: boolean) => void
}

const RadioContext = React.createContext<RadioContextType | null>(null)

export function RadioProvider({ children }: { children: React.ReactNode }) {
  const [activeRadioId, setActiveRadioId] = React.useState<number | null>(null)
  const [activeIsPlaying, setActiveIsPlaying] = React.useState(false)

  const setActiveRadio = React.useCallback((id: number | null, playing: boolean) => {
    setActiveRadioId(id)
    setActiveIsPlaying(playing)
  }, [])

  return (
    <RadioContext.Provider value={{ activeRadioId, activeIsPlaying, setActiveRadio }}>
      {children}
    </RadioContext.Provider>
  )
}

export function useRadioContext() {
  const ctx = React.useContext(RadioContext)
  if (!ctx) throw new Error("useRadioContext must be used within RadioProvider")
  return ctx
}
