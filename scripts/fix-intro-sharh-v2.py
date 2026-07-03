#!/usr/bin/env python3
"""
Fix introduction sharh by matching each entry's matn to the correct Shamela page.

Structure: Shamela intro has 72 marker pages with [الشَّرْحُ]. Each marker page
starts a new sharh section spanning to just before the next marker page.
Entry matn appears in the text of some page within a sharh section.
The correct sharh for that entry is the sharh from that section.
"""

import json
import re
import os
import hashlib
from datetime import datetime, timezone

SHARH_FILE = "public/data/riyad-uthaymeen-sharh.json"
FINAL_FILE = "public/data/riyad-uthaymeen-shamela-final.json"
CACHE_DIR = ".cache/shamela-all"


def html_to_text(html):
    text = html
    text = re.sub(r"<script[\s\S]*?</script>", "", text, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", "", text, flags=re.I)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"<p\b[^>]*>", "\n", text, flags=re.I)
    text = re.sub(r"</p>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"&#(\d+);", lambda m: chr(int(m.group(1))), text)
    text = re.sub(r"&#x([0-9a-f]+);", lambda m: chr(int(m.group(1), 16)), text)
    text = text.replace("&nbsp;", " ").replace("&amp;", "&").replace("&quot;", '"')
    text = re.sub(r"\r", "", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n[ \t]+", "\n", text)
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_sharh_from_text(full_text):
    """Extract sharh from sharh.json text field."""
    if not full_text:
        return "", ""
    sep = "\n\n---\n\n"
    idx = full_text.find(sep)
    if idx < 0:
        return "", full_text.strip()
    sharh_part = full_text[idx + len(sep):]
    header = "**شرح ابن عثيمين:**"
    if sharh_part.startswith(header):
        sharh_part = sharh_part[len(header):]
    return full_text[:idx].strip(), sharh_part.strip()


def normalize(text):
    """Normalize text for comparison."""
    if not text:
        return ""
    text = text.replace("\u200f", "").replace("\u200e", "")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def split_shamela_matn_sharh(full_text):
    """Split Shamela page text at [الشَّرْحُ] marker."""
    pos = full_text.find("الشَّرْحُ")
    if pos < 0:
        return full_text, ""
    before = full_text[:pos].strip()
    after = full_text[pos:]
    after = re.sub(r"^\[?الشَّرْحُ\]?\s*", "", after).strip()
    return before, after


def get_sharh_idx(text, pool, hash_map):
    if not text:
        return -1
    h = hashlib.md5(text.encode("utf-8")).digest()
    if h not in hash_map:
        hash_map[h] = len(pool)
        pool.append(text)
    return hash_map[h]


def main():
    print("=" * 70)
    print("FIX INTRO SHARH v2: Match matn to Shamela sharh sections")
    print("=" * 70)

    # Step 1: Load all Shamela intro pages
    print("\n1. Loading Shamela intro pages (1-679)...")
    raw_pages = {}
    pages = {}
    for pid in range(1, 680):
        fpath = os.path.join(CACHE_DIR, f"{pid}.json")
        if not os.path.exists(fpath):
            continue
        with open(fpath, "r", encoding="utf-8") as f:
            raw = json.load(f)
        raw_pages[pid] = raw
        pages[pid] = html_to_text(raw.get("nass", ""))
    print(f"   Loaded {len(pages)} pages")

    # Step 2: Identify marker pages and build sharh sections
    print("\n2. Building sharh sections from marker pages...")
    marker_pages = sorted(pid for pid, text in pages.items() if "الشَّرْحُ" in text)
    print(f"   Found {len(marker_pages)} marker pages")

    # Build sections: each section spans from one marker page to just before the next
    sections = []
    for i, start_pid in enumerate(marker_pages):
        end_pid = marker_pages[i + 1] - 1 if i + 1 < len(marker_pages) else 679

        # Extract sharh from the marker page
        page_text = pages.get(start_pid, "")
        _, sharh_after = split_shamela_matn_sharh(page_text)

        if not sharh_after:
            continue

        # Follow pages to collect full sharh
        full_sharh = sharh_after
        cur = start_pid
        last_pid = start_pid
        while cur < end_pid:
            # Get nextId from raw JSON
            fpath = os.path.join(CACHE_DIR, f"{cur}.json")
            if not os.path.exists(fpath):
                break
            with open(fpath, "r", encoding="utf-8") as f:
                raw = json.load(f)
            next_id = int(raw["nextId"]) if raw.get("nextId") else None
            if not next_id or next_id > end_pid:
                break
            np = pages.get(next_id)
            if not np:
                break
            if "الشَّرْحُ" in np:
                break
            full_sharh += "\n\n" + np
            cur = next_id
            last_pid = cur

        # Collect ALL text in this section (before markers) for matching
        all_section_text = ""
        for p in range(start_pid, last_pid + 1):
            all_section_text += " " + pages.get(p, "")

        sections.append({
            "start_pid": start_pid,
            "end_pid": last_pid,
            "sharh": full_sharh,
            "all_text": all_section_text,
        })

    print(f"   Built {len(sections)} sections")
    for s in sections[:5]:
        print(f"     Pages {s['start_pid']}-{s['end_pid']}: sharh {len(s['sharh'])} chars")

    # Step 3: Load sharh.json intro entries
    print("\n3. Loading sharh.json intro entries...")
    with open(SHARH_FILE, "r", encoding="utf-8") as f:
        sharh_data = json.load(f)
    intro_entries = {}
    for key, entry in sharh_data["entries"].items():
        if ":introduction:" not in key:
            continue
        text = entry.get("text", "")
        matn, sharh = extract_sharh_from_text(text)
        if matn:
            intro_entries[key] = {"matn": matn, "sharh": sharh, "key": key}
    print(f"   Loaded {len(intro_entries)} intro entries")

    # Step 4: For each entry, find the Shamela page containing its matn,
    # then find the sharh section that page belongs to
    print("\n4. Matching entries to sharh sections...")
    matched = 0
    unmatched = 0
    match_results = {}

    for key, entry_data in intro_entries.items():
        entry_num = int(key.split(":")[-1])
        matn = entry_data["matn"]
        norm_matn = normalize(matn)

        # Extract distinctive words from the matn (skip common words)
        # Use the first 30-50 meaningful words
        words = norm_matn.split()
        # Find the start of actual content (skip numbering, chapter refs)
        start_idx = 0
        for i, w in enumerate(words[:10]):
            if len(w) > 3:
                start_idx = i
                break

        search_words = words[start_idx:start_idx + 40]
        if len(search_words) < 3:
            search_words = words[:30]

        best_section = None
        best_score = 0

        for section in sections:
            section_text = normalize(section["all_text"])
            if not section_text:
                continue

            # Count how many search words appear in the section text
            match_count = sum(1 for w in search_words if len(w) > 2 and w in section_text)
            score = match_count / len(search_words) if search_words else 0

            if score > best_score:
                best_score = score
                best_section = section

        if best_section and best_score >= 0.3:
            match_results[key] = {
                "sharh": best_section["sharh"],
                "score": best_score,
                "page": best_section["start_pid"],
            }
            matched += 1
        else:
            unmatched += 1
            match_results[key] = {"sharh": "", "score": best_score, "page": 0}

    print(f"   Matched: {matched}/{len(intro_entries)}")
    print(f"   Unmatched: {unmatched}")

    # Step 5: Show verification samples
    print("\n5. Verification samples:")
    for key in ["riyadussalihin:introduction:1", "riyadussalihin:introduction:2",
                 "riyadussalihin:introduction:60", "riyadussalihin:introduction:80"]:
        if key in match_results:
            r = match_results[key]
            entry = intro_entries.get(key, {})
            print(f"\n  {key} (page {r['page']}, score {r['score']:.2f}):")
            print(f"    Matn: {entry.get('matn', '')[:100]}")
            print(f"    OLD sharh: {entry.get('sharh', '')[:100]}")
            print(f"    NEW sharh: {r['sharh'][:100]}")

    # Step 6: Save fixed sharh.json
    print("\n6. Saving fixed sharh.json...")
    fixed_count = 0
    for key, result in match_results.items():
        if result["sharh"] and result["sharh"] != intro_entries.get(key, {}).get("sharh", ""):
            entry = sharh_data["entries"][key]
            old_matn, old_sharh = extract_sharh_from_text(entry.get("text", ""))
            if old_sharh != result["sharh"]:
                entry["text"] = f"{old_matn}\n\n---\n\n**شرح ابن عثيمين:**\n\n{result['sharh']}"
                fixed_count += 1

    print(f"   Fixed {fixed_count} entries")
    with open(SHARH_FILE, "w", encoding="utf-8") as f:
        json.dump(sharh_data, f, ensure_ascii=False, indent=2)
    print(f"   Saved to {SHARH_FILE}")

    # Step 7: Rebuild final data
    print("\n7. Rebuilding final data...")
    import subprocess
    result = subprocess.run(["python3", "scripts/rebuild-from-reviewed.py"],
                          capture_output=True, text=True)
    print(result.stdout[-500:] if result.stdout else "No output")
    if result.returncode != 0:
        print(f"ERROR: {result.stderr[-500:] if result.stderr else ''}")

    print("\n" + "=" * 70)
    print("DONE!")
    print("=" * 70)


if __name__ == "__main__":
    main()
