"use client"

import * as React from "react"

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

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? ""
const apiUrl = apiKey
  ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`
  : ""

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

async function callGeminiAPI(prompt: string): Promise<{ text: string; sources: SourceLink[] }> {
  if (!apiKey || !apiUrl) {
    throw new Error(
      "API key غير مضبوط. تأكد من إضافة NEXT_PUBLIC_GEMINI_API_KEY في ملف .env.local"
    )
  }

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    tools: [{ google_search: {} }],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
  }

  const apiCall = async () => {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}`)
    }
    return response.json()
  }

  const result = await exponentialBackoff(apiCall, 3, 1000)

  const candidate = result?.candidates?.[0]
  const text: string | undefined = candidate?.content?.parts?.[0]?.text

  let sources: SourceLink[] = []
  const groundingMetadata = candidate?.groundingMetadata
  if (groundingMetadata?.groundingAttributions) {
    sources =
      groundingMetadata.groundingAttributions
        .map((attr: any) => ({
          uri: attr.web?.uri as string | undefined,
          title: attr.web?.title as string | undefined,
        }))
        .filter((s: SourceLink) => s.uri && s.title) as SourceLink[]

    // فلترة المصادر على الدومينات المسموح بها فقط
    sources = sources.filter((s) => isAllowedSource(s.uri))
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
  const nextIdRef = React.useRef(2)

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  React.useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  const handleToggle = () => {
    setIsOpen((prev) => !prev)
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
      const response = await callGeminiAPI(userMessage)
      addMessage("bot", response.text, response.sources)
    } catch (error) {
      console.error("Error calling Gemini API:", error)
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
          className="position-fixed end-0 m-3 animate-fade-in"
          style={{
            zIndex: 1040,
            bottom: "108px", // Increased by 20px (was 88px)
            maxWidth: "380px",
            width: "calc(100vw - 2rem)",
          }}
        >
          <div className="card border-0 shadow-lg rounded-4 bg-body">
            {/* ... (header content remains same, omitted for brevity in replacement if not changing) ... */}
            <div className="card-header gradient-bg text-white d-flex align-items-center justify-content-between p-3">
              <div className="d-flex align-items-center gap-2">
                <i className="fas fa-comments"></i>
                <div className="d-flex flex-column">
                  <span className="fw-semibold">المساعد الديني</span>
                  <small className="opacity-75">
                    اسأل عن الأذكار، الصلاة، القرآن...
                  </small>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggle}
                className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center"
                style={{ width: "32px", height: "32px" }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* محتوى الدردشة */}
            <div className="card-body p-0 d-flex flex-column" style={{ height: "380px" }}>
              {/* الرسائل */}
              <div
                className="flex-grow-1 p-3 overflow-auto"
                style={{ backgroundColor: "var(--bs-body-bg)" }}
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`d-flex mb-2 ${msg.sender === "user" ? "justify-content-end" : "justify-content-start"
                      }`}
                  >
                    <div
                      className={`p-2 rounded-3 ${msg.sender === "user"
                        ? "bg-primary text-white rounded-bottom-0"
                        : "bg-body-secondary text-body rounded-top-0"
                        }`}
                      style={{ maxWidth: "80%", whiteSpace: "pre-wrap" }}
                    >
                      {msg.sender === "user" ? (
                        <p className="small mb-0">{msg.text}</p>
                      ) : (
                        <div
                          className="small mb-0"
                          dangerouslySetInnerHTML={formatMarkdownSafe(msg.text)}
                        />
                      )}

                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-top border-secondary-subtle small">
                          <div className="fw-semibold mb-1">المصادر:</div>
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
                  <div className="d-flex justify-content-start mb-2">
                    <div
                      className="bg-body-secondary text-body small rounded-3 px-3 py-2 d-flex align-items-center gap-2"
                      style={{ maxWidth: "80%" }}
                    >
                      <div
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      ></div>
                      <span>أفكّر في الإجابة...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* أزرار سريعة */}
              <div className="px-3 pt-2 pb-1 border-top">
                <div className="row g-1">
                  <div className="col-6">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm w-100"
                      onClick={() => quickAsk("adhkar")}
                    >
                      <i className="fas fa-book-open me-1"></i>
                      <small>أذكار</small>
                    </button>
                  </div>
                  <div className="col-6">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm w-100"
                      onClick={() => quickAsk("prayer")}
                    >
                      <i className="fas fa-mosque me-1"></i>
                      <small>الصلاة</small>
                    </button>
                  </div>
                  <div className="col-6 mt-1">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm w-100"
                      onClick={() => quickAsk("quran")}
                    >
                      <i className="fas fa-quran me-1"></i>
                      <small>قرآن</small>
                    </button>
                  </div>
                  <div className="col-6 mt-1">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm w-100"
                      onClick={() => quickAsk("help")}
                    >
                      <i className="fas fa-info-circle me-1"></i>
                      <small>مساعدة</small>
                    </button>
                  </div>
                </div>
              </div>

              {/* إدخال الرسائل */}
              <form
                onSubmit={handleSubmit}
                className="d-flex align-items-center gap-2 px-3 py-2 border-top"
              >
                <input
                  type="text"
                  className="form-control form-control-lg rounded-3"
                  placeholder="اكتب سؤالك هنا..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="btn btn-primary rounded-3 d-flex align-items-center justify-content-center"
                  disabled={isLoading || !input.trim()}
                  style={{ minWidth: "50px", height: "48px" }}
                >
                  <i className="fas fa-paper-plane fs-5"></i>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleToggle}
        className="floating-chat-btn position-fixed d-flex align-items-center justify-content-center shadow-lg"
        aria-label="المساعد الديني"
      >
        <i className={`fas ${isOpen ? "fa-times" : "fa-comment-dots"} chat-icon`}></i>
      </button>

      <style jsx>{`
        .floating-chat-btn {
          left: 20px;
          bottom: 70px;
          width: 60px;
          height: 60px;
          border: none;
          border-radius: 50%;
          padding: 0;
          background: linear-gradient(135deg, #d4a574 0%, #7d9d7f 100%);
          color: white;
          z-index: 1050;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .floating-chat-btn:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 12px 32px rgba(212, 165, 116, 0.3);
        }

        .floating-chat-btn:active {
          transform: translateY(-1px) scale(1.02);
        }

        .chat-icon {
          font-size: 1.5rem;
          transition: transform 0.3s ease;
        }

        .floating-chat-btn:hover .chat-icon {
          transform: scale(1.1) rotate(5deg);
        }

        @media (max-width: 992px) {
          .floating-chat-btn {
            bottom: 80px;
            width: 56px;
            height: 56px;
          }

          .chat-icon {
            font-size: 1.3rem;
          }
        }
      `}</style>

    </>
  )
}
