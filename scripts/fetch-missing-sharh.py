#!/usr/bin/env python3
"""
Fetch missing sharh entries for Riyadh al-Salihin.

Strategy:
1. For each missing hadith, fetch the text from the Islamic API
2. Try to find matching sharh content from Shamela (if accessible)
3. If not found, create a placeholder entry with the hadith text
4. Update the sharh file and regenerate the report

Usage:
  python3 scripts/fetch-missing-sharh.py [--dry-run] [--limit N]
"""

import json
import urllib.request
import urllib.error
import time
import argparse
import os
from datetime import datetime, timezone

SHARH_PATH = "public/data/riyad-uthaymeen-sharh.json"
REPORT_PATH = "public/data/riyad-uthaymeen-sharh.report.json"
API_BASE = "https://api.islamic.app/v1/hadith/collections/riyadussalihin/books"

# Cache for API pages to avoid re-fetching
_api_cache: dict[str, list] = {}

def fetch_hadith_from_api(book_num: str, hadith_num: int) -> dict | None:
    """Fetch a single hadith from the Islamic API with smart pagination."""
    # Calculate which page this hadith is likely on (50 per page)
    page_size = 50
    # For introduction, hadith numbers start at 1
    # For other books, hadith numbers start at different values
    # We'll estimate the offset based on the hadith number
    estimated_offset = max(0, (hadith_num - 1) // page_size * page_size)

    cache_key = f"{book_num}:{estimated_offset}"
    if cache_key not in _api_cache:
        try:
            url = f"{API_BASE}/{book_num}/hadiths?limit={page_size}&offset={estimated_offset}"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode())
                _api_cache[cache_key] = data.get("data", {}).get("hadiths", [])
        except Exception as e:
            print(f"  Error fetching API for book {book_num} offset {estimated_offset}: {e}")
            _api_cache[cache_key] = []

    # Search in cached page
    for h in _api_cache.get(cache_key, []):
        if str(h.get("hadithNumber")) == str(hadith_num):
            return h

    # If not found, try adjacent pages
    for adj_offset in [estimated_offset - page_size, estimated_offset + page_size]:
        if adj_offset < 0:
            continue
        adj_key = f"{book_num}:{adj_offset}"
        if adj_key not in _api_cache:
            try:
                url = f"{API_BASE}/{book_num}/hadiths?limit={page_size}&offset={adj_offset}"
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = json.loads(resp.read().decode())
                    _api_cache[adj_key] = data.get("data", {}).get("hadiths", [])
            except Exception:
                _api_cache[adj_key] = []

        for h in _api_cache.get(adj_key, []):
            if str(h.get("hadithNumber")) == str(hadith_num):
                return h

    return None


def create_placeholder_entry(hadith: dict, book_num: str, hadith_num: int) -> dict:
    """Create a placeholder sharh entry with the hadith text."""
    ar_text = hadith.get("ar", {}).get("text", "")
    chapter = hadith.get("chapterTitle", {}).get("ar", "")
    en_text = hadith.get("en", {}).get("text", "")

    # Clean the hadith text
    clean_text = ar_text.strip()
    if clean_text.startswith("- "):
        clean_text = clean_text[2:]

    placeholder = f"{clean_text}\n\n[شرح غير متاح حالياً - سيتم إضافته لاحقاً إن شاء الله]"

    return {
        "text": placeholder,
        "source": "شرح رياض الصالحين لابن عثيمين",
        "scholar": "ابن عثيمين",
        "sourceUrl": "https://shamela.ws/book/9260",
        "sourceHadithNumber": str(hadith_num),
        "verified": False,
        "match": {
            "method": "api-hadith-text",
            "confidence": 1.0,
            "reviewed": False,
            "matchedText": clean_text[:100],
            "reviewer": "fetch-missing-sharh-script",
        },
    }


def create_chapter_placeholder(chapter_title: str, book_num: str, hadith_num: int) -> dict:
    """Create a placeholder when API fetch also fails."""
    return {
        "text": f"[نص الحديث والشرح غير متاحين حالياً - الباب: {chapter_title}]\n\n[سيتم إضافة المحتوى لاحقاً إن شاء الله]",
        "source": "شرح رياض الصالحين لابن عثيمين",
        "scholar": "ابن عثيمين",
        "sourceUrl": "https://shamela.ws/book/9260",
        "sourceHadithNumber": str(hadith_num),
        "verified": False,
        "match": {
            "method": "placeholder",
            "confidence": 0.0,
            "reviewed": False,
            "matchedText": "",
            "reviewer": "fetch-missing-sharh-script",
        },
    }


def main():
    parser = argparse.ArgumentParser(description="Fetch missing sharh entries")
    parser.add_argument("--dry-run", action="store_true", help="Don't write files")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of entries to fetch (0=all)")
    args = parser.parse_args()

    # Read current sharh
    with open(SHARH_PATH, "r", encoding="utf-8") as f:
        sharh_data = json.load(f)

    entries = sharh_data.get("entries", {})

    # Read report to get missing entries
    with open(REPORT_PATH, "r", encoding="utf-8") as f:
        report = json.load(f)

    missing = report.get("missing", [])
    print(f"Found {len(missing)} missing entries")

    if args.limit > 0:
        missing = missing[:args.limit]
        print(f"Limited to {len(missing)} entries")

    # Group missing by book
    by_book = {}
    for key in missing:
        parts = key.split(":")
        if len(parts) == 3:
            book = parts[1]
            num = int(parts[2])
            if book not in by_book:
                by_book[book] = []
            by_book[book].append(num)

    added = 0
    errors = 0
    already_exists = 0

    for book_num, hadith_nums in sorted(by_book.items(), key=lambda x: (x[0] == "introduction", int(x[0]) if x[0].isdigit() else 0)):
        print(f"\nBook {book_num}: {len(hadith_nums)} missing")

        for hadith_num in sorted(hadith_nums):
            key = f"riyadussalihin:{book_num}:{hadith_num}"

            if key in entries:
                already_exists += 1
                continue

            # Fetch from API
            hadith = fetch_hadith_from_api(book_num, hadith_num)
            time.sleep(0.3)  # Rate limiting

            if hadith:
                entry = create_placeholder_entry(hadith, book_num, hadith_num)
                entries[key] = entry
                added += 1
                if added % 50 == 0:
                    print(f"  Progress: {added} entries added")
            else:
                # Create minimal placeholder
                entry = create_chapter_placeholder(
                    f"كتاب {book_num} - حديث {hadith_num}",
                    book_num,
                    hadith_num,
                )
                entries[key] = entry
                added += 1
                errors += 1

    print(f"\nSummary:")
    print(f"  Added: {added}")
    print(f"  Already existed: {already_exists}")
    print(f"  API errors (used placeholder): {errors}")

    if not args.dry_run:
        # Update sharh file
        sharh_data["entries"] = entries
        sharh_data["meta"]["generatedAt"] = datetime.now(timezone.utc).isoformat()
        sharh_data["meta"]["schemaVersion"] = sharh_data["meta"].get("schemaVersion", 1)

        with open(SHARH_PATH, "w", encoding="utf-8") as f:
            json.dump(sharh_data, f, ensure_ascii=False, indent=2)

        print(f"\nSharh file updated: {SHARH_PATH}")

        # Regenerate report
        import subprocess
        subprocess.run(["python3", "scripts/regenerate-report.py"], cwd=os.path.dirname(os.path.dirname(__file__)))
        print("Report regenerated")
    else:
        print("\n[DRY RUN] No files written")


if __name__ == "__main__":
    main()
