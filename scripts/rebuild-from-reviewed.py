#!/usr/bin/env python3
"""
Root rebuild: Extract correct per-entry sharh from riad-uthaymeen-sharh.json
and rebuild riad-uthaymeen-shamela-final.json with proper sharhPool assignments.

Strategy:
1. Parse sharh.json text fields to extract per-entry sharh (after --- separator)
2. For verified entries with high confidence: always use their sharh
3. For unverified entries: use their sharh but flag lower confidence
4. Fall back to Shamela page-chain extraction only when sharh.json has no valid sharh
5. Deduplicate into a new sharhPool and assign indexes
"""

import json
import re
import hashlib
import os
from datetime import datetime, timezone

SHARH_FILE = "public/data/riyad-uthaymeen-sharh.json"
FINAL_FILE = "public/data/riyad-uthaymeen-shamela-final.json"
OUTPUT_FILE = "public/data/riyad-uthaymeen-shamela-final.json"
CACHE_DIR = ".cache/shamela-all"

BOOKS = [
    ["1", 680, 726], ["2", 727, 777], ["3", 778, 812], ["4", 813, 843],
    ["5", 844, 893], ["6", 894, 955], ["7", 956, 990], ["8", 991, 1267],
    ["9", 1268, 1270], ["10", 1271, 1284], ["11", 1285, 1375], ["12", 1376, 1392],
    ["13", 1393, 1396], ["14", 1397, 1407], ["15", 1408, 1464], ["16", 1465, 1510],
    ["17", 1511, 1807], ["18", 1808, 1868], ["19", 1869, 1896],
]

BOOK_RANGES = {}
for bname, start, end in BOOKS:
    for n in range(start, end + 1):
        BOOK_RANGES[n] = bname


def extract_sharh_from_text(full_text):
    """Extract sharh from riad-uthaymeen-sharh.json text field.
    
    Format: {matn}\n\n---\n\n**شرح ابن عثيمين:**\n\n{sharh}
    Or for 13 entries: just sharh (no --- separator)
    """
    if not full_text:
        return ""
    
    sep = "\n\n---\n\n"
    idx = full_text.find(sep)
    if idx < 0:
        # Sharh-only entry (13 entries with no separator)
        # These start directly with sharh content
        return full_text.strip()
    
    sharh_part = full_text[idx + len(sep):]
    
    # Strip the **شرح ابن عثيمين:** header
    header = "**شرح ابن عثيمين:**"
    if sharh_part.startswith(header):
        sharh_part = sharh_part[len(header):]
    
    # Strip leading newlines and whitespace
    sharh_part = sharh_part.strip()
    
    return sharh_part


def normalize_sharh(text):
    """Normalize sharh text for deduplication."""
    if not text:
        return ""
    # Strip RTL marks
    text = text.replace("\u200f", "").replace("\u200e", "")
    # Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text


def get_sharh_idx(text, pool, hash_map):
    """Get or create index in sharh pool."""
    if not text:
        return -1
    h = hashlib.md5(text.encode("utf-8")).digest()
    if h not in hash_map:
        hash_map[h] = len(pool)
        pool.append(text)
    return hash_map[h]


def extract_matn_from_text(full_text):
    """Extract matn (hadith text before --- separator)."""
    sep = "\n\n---\n\n"
    idx = full_text.find(sep)
    if idx < 0:
        return ""
    return full_text[:idx].strip()


def load_shamela_page(pid):
    """Load a single Shamela page from cache."""
    fpath = os.path.join(CACHE_DIR, f"{pid}.json")
    if not os.path.exists(fpath):
        return None
    with open(fpath, "r", encoding="utf-8") as f:
        raw = json.load(f)
    return raw


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


def split_shamela_matn_sharh(full_text):
    """Split Shamela page text at [الشَّرْحُ] marker."""
    pos = full_text.find("الشَّرْحُ")
    if pos < 0:
        return full_text, ""
    before = full_text[:pos].strip()
    after = full_text[pos:]
    after = re.sub(r"^\[?الشَّرْحُ\]?\s*", "", after).strip()
    return before, after


def is_new_matn_start(text):
    """Check if a page starts a new matn."""
    stripped = text.lstrip()
    if re.match(r"^\[.*باب", stripped):
        return True
    if re.match(r"^[\u0660-\u0669]{1,4}\s*[-ـ]", stripped):
        return True
    return False


def build_fallback_sharh():
    """Build fallback sharh from Shamela pages for entries not covered by sharh.json."""
    print("  Loading Shamela pages for fallback...")
    pages = {}
    for pid in range(1, 3785):
        fpath = os.path.join(CACHE_DIR, f"{pid}.json")
        if os.path.exists(fpath):
            with open(fpath, "r", encoding="utf-8") as f:
                raw = json.load(f)
            pages[pid] = {
                "text": html_to_text(raw.get("nass", "")),
                "nextId": int(raw["nextId"]) if raw.get("nextId") else None,
            }
    print(f"  Loaded {len(pages)} pages")
    
    # Build intro section sharh (pages 1-679)
    intro_markers = []
    for pid in range(1, 680):
        if pages.get(pid, {}).get("text", "").find("الشَّرْحُ") >= 0:
            intro_markers.append(pid)
    
    page_to_sharh = {}
    for mi, start_pid in enumerate(intro_markers):
        end_pid = intro_markers[mi + 1] - 1 if mi + 1 < len(intro_markers) else 679
        page = pages.get(start_pid)
        if not page:
            continue
        _, sharh_part = split_shamela_matn_sharh(page["text"])
        if not sharh_part:
            continue
        
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
        
        for p in range(start_pid, last_pid + 1):
            page_to_sharh[p] = full_sharh
    
    # Build book section sharh (pages 680-3784)
    hadith_re = re.compile(r"(?:^|\n)\s*([\u0660-\u0669]{1,4})\s*[-ـ]")
    valid_numbers = set()
    for _, start, end in BOOKS:
        for n in range(start, end + 1):
            valid_numbers.add(n)
    
    book_markers = []
    for pid in range(680, 3785):
        if pages.get(pid, {}).get("text", "").find("الشَّرْحُ") >= 0:
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
    
    return page_to_sharh, hadith_to_sharh


def main():
    print("=" * 70)
    print("ROOT REBUILD: Extract sharh from riad-uthaymeen-sharh.json")
    print("=" * 70)
    
    # Step 1: Load sharh.json
    print("\n1. Loading riad-uthaymeen-sharh.json...")
    with open(SHARH_FILE, "r", encoding="utf-8") as f:
        sharh_data = json.load(f)
    sharh_entries = sharh_data["entries"]
    print(f"   Loaded {len(sharh_entries)} entries")
    
    # Step 2: Extract per-entry sharh from sharh.json
    print("\n2. Extracting per-entry sharh from text fields...")
    entry_sharh = {}  # key -> sharh text
    entry_matn = {}   # key -> matn text
    verified_count = 0
    unverified_count = 0
    no_separator_count = 0
    empty_sharh_count = 0
    
    for key, entry in sharh_entries.items():
        text = entry.get("text", "")
        sharh = extract_sharh_from_text(text)
        matn = extract_matn_from_text(text)
        
        if not sharh:
            empty_sharh_count += 1
            continue
        
        entry_sharh[key] = sharh
        if matn:
            entry_matn[key] = matn
        
        if "\n\n---\n\n" not in text:
            no_separator_count += 1
        
        if entry.get("verified", False):
            verified_count += 1
        else:
            unverified_count += 1
    
    print(f"   Extracted sharh: {len(entry_sharh)} entries")
    print(f"   Verified: {verified_count}, Unverified: {unverified_count}")
    print(f"   No separator (sharh-only): {no_separator_count}")
    print(f"   Empty sharh: {empty_sharh_count}")
    
    # Step 3: Load current final data
    print("\n3. Loading current riad-uthaymeen-shamela-final.json...")
    with open(FINAL_FILE, "r", encoding="utf-8") as f:
        final_data = json.load(f)
    entries = final_data["entries"]
    print(f"   Loaded {len(entries)} entries")
    
    # Step 4: Build fallback from Shamela pages
    print("\n4. Building fallback sharh from Shamela pages...")
    fallback_intro, fallback_book = build_fallback_sharh()
    print(f"   Intro fallback: {len(fallback_intro)} pages")
    print(f"   Book fallback: {len(fallback_book)} hadiths")
    
    # Step 5: Build new sharhPool
    print("\n5. Building new sharhPool...")
    new_pool = []
    new_hash_map = {}
    
    def get_idx(text):
        return get_sharh_idx(text, new_pool, new_hash_map)
    
    # Pre-populate with existing pool for reference
    old_pool = final_data.get("sharhPool", [])
    for text in old_pool:
        get_idx(text)
    print(f"   Old pool: {len(old_pool)}")
    
    # Step 6: Assign sharh to each entry
    print("\n6. Assigning sharh to entries...")
    stats = {
        "from_sharh_json_verified": 0,
        "from_sharh_json_unverified": 0,
        "from_fallback_intro": 0,
        "from_fallback_book": 0,
        "no_sharh": 0,
        "total": 0,
    }
    
    for key, entry in entries.items():
        stats["total"] += 1
        parts = key.split(":")
        
        # Extract matn from sharh.json if available
        if key in entry_matn:
            entry["matn"] = entry_matn[key]
        
        # Priority 1: Use sharh.json sharh (the reviewed/correct source)
        if key in entry_sharh:
            sharh_text = entry_sharh[key]
            idx = get_idx(sharh_text)
            entry["sharh"] = idx
            
            if sharh_entries.get(key, {}).get("verified", False):
                stats["from_sharh_json_verified"] += 1
            else:
                stats["from_sharh_json_unverified"] += 1
            continue
        
        # Priority 2: Use Shamela page fallback
        if "introduction" in key:
            try:
                page_num = int(parts[2])
                if page_num in fallback_intro:
                    sharh_text = fallback_intro[page_num]
                    idx = get_idx(sharh_text)
                    entry["sharh"] = idx
                    stats["from_fallback_intro"] += 1
                    continue
            except (ValueError, IndexError):
                pass
        else:
            try:
                hadith_num = int(parts[2])
                if hadith_num in fallback_book:
                    sharh_text = fallback_book[hadith_num]
                    idx = get_idx(sharh_text)
                    entry["sharh"] = idx
                    stats["from_fallback_book"] += 1
                    continue
            except (ValueError, IndexError):
                pass
        
        # No sharh available
        entry["sharh"] = -1
        stats["no_sharh"] += 1
    
    print(f"   From sharh.json (verified): {stats['from_sharh_json_verified']}")
    print(f"   From sharh.json (unverified): {stats['from_sharh_json_unverified']}")
    print(f"   From Shamela fallback (intro): {stats['from_fallback_intro']}")
    print(f"   From Shamela fallback (books): {stats['from_fallback_book']}")
    print(f"   No sharh: {stats['no_sharh']}")
    
    # Step 7: Update metadata
    print("\n7. Updating metadata...")
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
    final_data["meta"]["rebuildMethod"] = "reviewed_sharh_json_with_shamela_fallback"
    
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
    
    # Save
    print(f"\nSaving to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)
    print("Done!")


if __name__ == "__main__":
    main()
