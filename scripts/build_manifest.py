#!/usr/bin/env python3
"""
Scan data/<id>/meta.json for every sub-directory and emit data/manifest.json
with the fixed project order expected by the UI.
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

# Fixed display order.
ORDER = ["art-science", "byob", "cosmic", "jam-discipline", "notations-lab"]


def main() -> int:
    projects = []
    for pid in ORDER:
        meta_path = DATA / pid / "meta.json"
        if not meta_path.exists():
            print(f"! missing {meta_path}", file=sys.stderr)
            continue
        meta = json.loads(meta_path.read_text())
        projects.append({
            "id":   pid,
            "slug": pid,
            "name": meta.get("name", pid),
        })

    (DATA / "manifest.json").write_text(
        json.dumps({"projects": projects}, indent=2, ensure_ascii=False) + "\n"
    )
    print(f"wrote {DATA / 'manifest.json'}  ({len(projects)} projects)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
