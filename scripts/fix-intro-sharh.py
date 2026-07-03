#!/usr/bin/env python3
"""
Fix introduction entries' sharh by matching them to book section hadiths.

Strategy:
1. For each intro entry, extract key phrases from its matn
2. Search the BOOK section (pages 680+) for matching hadiths
3. If found, use the book section's sharh for that intro entry
4. This works because many intro entries reference hadiths that also appear in the book sections
"""

import json
import os
import re
import hashlib
from datetime import datetime, timezone

CACHE_DIR = ".cache/shamela-all"
SHARH_FILE = "public/data/riyad-uthaymeen-sharh.json"
FINAL_FILE = "public/data/riyad-uthaymeen-shamela-final.json"
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


def normalize(text):
    if not text:
        return ""
    text = text.replace("\u200f", "").replace("\u200e", "")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def get_sharh_idx(text, pool, hash_map):
    if not text:
        return -1
    h = hashlib.md5(text.encode("utf-8")).digest()
    if h not in hash_map:
        hash_map[h] = len(pool)
        pool.append(text)
    return hash_map[h]


def split_matn_sharh(full_text):
    pos = full_text.find("الشَّرْحُ")
    if pos < 0:
        return full_text, ""
    before = full_text[:pos].strip()
    after = full_text[pos:]
    after = re.sub(r"^\[?الشَّرْحُ\]?\s*", "", after).strip()
    return before, after


def load_all_pages():
    pages = {}
    for pid in range(1, 3785):
        fpath = os.path.join(CACHE_DIR, f"{pid}.json")
        if os.path.exists(fpath):
            with open(fpath, "r", encoding="utf-8") as f:
                raw = json.load(f)
            text = html_to_text(raw.get("nass", ""))
            pages[pid] = {
                "text": text,
                "text_norm": normalize(text),
                "nextId": int(raw["nextId"]) if raw.get("nextId") else None,
                "has_sharh": "الشَّرْحُ" in text,
            }
    return pages


def build_book_hadith_sharh(pages):
    """Build mapping from hadith text -> sharh for book section (pages 680+)."""
    hadith_re = re.compile(r"(?:^|\n)\s*([\u0660-\u0669]{1,4})\s*[-ـ]")
    
    book_markers = []
    for pid in range(680, 3785):
        page = pages.get(pid)
        if page and page["has_sharh"]:
            book_markers.append(pid)
    
    book_sections = []
    for start_pid in book_markers:
        page = pages.get(start_pid)
        if not page:
            continue
        pos = page["text"].find("الشَّرْحُ")
        if pos < 0:
            continue
        before = page["text"][:pos]
        hadiths_before = []
        for m in hadith_re.finditer(before):
            num_str = m.group(1)
            num = int(num_str.replace("٠", "0").replace("١", "1").replace("٢", "2").replace("٣", "3").replace("٤", "4").replace("٥", "5").replace("٦", "6").replace("٧", "7").replace("٨", "8").replace("٩", "9"))
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
            if nxt["has_sharh"]:
                n_pos = nxt["text"].find("الشَّرْحُ")
                before_nxt = nxt["text"][:n_pos].strip()
                if before_nxt:
                    sharh += "\n\n" + before_nxt
                break
            stripped = nxt["text"].lstrip()
            fm = re.match(r"^[\u0660-\u0669]{1,4}\s*[-ـ]", stripped)
            if fm:
                fn_str = fm.group(0).split()[0].rstrip("-ـ").rstrip()
                fn = int(fn_str.replace("٠", "0").replace("١", "1").replace("٢", "2").replace("٣", "3").replace("٤", "4").replace("٥", "5").replace("٦", "6").replace("٧", "7").replace("٨", "8").replace("٩", "9"))
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
    
    return hadith_to_sharh


def extract_sharh_from_page(page_text):
    pos = page_text.find("الشَّرْحُ")
    if pos < 0:
        return ""
    after = page_text[pos:]
    after = re.sub(r"^\[?الشَّرْحُ\]?\s*", "", after).strip()
    return after


def main():
    print("=" * 70)
    print("FIX INTRODUCTION SHARH - Match to book section")
    print("=" * 70)
    
    # Step 1: Load Shamela pages
    print("\n1. Loading Shamela pages...")
    pages = load_all_pages()
    print(f"   Loaded {len(pages)} pages")
    
    # Step 2: Build book hadith -> sharh mapping
    print("\n2. Building book hadith -> sharh mapping...")
    hadith_to_sharh = build_book_hadith_sharh(pages)
    print(f"   Book hadiths with sharh: {len(hadith_to_sharh)}")
    
    # Step 3: Load sharh.json and final data
    print("\n3. Loading data...")
    with open(SHARH_FILE, "r", encoding="utf-8") as f:
        sharh_data = json.load(f)
    sharh_entries = sharh_data["entries"]
    
    with open(FINAL_FILE, "r", encoding="utf-8") as f:
        final_data = json.load(f)
    entries = final_data["entries"]
    print(f"   Loaded {len(entries)} entries")
    
    # Step 4: Build new sharhPool
    print("\n4. Building new sharhPool...")
    new_pool = []
    new_hash_map = {}
    for text in final_data.get("sharhPool", []):
        get_sharh_idx(text, new_pool, new_hash_map)
    print(f"   Old pool: {len(new_pool)}")
    
    # Step 5: Extract sharh from sharh.json for each entry
    print("\n5. Extracting sharh from sharh.json...")
    entry_sharh = {}
    for key, entry in sharh_entries.items():
        text = entry.get("text", "")
        sep = "\n\n---\n\n"
        idx = text.find(sep)
        if idx >= 0:
            sharh = text[idx + len(sep):]
            header = "**شرح ابن عثيمين:**"
            if sharh.startswith(header):
                sharh = sharh[len(header):]
            sharh = sharh.strip()
            if sharh:
                entry_sharh[key] = sharh
    
    print(f"   Extracted sharh for {len(entry_sharh)} entries")
    
    # Step 6: For intro entries, search for matching hadith in book section
    print("\n6. Fixing introduction entries...")
    
    # Build text index for book section pages
    book_page_texts = {}
    for pid in range(680, 3785):
        page = pages.get(pid)
        if page:
            book_page_texts[pid] = page["text_norm"]
    
    stats = {"from_book_search": 0, "from_sharh_json": 0, "no_sharh": 0, "total": 0}
    
    intro_keys = sorted([k for k in entries.keys() if "introduction" in k])
    
    for key in intro_keys:
        stats["total"] += 1
        entry = entries[key]
        parts = key.split(":")
        entry_num = int(parts[2])
        
        matn = entry.get("matn", "")
        if not matn or len(matn) < 20:
            stats["no_sharh"] += 1
            continue
        
        matn_norm = normalize(matn)
        
        # Strategy 1: Search book section pages for this matn
        # Extract distinctive phrases from the matn
        words = matn_norm.split()
        found_sharh = ""
        
        if len(words) >= 5:
            # Try searching with key phrases
            for phrase_len in [10, 8, 6, 5]:
                for start in range(0, max(1, len(words) - phrase_len + 1)):
                    phrase = " ".join(words[start:start + phrase_len])
                    if len(phrase) < 15:
                        continue
                    
                    for pid, page_text in book_page_texts.items():
                        if phrase in page_text:
                            # Found a match! Extract sharh from this page
                            sharh = extract_sharh_from_page(pages[pid]["text"])
                            if sharh and len(sharh) > 30:
                                found_sharh = sharh
                                break
                    if found_sharh:
                        break
                if found_sharh:
                    break
        
        if found_sharh:
            idx = get_sharh_idx(found_sharh, new_pool, new_hash_map)
            entry["sharh"] = idx
            stats["from_book_search"] += 1
        elif key in entry_sharh:
            # Fallback to sharh.json sharh
            idx = get_sharh_idx(entry_sharh[key], new_pool, new_hash_map)
            entry["sharh"] = idx
            stats["from_sharh_json"] += 1
        else:
            stats["no_sharh"] += 1
        
        if stats["total"] % 100 == 0:
            print(f"   Processed {stats['total']}/{len(intro_keys)}...")
    
    print(f"\n   From book search: {stats['from_book_search']}")
    print(f"   From sharh.json: {stats['from_sharh_json']}")
    print(f"   No sharh: {stats['no_sharh']}")
    
    # Step 7: Verify specific entries
    print("\n7. Verifying specific entries...")
    verify_keys = [
        "riyadussalihin:introduction:1",
        "riyadussalihin:introduction:10",
        "riyadussalihin:introduction:11",
        "riyadussalihin:introduction:80",
        "riyadussalihin:introduction:100",
    ]
    
    for key in verify_keys:
        entry = entries.get(key, {})
        matn = entry.get("matn", "")[:100]
        sharh_idx = entry.get("sharh", -1)
        if 0 <= sharh_idx < len(new_pool):
            sharh_text = new_pool[sharh_idx][:120]
        else:
            sharh_text = "No sharh"
        print(f"\n   {key}:")
        print(f"     Matn: {matn}...")
        print(f"     Sharh: {sharh_text}...")
    
    # Step 8: Update metadata
    print("\n8. Updating metadata...")
    total = len(entries)
    with_matn = sum(1 for e in entries.values() if len(e.get("matn", "")) > 20)
    with_sharh = sum(1 for e in entries.values() if isinstance(e.get("sharh"), int) and e["sharh"] >= 0)
    intro_with = sum(1 for k, e in entries.items() if ":introduction:" in k and isinstance(e.get("sharh"), int) and e["sharh"] >= 0)
    book_with = sum(1 for k, e in entries.items() if ":introduction:" not in k and isinstance(e.get("sharh"), int) and e["sharh"] >= 0)
    
    final_data["sharhPool"] = new_pool
    final_data["meta"]["totalEntries"] = total
    final_data["meta"]["entriesWithMatn"] = with_matn
    final_data["meta"]["entriesWithSharh"] = with_sharh
    final_data["meta"]["introSharh"] = intro_with
    final_data["meta"]["bookSharh"] = book_with
    final_data["meta"]["uniqueSharhTexts"] = len(new_pool)
    final_data["meta"]["generatedAt"] = datetime.now(timezone.utc).isoformat()
    final_data["meta"]["rebuildMethod"] = "intro_fix_book_search"
    
    print("\n" + "=" * 70)
    print("FINAL RESULTS:")
    print(f"  Total entries: {total}")
    print(f"  With matn: {with_matn}")
    print(f"  With sharh: {with_sharh}")
    print(f"  Introduction: {intro_with}/679 with sharh")
    print(f"  Books: {book_with}/1217 with sharh")
    print(f"  Sharh pool: {len(new_pool)} unique texts")
    print(f"  Coverage: {with_sharh}/{total} ({100*with_sharh/total:.1f}%)")
    print("=" * 70)
    
    print(f"\nSaving to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)
    print("Done!")


if __name__ == "__main__":
    main()
