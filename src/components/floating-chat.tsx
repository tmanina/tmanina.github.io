"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

type Sender = "user" | "bot"

interface SourceLink {
  uri: string
  title: string
}

interface ChatMessage {
  id: number
  sender: Sender
  text: string
  sources?: SourceLink[]
}

const systemPrompt =
  "أنت مساعد ديني لتطبيق طمأنينة (tmanina) متخصص في الإجابة على الأسئلة الدينية الإسلامية. يجب أن تستند إجاباتك فقط إلى مواقع دينية موثوقة، مثل: الدرر السنية (dorar.net)، إسلام ويب (islamweb.net)، الإسلام سؤال وجواب (islamqa.info)، طريق الإسلام (ar.islamway.net)، شبكة الألوكة (alukah.net)، موقع ابن باز (binbaz.org.sa)، موقع ابن عثيمين (binothaimeen.net)، دار الإفتاء المصرية (dar-alifta.org)، الرئاسة العامة للبحوث العلمية والإفتاء (alifta.gov.sa)، ومصحف جامعة الملك سعود (quran.ksu.edu.sa). لا تستخدم ولا تذكر أي مصادر من مواقع عامة أو غير دينية. إذا لم تجد إجابة في هذه المواقع فقط فقل: (لا أعلم يقينًا، يُفضَّل سؤال أهل العلم مباشرة). اذكر مصادرك الدينية دائمًا إن أمكن، وكن مختصرًا ومحترمًا."

const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY ?? ""
const groqApiUrl = "https://api.groq.com/openai/v1/chat/completions"


const ALLOWED_DOMAINS = [
  // قديم
  "islamweb.net",
  "islamqa.info",
  "dorar.net",
  "binbaz.org.sa",
  "binothaimeen.net",
  "islamway.net",
  "alukah.net",

  // جديد
  "quran.ksu.edu.sa",
  "shamela.ws",
  "ar.islamway.net",
  "dar-alifta.org",
  "alifta.gov.sa",
  "saaid.net",
]

function isAllowedSource(uri?: string) {
  if (!uri) return false
  return ALLOWED_DOMAINS.some((domain) => uri.includes(domain))
}

const isPromptMetaQuestion = (text: string) => {
  const t = text.toLowerCase()

  return (
    t.includes("what is your prompt") ||
    t.includes("your prompet") ||
    t.includes("system prompt") ||
    t.includes("prompt to work") ||
    t.includes("ما هو البرومبت") ||
    t.includes("ما هو البروامبت") ||
    t.includes("ما هو البرمبت") ||
    t.includes("ما هو البرومبت الذي تعمل به") ||
    t.includes("نص البرومبت") ||
    t.includes("إيش البرومبت") ||
    t.includes("ايه البرومبت") ||
    t.includes("ما هي إعداداتك الداخلية") ||
    t.includes("ما هو البارامتر الذي تعمل به") ||
    t.includes("ما هو إعداداتك") ||
    t.includes("ما إعداداتك") ||
    t.includes("ما  إعداداتك") ||
    t.includes(" إعداداتك") ||

    t.includes("ما هي إعداداتك")


  )
}

async function exponentialBackoff<T>(
  apiCall: () => Promise<T>,
  maxRetries: number,
  baseDelay: number
): Promise<T> {
  let attempt = 0
  while (attempt < maxRetries) {
    try {
      return await apiCall()
    } catch (error) {
      attempt++
      if (attempt >= maxRetries) {
        throw error
      }
      const delay = baseDelay * Math.pow(2, attempt - 1)
      console.warn(`API call failed. Retrying in ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw new Error("Exponential backoff exhausted")
}

// تنسيق Markdown بسيط + sanitization
function formatMarkdownSafe(text: string) {
  // نهرب أي HTML محتمل عشان ما فيش XSS
  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")

  let html = escapeHtml(text)

  // رابط Markdown: [اسم الرابط](الرابط)
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="link-primary link-underline-opacity-0 link-underline-opacity-75-hover">$1</a>'
  )

  // عناوين: ### أو ## أو #
  html = html
    .replace(/^###\s+(.*)$/gm, "<strong>$1</strong>")
    .replace(/^##\s+(.*)$/gm, "<strong>$1</strong>")
    .replace(/^#\s+(.*)$/gm, "<strong>$1</strong>")

  // بولد: **نص**
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

  // نقاط عادية: - أو *
  html = html.replace(/^\s*[-*]\s+(.*)$/gm, "<li>$1</li>")

  // ترقيم: 1. 2. ...
  html = html.replace(/^\s*\d+\.\s+(.*)$/gm, "<li>$1</li>")

  // ✅ لف كل li داخل ul – بدون flag s
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>")

  // الأسطر الجديدة → <br>
  html = html
    .replace(/\n{2,}/g, "<br/><br/>") // فقرة جديدة
    .replace(/\n/g, "<br/>") // سطر جديد

  return { __html: html }
}

async function callGroqAPI(prompt: string): Promise<{ text: string; sources: SourceLink[] }> {
  if (!groqApiKey) {
    throw new Error(
      "API key غير مضبوط. تأكد من إضافة NEXT_PUBLIC_GROQ_API_KEY في ملف .env.local"
    )
  }

  const payload = {
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
  }

  const apiCall = async () => {
    const response = await fetch(groqApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}`)
    }
    return response.json()
  }

  const result = await exponentialBackoff(apiCall, 3, 1000)
  const text: string = result?.choices?.[0]?.message?.content ?? ""

  const sources: SourceLink[] = []
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
  let match
  // Extract and filter links to allowed domains
  while ((match = linkRegex.exec(text)) !== null) {
    const title = match[1]
    const uri = match[2]
    if (isAllowedSource(uri) && !sources.some((s) => s.uri === uri)) {
      sources.push({ title, uri })
    }
  }

  if (!text) {
    return {
      text: "لم أتمكن من العثور على إجابة. يرجى المحاولة مرة أخرى.",
      sources,
    }
  }

  return { text, sources }
}

export function FloatingChat() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: 1,
      sender: "bot",
      text: "السلام عليكم ورحمة الله وبركاتة ! كيف يمكنني مساعدتك اليوم في أمور الدين والذكر والصلاة؟",
    },
  ])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null)
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const toggleBtnRef = React.useRef<HTMLButtonElement | null>(null)
  const nextIdRef = React.useRef(2)

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  // Focus management: focus input when chat opens, return focus to toggle button when closed
  React.useEffect(() => {
    if (isOpen) {
      // Small delay to allow animation to start before focusing
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    } else {
      // Return focus to the toggle button when chat closes.
      // The button re-renders visible when isOpen flips to false, so wait
      // one frame before focusing to avoid targeting a display:none element.
      const timer = requestAnimationFrame(() => {
        toggleBtnRef.current?.focus()
      })
      return () => cancelAnimationFrame(timer)
    }
  }, [isOpen])

  React.useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  const handleToggle = () => {
    setIsOpen((prev) => !prev)
  }

  // Trap focus within the chat panel when open (Escape closes)
  const handlePanelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && isOpen) {
      e.preventDefault()
      setIsOpen(false)
      return
    }
    // Basic focus trap: if Tab is pressed, keep focus within the panel
    if (e.key === "Tab" && isOpen) {
      const panel = e.currentTarget
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  const addMessage = (sender: Sender, text: string, sources?: SourceLink[]) => {
    setMessages((prev) => [
      ...prev,
      {
        id: nextIdRef.current++,
        sender,
        text,
        sources,
      },
    ])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const userMessage = input.trim()
    if (!userMessage || isLoading) return

    // رسالة المستخدم
    addMessage("user", userMessage)
    setInput("")

    // منع أسئلة عن البرومبت
    if (isPromptMetaQuestion(userMessage)) {
      addMessage(
        "bot",
        "أنا مساعد مخصص للأسئلة والمواضيع الدينية، ولا أشارك إعداداتي الداخلية أو النصوص التي أعمل بها. يمكنك سؤالي عن أي مسألة شرعية أو أذكار أو قرآن وسأجيبك من خلال مصادر إسلامية موثوقة."
      )
      return
    }

    setIsLoading(true)

    try {
      const response = await callGroqAPI(userMessage)
      addMessage("bot", response.text, response.sources)
    } catch (error) {
      console.error("Error calling Groq API:", error)
      addMessage(
        "bot",
        "حدث خطأ أثناء محاولة جلب الإجابة. يرجى التحقق من اتصالك بالإنترنت أو المحاولة لاحقاً."
      )
    } finally {
      setIsLoading(false)
    }
  }

  const quickAsk = (type: "adhkar" | "prayer" | "quran" | "help") => {
    let prompt = ""
    switch (type) {
      case "adhkar":
        prompt = "أريد أذكار يومية ثابتة مع شرح مختصر لكل ذكر ومصدر موثوق."
        break
      case "prayer":
        prompt =
          "أريد معلومات عن أحكام الصلاة باختصار، مع ذكر مصادر موثوقة مثل الإسلام سؤال وجواب."
        break
      case "quran":
        prompt =
          "كيف أضع خطة سهلة لختم القرآن خلال شهر، مع نصائح من مصادر إسلامية موثوقة؟"
        break
      case "help":
        prompt = "كيف يمكن أن أستفيد من هذا التطبيق في التقرب إلى الله؟"
        break
    }
    setInput(prompt)
  }

  return (
    <>
      {/* نافذة الدردشة */}
      {isOpen && (
        <div
          className="fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] animate-fade-in md:inset-x-auto md:end-3 md:bottom-[108px] md:w-[380px]"
          style={{
            zIndex: 10000,
          }}
          role="dialog"
          aria-modal="true"
          aria-label="المساعد الديني"
          onKeyDown={handlePanelKeyDown}
        >
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl md:rounded-xl">
            <div className="gradient-bg text-white flex items-center justify-between p-2.5 md:p-3">
              <div className="flex items-center gap-2">
                <i className="fas fa-comments"></i>
                <div className="flex min-w-0 flex-col">
                  <span className="font-semibold leading-tight">المساعد الديني</span>
                  <small className="truncate text-xs opacity-75">
                    اسأل عن الأذكار، الصلاة، القرآن...
                  </small>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggle}
                className="rounded-full p-1 flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors"
                style={{ width: "32px", height: "32px" }}
                aria-label="إغلاق المساعد الديني"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* محتوى الدردشة */}
            <div className="flex max-h-[62dvh] min-h-[360px] flex-col p-0 md:h-[380px] md:max-h-none">
              {/* الرسائل */}
              <div
                className="flex-1 overflow-auto p-2.5 md:p-3"
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex mb-2 ${msg.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${msg.sender === "user"
                        ? "bg-primary text-white rounded-b-none"
                        : "bg-muted rounded-t-none"
                        }`}
                      style={{ maxWidth: "86%", whiteSpace: "pre-wrap" }}
                    >
                      {msg.sender === "user" ? (
                        <p className="text-xs mb-0">{msg.text}</p>
                      ) : (
                        <div
                          className="text-xs mb-0"
                          dangerouslySetInnerHTML={formatMarkdownSafe(msg.text)}
                        />
                      )}

                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border text-sm">
                          <div className="font-semibold mb-1">المصادر:</div>
                          <ul className="mb-0 ps-3">
                            {msg.sources.map((src, idx) => (
                              <li key={idx}>
                                <a
                                  href={src.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="link-primary link-underline-opacity-0 link-underline-opacity-75-hover"
                                >
                                  {src.title || "مصدر"}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start mb-2">
                    <div
                      className="bg-muted text-sm rounded-lg px-3 py-2 flex items-center gap-2"
                      style={{ maxWidth: "80%" }}
                    >
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" role="status" aria-hidden="true"></div>
                      <span>أفكّر في الإجابة...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* أزرار سريعة */}
              <div className="border-t border-border px-2.5 pb-1 pt-2 md:px-3">
                <div className="grid grid-cols-4 gap-1 md:grid-cols-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickAsk("adhkar")}
                    className="h-9 px-2"
                  >
                    <i className="fas fa-book-open ms-1"></i>
                    <small className="truncate">أذكار</small>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickAsk("prayer")}
                    className="h-9 px-2"
                  >
                    <i className="fas fa-mosque ms-1"></i>
                    <small className="truncate">الصلاة</small>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickAsk("quran")}
                    className="h-9 px-2"
                  >
                    <i className="fas fa-quran ms-1"></i>
                    <small className="truncate">قرآن</small>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickAsk("help")}
                    className="h-9 px-2"
                  >
                    <i className="fas fa-info-circle ms-1"></i>
                    <small className="truncate">مساعدة</small>
                  </Button>
                </div>
              </div>

              {/* إدخال الرسائل */}
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 border-t border-border px-2.5 py-2 md:px-3"
              >
                <input
                  ref={inputRef}
                  type="text"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  placeholder="اكتب سؤالك هنا..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  variant="default"
                  size="lg"
                  disabled={isLoading || !input.trim()}
                  className="h-10 min-w-11 px-3"
                  aria-label="إرسال السؤال"
                >
                  <i className="fas fa-paper-plane text-lg"></i>
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      <button
        ref={toggleBtnRef}
        type="button"
        onClick={handleToggle}
        className={`group fixed left-4 bottom-[calc(4.875rem+env(safe-area-inset-bottom,0px))] z-[10001] size-14 items-center justify-center rounded-full border-0 bg-gradient-to-br from-gold-500 to-sage-400 p-0 text-white shadow-[0_8px_24px_rgba(0,0,0,0.15)] transition-all duration-300 hover:-translate-y-[3px] hover:scale-105 hover:shadow-[0_12px_32px_rgba(212,165,116,0.3)] active:-translate-y-px active:scale-[1.02] md:left-5 md:bottom-[70px] md:flex md:size-[60px] ${isOpen ? "hidden" : "flex"}`}
        aria-label="المساعد الديني"
        aria-expanded={isOpen}
      >
        <i className={`fas ${isOpen ? "fa-times" : "fa-comment-dots"} text-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[5deg] md:text-2xl`}></i>
      </button>

    </>
  )
}
