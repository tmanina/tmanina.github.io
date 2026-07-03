#!/usr/bin/env python3
"""
Fetch sharh content from Shamela library by scraping specific pages.
Maps hadith numbers to Shamela page IDs and extracts sharh content.
"""

import json
import urllib.request
import time
import re
import html

SHARH_PATH = "public/data/riyad-uthaymeen-sharh.json"

# Shamela page IDs for each book (from the table of contents)
# These are the starting page IDs for each book
SHAMELA_BOOK_PAGES = {
    "1": 11,    # آداب عامة
    "2": 80,    # باب التوبة
    "3": 167,   # باب الصبر
    "4": 284,   # باب الصدق
    "5": 319,   # باب المراقبة
    "6": 508,   # باب التقوى
    "7": 533,   # باب اليقين والتوكل
    "8": 560,   # باب الحسد
    "9": 787,   # باب الحب في الله
    "10": 802,  # باب البر
    "11": 810,  # باب بر الوالدين
    "12": 910,  # باب صلة الرحم
    "13": 930,  # باب الإنفاق
    "14": 940,  # باب النذر
    "15": 960,  # باب الصدقة
    "16": 1000, # باب الصيام
    "17": 1050, # باب Jihad
    "18": 1300, # باب السفر
    "19": 1350, # باب الوضوء
    "introduction": 6  # المقدمة
}

# Cache for fetched pages
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
        return cleaned[:1000]  # Limit length

    # If no sharh marker found, return the whole content
    cleaned = clean_html(nass_content)
    return cleaned[:1000] if len(cleaned) > 50 else None


def get_page_for_hadith(book_num: str, hadith_num: int) -> int | None:
    """Get the Shamela page ID for a specific hadith."""
    if book_num not in SHAMELA_BOOK_PAGES:
        return None

    start_page = SHAMELA_BOOK_PAGES[book_num]

    # Estimate page based on hadith number
    # Rough estimate: 2-3 hadiths per page
    estimated_page = start_page + (hadith_num // 2)

    return estimated_page


def fetch_sharh_for_hadith(book_num: str, hadith_num: int) -> str | None:
    """Fetch sharh content for a specific hadith."""
    estimated_page = get_page_for_hadith(book_num, hadith_num)
    if not estimated_page:
        return None

    # Try a range of pages around the estimate
    for page_offset in range(-3, 4):
        page_id = estimated_page + page_offset
        if page_id < 1:
            continue

        content = fetch_shamela_page(page_id)
        if content:
            sharh = extract_sharh_from_page(content)
            if sharh and len(sharh) > 100:  # Minimum length
                return sharh

        time.sleep(0.3)  # Rate limiting

    return None


def is_api_hadith_text_entry(entry: dict) -> bool:
    """Check if an entry is an api-hadith-text entry."""
    return entry.get("match", {}).get("method") == "api-hadith-text"


def main():
    with open(SHARH_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    entries = data.get("entries", {})
    updated = 0
    errors = 0
    api_text_entries = []

    # Collect all api-hadith-text entries
    for key, entry in entries.items():
        if is_api_hadith_text_entry(entry):
            api_text_entries.append((key, entry))

    print(f"Found {len(api_text_entries)} api-hadith-text entries")

    # Process entries
    for key, entry in api_text_entries:  # Process all entries
        parts = key.split(":")
        if len(parts) != 3:
            continue

        book_num = parts[1]
        hadith_num = int(parts[2])

        print(f"Fetching sharh for {key}...")

        sharh = fetch_sharh_for_hadith(book_num, hadith_num)
        if sharh:
            # Update entry with sharh content
            # Preserve original hadith text
            original_text = entry["text"].split("\n\n---\n\n")[0] if "\n\n---\n\n" in entry["text"] else entry["text"]
            entry["text"] = f"{original_text}\n\n---\n\n**شرح ابن عثيمين:**\n\n{sharh}"
            entry["match"]["method"] = "shamela_scraped"
            entry["match"]["confidence"] = 0.7
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
