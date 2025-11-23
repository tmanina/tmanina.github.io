"use client"

import * as React from "react"
import styles from "./splash-screen.module.css"

interface SplashScreenProps {
  onFinish: () => void
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [isExiting, setIsExiting] = React.useState(false)

  const onFinishRef = React.useRef(onFinish)

  React.useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  React.useEffect(() => {
    // Start exit animation slightly before the total duration
    const exitTimer = setTimeout(() => {
      setIsExiting(true)
    }, 1500) // Start exit at 1.5s

    // Complete and unmount
    const finishTimer = setTimeout(() => {
      onFinishRef.current()
    }, 2000) // Total duration 2s

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(finishTimer)
    }
  }, [])

  return (
    <div className={`${styles.splashContainer} ${isExiting ? styles.splashExit : ""}`}>
      <div className={styles.bgPattern}></div>

      <div className={styles.contentWrapper}>
        <div className={styles.iconWrapper}>
          <div className={styles.iconGlow}></div>
          <i className={`fas fa-mosque ${styles.mainIcon}`}></i>
        </div>

        <h1 className={styles.title}>طمأنينة</h1>

        <div className={styles.divider}></div>

        <p className={styles.subtitle}>
          رفيقك في رحلة التقرب إلى الله
        </p>
      </div>
    </div>
  )
}
