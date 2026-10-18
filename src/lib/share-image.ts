interface ShareImageOptions {
  title: string
  text: string
  source?: string
  footer?: string
  filename?: string
}

/**
 * Draws an authentic 8-pointed Islamic Star (نجمة إسلامية ثمانية)
 */
function drawIslamicStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  fillColor?: string,
  strokeColor?: string,
  lineWidth = 1.5
) {
  ctx.save()
  ctx.beginPath()
  const points = 8
  const step = Math.PI / points
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius
    const angle = i * step - Math.PI / 2
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  if (fillColor) {
    ctx.fillStyle = fillColor
    ctx.fill()
  }
  if (strokeColor) {
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = lineWidth
    ctx.stroke()
  }
  ctx.restore()
}

/**
 * Draws an ornate Islamic corner ornament
 */
function drawCornerFlourish(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  dirX: 1 | -1,
  dirY: 1 | -1,
  goldColor: string
) {
  ctx.save()
  ctx.strokeStyle = goldColor
  ctx.fillStyle = goldColor
  ctx.lineWidth = 2

  // Outer L-lines
  ctx.beginPath()
  ctx.moveTo(x + dirX * size, y)
  ctx.lineTo(x, y)
  ctx.lineTo(x, y + dirY * size)
  ctx.stroke()

  // Inner L-lines
  const inset = 10
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(x + dirX * (size - 14), y + dirY * inset)
  ctx.lineTo(x + dirX * inset, y + dirY * inset)
  ctx.lineTo(x + dirX * inset, y + dirY * (size - 14))
  ctx.stroke()

  // Star finial at apex
  drawIslamicStar(ctx, x + dirX * (inset + 12), y + dirY * (inset + 12), 8, 4, goldColor)
  ctx.restore()
}

/**
 * Draws a classical Islamic horizontal divider
 */
function drawIslamicDivider(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  goldColor: string
) {
  ctx.save()
  const half = width / 2

  // Center 8-pointed star
  drawIslamicStar(ctx, cx, cy, 14, 7, goldColor)

  // Side diamonds
  drawIslamicStar(ctx, cx - 36, cy, 6, 3, goldColor)
  drawIslamicStar(ctx, cx + 36, cy, 6, 3, goldColor)

  // Left fading line
  const gradLeft = ctx.createLinearGradient(cx - 55, cy, cx - half, cy)
  gradLeft.addColorStop(0, goldColor)
  gradLeft.addColorStop(1, "rgba(212, 175, 55, 0)")
  ctx.strokeStyle = gradLeft
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(cx - 55, cy)
  ctx.lineTo(cx - half, cy)
  ctx.stroke()

  // Right fading line
  const gradRight = ctx.createLinearGradient(cx + 55, cy, cx + half, cy)
  gradRight.addColorStop(0, goldColor)
  gradRight.addColorStop(1, "rgba(212, 175, 55, 0)")
  ctx.strokeStyle = gradRight
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(cx + 55, cy)
  ctx.lineTo(cx + half, cy)
  ctx.stroke()

  ctx.restore()
}

function wrapCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) {
  const words = text.replace(/\s+/g, " ").trim().split(" ")
  const lines: string[] = []
  let line = ""

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word
    if (context.measureText(testLine).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = testLine
    }
  })

  if (line) lines.push(line)
  return lines
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(x + width - radius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + radius)
  context.lineTo(x + width, y + height - radius)
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  context.lineTo(x + radius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
}

function downloadBlob(blob: Blob, filename: string) {
  if (typeof window === "undefined" || typeof URL === "undefined" || !URL.createObjectURL) {
    return
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  if (URL.revokeObjectURL) {
    URL.revokeObjectURL(url)
  }
}

export async function shareTextAsImage({
  title,
  text,
  source,
  footer = "تطبيق طمأنينة",
  filename = "tmanina-dua.png",
}: ShareImageOptions): Promise<"shared" | "downloaded" | "unavailable"> {
  if (typeof document === "undefined") return "unavailable"

  const canvas = document.createElement("canvas")
  const width = 1080
  const height = 1350
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext("2d")
  if (!context) return "unavailable"

  context.direction = "rtl"

  // 1. Deep Royal Islamic Emerald Velvet Gradient
  const bgGrad = context.createRadialGradient(
    width / 2,
    height * 0.42,
    80,
    width / 2,
    height * 0.5,
    width * 0.9
  )
  bgGrad.addColorStop(0, "#0e3427")    // luminous deep emerald center
  bgGrad.addColorStop(0.5, "#082218")  // regal dark emerald
  bgGrad.addColorStop(1, "#03100b")    // obsidian emerald borders
  context.fillStyle = bgGrad
  context.fillRect(0, 0, width, height)

  // 2. Subtle Background Geometric Stars Pattern
  context.save()
  const stepX = 180
  const stepY = 180
  for (let gx = stepX / 2; gx < width; gx += stepX) {
    for (let gy = stepY / 2; gy < height; gy += stepY) {
      drawIslamicStar(context, gx, gy, 18, 9, undefined, "rgba(212, 175, 55, 0.025)", 1)
    }
  }
  context.restore()

  const goldPrimary = "#d4af37"
  const goldLight = "#f7e7ce"
  const goldSoft = "#e0c99f"

  // 3. Ornate Double Gold Borders
  // Outer fine pinstripe
  context.strokeStyle = "rgba(212, 175, 55, 0.45)"
  context.lineWidth = 1.5
  context.strokeRect(38, 38, width - 76, height - 76)

  // Inner rounded gold border
  context.strokeStyle = "rgba(212, 175, 55, 0.75)"
  context.lineWidth = 2
  roundRect(context, 52, 52, width - 104, height - 104, 22)
  context.stroke()

  // 4 Corner Flourishes with Stars
  drawCornerFlourish(context, 52, 52, 56, 1, 1, goldPrimary)
  drawCornerFlourish(context, width - 52, 52, 56, -1, 1, goldPrimary)
  drawCornerFlourish(context, 52, height - 52, 56, 1, -1, goldPrimary)
  drawCornerFlourish(context, width - 52, height - 52, 56, -1, -1, goldPrimary)

  // 4. Header: Basmala
  context.textAlign = "center"
  context.fillStyle = goldLight
  context.font = '500 32px "Amiri", "Traditional Arabic", "Scheherazade", serif'
  context.shadowColor = "rgba(212, 175, 55, 0.35)"
  context.shadowBlur = 8
  context.fillText("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", width / 2, 125)
  context.shadowBlur = 0

  // 5. Header Badge: Category Cartouche
  const cartoucheWidth = Math.min(width - 240, 560)
  const cartoucheHeight = 56
  const cartoucheX = (width - cartoucheWidth) / 2
  const cartoucheY = 160

  context.fillStyle = "rgba(12, 42, 32, 0.85)"
  context.strokeStyle = "rgba(212, 175, 55, 0.6)"
  context.lineWidth = 1.5
  roundRect(context, cartoucheX, cartoucheY, cartoucheWidth, cartoucheHeight, 28)
  context.fill()
  context.stroke()

  context.fillStyle = "#fce8c3"
  context.font = '700 24px "Cairo", "Amiri", sans-serif'
  context.fillText(`✦  ${title}  ✦`, width / 2, cartoucheY + 36)

  // 6. Central Dua Card Container
  const cardX = 85
  const cardY = 250
  const cardW = width - 170
  const cardH = 810

  context.fillStyle = "rgba(255, 255, 255, 0.025)"
  context.strokeStyle = "rgba(212, 175, 55, 0.22)"
  context.lineWidth = 1
  roundRect(context, cardX, cardY, cardW, cardH, 26)
  context.fill()
  context.stroke()

  // Opening Decorative Quotation Mark
  context.fillStyle = "rgba(212, 175, 55, 0.45)"
  context.font = '700 70px "Georgia", serif'
  context.fillText("❝", width / 2, cardY + 75)

  // 7. Auto-Fit Dua Typography
  const cleanText = text.replace(/\s+/g, " ").trim()
  const charCount = cleanText.length

  let fontSize = 44
  let lineHeight = 76

  if (charCount < 70) {
    fontSize = 50
    lineHeight = 88
  } else if (charCount < 140) {
    fontSize = 42
    lineHeight = 74
  } else if (charCount < 260) {
    fontSize = 36
    lineHeight = 64
  } else if (charCount < 400) {
    fontSize = 30
    lineHeight = 54
  } else {
    fontSize = 26
    lineHeight = 46
  }

  const maxTextWidth = cardW - 120
  context.font = `500 ${fontSize}px "Amiri", "Traditional Arabic", "Scheherazade", serif`
  let lines = wrapCanvasText(context, cleanText, maxTextWidth)

  // Safety auto-scaler: if lines exceed available height, shrink smoothly
  const maxAvailableHeight = 520
  while (lines.length * lineHeight > maxAvailableHeight && fontSize > 20) {
    fontSize -= 2
    lineHeight = Math.round(fontSize * 1.6)
    context.font = `500 ${fontSize}px "Amiri", "Traditional Arabic", "Scheherazade", serif`
    lines = wrapCanvasText(context, cleanText, maxTextWidth)
  }

  // Vertically Center the text inside the card
  const totalTextHeight = lines.length * lineHeight
  const textStartY = cardY + 110 + Math.max(0, (maxAvailableHeight - totalTextHeight) / 2)

  context.fillStyle = "#fffcf2"
  context.shadowColor = "rgba(0, 0, 0, 0.65)"
  context.shadowBlur = 6
  context.shadowOffsetY = 2

  let curY = textStartY
  lines.forEach((line) => {
    context.fillText(line, width / 2, curY)
    curY += lineHeight
  })
  context.shadowBlur = 0
  context.shadowOffsetY = 0

  // Closing Decorative Quotation Mark
  context.fillStyle = "rgba(212, 175, 55, 0.45)"
  context.font = '700 60px "Georgia", serif'
  context.fillText("❞", width / 2, curY + 25)

  // 8. Islamic Divider
  const dividerY = Math.min(cardY + cardH - 100, Math.max(curY + 65, cardY + cardH - 120))
  drawIslamicDivider(context, width / 2, dividerY, 440, goldPrimary)

  // 9. Source Attribution Badge
  if (source) {
    const sourceY = dividerY + 45
    context.fillStyle = "rgba(212, 175, 55, 0.1)"
    context.strokeStyle = "rgba(212, 175, 55, 0.3)"
    context.lineWidth = 1

    const sourceText = `المصدر: ${source}`
    context.font = '500 22px "Cairo", "Amiri", sans-serif'
    const sourceMetrics = context.measureText(sourceText)
    const sourceBadgeW = Math.min(sourceMetrics.width + 48, cardW - 80)
    const sourceBadgeH = 40
    const sourceBadgeX = (width - sourceBadgeW) / 2

    roundRect(context, sourceBadgeX, sourceY - 26, sourceBadgeW, sourceBadgeH, 20)
    context.fill()
    context.stroke()

    context.fillStyle = goldSoft
    context.fillText(sourceText, width / 2, sourceY)
  }

  // 10. Royal Footer & Branding
  const footerY = height - 145

  // Center gold star icon
  drawIslamicStar(context, width / 2, footerY - 32, 11, 5.5, goldPrimary)

  // App Name
  context.fillStyle = "#fae8c8"
  context.font = '800 32px "Cairo", sans-serif'
  context.fillText(footer, width / 2, footerY)

  // Subtitle
  context.fillStyle = "#c0ae94"
  context.font = '500 20px "Cairo", sans-serif'
  context.fillText("tmanina • رفيقك اليومي في الذكر والدعاء", width / 2, footerY + 36)

  // 11. Generate Image Blob and Share / Download
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png", 0.98)
  })

  if (!blob) return "unavailable"

  const file = new File([blob], filename, { type: "image/png" })
  if (
    typeof navigator !== "undefined" &&
    navigator.share &&
    (!navigator.canShare || navigator.canShare({ files: [file] }))
  ) {
    try {
      await navigator.share({ title, files: [file] })
      return "shared"
    } catch {
      // If user dismisses or share API fails, fall back to download
      downloadBlob(blob, filename)
      return "downloaded"
    }
  }

  downloadBlob(blob, filename)
  return "downloaded"
}
