#!/usr/bin/env python3
"""
Fetch 10 HOSQ metric system.md files from hosq-co/CIOS and build data/metrics.json.

Output schema per metric:
{
  id, letter, weight, nameEn, what, how,
  scale: [{score, label}, ...],         # generic 0-5 scale (same for all metrics)
  subindices: [{id, name, description}] # parsed from SUBINDICES section
}
"""
from __future__ import annotations
import json
import os
import re
import subprocess
import sys
import urllib.request
from pathlib import Path
from typing import Optional

GH_REPO = "hosq-co/CIOS"
BASE_PATH = "datalake/prompts"
METRICS_PATH = f"{BASE_PATH}/proposal/metrics"
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "metrics.json"

# maps camelCase key in config.json -> kebab-case folder name
CAMEL_TO_FOLDER = {
    "culturalVitality":    "cultural-vitality",
    "creativeEconomy":     "creative-economy",
    "socialInclusion":     "social-inclusion",
    "artisticQuality":     "artistic-quality",
    "heritageEnvironment": "heritage-environment",
    "digitality":          "digitality",
    "internationality":    "internationality",
    "capacityBuilding":    "capacity-building",
    "participation":       "participation",
    "resonance":           "resonance",
}

METRIC_ORDER = [
    "cultural-vitality", "creative-economy", "social-inclusion",
    "artistic-quality", "heritage-environment", "digitality",
    "internationality", "capacity-building", "participation", "resonance",
]

# letter prefix per metric (A..J in canonical order)
LETTER = {mid: chr(ord("A") + i) for i, mid in enumerate(METRIC_ORDER)}

# human-readable vector name (EN only; UI is English)
NAME_EN = {
    "cultural-vitality":    "Cultural Vitality",
    "creative-economy":     "Creative Economy",
    "social-inclusion":     "Social Inclusion",
    "artistic-quality":     "Artistic Quality",
    "heritage-environment": "Heritage & Environment",
    "digitality":           "Digitality",
    "internationality":     "Internationality",
    "capacity-building":    "Capacity Building",
    "participation":        "Participation",
    "resonance":            "Resonance",
}

# one-line "what" per metric (distilled from system.md intros)
WHAT = {
    "cultural-vitality":    "Thematic relevance, cultural originality, local embedding and the depth of artistic research behind the project.",
    "creative-economy":     "Economic sustainability, job creation, value-chain integration and financial innovation.",
    "social-inclusion":     "Representation of marginalised voices, accessibility, community engagement and multilingual/multicultural reach.",
    "artistic-quality":     "Curatorial and artistic concept, team competence, contemporary forms and critical potential.",
    "heritage-environment": "Engagement with intangible heritage, meaningfulness of place and environmental sensitivity.",
    "digitality":           "Digital representation, technological innovation, digital accessibility and data/interactivity loops.",
    "internationality":     "International partners, multi-cultural representation, depth of cross-cultural exchange and transferability.",
    "capacity-building":    "Educational component, skills transfer, institutional ties and ecosystem sustainability.",
    "participation":        "Engagement level, dialogue depth, process transparency and inclusivity of formats.",
    "resonance":            "Media potential, reputational value, risk awareness and post-project continuation effects.",
}

# shared generic scoring guidance — the per-subindex rubric lives in "subindices"
HOW = (
    "Give a single 0–5 score for the whole vector based on the evidence present in the project "
    "materials. Use the level definitions below. Remember: 3 is a competent baseline, 5 requires "
    "concrete artefacts and independent evidence. Do not inflate — strictness is helpful."
)

GENERIC_SCALE = [
    {"score": 0, "label": "Not addressed in the materials"},
    {"score": 1, "label": "Only claims / very weak signals"},
    {"score": 2, "label": "Generic or minor mentions"},
    {"score": 3, "label": "Competent baseline — basic criteria met"},
    {"score": 4, "label": "Strong evidence with minor gaps"},
    {"score": 5, "label": "Rigorous + multiple independent artefacts"},
]


def gh_token() -> Optional[str]:
    try:
        r = subprocess.run(["gh", "auth", "token"], check=True, capture_output=True, text=True)
        return r.stdout.strip() or None
    except Exception:
        return None


def fetch_raw(path: str) -> str:
    url = f"https://api.github.com/repos/{GH_REPO}/contents/{path}"
    req = urllib.request.Request(url, headers={"Accept": "application/vnd.github.v3.raw"})
    tok = gh_token()
    if tok:
        req.add_header("Authorization", f"token {tok}")
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8")


def parse_subindices(system_md: str, letter: str):
    # Match the SUBINDICES block up to the next ALL-CAPS heading
    m = re.search(r"^SUBINDICES\s*\n(.+?)(?=^[A-Z][A-Z _]+\s*$)", system_md, re.M | re.S)
    if not m:
        return []
    block = m.group(1).strip()
    out = []
    for line in block.splitlines():
        line = line.strip()
        if not line:
            continue
        # e.g. "A1 Thematic relevance (theme quality + linkage to context/problem/audience)"
        m2 = re.match(rf"^({letter}\d+)\s+([^(]+?)(?:\s*\(([^)]+)\))?\s*$", line)
        if not m2:
            continue
        sid, name, desc = m2.group(1), m2.group(2).strip(), (m2.group(3) or "").strip()
        out.append({"id": sid, "name": name, "description": desc})
    return out


def main() -> int:
    cfg_raw = fetch_raw(f"{BASE_PATH}/config.json")
    weights_camel = json.loads(cfg_raw)
    weights = {CAMEL_TO_FOLDER[k]: v for k, v in weights_camel.items()}

    metrics = []
    for mid in METRIC_ORDER:
        print(f"  fetching {mid} …", file=sys.stderr)
        sysmd = fetch_raw(f"{METRICS_PATH}/{mid}/system.md")
        letter = LETTER[mid]
        subs = parse_subindices(sysmd, letter)
        if not subs:
            print(f"  ! no subindices parsed for {mid}", file=sys.stderr)
        metrics.append({
            "id":          mid,
            "letter":      letter,
            "weight":      weights.get(mid, 0.0),
            "nameEn":      NAME_EN[mid],
            "what":        WHAT[mid],
            "how":         HOW,
            "scale":       GENERIC_SCALE,
            "subindices":  subs,
        })

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"metrics": metrics}, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {OUT} ({len(metrics)} metrics)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
