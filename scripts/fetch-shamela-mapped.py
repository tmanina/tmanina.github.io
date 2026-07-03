#!/usr/bin/env python3
"""
Create precise mapping between API books and Shamela pages.
Then fetch sharh content for each hadith using this mapping.
"""

import json
import urllib.request
import time
import re
import html

SHARH_PATH = "public/data/riyad-uthaymeen-sharh.json"

# Mapping from API book numbers to Shamela page ranges
# Based on the table of contents from Shamela
API_TO_SHAMELA = {
    "introduction": {"start": 6, "end": 80, "name": "المقدمات"},
    "1": {"start": 1889, "end": 1902, "name": "كتاب الأدب"},
    "2": {"start": 2052, "end": 2129, "name": "كتاب أدب الطعام"},
    "3": {"start": 2129, "end": 2197, "name": "كتاب اللباس"},
    "4": {"start": 2197, "end": 2244, "name": "كتاب آداب النوم"},
    "5": {"start": 2244, "end": 2319, "name": "كتاب السلام"},
    "6": {"start": 2319, "end": 2438, "name": "كتاب عيادة المريض وتشييع الميت"},
    "7": {"start": 2438, "end": 2489, "name": "كتاب آداب السفر"},
    "8": {"start": 2489, "end": 2850, "name": "كتاب الفضائل"},
    "9": {"start": 2850, "end": 2852, "name": "كتاب الاعتكاف"},
    "10": {"start": 2852, "end": 2863, "name": "كتاب الحج"},
    "11": {"start": 2863, "end": 2919, "name": "كتاب الجهاد"},
    "12": {"start": 2919, "end": 2923, "name": "كتاب العتق"},
    "13": {"start": 2923, "end": 2978, "name": "كتاب الفرائض"},
    "14": {"start": 3080, "end": 3164, "name": "كتاب الدعوات"},
    "15": {"start": 3003, "end": 3080, "name": "كتاب الأذكار"},
    "16": {"start": 1595, "end": 1633, "name": "كتاب الصدقة"},
    "17": {"start": 2774, "end": 2850, "name": "كتاب الصيام"},
    "18": {"start": 2639, "end": 2727, "name": "كتاب المحافظة على الصلوات"},
    "19": {"start": 2597, "end": 2639, "name": "كتاب فضل الصلاة والمساجد"},
}

# Cache
_page_cache: dict[int, str] = {}


def clean_html(text: str) -> str:
    """Remove HTML tags and clean up text."""
    text = re.sub(r'<span class="c\d+">', '', text)
    text = re.sub(r'<a[^>]*>.*?</a>', '', text, flags=re.DOTALL)
    text = re.sub(r'<[^>]+>', '', text)
    text = html.unescape(text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def fetch_shamela_page(page_id: int) -> str | None:
    """Fetch a page from Shamela library."""
    if page_id in _page_cache:
        return _page_cache[page_id]

    try:
        url = f"https://shamela.ws/book/9260/{page_id}"
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'ar,en;q=0.9'
        })
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read().decode('utf-8')
            _page_cache[page_id] = content
            return content
    except Exception as e:
        print(f"Error fetching page {page_id}: {e}")
        _page_cache[page_id] = ""
        return ""


def extract_sharh_from_page(html_content: str) -> str | None:
    """Extract sharh content from Shamela page."""
    # Find nass div
    nass_match = re.search(r'<div class="nass[^"]*"[^>]*>(.*?)</div>\s*<div id="appended_pages"', html_content, re.DOTALL)
    if not nass_match:
        nass_match = re.search(r'<div class="nass[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)

    if not nass_match:
        return None

    nass_content = nass_match.group(1)

    # Find the sharh section (after [الشَّرْحُ] or similar markers)
    sharh_markers = ['[الشَّرْحُ]', '[الشرح]', 'قال المؤلف', 'قوله']
    sharh_start = -1

    for marker in sharh_markers:
        pos = nass_content.find(marker)
        if pos >= 0:
            sharh_start = pos
            break

    if sharh_start >= 0:
        # Extract from sharh marker to end
        sharh_content = nass_content[sharh_start:]
        cleaned = clean_html(sharh_content)
        return cleaned[:2000]  # Limit length

    # If no sharh marker found, return the whole content
    cleaned = clean_html(nass_content)
    return cleaned[:2000] if len(cleaned) > 100 else None


def fetch_sharh_for_book(book_num: str, hadith_num: int, hadith_index: int, total_in_book: int) -> str | None:
    """Fetch sharh content for a specific hadith in a book."""
    if book_num not in API_TO_SHAMELA:
        return None
    
    book_info = API_TO_SHAMELA[book_num]
    start_page = book_info["start"]
    end_page = book_info["end"]
    
    # Calculate which page this hadith is on
    page_range = end_page - start_page
    if total_in_book > 0:
        hadith_position = hadith_index / total_in_book
    else:
        hadith_position = 0
    
    estimated_page = start_page + int(page_range * hadith_position)
    
    # Try a range of pages around the estimate
    for offset in range(-2, 3):
        page_id = estimated_page + offset
        if page_id < start_page or page_id > end_page:
            continue
        
        content = fetch_shamela_page(page_id)
        if content:
            sharh = extract_sharh_from_page(content)
            if sharh and len(sharh) > 100:
                return sharh
        
        time.sleep(0.2)
    
    return None


def main():
    with open(SHARH_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    entries = data.get("entries", {})
    updated = 0
    errors = 0
    
    # Group entries by book
    books = {}
    for key, entry in entries.items():
        parts = key.split(":")
        if len(parts) == 3:
            book_num = parts[1]
            if book_num not in books:
                books[book_num] = []
            books[book_num].append((key, entry))
    
    print(f"Processing {len(books)} books...")
    
    for book_num, book_entries in books.items():
        if book_num not in API_TO_SHAMELA:
            print(f"Book {book_num}: No Shamela mapping found")
            continue
        
        book_info = API_TO_SHAMELA[book_num]
        print(f"\nBook {book_num}: {book_info['name']} ({len(book_entries)} entries)")
        
        for idx, (key, entry) in enumerate(book_entries):
            # Only process entries that don't have sharh yet
            if entry.get("match", {}).get("method") in ("segment_sharh", "shared_sharh", "manual", "matn_similarity"):
                continue
            
            parts = key.split(":")
            hadith_num = int(parts[2])
            
            sharh = fetch_sharh_for_book(book_num, hadith_num, idx, len(book_entries))
            if sharh:
                # Update entry with sharh content
                original_text = entry["text"].split("\n\n---\n\n")[0] if "\n\n---\n\n" in entry["text"] else entry["text"]
                entry["text"] = f"{original_text}\n\n---\n\n**شرح ابن عثيمين:**\n\n{sharh}"
                entry["match"]["method"] = "shamela_mapped"
                entry["match"]["confidence"] = 0.85
                updated += 1
                if updated % 50 == 0:
                    print(f"  Updated {updated} entries...")
            else:
                errors += 1
    
    print(f"\nSummary:")
    print(f"  Updated: {updated}")
    print(f"  Not found: {errors}")

    # Save
    with open(SHARH_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Sharh file updated: {SHARH_PATH}")


if __name__ == "__main__":
    main()
