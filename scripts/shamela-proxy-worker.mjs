const ALLOWED_ORIGIN = "https://shamela.ws"
const ALLOWED_BOOK_PREFIX = `${ALLOWED_ORIGIN}/book/9260`
const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, HEAD, OPTIONS",
  "access-control-allow-headers": "content-type",
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return textResponse("Method not allowed", 405)
    }

    const requestUrl = new URL(request.url)
    const target = resolveTargetUrl(requestUrl)

    if (!target) {
      return textResponse("Missing target. Use ?url=https://shamela.ws/book/9260/100 or /book/9260/100", 400)
    }

    let targetUrl
    try {
      targetUrl = new URL(target)
    } catch {
      return textResponse("Invalid url query parameter", 400)
    }

    if (!targetUrl.href.startsWith(ALLOWED_BOOK_PREFIX)) {
      return textResponse("Only the Shamela Riyad as-Salihin book is allowed", 403)
    }

    const upstream = await fetch(targetUrl.href, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "Tmanina Shamela importer",
      },
      method: request.method,
    })

    const body = request.method === "HEAD" ? "" : await upstream.text()
    if (/Just a moment|cf_chl|Enable JavaScript and cookies|security verification/i.test(body)) {
      return textResponse(
        "UPSTREAM_CF_CHALLENGE: Shamela returned a Cloudflare challenge to this Worker. Use copied HTML/text with the importer, or a browser-capable fetch service.",
        502
      )
    }

    const headers = new Headers(upstream.headers)
    Object.entries(CORS_HEADERS).forEach(([key, value]) => headers.set(key, value))
    headers.set("cache-control", "public, max-age=86400")
    headers.delete("set-cookie")

    return new Response(body, {
      status: upstream.status,
      headers,
    })
  },
}

function resolveTargetUrl(requestUrl) {
  const target = requestUrl.searchParams.get("url")
  if (target) return target

  if (requestUrl.pathname === "/" || requestUrl.pathname === "") {
    return ""
  }

  if (requestUrl.pathname.startsWith("/book/9260")) {
    return `${ALLOWED_ORIGIN}${requestUrl.pathname}${requestUrl.search}`
  }

  return ""
}

function textResponse(message, status) {
  return new Response(message, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      ...CORS_HEADERS,
    },
  })
}
