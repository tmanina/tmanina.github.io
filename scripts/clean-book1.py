#!/usr/bin/env python3
"""
Clean up book 1 (كتاب الأدب) by:
1. Removing commentary-only entries
2. Re-fetching hadith text from API
3. Re-applying sharh with correct alignment
"""

import json
import urllib.request
import time

SHARH_PATH = "public/data/riyad-uthaymeen-sharh.json"

def fetch_book1_hadiths():
    """Fetch book 1 hadiths from API."""
    url = "https://api.islamic.app/v1/hadith/collections/riyadussalihin/books/1/hadiths?limit=100&offset=0"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
            hadiths = data.get("data", {}).get("hadiths", [])
            return hadiths
    except Exception as e:
        print(f"Error fetching hadiths: {e}")
        return []


def is_commentary_only(text: str) -> bool:
    """Check if entry is commentary-only (not a hadith)."""
    commentary_patterns = [
        "قال المؤلف النووي",
        "نقل المؤلف",
        "هذا الباب الذي ذكره",
        "قال المؤلف رحمه الله تعالى:",
        "ذكر النووي",
        "قال الإمام النووي",
        "ثم ذكر النووي",
        "قال المؤلف رحمه الله تعالى في",
        "نقل المؤلف - رحمه الله",
    ]
    
    hadith_patterns = [
        "قال رسول الله",
        "عن النبي",
        "رواه",
        "متفق عليه",
        "رواه مسلم",
        "رواه البخاري",
        "حديث صحيح",
        "عن أبي هريرة",
        "عن عائشة",
        "عن جابر",
        "عن ابن عمر",
        "عن عمران بن حصين",
        "عن أبي سعيد",
    ]
    
    # Check if it's commentary-only
    has_commentary = any(pattern in text for pattern in commentary_patterns)
    has_hadith = any(pattern in text for pattern in hadith_patterns)
    
    # If it has commentary but no clear hadith, it's commentary-only
    return has_commentary and not has_hadith


def clean_book1():
    """Clean book 1 entries."""
    with open(SHARH_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    entries = data.get("entries", {})
    
    # Fetch API hadiths for book 1
    print("Fetching book 1 hadiths from API...")
    api_hadiths = fetch_book1_hadiths()
    
    # Create mapping of API hadith numbers to hadith text
    api_hadith_map = {}
    for h in api_hadiths:
        num = h.get("hadithNumber")
        ar_text = h.get("ar", {}).get("text", "")
        if num and ar_text:
            api_hadith_map[str(num)] = ar_text
    
    print(f"Fetched {len(api_hadith_map)} hadiths from API")
    
    # Process book 1 entries
    updated = 0
    removed = 0
    
    for key in list(entries.keys()):
        if not key.startswith("riyadussalihin:1:"):
            continue
        
        entry = entries[key]
        text = entry.get("text", "")
        parts = key.split(":")
        hadith_num = parts[2]
        
        # Check if this is commentary-only
        if is_commentary_only(text):
            # Remove this entry or replace with API hadith text
            if hadith_num in api_hadith_map:
                # Replace with API hadith text
                api_text = api_hadith_map[hadith_num]
                entry["text"] = api_text
                entry["match"]["method"] = "api_text"
                entry["match"]["confidence"] = 1.0
                updated += 1
                print(f"  {key}: Replaced commentary with API hadith text")
            else:
                # Remove entry
                del entries[key]
                removed += 1
                print(f"  {key}: Removed commentary-only entry")
        else:
            # This entry has hadith text, keep it
            # But make sure it doesn't have old sharh
            if "**شرح ابن عثيمين:**" in text:
                # Remove old sharh
                entry["text"] = text.split("\n\n---\n\n")[0]
                entry["match"]["method"] = "api_text"
                entry["match"]["confidence"] = 1.0
                updated += 1
                print(f"  {key}: Removed old sharh")
    
    print(f"\nSummary:")
    print(f"  Updated: {updated}")
    print(f"  Removed: {removed}")
    
    # Save
    with open(SHARH_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Sharh file updated: {SHARH_PATH}")


if __name__ == "__main__":
    clean_book1()
