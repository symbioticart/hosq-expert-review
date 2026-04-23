#!/usr/bin/env python3
"""
Render analysis-*.pdf to PNG pages (180 dpi).

These PDFs are image-only (rendered reports, no extractable text), so this script
only handles the deterministic rasterisation step. The actual JSON extraction
(finalScore, per-metric score/pros/cons) was performed once via vision and the
results are committed to data/<id>/ai-evaluation.json.

Re-running is only necessary if the PDFs change. After re-rendering, feed the
PNGs back through a vision pass to regenerate the JSON.
"""
from __future__ import annotations
import sys
from pathlib import Path

import fitz  # pymupdf

ROOT = Path(__file__).resolve().parent.parent
SRC_PDFS = ROOT.parent / "project_pdfs"
OUT = ROOT / "data" / "_ai_pages"

PROJECTS = {
    "Art_and_Science_Exhibitions_at_Schools": "art-science",
    "Bring_Your_Own_Beamer":                  "byob",
    "Cosmic_Perspective":                     "cosmic",
    "Jam_Discipline_n1":                      "jam-discipline",
    "Notations_Laboratory_and_Showcase":      "notations-lab",
}


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    for stem, pid in PROJECTS.items():
        src = SRC_PDFS / f"analysis-{stem}.pdf"
        if not src.exists():
            print(f"! missing {src}", file=sys.stderr)
            continue
        doc = fitz.open(src)
        for i in range(doc.page_count):
            pix = doc[i].get_pixmap(dpi=180)
            dst = OUT / f"{pid}-p{i+1}.png"
            pix.save(dst)
            print(f"wrote {dst} ({pix.width}×{pix.height})")
    print(f"\nAI-evaluation JSON files are already at data/<id>/ai-evaluation.json")
    print(f"They were extracted once via vision; re-run a vision pass if PDFs changed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
