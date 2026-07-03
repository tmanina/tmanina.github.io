#!/usr/bin/env python3
"""
Fix book 1 sharh by searching for hadith text in Shamela content.
This correctly aligns sharh with hadiths by matching text, not numbers.
"""

import json
import urllib.request
import time
import re
import html

SHARH_PATH = "public/data/riyad-uthaymeen-sharh.json"


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
    try:
        url = f"https://shamela.ws/book/9260/{page_id}"
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'ar,en;q=0.9'
        })
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read().decode('utf-8')
    except Exception:
        return ""


def extract_nass(html_content: str) -> str:
    """Extract the main nass content from Shamela page."""
    match = re.search(r'<div class="nass[^"]*"[^>]*>(.*?)</div>\s*<div id="appended_pages"', html_content, re.DOTALL)
    if not match:
        match = re.search(r'<div class="nass[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)
    if match:
        return clean_html(match.group(1))
    return ""


def extract_key_phrases(text: str) -> list[str]:
    """Extract key phrases from hadith text for searching."""
    # Clean text
    clean = re.sub(r'[^\w\s]', ' ', text)
    clean = re.sub(r'\s+', ' ', clean).strip()
    
    # Split into words
    words = clean.split()
    
    # Extract key phrases (3-5 words)
    phrases = []
    for i in range(len(words) - 2):
        phrase = ' '.join(words[i:i+3])
        if len(phrase) > 15:
            phrases.append(phrase)
    
    return phrases[:5]


def find_sharh_for_hadith(page_text: str, hadith_text: str) -> str:
    """Find sharh for a specific hadith in page text."""
    # Extract key phrases from hadith
    phrases = extract_key_phrases(hadith_text)
    
    for phrase in phrases:
        # Search for the phrase in page text
        pos = page_text.find(phrase)
        if pos >= 0:
            # Found the hadith, now find sharh after it
            remaining = page_text[pos:]
            
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


def fix_book1():
    """Fix sharh for book 1."""
    with open(SHARH_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    entries = data.get("entries", {})
    
    # Fetch Shamela content for book 1
    print("Fetching Shamela content for book 1...")
    shamela_content = []
    for page_id in range(1889, 1902):
        content = fetch_page(page_id)
        if content:
            page_text = extract_nass(content)
            if page_text:
                shamela_content.append(page_text)
        time.sleep(0.1)
    
    combined = ' '.join(shamela_content)
    print(f"Fetched {len(shamela_content)} pages")
    
    # Process book 1 entries
    updated = 0
    
    for key, entry in entries.items():
        if not key.startswith("riyadussalihin:1:"):
            continue
        
        text = entry.get("text", "")
        
        # Skip entries that already have good sharh
        if entry.get("match", {}).get("method") in ("segment_sharh", "shared_sharh", "manual", "matn_similarity"):
            continue
        
        # Extract hadith text (before the --- separator)
        hadith_text = text.split("\n\n---\n\n")[0] if "\n\n---\n\n" in text else text
        
        # Skip if hadith text is too short
        if len(hadith_text) < 20:
            continue
        
        print(f"Processing {key}...")
        
        # Find sharh for this hadith
        sharh = find_sharh_for_hadith(combined, hadith_text)
        
        if sharh:
            # Update entry
            entry["text"] = f"{hadith_text}\n\n---\n\n**شرح ابن عثيمين:**\n\n{sharh}"
            entry["match"]["method"] = "shamela_precise"
            entry["match"]["confidence"] = 0.95
            updated += 1
            print(f"  ✓ Found precise sharh ({len(sharh)} chars)")
        else:
            print(f"  ✗ No sharh found")
    
    print(f"\nSummary: Updated {updated} entries")
    
    # Save
    with open(SHARH_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Sharh file updated: {SHARH_PATH}")


if __name__ == "__main__":
    fix_book1()
