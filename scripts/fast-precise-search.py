#!/usr/bin/env python3
"""
Fast precise sharh extraction from Shamela.
Uses batch processing and saves progress frequently.
"""

import json
import urllib.request
import time
import re
import html

SHARH_PATH = "public/data/riyad-uthaymeen-sharh.json"
PROGRESS_PATH = "public/data/sharh_progress.json"

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


def extract_key_words(text: str) -> list[str]:
    """Extract key words for searching."""
    # Remove common words and extract distinctive words
    common_words = {'عن', 'عن', 'قال', 'حدثنا', 'أخبرنا', 'رضي', 'الله', ' عنه', 'عنها', 'صلى', 'عليه', 'وسلم', 'رواه'}
    
    # Clean text
    clean = re.sub(r'[^\w\s]', ' ', text)
    clean = re.sub(r'\s+', ' ', clean).strip()
    
    # Split into words
    words = clean.split()
    
    # Filter out common words and short words
    key_words = [w for w in words if len(w) > 3 and w not in common_words]
    
    return key_words[:10]  # Return top 10 key words


def search_in_page(page_text: str, key_words: list[str]) -> tuple[bool, str]:
    """
    Search for key words in page text and return (found, sharh).
    Returns (True, sharh_text) if found, (False, "") otherwise.
    """
    if not key_words:
        return False, ""
    
    # Check if at least 3 key words are present
    found_words = [w for w in key_words if w in page_text]
    
    if len(found_words) >= 3:
        # Found the hadith, now extract sharh
        # Find the position of the first key word
        first_pos = page_text.find(found_words[0])
        
        if first_pos >= 0:
            # Look for sharh after this position
            remaining = page_text[first_pos:]
            
            # Look for sharh markers
            sharh_markers = ['[الشَّرْحُ]', 'قال المؤلف', 'قوله', 'أقول']
            
            for marker in sharh_markers:
                marker_pos = remaining.find(marker)
                if marker_pos >= 0:
                    # Extract sharh
                    sharh_start = first_pos + marker_pos
                    sharh_end = min(sharh_start + 1500, len(page_text))
                    
                    # Try to find where the next hadith starts
                    next_markers = ['حديث', 'رواه', 'عن النبي', 'قال رسول الله']
                    for next_marker in next_markers:
                        next_pos = page_text.find(next_marker, sharh_start + 100)
                        if next_pos > 0 and next_pos < sharh_end:
                            sharh_end = next_pos
                    
                    sharh = page_text[sharh_start:sharh_end].strip()
                    if len(sharh) > 50:
                        return True, sharh
    
    return False, ""


def process_entry(entry: dict, book_num: str) -> tuple[bool, str]:
    """
    Process a single entry to find precise sharh.
    Returns (success, sharh_text).
    """
    if book_num not in PAGE_RANGES:
        return False, ""
    
    # Get hadith text
    text = entry.get("text", "")
    hadith_text = text.split("\n\n---\n\n")[0] if "\n\n---\n\n" in text else text
    
    # Extract key words
    key_words = extract_key_words(hadith_text)
    if not key_words:
        return False, ""
    
    # Search in Shamela pages
    start_page, end_page = PAGE_RANGES[book_num]
    
    for page_id in range(start_page, min(end_page, start_page + 30)):
        content = fetch_page(page_id)
        if not content:
            continue
        
        page_text = extract_nass(content)
        if not page_text:
            continue
        
        found, sharh = search_in_page(page_text, key_words)
        if found:
            return True, sharh
        
        time.sleep(0.1)  # Rate limiting
    
    return False, ""


def main():
    # Load data
    with open(SHARH_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    entries = data.get("entries", {})
    
    # Load progress if exists
    processed = set()
    try:
        with open(PROGRESS_PATH, "r") as f:
            progress = json.load(f)
            processed = set(progress.get("processed", []))
    except:
        pass
    
    updated = 0
    errors = 0
    total = 0
    
    # Process entries
    for key, entry in entries.items():
        total += 1
        
        # Skip already processed
        if key in processed:
            continue
        
        method = entry.get("match", {}).get("method", "")
        
        # Only process entries that need better sharh
        if method not in ("shamela_mapped", "api-hadith-text"):
            processed.add(key)
            continue
        
        parts = key.split(":")
        if len(parts) != 3:
            processed.add(key)
            continue
        
        book_num = parts[1]
        
        print(f"[{total}/{len(entries)}] Processing {key}...")
        
        success, sharh = process_entry(entry, book_num)
        
        if success:
            # Update entry
            original_text = entry["text"].split("\n\n---\n\n")[0] if "\n\n---\n\n" in entry["text"] else entry["text"]
            entry["text"] = f"{original_text}\n\n---\n\n**شرح ابن عثيمين:**\n\n{sharh}"
            entry["match"]["method"] = "shamela_precise"
            entry["match"]["confidence"] = 0.95
            updated += 1
            print(f"  ✓ Found precise sharh ({len(sharh)} chars)")
        else:
            errors += 1
            print(f"  ✗ No precise sharh found")
        
        processed.add(key)
        
        # Save progress every 50 entries
        if len(processed) % 50 == 0:
            with open(SHARH_PATH, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            with open(PROGRESS_PATH, "w") as f:
                json.dump({"processed": list(processed)}, f)
    
    # Final save
    with open(SHARH_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    with open(PROGRESS_PATH, "w") as f:
        json.dump({"processed": list(processed)}, f)
    
    print(f"\nSummary:")
    print(f"  Total processed: {total}")
    print(f"  Updated: {updated}")
    print(f"  Not found: {errors}")
    print(f"  Already processed: {len(processed) - updated - errors}")


if __name__ == "__main__":
    main()
