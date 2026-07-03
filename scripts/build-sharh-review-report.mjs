#!/usr/bin/env node
/**
 * build-sharh-review-report.mjs
 * 
 * بناء تقرير HTML لعرض التصحيحات في المطابقة بين المتن والشرح
 * للمراجعة اليدوية قبل اعتماد التغييرات
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CORRECTED_FILE = path.join(__dirname, '..', 'public', 'data', 'riyad-shamela-corrected.json')
const ORIGINAL_FILE = path.join(__dirname, '..', 'public', 'data', 'riyad-uthaymeen-shamela-final.json')
const REPORT_FILE = path.join(__dirname, '..', 'public', 'sharh-review-report.html')

// Normalization helper
function normalize(text) {
  if (!text) return ''
  return text
    .replace(/[ًٌٍَُِّ~ْٰٕٖٓٔٔ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ؤ]/g, 'و')
    .replace(/[ئ]/g, 'ي')
    .replace(/[ة]/g, 'ه')
    .replace(/[ىٰ]/g, 'ي')
    .trim()
}

// Topic detection
const TOPIC_KEYWORDS = {
  'الصبر': ['صبر', 'الصبر', 'اصبر', 'احتساب'],
  'الجهاد': ['جهاد', 'الجهاد', 'غزو', 'غزوة', 'قتال', 'هجرة', 'الفتح'],
  'الصلاة': ['صلاة', 'الصلاة', 'وضوء', 'سجود', 'ركوع', 'مسجد'],
  'الزكاة': ['زكاة', 'الزكاة', 'صدقة', 'الصدقة'],
  'الصيام': ['صيام', 'صوم', 'الصوم', 'رمضان'],
  'الحج': ['حج', 'الحج', 'عمرة', 'مكة', 'عرفة'],
  'التوبة': ['توبة', 'التوبة', 'تبت', 'استغفار'],
  'الدعاء': ['دعاء', 'الدعاء', 'يدعو', 'الذكر'],
  'الطعام': ['طعام', 'أكل', 'شرب', 'الأكل', 'الطعام'],
  'النكاح': ['نكاح', 'النكاح', 'زواج', 'تزوج'],
  'الموت': ['موت', 'الموت', 'وفاة', 'قبر', 'الدفن'],
  'العلم': ['علم', 'العلم', 'تعلم', 'فتوى'],
  'الآداب': ['أدب', 'أخلاق', 'بر', 'صلة', 'حياء'],
}

function detectTopics(text) {
  if (!text || text.length < 20) return []
  const n = normalize(text)
  const results = []
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    let score = 0
    for (const kw of keywords) {
      if (n.includes(kw)) score++
    }
    if (score > 0) results.push({ topic, score })
  }
  return results.sort((a, b) => b.score - a.score)
}

function escapeHtml(text) {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>')
}

async function main() {
  console.log('Building HTML review report...')
  
  // Load data
  const corrected = JSON.parse(fs.readFileSync(CORRECTED_FILE, 'utf8'))
  const original = JSON.parse(fs.readFileSync(ORIGINAL_FILE, 'utf8'))
  const cEntries = corrected.entries
  const cPool = corrected.sharhPool
  const oPool = original.sharhPool
  
  // Find corrections: entries where sharh changed
  const corrections = []
  
  for (const [key, cEntry] of Object.entries(cEntries)) {
    if (key.startsWith('riyadussalihin:introduction:')) continue
    
    const oEntry = original.entries[key]
    if (!oEntry) continue
    
    const oldSharhIdx = oEntry.sharh
    const newSharhIdx = cEntry.sharh
    
    if (oldSharhIdx === newSharhIdx) continue
    
    // Get the texts
    const matn = cEntry.matn || cEntry.text || ''
    const oldSharhText = (typeof oldSharhIdx === 'number' && oldSharhIdx >= 0 && oPool[oldSharhIdx]) ? oPool[oldSharhIdx] : ''
    const newSharhText = (typeof newSharhIdx === 'number' && newSharhIdx >= 0 && cPool[newSharhIdx]) ? cPool[newSharhIdx] : ''
    
    const oldTopics = detectTopics(oldSharhText)
    const newTopics = detectTopics(newSharhText)
    const matnTopics = detectTopics(matn)
    
    const match = key.match(/riyadussalihin:(\w+):(\d+)/)
    const bookNum = match ? match[1] : '0'
    const hadithNum = match ? match[2] : '0'
    
    corrections.push({
      key,
      bookNum,
      hadithNum: parseInt(hadithNum),
      matn: matn.slice(0, 300),
      oldSharhIdx,
      newSharhIdx,
      oldSharhPreview: oldSharhText.slice(0, 400),
      newSharhPreview: newSharhText.slice(0, 400),
      oldSharhFull: oldSharhText,
      newSharhFull: newSharhText,
      oldTopics: oldTopics.map(t => t.topic).join(', '),
      newTopics: newTopics.map(t => t.topic).join(', '),
      matnTopics: matnTopics.map(t => t.topic).join(', '),
      source: cEntry.source || 'unknown',
      matchConfidence: cEntry.matchConfidence || 0,
    })
  }
  
  // Sort by book and hadith number
  corrections.sort((a, b) => {
    if (a.bookNum !== b.bookNum) return parseInt(a.bookNum) - parseInt(b.bookNum)
    return a.hadithNum - b.hadithNum
  })
  
  console.log(`Found ${corrections.length} corrections`)
  
  // Group by book
  const byBook = {}
  for (const c of corrections) {
    if (!byBook[c.bookNum]) byBook[c.bookNum] = []
    byBook[c.bookNum].push(c)
  }
  
  // Book names
  const BOOK_NAMES = {
    '1': 'كتاب الأدب', '2': 'كتاب أدب الطعام', '3': 'كتاب اللباس',
    '4': 'كتاب آداب النوم', '5': 'كتاب السلام', '6': 'كتاب عيادة المريض',
    '7': 'كتاب آداب السفر', '8': 'كتاب الفضائل', '9': 'كتاب الاعتكاف',
    '10': 'كتاب الحج', '11': 'كتاب الجهاد', '12': 'كتاب العلم',
    '13': 'كتاب حمد الله', '14': 'كتاب الصلاة على النبي', '15': 'كتاب الأذكار',
    '16': 'كتاب الدعوات', '17': 'كتاب الأمور المنهي عنها', '18': 'كتاب المنثورات',
    '19': 'كتاب الاستغفار',
  }
  
  // Build HTML
  let html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تقرير مراجعة تصحيحات شرح رياض الصالحين</title>
  <style>
    :root {
      --bg: #f8fafc;
      --card: #ffffff;
      --border: #e2e8f0;
      --text: #1e293b;
      --text-muted: #64748b;
      --success: #059669;
      --warning: #d97706;
      --danger: #dc2626;
      --emerald-bg: #ecfdf5;
      --amber-bg: #fffbeb;
      --red-bg: #fef2f2;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Amiri', 'Traditional Arabic', Tahoma, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 20px;
      line-height: 1.8;
    }
    .container { max-width: 1000px; margin: 0 auto; }
    .header {
      background: linear-gradient(135deg, #059669, #047857);
      color: white;
      padding: 30px;
      border-radius: 16px;
      margin-bottom: 30px;
      text-align: center;
    }
    .header h1 { font-size: 1.8rem; margin-bottom: 8px; }
    .header p { opacity: 0.9; font-size: 1rem; }
    .stats { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 30px; }
    .stat-card {
      flex: 1;
      min-width: 150px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    .stat-card .num { font-size: 2rem; font-weight: bold; }
    .stat-card .label { font-size: 0.85rem; color: var(--text-muted); }
    .stat-card.green { border-right: 4px solid var(--success); }
    .stat-card.amber { border-right: 4px solid var(--warning); }
    .stat-card.red { border-right: 4px solid var(--danger); }
    
    .book-section { margin-bottom: 24px; }
    .book-header {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.2s;
    }
    .book-header:hover { border-color: var(--success); }
    .book-header h3 { font-size: 1.1rem; }
    .book-header .count {
      background: var(--emerald-bg);
      color: var(--success);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: bold;
    }
    .book-body { display: none; padding-top: 12px; }
    .book-body.open { display: block; }
    
    .correction-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 12px;
      transition: all 0.2s;
    }
    .correction-card:hover { border-color: #94a3b8; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    
    .correction-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .hadith-num {
      background: #059669;
      color: white;
      padding: 3px 12px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: bold;
    }
    .topics {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    .topic-badge {
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: bold;
    }
    .topic-badge.green { background: #d1fae5; color: #065f46; }
    .topic-badge.amber { background: #fef3c7; color: #92400e; }
    .topic-badge.red { background: #fee2e2; color: #991b1b; }
    .topic-badge.gray { background: #f1f5f9; color: #475569; }
    
    .matn-box {
      background: #f1f5f9;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
      font-size: 1rem;
      line-height: 2;
    }
    .matn-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: bold;
      margin-bottom: 6px;
    }
    
    .sharh-compare {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    @media (max-width: 768px) {
      .sharh-compare { grid-template-columns: 1fr; }
    }
    
    .sharh-box {
      border-radius: 8px;
      padding: 12px;
      font-size: 0.9rem;
      line-height: 1.9;
    }
    .sharh-box.old {
      background: var(--red-bg);
      border: 1px solid #fecaca;
    }
    .sharh-box.new {
      background: var(--emerald-bg);
      border: 1px solid #a7f3d0;
    }
    .sharh-box .sharh-label {
      font-size: 0.75rem;
      font-weight: bold;
      margin-bottom: 6px;
    }
    .sharh-box.old .sharh-label { color: #991b1b; }
    .sharh-box.new .sharh-label { color: #065f46; }
    
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: bold;
    }
    .status-badge.exact { background: #d1fae5; color: #065f46; }
    .status-badge.partial { background: #fef3c7; color: #92400e; }
    .status-badge.wrong { background: #fee2e2; color: #991b1b; }
    
    .verdict {
      margin-top: 12px;
      padding: 12px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: bold;
      text-align: center;
    }
    .verdict.correct { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
    .verdict.review { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .verdict.wrong { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    
    .source-info {
      margin-top: 8px;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    
    .loading { text-align: center; padding: 40px; color: var(--text-muted); }
    
    .search-bar {
      margin-bottom: 20px;
    }
    .search-bar input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid var(--border);
      border-radius: 12px;
      font-size: 1rem;
      font-family: inherit;
      transition: border-color 0.2s;
    }
    .search-bar input:focus {
      outline: none;
      border-color: var(--success);
    }
    
    .toggle-all {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
    }
    .toggle-all button {
      padding: 8px 16px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--card);
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s;
    }
    .toggle-all button:hover { border-color: var(--success); }
    
    .no-results {
      text-align: center;
      padding: 40px;
      color: var(--text-muted);
      font-size: 1.1rem;
    }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>📋 تقرير مراجعة تصحيحات شرح رياض الصالحين</h1>
    <p>عدد التصحيحات: ${corrections.length} حديثاً</p>
    <p style="font-size: 0.85rem; margin-top: 8px; opacity: 0.7;">
      تمت المطابقة باستخدام نصوص API من Sunnah.com + خوارزمية تشابه النصوص
    </p>
  </div>
  
  <div class="stats">
    <div class="stat-card green">
      <div class="num">${corrections.length}</div>
      <div class="label">إجمالي التصحيحات</div>
    </div>
    <div class="stat-card amber">
      <div class="num">${Object.keys(byBook).length}</div>
      <div class="label">كتب متأثرة</div>
    </div>
    <div class="stat-card">
      <div class="num">${corrected.sharhPool.length}</div>
      <div class="label">نصوص شرح فريدة</div>
    </div>
  </div>
  
  <div class="search-bar">
    <input type="text" id="searchInput" placeholder="🔍 ابحث برقم الحديث أو كلمة من المتن..." oninput="filterCorrections()">
  </div>
  
  <div class="toggle-all">
    <button onclick="toggleAll(true)">📖 فتح الكل</button>
    <button onclick="toggleAll(false)">📕 إغلاق الكل</button>
  </div>
  
  <div id="booksContainer">`
  
  // Build book sections
  const bookOrder = Object.keys(byBook).sort((a, b) => parseInt(a) - parseInt(b))
  
  for (const bookNum of bookOrder) {
    const bookCorrections = byBook[bookNum]
    const bookName = BOOK_NAMES[bookNum] || `الكتاب ${bookNum}`
    
    html += `
    <div class="book-section" data-book="${bookNum}">
      <div class="book-header" onclick="toggleBook('book-${bookNum}')">
        <h3>📗 ${bookName}</h3>
        <span class="count">${bookCorrections.length} تصحيح</span>
      </div>
      <div class="book-body" id="book-${bookNum}">`
    
    for (const c of bookCorrections) {
      const statusClass = c.matchConfidence > 30 ? 'exact' : 'partial'
      const statusText = c.matchConfidence > 30 ? 'مطابق' : 'بحاجة مراجعة'
      
      html += `
      <div class="correction-card" data-search="${c.hadithNum} ${c.matn.slice(0, 100)}">
        <div class="correction-header">
          <span class="hadith-num">#${c.hadithNum}</span>
          <div class="topics">
            <span class="topic-badge gray">المتن: ${c.matnTopics || 'غير محدد'}</span>
            <span class="topic-badge red">قبل: ${c.oldTopics || 'غير محدد'}</span>
            <span class="topic-badge green">بعد: ${c.newTopics || 'غير محدد'}</span>
            <span class="status-badge ${statusClass}">${statusText} (${c.matchConfidence}%)</span>
          </div>
        </div>
        
        <div class="matn-box">
          <div class="matn-label">📜 متن الحديث</div>
          ${escapeHtml(c.matn)}
        </div>
        
        <div class="sharh-compare">
          <div class="sharh-box old">
            <div class="sharh-label">❌ الشرح القديم (رقم ${c.oldSharhIdx})</div>
            ${escapeHtml(c.oldSharhPreview)}
          </div>
          <div class="sharh-box new">
            <div class="sharh-label">✅ الشرح الجديد (رقم ${c.newSharhIdx})</div>
            ${escapeHtml(c.newSharhPreview)}
          </div>
        </div>
        
        <div class="source-info">
          المصدر: ${c.source} | الثقة: ${c.matchConfidence}%
        </div>
      </div>`
    }
    
    html += `
      </div>
    </div>`
  }
  
  html += `
  </div>
</div>

<script>
function toggleBook(id) {
  const body = document.getElementById(id)
  if (body) body.classList.toggle('open')
}

function toggleAll(open) {
  document.querySelectorAll('.book-body').forEach(el => {
    el.classList.toggle('open', open)
  })
}

function filterCorrections() {
  const q = document.getElementById('searchInput').value.toLowerCase().trim()
  document.querySelectorAll('.correction-card').forEach(card => {
    const searchText = (card.dataset.search || '').toLowerCase()
    card.style.display = (!q || searchText.includes(q)) ? '' : 'none'
  })
  // Show/hide books based on visible corrections
  document.querySelectorAll('.book-section').forEach(section => {
    const visibleCards = section.querySelectorAll('.correction-card[style*=\"display: none\"]')
    const totalCards = section.querySelectorAll('.correction-card').length
    if (visibleCards.length === totalCards) {
      section.style.display = 'none'
    } else {
      section.style.display = ''
    }
  })
}
</script>
</body>
</html>`
  
  fs.writeFileSync(REPORT_FILE, html, 'utf8')
  const fileSize = (fs.statSync(REPORT_FILE).size / 1024).toFixed(1)
  console.log(`Written: ${REPORT_FILE} (${fileSize} KB)`)
  console.log(`Total corrections: ${corrections.length}`)
}

main().catch(err => { console.error('Error:', err.message); process.exit(1) })
