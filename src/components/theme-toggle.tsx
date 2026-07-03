"use client"

import * as React from "react"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "./theme-provider"

export function ThemeToggle() {
  const { theme, toggle } = useTheme()

  // Avoid hydration mismatch: context starts at "light" until the first
  // effect reads localStorage. Render the Moon icon until mount to keep the
  // server-rendered and first-paint output stable; flip after hydration.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const isDark = mounted && theme === "dark"
  // Reveal the accurate action label only after hydration; pre-mount we show
  // a neutral label so screen readers don't claim a wrong destination.
  const label = mounted
    ? isDark
      ? "تبديل إلى الوضع النهاري"
      : "تبديل إلى الوضع الليلي"
    : "تبديل الوضع"

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="text-muted-foreground hover:text-foreground active:scale-90 size-9"
      aria-label={label}
    >
      {isDark ? (
        <Sun className="size-[18px]" />
      ) : (
        <Moon className="size-[18px]" />
      )}
    </Button>
  )
}
