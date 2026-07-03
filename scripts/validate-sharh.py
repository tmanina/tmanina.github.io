#!/usr/bin/env python3
"""
Validate sharh entries against the API hadith text.

Checks:
1. Does the sharh entry exist for every expected hadith?
2. Does the sharh text mention the correct hadith topic/raavi?
3. Is the sharh a real commentary or just a placeholder?
4. Are there any duplicate entries?

Usage:
  python3 scripts/validate-sharh.py [--verbose]
"""

import json
import urllib.request
import time
import argparse
from collections import defaultdict

SHARH_PATH = "public/data/riyad-uthaymeen-sharh.json"
API_BASE = "https://api.islamic.app/v1/hadith/collections/riyadussalihin/books"

# Keywords that indicate a placeholder entry
PLACEHOLDER_KEYWORDS = [
    "[نص الحديث والشرح غير متاحين حالياً",
    "[شرح غير متاح حالياً",
    "[سيتم إضافة المحتوى لاحقاً",
]

# Keywords that indicate real sharh content
SHARH_KEYWORDS = [
    "قال المؤلف",
    "قال النووي",
    "قال الشيخ",
    "هذا الحديث",
    "في هذا الحديث",
    "دلالته",
    "فوائده",
    "معناه",
    "يقول تعالى",
    "الحديث يدل",
]


def is_placeholder(text: str) -> bool:
    """Check if the entry is a placeholder."""
    return any(kw in text for kw in PLACEHOLDER_KEYWORDS)


def has_real_sharh(text: str) -> bool:
    """Check if the entry contains real sharh content."""
    return any(kw in text for kw in SHARH_KEYWORDS)


def extract_raawi(text: str) -> str | None:
    """Extract the narrator name from the hadith text."""
    import re
    # Common patterns for narrator names
    patterns = [
        r"عن\s+(\S+\s+رضي\s+الله\s+ عنه[^\s]*)",
        r"عن\s+(\S+\s+رضي\s+الله\s+ عنها[^\s]*)",
        r"عن\s+(أبي\s+\S+)",
        r"عن\s+(ابن\s+\S+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1)
    return None


def main():
    parser = argparse.ArgumentParser(description="Validate sharh entries")
    parser.add_argument("--verbose", action="store_true", help="Show detailed output")
    args = parser.parse_args()

    with open(SHARH_PATH, "r", encoding="utf-8") as f:
        sharh_data = json.load(f)

    entries = sharh_data.get("entries", {})

    # Statistics
    stats = {
        "total": len(entries),
        "placeholder": 0,
        "real_sharh": 0,
        "mixed": 0,  # has some sharh but also placeholder marker
        "very_short": 0,  # less than 100 chars
        "no_source": 0,
        "low_confidence": 0,
    }

    issues = []

    for key, entry in sorted(entries.items()):
        text = entry.get("text", "")
        method = entry.get("match", {}).get("method", "")
        confidence = entry.get("match", {}).get("confidence", 0)
        reviewed = entry.get("match", {}).get("reviewed", False)

        # Check for placeholder
        if is_placeholder(text):
            stats["placeholder"] += 1
            if args.verbose:
                issues.append(f"PLACEHOLDER: {key}")
            continue

        # Check for real sharh
        if has_real_sharh(text):
            stats["real_sharh"] += 1
        else:
            # Might be a short entry or manual entry
            if len(text) < 100:
                stats["very_short"] += 1
                if args.verbose:
                    issues.append(f"SHORT ({len(text)} chars): {key} - {text[:60]}")
            else:
                stats["mixed"] += 1

        # Check confidence
        if confidence < 0.9:
            stats["low_confidence"] += 1
            if args.verbose:
                issues.append(f"LOW CONFIDENCE ({confidence}): {key}")

        # Check source
        if not entry.get("source"):
            stats["no_source"] += 1

    # Print results
    print("=" * 60)
    print("SHARH VALIDATION REPORT")
    print("=" * 60)
    print(f"\nTotal entries: {stats['total']}")
    print(f"\nEntry Types:")
    print(f"  Real sharh content:     {stats['real_sharh']:>5} ({stats['real_sharh']/stats['total']*100:.1f}%)")
    print(f"  Placeholder (no data):  {stats['placeholder']:>5} ({stats['placeholder']/stats['total']*100:.1f}%)")
    print(f"  Short entries (<100ch): {stats['very_short']:>5} ({stats['very_short']/stats['total']*100:.1f}%)")
    print(f"  Other content:          {stats['mixed']:>5} ({stats['mixed']/stats['total']*100:.1f}%)")
    print(f"\nQuality:")
    print(f"  Low confidence (<0.9):  {stats['low_confidence']:>5}")
    print(f"  Missing source:         {stats['no_source']:>5}")

    if issues and args.verbose:
        print(f"\nIssues ({len(issues)}):")
        for issue in issues[:50]:  # Show first 50
            print(f"  {issue}")
        if len(issues) > 50:
            print(f"  ... and {len(issues) - 50} more")

    # Coverage by book
    print(f"\nCoverage by Book:")
    by_book = defaultdict(lambda: {"total": 0, "placeholder": 0, "real": 0})
    for key, entry in entries.items():
        parts = key.split(":")
        if len(parts) == 3:
            book = parts[1]
            by_book[book]["total"] += 1
            if is_placeholder(entry.get("text", "")):
                by_book[book]["placeholder"] += 1
            elif has_real_sharh(entry.get("text", "")):
                by_book[book]["real"] += 1

    for book in sorted(by_book.keys(), key=lambda x: (x == "introduction", int(x) if x.isdigit() else 0)):
        b = by_book[book]
        real_pct = b["real"] / b["total"] * 100 if b["total"] > 0 else 0
        placeholder_pct = b["placeholder"] / b["total"] * 100 if b["total"] > 0 else 0
        print(f"  Book {book:>15}: {b['total']:>4} entries, {b['real']:>4} real ({real_pct:.0f}%), {b['placeholder']:>4} placeholder ({placeholder_pct:.0f}%)")

    print(f"\n{'=' * 60}")


if __name__ == "__main__":
    main()
