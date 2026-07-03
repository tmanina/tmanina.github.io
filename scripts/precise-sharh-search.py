#!/usr/bin/env python3
"""
Precise sharh extraction from Shamela by searching for each hadith.
This script fetches hadith text from our data, searches Shamela pages,
and extracts the exact sharh that follows each hadith.
"""

import json
import urllib.request
import time
import re
import html
from typing import Optional

SHARH_PATH = "public/data/riyad-uthaymeen-sharh.json"

# Cache for fetched pages
_page_cache: dict[int, str] = {}

# Page ranges for each book in Shamela
PAGE_RANGES = {
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


def clean_html(text: str) -> str:
    """Remove HTML tags and clean up text."""
    text = re.sub(r'<span class="c\d+">', '', text)
    text = re.sub(r'<a[^>]*>.*?</a>', '', text, flags=re.DOTALL)
    text = re.sub(r'<[^>]+>', '', text)
    text = html.unescape(text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def fetch_shamela_page(page_id: int) -> Optional[str]:
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
        _page_cache[page_id] = ""
        return ""


def extract_nass_content(html_content: str) -> Optional[str]:
    """Extract the main nass content from Shamela page."""
    nass_match = re.search(r'<div class="nass[^"]*"[^>]*>(.*?)</div>\s*<div id="appended_pages"', html_content, re.DOTALL)
    if not nass_match:
        nass_match = re.search(r'<div class="nass[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)

    if nass_match:
        return clean_html(nass_match.group(1))
    return None


def find_hadith_in_page(page_text: str, hadith_text: str) -> tuple[Optional[int], Optional[str]]:
    """
    Find hadith in page text and extract sharh after it.
    Returns (position, sharh_text) or (None, None) if not found.
    """
    if not hadith_text or len(hadith_text) < 10:
        return None, None
    
    # Clean hadith text for matching
    clean_hadith = re.sub(r'[^\w\s]', '', hadith_text)
    clean_hadith = re.sub(r'\s+', ' ', clean_hadith).strip()
    
    # Try to find the hadith using different strategies
    # Strategy 1: Direct search
    pos = page_text.find(clean_hadith[:50])  # Search for first 50 chars
    if pos >= 0:
        # Found the hadith, now find sharh after it
        sharh = extract_sharh_after_position(page_text, pos)
        return pos, sharh
    
    # Strategy 2: Search for key phrases
    hadith_words = clean_hadith.split()
    if len(hadith_words) >= 3:
        # Try searching for consecutive words
        for i in range(len(hadith_words) - 2):
            search_phrase = ' '.join(hadith_words[i:i+3])
            pos = page_text.find(search_phrase)
            if pos >= 0:
                sharh = extract_sharh_after_position(page_text, pos)
                return pos, sharh
    
    # Strategy 3: Search for individual distinctive words
    distinctive_words = [w for w in hadith_words if len(w) > 4]
    for word in distinctive_words[:5]:
        pos = page_text.find(word)
        if pos >= 0:
            # Check if context matches
            context = page_text[max(0, pos-100):pos+200]
            if any(w in context for w in hadith_words[:5]):
                sharh = extract_sharh_after_position(page_text, pos)
                return pos, sharh
    
    return None, None


def extract_sharh_after_position(page_text: str, hadith_pos: int) -> Optional[str]:
    """Extract sharh content that follows the hadith at given position."""
    # Look for sharh markers after the hadith
    sharh_markers = ['[الشَّرْحُ]', 'قال المؤلف', 'قوله', 'أقول', 'قوله تعالي', 'قوله تعالى']
    
    remaining_text = page_text[hadith_pos:]
    
    for marker in sharh_markers:
        marker_pos = remaining_text.find(marker)
        if marker_pos >= 0:
            # Extract from marker to end or next hadith
            sharh_start = hadith_pos + marker_pos
            sharh_end = min(sharh_start + 2000, len(page_text))
            
            # Try to find where the next hadith starts
            next_hadith_markers = ['حديث ', 'رواه ', 'عن النبي', 'قال رسول الله', 'الحديث']
            for next_marker in next_hadith_markers:
                next_pos = page_text.find(next_marker, sharh_start + 100)
                if next_pos > 0 and next_pos < sharh_end:
                    sharh_end = next_pos
            
            sharh = page_text[sharh_start:sharh_end].strip()
            if len(sharh) > 50:
                return sharh
    
    # If no sharh marker found, try to extract content after hadith
    # Look for the next paragraph or section
    lines = remaining_text.split('\n')
    sharh_lines = []
    capture = False
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Start capturing after hadith
        if capture:
            sharh_lines.append(line)
            if len(sharh_lines) >= 5:  # Limit to 5 lines
                break
        
        # Check if this line contains sharh start
        if any(marker in line for marker in sharh_markers):
            capture = True
            sharh_lines.append(line)
    
    if sharh_lines:
        return ' '.join(sharh_lines)[:2000]
    
    return None


def search_hadith_in_shamela(hadith_text: str, book_num: str) -> Optional[str]:
    """Search for hadith in Shamela pages and return sharh."""
    if book_num not in PAGE_RANGES:
        return None
    
    start_page, end_page = PAGE_RANGES[book_num]
    
    # Search through pages in the range
    for page_id in range(start_page, min(end_page, start_page + 30)):
        content = fetch_shamela_page(page_id)
        if not content:
            continue
        
        page_text = extract_nass_content(content)
        if not page_text:
            continue
        
        # Search for hadith in this page
        pos, sharh = find_hadith_in_page(page_text, hadith_text)
        if sharh:
            return sharh
        
        time.sleep(0.15)  # Rate limiting
    
    return None


def extract_key_phrases(text: str) -> list[str]:
    """Extract key phrases from hadith text for searching."""
    # Remove common prefixes and clean
    text = re.sub(r'^(وعن|عن|حدثنا|أخبرنا|قال)\s+', '', text)
    
    # Extract key phrases
    phrases = []
    
    # Look for quoted text (the actual hadith)
    quote_match = re.search(r'["「]([^"」]+)["」]', text)
    if quote_match:
        phrases.append(quote_match.group(1))
    
    # Look for distinctive words
    words = text.split()
    for i in range(len(words) - 2):
        phrase = ' '.join(words[i:i+3])
        if len(phrase) > 15:
            phrases.append(phrase)
    
    return phrases[:5]  # Return top 5 phrases


def main():
    with open(SHARH_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    entries = data.get("entries", {})
    updated = 0
    errors = 0
    total = 0
    
    # Process all entries
    for key, entry in entries.items():
        total += 1
        method = entry.get("match", {}).get("method", "")
        
        # Skip entries that already have good sharh
        if method in ("segment_sharh", "shared_sharh", "manual", "matn_similarity", "shamela_matched"):
            continue
        
        parts = key.split(":")
        if len(parts) != 3:
            continue
        
        book_num = parts[1]
        hadith_num = int(parts[2])
        
        # Get the hadith text from the entry
        text = entry.get("text", "")
        hadith_text = text.split("\n\n---\n\n")[0] if "\n\n---\n\n" in text else text
        
        # Extract key phrases for searching
        key_phrases = extract_key_phrases(hadith_text)
        
        if not key_phrases:
            errors += 1
            continue
        
        print(f"[{total}/{len(entries)}] Searching for {key}...")
        
        # Search for hadith in Shamela
        sharh = None
        for phrase in key_phrases:
            sharh = search_hadith_in_shamela(phrase, book_num)
            if sharh:
                break
            time.sleep(0.1)
        
        if sharh:
            # Update entry with better sharh
            original_text = text.split("\n\n---\n\n")[0] if "\n\n---\n\n" in text else text
            entry["text"] = f"{original_text}\n\n---\n\n**شرح ابن عثيمين:**\n\n{sharh}"
            entry["match"]["method"] = "shamela_precise"
            entry["match"]["confidence"] = 0.95
            updated += 1
            print(f"  ✓ Found precise sharh ({len(sharh)} chars)")
        else:
            errors += 1
            print(f"  ✗ No precise sharh found")
    
    print(f"\nSummary:")
    print(f"  Total processed: {total}")
    print(f"  Updated: {updated}")
    print(f"  Not found: {errors}")

    # Save
    with open(SHARH_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Sharh file updated: {SHARH_PATH}")


if __name__ == "__main__":
    main()
