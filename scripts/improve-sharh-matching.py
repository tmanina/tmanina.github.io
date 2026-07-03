#!/usr/bin/env python3
"""
Improved sharh extraction from Shamela by matching hadith text.
This script searches for the hadith text in Shamela pages and extracts the corresponding sharh.
"""

import json
import urllib.request
import urllib.parse
import time
import re
import html

SHARH_PATH = "public/data/riyad-uthaymeen-sharh.json"

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


def extract_sharh_for_hadith(html_content: str, hadith_text: str) -> str | None:
    """Extract sharh content for a specific hadith from Shamela page."""
    # Find nass div
    nass_match = re.search(r'<div class="nass[^"]*"[^>]*>(.*?)</div>\s*<div id="appended_pages"', html_content, re.DOTALL)
    if not nass_match:
        nass_match = re.search(r'<div class="nass[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)

    if not nass_match:
        return None

    nass_content = nass_match.group(1)
    
    # Clean the hadith text for matching
    clean_hadith = re.sub(r'[^\w\s]', '', hadith_text)
    clean_hadith = re.sub(r'\s+', ' ', clean_hadith).strip()
    
    # Try to find the hadith in the page content
    # First, clean the page content
    page_text = clean_html(nass_content)
    
    # Search for key phrases from the hadith
    hadith_phrases = clean_hadith.split()[:5]  # Take first 5 words
    search_phrase = ' '.join(hadith_phrases)
    
    # Find the position of the hadith in the page
    hadith_pos = page_text.find(search_phrase)
    
    if hadith_pos >= 0:
        # Found the hadith, now find the sharh after it
        # Look for sharh markers after the hadith
        sharh_markers = ['[الشَّرْحُ]', 'قال المؤلف', 'قوله', 'أقول']
        
        # Search after the hadith position
        remaining_text = page_text[hadith_pos:]
        
        for marker in sharh_markers:
            marker_pos = remaining_text.find(marker)
            if marker_pos >= 0:
                # Extract from marker to end or next hadith
                sharh_start = hadith_pos + marker_pos
                sharh_end = min(sharh_start + 1500, len(page_text))
                
                # Try to find where the next hadith starts
                next_hadith_markers = ['حديث ', 'رواه ', 'عن ', 'قال رسول الله']
                for next_marker in next_hadith_markers:
                    next_pos = page_text.find(next_marker, sharh_start + 100)
                    if next_pos > 0 and next_pos < sharh_end:
                        sharh_end = next_pos
                
                sharh = page_text[sharh_start:sharh_end].strip()
                return sharh if len(sharh) > 50 else None
    
    # If direct search fails, try to find sharh that mentions key words from hadith
    hadith_words = set(clean_hadith.split())
    
    # Split page into paragraphs
    paragraphs = re.split(r'\n\s*\n', page_text)
    
    for para in paragraphs:
        para_words = set(para.split())
        # Check if paragraph contains words from hadith
        overlap = len(hadith_words.intersection(para_words))
        if overlap >= 3:  # At least 3 words in common
            return para[:1500]
    
    return None


def fetch_sharh_for_hadith_from_shamela(hadith_text: str, book_num: str, hadith_num: int) -> str | None:
    """Fetch sharh for a hadith by searching Shamela pages."""
    # Estimate page range based on book
    page_ranges = {
        "introduction": (6, 80),
        "1": (1889, 1902),
        "2": (2052, 2129),
        "3": (2129, 2197),
        "4": (2197, 2244),
        "5": (2244, 2319),
        "6": (2319, 2438),
        "7": (2438, 2489),
        "8": (2489, 2850),
        "9": (2850, 2852),
        "10": (2852, 2863),
        "11": (2863, 2919),
        "12": (2919, 2923),
        "13": (2923, 2978),
        "14": (3080, 3164),
        "15": (3003, 3080),
        "16": (1595, 1633),
        "17": (2774, 2850),
        "18": (2639, 2727),
        "19": (2597, 2639),
    }
    
    if book_num not in page_ranges:
        return None
    
    start_page, end_page = page_ranges[book_num]
    
    # Search through pages in the range
    for page_id in range(start_page, min(end_page, start_page + 50)):
        content = fetch_shamela_page(page_id)
        if content:
            sharh = extract_sharh_for_hadith(content, hadith_text)
            if sharh:
                return sharh
        time.sleep(0.2)
    
    return None


def main():
    with open(SHARH_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    entries = data.get("entries", {})
    updated = 0
    errors = 0
    
    # Process entries that need better sharh
    for key, entry in list(entries.items())[:50]:  # Process first 50 for testing
        method = entry.get("match", {}).get("method", "")
        
        # Only process shamela_mapped entries that might have incorrect sharh
        if method != "shamela_mapped":
            continue
        
        parts = key.split(":")
        if len(parts) != 3:
            continue
        
        book_num = parts[1]
        hadith_num = int(parts[2])
        
        # Get the hadith text from the entry
        text = entry.get("text", "")
        hadith_text = text.split("\n\n---\n\n")[0] if "\n\n---\n\n" in text else text
        
        # Clean the hadith text
        hadith_text = re.sub(r'[^أ-ي\s]', '', hadith_text)  # Keep only Arabic letters and spaces
        hadith_text = re.sub(r'\s+', ' ', hadith_text).strip()
        
        if len(hadith_text) < 20:  # Too short to search
            continue
        
        print(f"Fetching sharh for {key}...")
        
        sharh = fetch_sharh_for_hadith_from_shamela(hadith_text, book_num, hadith_num)
        if sharh:
            # Update entry with better sharh
            original_text = text.split("\n\n---\n\n")[0] if "\n\n---\n\n" in text else text
            entry["text"] = f"{original_text}\n\n---\n\n**شرح ابن عثيمين:**\n\n{sharh}"
            entry["match"]["method"] = "shamela_matched"
            entry["match"]["confidence"] = 0.9
            updated += 1
            print(f"  ✓ Found better sharh: {sharh[:100]}...")
        else:
            errors += 1
            print(f"  ✗ No better sharh found")
    
    print(f"\nSummary:")
    print(f"  Updated: {updated}")
    print(f"  Not found: {errors}")

    # Save
    with open(SHARH_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Sharh file updated: {SHARH_PATH}")


if __name__ == "__main__":
    main()
