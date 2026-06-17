interface ShareImageOptions {
  title: string
  text: string
  source?: string
  footer?: string
  filename?: string
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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function shareTextAsImage({
  title,
  text,
  source,
  footer = "تطبيق طمأنينة",
  filename = "tmanina-share.png",
}: ShareImageOptions) {
  if (typeof document === "undefined") return "unavailable"

  const canvas = document.createElement("canvas")
  const width = 1080
  const height = 1350
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext("2d")
  if (!context) return "unavailable"

  context.direction = "rtl"
  context.fillStyle = "#f8f3ea"
  context.fillRect(0, 0, width, height)

  const gradient = context.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, "#2b5a4b")
  gradient.addColorStop(1, "#d4a574")
  context.fillStyle = gradient
  context.fillRect(0, 0, width, 210)

  context.fillStyle = "rgba(255,255,255,0.16)"
  context.beginPath()
  context.arc(120, 90, 140, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = "#ffffff"
  context.textAlign = "right"
  context.font = '700 56px "Arial", sans-serif'
  context.fillText(title, width - 80, 125)
  context.font = '400 28px "Arial", sans-serif'
  context.fillText(footer, width - 80, 170)

  context.fillStyle = "#ffffff"
  context.strokeStyle = "rgba(43,90,75,0.16)"
  context.lineWidth = 2
  roundRect(context, 70, 270, width - 140, 800, 34)
  context.fill()
  context.stroke()

  context.fillStyle = "#2b2a27"
  context.textAlign = "right"
  context.font = '500 46px "Amiri", "Times New Roman", serif'

  const lines = wrapCanvasText(context, text, width - 220)
  const lineHeight = 84
  const maxLines = 8
  const visibleLines = lines.slice(0, maxLines)
  let y = 380

  visibleLines.forEach((line) => {
    context.fillText(line, width - 110, y)
    y += lineHeight
  })

  if (lines.length > maxLines) {
    context.fillText("...", width - 110, y)
  }

  if (source) {
    context.fillStyle = "#6b5f4f"
    context.font = '400 30px "Arial", sans-serif'
    context.fillText(source, width - 110, 1000)
  }

  context.fillStyle = "#2b5a4b"
  context.font = '700 34px "Arial", sans-serif'
  context.textAlign = "center"
  context.fillText("tmanina", width / 2, 1190)
  context.font = '400 28px "Arial", sans-serif'
  context.fillStyle = "#7a6f60"
  context.fillText("رفيقك في الذكر والدعاء", width / 2, 1238)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png", 0.95)
  })

  if (!blob) return "unavailable"

  const file = new File([blob], filename, { type: "image/png" })
  if (
    typeof navigator !== "undefined" &&
    navigator.share &&
    (!navigator.canShare || navigator.canShare({ files: [file] }))
  ) {
    await navigator.share({ title, files: [file] })
    return "shared"
  }

  downloadBlob(blob, filename)
  return "downloaded"
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
