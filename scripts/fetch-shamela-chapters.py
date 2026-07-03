#!/usr/bin/env python3
"""
Improved Shamela scraper that maps chapters to pages for better accuracy.
"""

import json
import urllib.request
import time
import re
import html
from urllib.parse import quote

SHARH_PATH = "public/data/riyad-uthaymeen-sharh.json"

# Shamela table of contents - maps chapter names to page IDs
# From https://shamela.ws/book/9260
SHAMELA_TOC = {
    "المقدمة": 6,
    "مقدمة الإمام النووي": 6,
    "مقدمة الشارح": 6,
    "آداب عامة": 8,
    "باب الإخلاص": 8,
    "باب التوبة": 80,
    "باب الصبر": 167,
    "باب الصدق": 284,
    "باب المراقبة": 319,
    "باب التقوى": 508,
    "باب اليقين والتوكل": 533,
    "باب الحسد": 560,
    "باب الحب في الله": 787,
    "باب البر": 802,
    "باب بر الوالدين": 810,
    "باب صلة الرحم": 910,
    "باب الإنفاق": 930,
    "باب النذر": 940,
    "باب الصدقة": 960,
    "باب الصيام": 1000,
    "باب Jihad": 1050,
    "باب السفر": 1300,
    "باب الوضوء": 1350,
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


def extract_sharh_from_page(html_content: str, hadith_text: str = "") -> str | None:
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
        return cleaned[:1500]  # Limit length

    # If no sharh marker found, return the whole content
    cleaned = clean_html(nass_content)
    return cleaned[:1500] if len(cleaned) > 100 else None


def find_chapter_page(chapter_title: str) -> int | None:
    """Find the Shamela page for a chapter based on its title."""
    # Clean the chapter title
    cleaned = chapter_title.strip()
    
    # Try exact match
    for key, page_id in SHAMELA_TOC.items():
        if key in cleaned or cleaned in key:
            return page_id
    
    # Try partial match
    for key, page_id in SHAMELA_TOC.items():
        key_words = key.split()
        cleaned_words = cleaned.split()
        if len(key_words) > 0 and all(kw in cleaned for kw in key_words):
            return page_id
    
    return None


def fetch_sharh_for_hadith(chapter_title: str, hadith_text: str = "") -> str | None:
    """Fetch sharh content for a hadith based on chapter title."""
    # Find the page for this chapter
    page_id = find_chapter_page(chapter_title)
    if not page_id:
        return None
    
    # Fetch the page and a few nearby pages
    for offset in range(0, 5):
        content = fetch_shamela_page(page_id + offset)
        if content:
            sharh = extract_sharh_from_page(content, hadith_text)
            if sharh and len(sharh) > 100:
                return sharh
        time.sleep(0.3)
    
    return None


def extract_chapter_from_text(text: str) -> str:
    """Extract chapter title from hadith entry text."""
    # Look for chapter markers in the text
    patterns = [
        r'\*\*[- ]*باب\s+([^*]+)\*\*',
        r'\*\*[- ]*كتاب\s+([^*]+)\*\*',
        r'\*\*([^*]*باب[^*]+)\*\*',
        r'\*\*([^*]*كتاب[^*]+)\*\*',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1).strip()
    
    return ""


def main():
    with open(SHARH_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    entries = data.get("entries", {})
    updated = 0
    errors = 0
    api_text_entries = []

    # Collect all api-hadith-text entries (those without sharh)
    for key, entry in entries.items():
        if entry.get("match", {}).get("method") == "api-hadith-text":
            api_text_entries.append((key, entry))

    print(f"Found {len(api_text_entries)} entries without sharh")

    # Process entries
    for key, entry in api_text_entries[:200]:  # Process first 200 for testing
        parts = key.split(":")
        if len(parts) != 3:
            continue

        book_num = parts[1]
        hadith_num = int(parts[2])

        # Extract chapter title from entry text
        chapter_title = extract_chapter_from_text(entry.get("text", ""))
        
        if not chapter_title:
            # Try to infer chapter from book number
            chapter_map = {
                "1": "باب الوضوء",
                "2": "باب الإيمان",
                "3": "باب الصلاة",
                "4": "باب الزكاة",
                "5": "باب الصيام",
                "6": "باب الحج",
                "7": "باب Jihad",
                "8": "باب التوبة",
                "9": "باب الحب في الله",
                "10": "باب البر",
                "11": "باب بر الوالدين",
                "12": "باب صلة الرحم",
                "13": "باب الإنفاق",
                "14": "باب النذر",
                "15": "باب الصدقة",
                "16": "باب الصيام",
                "17": "باب Jihad",
                "18": "باب السفر",
                "19": "باب الوضوء",
            }
            chapter_title = chapter_map.get(book_num, "")

        if not chapter_title:
            errors += 1
            print(f"  {key}: No chapter title found")
            continue

        print(f"Fetching sharh for {key} (chapter: {chapter_title})...")

        sharh = fetch_sharh_for_hadith(chapter_title)
        if sharh:
            # Update entry with sharh content
            original_text = entry["text"].split("\n\n---\n\n")[0] if "\n\n---\n\n" in entry["text"] else entry["text"]
            entry["text"] = f"{original_text}\n\n---\n\n**شرح ابن عثيمين:**\n\n{sharh}"
            entry["match"]["method"] = "shamela_chapter"
            entry["match"]["confidence"] = 0.8
            updated += 1
            print(f"  ✓ Found sharh: {sharh[:100]}...")
        else:
            errors += 1
            print(f"  ✗ No sharh found")

    print(f"\nSummary:")
    print(f"  Updated: {updated}")
    print(f"  Not found: {errors}")

    # Save
    with open(SHARH_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Sharh file updated: {SHARH_PATH}")


if __name__ == "__main__":
    main()
