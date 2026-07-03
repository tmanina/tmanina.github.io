#!/usr/bin/env python3
"""
Fix book 1 (كتاب الأدب) sharh alignment.
The issue: Shamela hadith numbers are API numbers + 1 for book 1.
This causes sharh to be shifted by 1 entry.
"""

import json
import urllib.request
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


def fetch_page(page_id: int) -> str:
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
    except Exception:
        _page_cache[page_id] = ""
        return ""


def extract_nass(html_content: str) -> str:
    """Extract the main nass content from Shamela page."""
    match = re.search(r'<div class="nass[^"]*"[^>]*>(.*?)</div>\s*<div id="appended_pages"', html_content, re.DOTALL)
    if not match:
        match = re.search(r'<div class="nass[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)
    if match:
        return clean_html(match.group(1))
    return ""


def extract_sharh_after_marker(page_text: str, marker_pos: int) -> str:
    """Extract sharh after a marker position."""
    remaining = page_text[marker_pos:]
    
    # Look for sharh markers
    sharh_markers = ['[الشَّرْحُ]', 'قال المؤلف', 'قوله', 'أقول']
    
    for marker in sharh_markers:
        marker_pos = remaining.find(marker)
        if marker_pos >= 0:
            # Extract sharh
            sharh_start = marker_pos
            sharh_end = min(sharh_start + 1500, len(remaining))
            
            # Try to find where the next hadith starts
            next_markers = ['حديث', 'رواه', 'عن النبي', 'قال رسول الله']
            for next_marker in next_markers:
                next_pos = remaining.find(next_marker, sharh_start + 100)
                if next_pos > 0 and next_pos < sharh_end:
                    sharh_end = next_pos
            
            sharh = remaining[sharh_start:sharh_end].strip()
            if len(sharh) > 50:
                return sharh
    
    return ""


def get_shamela_sharh_for_hadith(api_hadith_num: int, book_num: str) -> str:
    """Get sharh from Shamela for a specific hadith."""
    # For book 1, Shamela numbers are API numbers + 1
    shamela_num = api_hadith_num
    if book_num == "1":
        shamela_num = api_hadith_num + 1
    
    # Search through pages
    for page_id in range(1889, 1902):  # Book 1 pages
        content = fetch_page(page_id)
        if not content:
            continue
        
        page_text = extract_nass(content)
        if not page_text:
            continue
        
        # Look for the hadith number in Shamela format
        # Shamela uses Arabic numerals: ٦٨١, ٦٨٢, etc.
        arabic_num = ''.join(['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'][int(d)] for d in str(shamela_num))
        
        # Search for the hadith
        hadith_pattern = f'{arabic_num} -'
        pos = page_text.find(hadith_pattern)
        
        if pos >= 0:
            # Found the hadith, now find sharh after it
            sharh = extract_sharh_after_marker(page_text, pos)
            if sharh:
                return sharh
        
        time.sleep(0.1)
    
    return ""


def fix_book1_sharh():
    """Fix sharh alignment for book 1."""
    with open(SHARH_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    entries = data.get("entries", {})
    updated = 0
    
    print("Fixing book 1 (كتاب الأدب) sharh alignment...")
    
    # Get all book 1 entries
    book1_entries = []
    for key, entry in entries.items():
        if key.startswith("riyadussalihin:1:"):
            book1_entries.append((key, entry))
    
    # Sort by hadith number
    book1_entries.sort(key=lambda x: int(x[0].split(':')[2]))
    
    # Process each entry
    for key, entry in book1_entries:
        parts = key.split(":")
        api_hadith_num = int(parts[2])
        
        print(f"Processing {key} (API #{api_hadith_num})...")
        
        # Get sharh from Shamela
        sharh = get_shamela_sharh_for_hadith(api_hadith_num, "1")
        
        if sharh:
            # Update entry
            text = entry.get("text", "")
            original_text = text.split("\n\n---\n\n")[0] if "\n\n---\n\n" in text else text
            
            # Extract hadith text from original
            hadith_text = original_text
            
            entry["text"] = f"{hadith_text}\n\n---\n\n**شرح ابن عثيمين:**\n\n{sharh}"
            entry["match"]["method"] = "shamela_fixed"
            entry["match"]["confidence"] = 0.98
            updated += 1
            print(f"  ✓ Fixed sharh ({len(sharh)} chars)")
        else:
            print(f"  ✗ No sharh found")
    
    # Save
    with open(SHARH_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\nSummary: Updated {updated} entries")


if __name__ == "__main__":
    fix_book1_sharh()
