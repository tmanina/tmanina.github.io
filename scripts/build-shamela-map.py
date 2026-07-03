#!/usr/bin/env python3
"""
Fetch Shamela table of contents and map hadith numbers to pages for precise matching.
"""

import json
import urllib.request
import time
import re
import html

SHARH_PATH = "public/data/riyad-uthaymeen-sharh.json"

# Cache
_page_cache: dict[int, str] = {}
_toc_data: dict = {}


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


def extract_hadith_numbers_from_page(html_content: str) -> list[int]:
    """Extract hadith numbers mentioned on a Shamela page."""
    numbers = []
    
    # Look for patterns like "الحديث 123" or "ح 123" or "#123"
    patterns = [
        r'الحديث\s+(\d+)',
        r'ح\s+(\d+)',
        r'#(\d+)',
        r'رقم\s+(\d+)',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, html_content)
        for match in matches:
            try:
                num = int(match)
                if 1 <= num <= 2000:  # Reasonable range
                    numbers.append(num)
            except ValueError:
                pass
    
    return list(set(numbers))


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


def build_hadith_to_page_map() -> dict[int, int]:
    """Build a mapping from hadith numbers to Shamela page IDs."""
    print("Building hadith-to-page mapping from Shamela...")
    
    # Start from page 1 and scan through
    hadith_map = {}
    current_book = 0
    
    for page_id in range(6, 2000, 5):  # Scan every 5 pages
        content = fetch_shamela_page(page_id)
        if not content:
            continue
        
        # Extract hadith numbers from this page
        numbers = extract_hadith_numbers_from_page(content)
        
        for num in numbers:
            if num not in hadith_map:
                hadith_map[num] = page_id
        
        # Check if we've gone past the book
        if "فهرس" in content or "انتهى" in content:
            break
        
        time.sleep(0.2)
    
    print(f"Found mapping for {len(hadith_map)} hadiths")
    return hadith_map


def main():
    # Build the mapping
    hadith_map = build_hadith_to_page_map()
    
    # Save the mapping for reference
    with open("public/data/shamela-hadith-map.json", "w", encoding="utf-8") as f:
        json.dump(hadith_map, f, ensure_ascii=False, indent=2)
    
    print(f"Mapping saved to public/data/shamela-hadith-map.json")
    print(f"Sample mappings:")
    for i, (num, page) in enumerate(sorted(hadith_map.items())[:10]):
        print(f"  Hadith {num} -> Page {page}")


if __name__ == "__main__":
    main()
