#!/usr/bin/env python3
"""
Generate brand-kit/files/manifest.json from the local Brand Kit folder.
Run from repo root or brand-kit/ directory:
  python3 brand-kit/generate-manifest.py
"""
import os, json

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.join(SCRIPT_DIR, "files", "BAINULTRA-ONLINE-HUB", "Brand Kit")
OUTPUT = os.path.join(SCRIPT_DIR, "files", "manifest.json")

SKIP_NAMES = {".DS_Store", ".gitkeep", "manifest.json"}
SKIP_EXTS = {".url"}


def build_tree(abs_path, rel_path=""):
    entries = []
    try:
        items = sorted(os.listdir(abs_path), key=lambda s: s.lower())
    except PermissionError:
        return entries

    for name in items:
        if name in SKIP_NAMES or name.startswith("."):
            continue
        _, ext = os.path.splitext(name)
        if ext.lower() in SKIP_EXTS:
            continue

        child_abs = os.path.join(abs_path, name)
        child_rel = (rel_path + "/" + name) if rel_path else name

        if os.path.isdir(child_abs):
            entries.append({
                "name": name,
                "path": child_rel,
                "type": "folder",
                "children": build_tree(child_abs, child_rel),
            })
        else:
            entries.append({
                "name": name,
                "path": child_rel,
                "type": "file",
                "ext": ext.lower().lstrip("."),
            })

    return entries


tree = {
    "name": "Brand Kit",
    "path": "",
    "type": "folder",
    "children": build_tree(BASE_DIR),
}

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(tree, f, ensure_ascii=False, separators=(",", ":"))

file_count = sum(1 for _ in open(OUTPUT, encoding="utf-8") if False) or 0
print(f"Wrote {OUTPUT}")
print(f"Top-level folders: {[c['name'] for c in tree['children'] if c['type'] == 'folder']}")
