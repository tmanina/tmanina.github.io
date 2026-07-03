#!/usr/bin/env python3
"""
Final rebuild of riyad-uthaymeen-shamela-final.json.

Approach:
1. For introduction entries: Use Shamela page chain extraction with matn boundary detection
2. For book entries: Use Shamela page chain extraction  
3. Use reviewed sharh.json as reference for quality validation
"""

import json
import os
import re
import hashlib
from datetime import datetime, timezone

CACHE_DIR = ".cache/shamela-all"
INPUT_FILE = "public/data/riyad-uthaymeen-shamela-final.json"
OUTPUT_FILE = "public/data/riyad-uthaymeen-shamela-final.json"

BOOKS = [
    ["1", 680, 726], ["2", 727, 777], ["3", 778, 812], ["4", 813, 843],
    ["5", 844, 893], ["6", 894, 955], ["7", 956, 990], ["8", 991, 1267],
    ["9", 1268, 1270], ["10", 1271, 1284], ["11", 1285, 1375], ["12", 1376, 1392],
    ["13", 1393, 1396], ["14", 1397, 1407], ["15", 1408, 1464], ["16", 1465, 1510],
    ["17", 1511, 1807], ["18", 1808, 1868], ["19", 1869, 1896],
]

valid_numbers = set()
for _, start, end in BOOKS:
    for n in range(start, end + 1):
        valid_numbers.add(n)


def decode_entities(text):
    text = re.sub(r"&#(\d+);", lambda m: chr(int(m.group(1))), text)
    text = re.sub(r"&#x([0-9a-f]+);", lambda m: chr(int(m.group(1), 16)), text)
    return text.replace("&nbsp;", " ").replace("&quot;", '"').replace("&amp;", "&")


def html_to_text(html):
    text = html
    text = re.sub(r"<script[\s\S]*?</script>", "", text, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", "", text, flags=re.I)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"<p\b[^>]*>", "\n", text, flags=re.I)
    text = re.sub(r"</p>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    text = decode_entities(text)
    text = re.sub(r"\r", "", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n[ \t]+", "\n", text)
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def to_western_digits(value):
    digits = {"٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9"}
    return re.sub(r"[٠-٩]", lambda d: digits[d.group()], str(value))


def split_matn_sharh(full_text):
    pos = full_text.find("الشَّرْحُ")
    if pos < 0:
        return full_text, ""
    before = full_text[:pos].strip()
    after = full_text[pos:]
    after = re.sub(r"^\[?الشَّرْحُ\]?\s*", "", after).strip()
    return before, after


def get_sharh_idx(text, sharh_pool, sharh_hash_to_idx):
    if not text:
        return -1
    h = hashlib.md5(text.encode("utf-8")).digest()
    if h not in sharh_hash_to_idx:
        sharh_hash_to_idx[h] = len(sharh_pool)
        sharh_pool.append(text)
    return sharh_hash_to_idx[h]


def load_pages(page_range):
    pages = {}
    for pid in page_range:
        fpath = os.path.join(CACHE_DIR, f"{pid}.json")
        if os.path.exists(fpath):
            with open(fpath, "r", encoding="utf-8") as f:
                raw = json.load(f)
            pages[pid] = {
                "text": html_to_text(raw.get("nass", "")),
                "nextId": int(raw["nextId"]) if raw.get("nextId") else None,
            }
    return pages


def is_new_matn_start(text):
    """Check if a page starts a new matn (chapter heading or hadith number)."""
    stripped = text.lstrip()
    # Chapter headings: [٥- باب ...] or [باب ...]
    if re.match(r"^\[.*باب", stripped):
        return True
    # Hadith numbers: ٦٠- or 852 -
    if re.match(r"^[\u0660-\u0669]{1,4}\s*[-ـ]", stripped):
        return True
    return False


def build_intro_sharh(pages):
    """Extract sharh for introduction entries using Shamela page chain."""
    # Find all marker pages
    markers = []
    for pid in range(1, 680):
        if pages.get(pid, {}).get("text", "").find("الشَّرْحُ") >= 0:
            markers.append(pid)

    print(f"  Found {len(markers)} marker pages")

    # For each marker, build the sharh and assign to pages in the section
    page_to_sharh = {}
    for mi, start_pid in enumerate(markers):
        end_pid = markers[mi + 1] - 1 if mi + 1 < len(markers) else 679
        page = pages.get(start_pid)
        if not page:
            continue

        _, sharh_part = split_matn_sharh(page["text"])
        if not sharh_part:
            continue

        # Follow chain, but stop at new matn boundaries
        full_sharh = sharh_part
        cur = start_pid
        last_pid = start_pid
        while cur < end_pid:
            nxt = pages.get(cur, {}).get("nextId")
            if not nxt or nxt > end_pid:
                break
            np = pages.get(nxt)
            if not np:
                break
            if np["text"].find("الشَّرْحُ") >= 0:
                break
            if is_new_matn_start(np["text"]):
                break
            full_sharh += "\n\n" + np["text"]
            cur = nxt
            last_pid = cur

        # Assign to all pages in section
        for p in range(start_pid, last_pid + 1):
            page_to_sharh[p] = full_sharh

    mapped = len(page_to_sharh)
    unmapped = sum(1 for i in range(1, 680) if i not in page_to_sharh)
    print(f"  Pages with sharh: {mapped}, Without: {unmapped}")
    return page_to_sharh


def build_book_sharh(pages):
    """Extract sharh for book entries using Shamela page chain."""
    markers = []
    for pid in range(680, 3785):
        if pages.get(pid, {}).get("text", "").find("الشَّرْحُ") >= 0:
            markers.append(pid)

    print(f"  Found {len(markers)} marker pages in books")

    hadith_re = re.compile(r"(?:^|\n)\s*([\u0660-\u0669]{1,4})\s*[-ـ]")
    book_sections = []

    for start_pid in markers:
        page = pages.get(start_pid)
        if not page:
            continue
        pos = page["text"].find("الشَّرْحُ")
        if pos < 0:
            continue
        before = page["text"][:pos]
        hadiths_before = []
        for m in hadith_re.finditer(before):
            num = int(to_western_digits(m.group(1)))
            if num in valid_numbers:
                hadiths_before.append(num)
        if not hadiths_before:
            continue
        last_hadith = max(hadiths_before)
        sharh = page["text"][pos:]
        sharh = re.sub(r"^\[?الشَّرْحُ\]?\s*", "", sharh).strip()

        cur = start_pid
        while True:
            cur_page = pages.get(cur)
            if not cur_page or not cur_page.get("nextId"):
                break
            nxt = pages.get(cur_page["nextId"])
            if not nxt:
                break
            if nxt["text"].find("الشَّرْحُ") >= 0:
                n_pos = nxt["text"].find("الشَّرْحُ")
                before_nxt = nxt["text"][:n_pos].strip()
                if before_nxt:
                    sharh += "\n\n" + before_nxt
                break
            stripped = nxt["text"].lstrip()
            fm = re.match(r"^[\u0660-\u0669]{1,4}\s*[-ـ]", stripped)
            if fm:
                fn_str = fm.group(0).split()[0].rstrip("-ـ").rstrip()
                fn = int(to_western_digits(fn_str))
                if fn in valid_numbers:
                    break
            sharh += "\n\n" + nxt["text"]
            cur = cur_page["nextId"]

        book_sections.append({"sharh_text": sharh, "last_hadith": last_hadith})

    book_sections.sort(key=lambda x: x["last_hadith"])
    hadith_to_sharh = {}
    for i, section in enumerate(book_sections):
        start = book_sections[i - 1]["last_hadith"] + 1 if i > 0 else 680
        for n in range(start, section["last_hadith"] + 1):
            hadith_to_sharh[n] = section["sharh_text"]

    print(f"  Sections: {len(book_sections)}, Hadiths mapped: {len(hadith_to_sharh)}")
    return hadith_to_sharh


def main():
    print("=" * 60)
    print("Final rebuild of Riyadh al-Salihin sharh")
    print("=" * 60)

    # Load pages
    print("\n1. Loading Shamela pages...")
    intro_pages = load_pages(range(1, 680))
    book_pages = load_pages(range(680, 3785))
    all_pages = {**intro_pages, **book_pages}
    print(f"   Loaded {len(all_pages)} pages")

    # Build sharh mappings
    print("\n2. Building introduction sharh...")
    intro_mapping = build_intro_sharh(intro_pages)

    print("\n3. Building book sharh...")
    book_mapping = build_book_sharh(all_pages)

    # Load current data
    print("\n4. Loading current data...")
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    entries = data["entries"]
    old_pool = data.get("sharhPool", [])

    # Build new sharhPool
    print("\n5. Building new sharhPool...")
    new_sharh_pool = []
    new_hash_to_idx = {}

    def get_idx(text):
        return get_sharh_idx(text, new_sharh_pool, new_hash_to_idx)

    for text in old_pool:
        get_idx(text)
    print(f"   Old pool: {len(old_pool)}, After adding: {len(new_sharh_pool)}")

    # Update introduction entries
    print("\n6. Updating introduction entries...")
    intro_fixed = 0
    intro_no_sharh = 0
    for i in range(1, 680):
        key = f"riyadussalihin:introduction:{i}"
        entry = entries.get(key, {})
        if not entry:
            continue

        full_text = entry.get("text", "")
        matn, _ = split_matn_sharh(full_text)
        entry["matn"] = matn

        sharh_text = intro_mapping.get(i, "")
        if sharh_text:
            idx = get_idx(sharh_text)
            entry["sharh"] = idx
            intro_fixed += 1
        else:
            entry["sharh"] = -1
            intro_no_sharh += 1

    print(f"   With sharh: {intro_fixed}, Without: {intro_no_sharh}")

    # Update book entries
    print("\n7. Updating book entries...")
    book_fixed = 0
    book_kept = 0
    for key, entry in list(entries.items()):
        if "introduction" in key:
            continue
        if entry.get("sharh", -1) >= 0:
            book_kept += 1
            continue
        parts = key.split(":")
        if len(parts) < 3:
            continue
        hadith_num = int(parts[2])
        sharh_text = book_mapping.get(hadith_num, "")
        if sharh_text:
            idx = get_idx(sharh_text)
            entry["sharh"] = idx
            book_fixed += 1

    print(f"   Kept: {book_kept}, Fixed: {book_fixed}")

    # Clean wrong sharh
    print("\n8. Cleaning wrong sharh references...")
    wrong_start = "ذكر المؤلف في سياق الأحاديث الواردة في نعيم أهل الجنة"
    fixed_wrong = 0
    for key, entry in entries.items():
        idx = entry.get("sharh", -1)
        if 0 <= idx < len(new_sharh_pool):
            if wrong_start in new_sharh_pool[idx]:
                entry["sharh"] = -1
                fixed_wrong += 1
    print(f"   Fixed: {fixed_wrong}")

    # Stats
    total = len(entries)
    with_matn = sum(1 for e in entries.values() if len(e.get("matn", "")) > 20)
    with_sharh = sum(1 for e in entries.values() if isinstance(e.get("sharh"), int) and e["sharh"] >= 0)
    intro_with = sum(1 for k, e in entries.items() if ":introduction:" in k and isinstance(e.get("sharh"), int) and e["sharh"] >= 0)
    book_with = sum(1 for k, e in entries.items() if ":introduction:" not in k and isinstance(e.get("sharh"), int) and e["sharh"] >= 0)

    data["sharhPool"] = new_sharh_pool
    data["meta"]["totalEntries"] = total
    data["meta"]["entriesWithMatn"] = with_matn
    data["meta"]["entriesWithSharh"] = with_sharh
    data["meta"]["introSharh"] = intro_with
    data["meta"]["bookSharh"] = book_with
    data["meta"]["uniqueSharhTexts"] = len(new_sharh_pool)
    data["meta"]["generatedAt"] = datetime.now(timezone.utc).isoformat()

    print("\n" + "=" * 60)
    print("RESULTS:")
    print(f"  Total entries: {total}")
    print(f"  With matn: {with_matn}")
    print(f"  With sharh: {with_sharh}")
    print(f"  Introduction: {intro_with}/679 with sharh")
    print(f"  Books: {book_with}/1217 with sharh")
    print(f"  Sharh pool: {len(new_sharh_pool)} unique texts")
    print("=" * 60)

    print(f"\nSaving to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("Done!")


if __name__ == "__main__":
    main()
