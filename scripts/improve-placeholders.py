#!/usr/bin/env python3
"""
Improve placeholder entries by fetching chapter titles and hadith text from the API.
This makes the placeholders more informative for users.
"""

import json
import urllib.request
import time
import re

SHARH_PATH = "public/data/riyad-uthaymeen-sharh.json"
API_BASE = "https://api.islamic.app/v1/hadith/collections/riyadussalihin/books"

# Cache for API pages
_api_cache: dict[str, list] = {}


# Cache for book totals
_book_totals: dict[str, int] = {}


def get_book_total(book_num: str) -> int:
    """Get the total number of hadiths in a book."""
    if book_num in _book_totals:
        return _book_totals[book_num]
    try:
        url = f"{API_BASE}/{book_num}/hadiths?limit=1&offset=0"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            total = data.get("data", {}).get("total", 0)
            _book_totals[book_num] = total
            return total
    except Exception:
        _book_totals[book_num] = 0
        return 0


def fetch_hadith_from_api(book_num: str, hadith_num: int) -> dict | None:
    """Fetch a single hadith from the Islamic API with smart pagination."""
    page_size = 50
    total = get_book_total(book_num)

    # Calculate which page this hadith is on
    # The hadith number might not start at 1, so we need to find the right page
    # Try multiple pages to find the hadith
    for offset in range(0, max(total, hadith_num + 1), page_size):
        cache_key = f"{book_num}:{offset}"
        if cache_key not in _api_cache:
            try:
                url = f"{API_BASE}/{book_num}/hadiths?limit={page_size}&offset={offset}"
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = json.loads(resp.read().decode())
                    _api_cache[cache_key] = data.get("data", {}).get("hadiths", [])
            except Exception as e:
                print(f"  Error fetching API for book {book_num} offset {offset}: {e}")
                _api_cache[cache_key] = []

        page_hadiths = _api_cache.get(cache_key, [])
        if not page_hadiths:
            break  # No more hadiths

        for h in page_hadiths:
            if str(h.get("hadithNumber")) == str(hadith_num):
                return h

        # Check if we've passed the hadith number
        last_num = int(page_hadiths[-1].get("hadithNumber", 0))
        if last_num > hadith_num:
            break  # We've passed it

    return None


def clean_hadith_text(text: str) -> str:
    """Clean hadith text by removing HTML tags and extra whitespace."""
    # Remove HTML tags
    text = re.sub(r"<[^>]+>", "", text)
    # Remove extra whitespace
    text = re.sub(r"\s+", " ", text).strip()
    # Remove leading dash
    if text.startswith("- "):
        text = text[2:]
    return text


def is_placeholder(entry: dict) -> bool:
    """Check if an entry is a placeholder."""
    method = entry.get("match", {}).get("method", "")
    text = entry.get("text", "")
    return (
        method in ("placeholder", "api-hadith-text")
        or "[نص الحديث والشرح غير متاحين حالياً" in text
        or "[شرح غير متاح حالياً" in text
    )


def main():
    with open(SHARH_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    entries = data.get("entries", {})
    updated = 0
    errors = 0

    for key, entry in list(entries.items()):
        if not is_placeholder(entry):
            continue

        parts = key.split(":")
        if len(parts) != 3:
            continue

        book_num = parts[1]
        hadith_num = int(parts[2])

        # Fetch from API
        hadith = fetch_hadith_from_api(book_num, hadith_num)
        time.sleep(0.2)  # Rate limiting

        if hadith:
            ar_text = hadith.get("ar", {}).get("text", "")
            chapter = hadith.get("chapterTitle", {}).get("ar", "")
            en_text = hadith.get("en", {}).get("text", "")

            clean_ar = clean_hadith_text(ar_text) if ar_text else ""

            if clean_ar:
                # We have the hadith text
                new_text = f"{clean_ar}\n\n---\n\n**{chapter}**\n\n[شرح ابن عثيمين غير متاح حالياً على هذا الحديث]\n\n[سيتم إضافته إن شاء الله]"

                entry["text"] = new_text
                entry["match"]["method"] = "api-hadith-text"
                entry["match"]["confidence"] = 1.0
                entry["match"]["matchedText"] = clean_ar[:100]
                updated += 1
            else:
                # We only have the chapter title
                if chapter:
                    new_text = f"[الباب: {chapter}]\n\n[نص الحديث غير متاح حالياً]\n\n[شرح ابن عثيمين غير متاح حالياً]"
                    entry["text"] = new_text
                    entry["match"]["method"] = "placeholder"
                    entry["match"]["confidence"] = 0.5
                    entry["match"]["matchedText"] = chapter[:100]
                    updated += 1
        else:
            errors += 1

        if updated % 100 == 0 and updated > 0:
            print(f"  Progress: {updated} entries updated")

    print(f"\nSummary:")
    print(f"  Updated: {updated}")
    print(f"  API errors: {errors}")

    # Save
    with open(SHARH_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Sharh file updated: {SHARH_PATH}")


if __name__ == "__main__":
    main()
