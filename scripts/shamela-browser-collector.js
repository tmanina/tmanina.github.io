/*
 * Run this in the browser console while you are on https://shamela.ws/book/9260
 * after the page has loaded normally. It downloads one JSON file that can be
 * imported with:
 * node scripts/import-riyad-shamela.mjs --input-json ./riyad-shamela-pages.json --apply
 */
(async () => {
  const BOOK_ID = "9260"
  const FROM_PAGE = 1
  const TO_PAGE = 1300
  const DELAY_MS = 700
  const OUTPUT_NAME = "riyad-shamela-pages.json"

  if (location.hostname !== "shamela.ws") {
    throw new Error("Open https://shamela.ws/book/9260 first, then run this script in that tab.")
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  async function fetchPage(page) {
    const url = `/book/${BOOK_ID}/${page}`
    const response = await fetch(url, {
      credentials: "include",
      headers: { accept: "text/html,application/xhtml+xml" },
    })
    const html = await response.text()
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} while fetching ${url}`)
    }
    if (/Just a moment|cf_chl|Enable JavaScript and cookies|security verification/i.test(html)) {
      throw new Error(`Cloudflare challenge returned while fetching ${url}`)
    }
    return { page, url: `https://shamela.ws${url}`, html }
  }

  const pages = []
  for (let page = FROM_PAGE; page <= TO_PAGE; page += 1) {
    try {
      const item = await fetchPage(page)
      pages.push(item)
      console.log(`[riyad] saved page ${page}; total ${pages.length}`)
    } catch (error) {
      console.warn(`[riyad] stopped at page ${page}: ${error.message}`)
      break
    }
    await sleep(DELAY_MS)
  }

  const payload = {
    source: "https://shamela.ws/book/9260",
    collectedAt: new Date().toISOString(),
    fromPage: FROM_PAGE,
    toPage: pages.length ? pages[pages.length - 1].page : null,
    pages,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = OUTPUT_NAME
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(link.href)
  console.log(`[riyad] downloaded ${OUTPUT_NAME} with ${pages.length} pages`)
})()
