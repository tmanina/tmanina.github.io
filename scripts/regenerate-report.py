#!/usr/bin/env python3
"""
Regenerate riyad-uthaymeen-sharh.report.json from the actual sharh file.
This fixes the desync between the report and the actual data.
"""

import json
from datetime import datetime, timezone

SHARH_PATH = "public/data/riyad-uthaymeen-sharh.json"
REPORT_PATH = "public/data/riyad-uthaymeen-sharh.report.json"

# Expected hadith ranges per book (from the API structure)
BOOK_RANGES = {
    "introduction": {"start": 1, "end": 679},
    "1": {"start": 680, "end": 726},
    "2": {"start": 727, "end": 777},
    "3": {"start": 778, "end": 812},
    "4": {"start": 813, "end": 843},
    "5": {"start": 844, "end": 893},
    "6": {"start": 894, "end": 955},
    "7": {"start": 956, "end": 990},
    "8": {"start": 991, "end": 1267},
    "9": {"start": 1268, "end": 1270},
    "10": {"start": 1271, "end": 1284},
    "11": {"start": 1285, "end": 1375},
    "12": {"start": 1376, "end": 1392},
    "13": {"start": 1393, "end": 1396},
    "14": {"start": 1397, "end": 1407},
    "15": {"start": 1408, "end": 1464},
    "16": {"start": 1465, "end": 1510},
    "17": {"start": 1511, "end": 1807},
    "18": {"start": 1808, "end": 1868},
    "19": {"start": 1869, "end": 1896},
}

def main():
    with open(SHARH_PATH, "r", encoding="utf-8") as f:
        sharh_data = json.load(f)

    entries = sharh_data.get("entries", {})
    meta = sharh_data.get("meta", {})

    # Group entries by book
    by_book = {}
    for key in entries:
        parts = key.split(":")
        if len(parts) == 3 and parts[0] == "riyadussalihin":
            book = parts[1]
            hadith_num = int(parts[2])
            if book not in by_book:
                by_book[book] = []
            by_book[book].append(hadith_num)

    # Build report
    by_book_report = []
    all_missing = []
    total_expected = 0
    total_covered = 0

    for book_num_str in ["introduction"] + [str(i) for i in range(1, 20)]:
        book_range = BOOK_RANGES.get(book_num_str)
        if not book_range:
            continue

        start = book_range["start"]
        end = book_range["end"]
        total = end - start + 1
        total_expected += total

        existing = set(by_book.get(book_num_str, []))
        covered = len(existing)
        total_covered += covered

        missing_nums = [n for n in range(start, end + 1) if n not in existing]
        missing_count = len(missing_nums)
        all_missing.extend([f"riyadussalihin:{book_num_str}:{n}" for n in missing_nums])

        by_book_report.append({
            "bookNumber": book_num_str,
            "start": start,
            "end": end,
            "total": total,
            "covered": covered,
            "missing": missing_count,
        })

    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceUrl": meta.get("sourceUrl", "https://shamela.ws/book/9260"),
        "generatedEntries": len(entries),
        "totalEntries": len(entries),
        "expectedEntries": total_expected,
        "missingEntries": len(all_missing),
        "byBook": by_book_report,
        "missing": all_missing,
    }

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"Report regenerated successfully!")
    print(f"  Total entries in sharh file: {len(entries)}")
    print(f"  Expected entries: {total_expected}")
    print(f"  Missing entries: {len(all_missing)}")
    print(f"  Coverage: {len(entries)/total_expected*100:.1f}%")
    print()
    for b in by_book_report:
        if b["missing"] > 0:
            print(f"  Book {b['bookNumber']}: {b['covered']}/{b['total']} covered, {b['missing']} missing")

if __name__ == "__main__":
    main()
