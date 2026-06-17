"use client"

import * as React from "react"
import { BASE_W, BASE_H } from "../utils"

/**
 * Creates a fixed-size virtual page (900×1350) and scales it to fit any screen.
 * Uses ResizeObserver and visualViewport for responsive scaling.
 */
export function useMushafScale() {
  const stageRef = React.useRef<HTMLDivElement>(null)
  const [scale, setScale] = React.useState(1)

  React.useLayoutEffect(() => {
    const compute = () => {
      const el = stageRef.current
      if (!el) return

      let availW = el.clientWidth
      let availH = el.clientHeight

      if (availW < 50 || availH < 50) {
        availW = window.innerWidth
        availH = window.innerHeight
      }

      const cs = getComputedStyle(el)
      const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0)
      const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0)

      availW = Math.max(0, availW - padX)
      availH = Math.max(0, availH - padY)

      const s = Math.min(availW / BASE_W, availH / BASE_H)
      setScale(Math.max(0.1, s))
    }

    compute()
    requestAnimationFrame(compute)
    setTimeout(compute, 60)

    if ((document as any).fonts?.ready) {
      ;(document as any).fonts.ready.then(compute).catch(() => {})
    }

    const ro = new ResizeObserver(compute)
    if (stageRef.current) ro.observe(stageRef.current)

    window.addEventListener("orientationchange", compute)
    window.addEventListener("resize", compute)
    window.visualViewport?.addEventListener("resize", compute)

    return () => {
      ro.disconnect()
      window.removeEventListener("orientationchange", compute)
      window.removeEventListener("resize", compute)
      window.visualViewport?.removeEventListener("resize", compute)
    }
  }, [])

  return { stageRef, scale }
}
