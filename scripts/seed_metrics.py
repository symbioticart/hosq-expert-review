#!/usr/bin/env python3
"""
Build data/metrics.json from cached HOSQ system.md files in scripts/cios-prompts/.

Output per metric:
{
  id, letter, weight, nameEn,
  what:                one-line vector description,
  scoringDiscipline:   paragraph about not inflating scores,
  ceilingRules:        [str] from system.md CEILING RULES block,
  vectorRubric:        {"0": "...", ..., "5": "..."}   hand-crafted per-vector 0–5 rubric,
  subindices: [
    {id, name, description,
     rubric: {"0": "...", ..., "5": "..."}}            parsed from system.md RUBRICS block
  ]
}
"""
from __future__ import annotations
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROMPTS_DIR = ROOT / "scripts" / "cios-prompts"
OUT = ROOT / "data" / "metrics.json"

WEIGHTS = {
    "cultural-vitality":    0.13,
    "creative-economy":     0.12,
    "social-inclusion":     0.08,
    "artistic-quality":     0.14,
    "heritage-environment": 0.10,
    "digitality":           0.10,
    "internationality":     0.11,
    "capacity-building":    0.11,
    "participation":        0.06,
    "resonance":            0.05,
}

METRIC_ORDER = [
    "cultural-vitality", "creative-economy", "social-inclusion",
    "artistic-quality", "heritage-environment", "digitality",
    "internationality", "capacity-building", "participation", "resonance",
]

LETTER = {mid: chr(ord("A") + i) for i, mid in enumerate(METRIC_ORDER)}

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

# Hand-crafted vector-level rubrics — one cohesive 0–5 scale per vector,
# synthesised from the 4 (or 3) subindex rubrics in the CIOS system.md files.
# Each level tells the expert what "this score" looks like across the whole vector.
VECTOR_RUBRIC = {
    "cultural-vitality": {
        "0": "The project materials do not address theme, originality, local connection or artistic research at all.",
        "1": "Only claims — theme unarticulated, novelty asserted without basis, decorative local mention, no research layer.",
        "2": "Generic theme, minor formal variation, surface-level local reference, references-only research. Mostly claims, no mechanisms.",
        "3": "Clear theme with some context linkage, some original elements, local partners or place present, research actions mentioned. Competent baseline; mechanisms weak, evidence thin.",
        "4": "Strong theme → context/audience chain, clear differentiator, real involvement mechanisms with local actors, method + sources present. Missing artefacts or full proof.",
        "5": "Full theme → context → audience chain + culturally meaningful novelty + meaningful co-authorship with partners + structured research (method, sources, steps, artefacts). Multiple independent strength-3 items.",
    },
    "creative-economy": {
        "0": "No financial logic, employment dimension, market links or funding mechanism in the materials.",
        "1": "Only 'will be sustainable' claims, no jobs, no market/distribution, pure grant dependence with no structure.",
        "2": "Basic revenue idea, vague jobs claims, generic 'market/partners' language, minor financing variations. No numbers, no mechanisms.",
        "3": "Coherent model with some numbers, named roles and channels, one described novel mechanism. Competent baseline; cost assumptions, commitments and proof are gap-y.",
        "4": "Credible economics, clear job-creation plan, concrete distribution mechanics, real innovative financing — each with at least one mechanism-level evidence item. Validation/artefacts still missing.",
        "5": "Validated economics + confirmed paid staffing + confirmed market/distribution access + proven or contracted innovative financing. Budgets, contracts, partner letters or prior traction present.",
    },
    "social-inclusion": {
        "0": "No inclusion, accessibility, community-engagement or cultural-diversity dimension in the materials.",
        "1": "Generic inclusion talk, no access provisions, audience is passive, single-language with no diversity design.",
        "2": "Target groups named but without agency; 'open to all' language; 'we will engage community' claims; diversity mentioned without implementation.",
        "3": "Clear target groups with some design choices, some accessibility measures, participatory activities listed, some multilingual or cultural elements. Proof limited, governance unclear.",
        "4": "Strong inclusion design, defined accessibility mechanisms, real co-creation structures, deliberate multilingual/multicultural design — each with mechanism-level evidence. Delivery proof thin.",
        "5": "Representation with real agency + verified accessibility across physical/economic/digital + community co-authorship with partners + delivered translation/multilingual outputs. Strength-3 artefacts.",
    },
    "artistic-quality": {
        "0": "No concept, team information, contemporary forms or critical dimension in the materials.",
        "1": "Concept unclear or absent, team unknown, only conventional forms, no critical/discursive layer.",
        "2": "Basic concept stated, team names listed without roles, digital/performance mentioned in passing, generic 'raises awareness' claims.",
        "3": "Clear concept with partial curatorial logic, bios and roles present, some contemporary forms described, clear themes with some discourse plan. Anchors and execution evidence limited.",
        "4": "Strong concept + curatorial logic, credible roles and experience, contemporary forms with production mechanisms, defined discourse triggers and public programme. Proof limited.",
        "5": "Concept excellence with realised outputs + verified team track record + prototypes/confirmed tech or venues + evidenced critical engagement (prior debate coverage, confirmed panels, commissioned texts).",
    },
    "heritage-environment": {
        "0": "No heritage layer, no site-specific logic and no environmental considerations in the materials.",
        "1": "No heritage work, generic venue (not place-based), no sustainability consideration.",
        "2": "Heritage referenced without method, place mentioned decoratively, generic 'eco-friendly' claims.",
        "3": "Heritage elements present, some site-specific logic, some environmental measures listed. Methods weak, verification absent.",
        "4": "Clear heritage mechanisms + site-specific concept with real mechanisms + defined sustainability mechanisms, each with at least one mechanism-level item. Proof and permissions thin.",
        "5": "Structured heritage engagement with artefacts and partners + strong site integration (with permissions) + verified environmental approach with measurable practices across key footprint drivers.",
    },
    "digitality": {
        "0": "The project has no digital layer at all.",
        "1": "No digital outputs, no technological novelty, no real access path, content is entirely static.",
        "2": "Generic website/social mention, novelty claimed without method, 'online access' stated vaguely, interactivity claimed without implementation.",
        "3": "Defined digital outputs, some innovative elements, some digital channels described, some interactive/data features listed. Detail partial, validation weak.",
        "4": "Clear digital deliverables + innovation mechanisms (R&D steps, experimentation) + defined access mechanics (platforms, UX, onboarding) + clear interactive/data mechanisms — each with mechanism-level evidence.",
        "5": "Evidenced digital delivery + validated innovation with prototypes/demos + verified low-friction access + working interactive/data components with meaningful user loops. Demos, analytics or documented R&D present.",
    },
    "internationality": {
        "0": "No international layer in the materials.",
        "1": "No international partners, mono-cultural, no exchange (only export/marketing), project is site-locked.",
        "2": "Generic 'international' claims, diversity asserted, 'exchange' claimed, 'scalable' asserted — all without specifics.",
        "3": "Named partners, multiple cultures present in programme, some interaction formats described, some replication thinking. Roles, depth and packaging weak.",
        "4": "Concrete partner mechanisms + clear multi-cultural design + defined exchange mechanisms (co-creation, residencies, dialogue) + modular replication design — each with mechanism-level evidence.",
        "5": "Confirmed international partners/commitments + evidenced non-tokenistic representation + deep exchange with co-production structures + evidenced transferability (pilots, toolkits, contracted hosts).",
    },
    "capacity-building": {
        "0": "No learning, skills, institutional-tie or continuation dimension in the materials.",
        "1": "No education component, no skills stated, no institutional ties, no continuation plan.",
        "2": "Vague 'learning' mention, generic 'skills' claim, generic 'collaboration' statement, 'community will remain' claim. No structure.",
        "3": "Some workshops described, specific skills named, institutions named, some continuation elements. Curricula, methods and governance are weak.",
        "4": "Structured educational mechanisms + clear skill-building with outputs + defined partnership mechanisms + defined post-project mechanisms (platform, governance, funding) — each with mechanism-level evidence.",
        "5": "Evidenced education delivery with partners + evidenced skill transfer (portfolios, certifications, partner validation) + confirmed long-term institutional agreements + evidenced sustainability infrastructure.",
    },
    "participation": {
        "0": "No participation or dialogue dimension at all.",
        "1": "Audience is passive only, no dialogue, process opaque, one-size-fits-all with exclusion risks ignored.",
        "2": "Engagement claimed, generic 'discussion' claim, vague process mention, 'inclusive' claim — all without design.",
        "3": "Some participatory formats + dialogue formats listed + some stages described + some adaptations for different audiences. Depth weak, detail incomplete.",
        "4": "Clear engagement mechanisms + dialogue/feedback mechanisms + transparency mechanisms (roadmap, decision logic) + inclusive participation design — each with mechanism-level evidence.",
        "5": "Evidenced high-engagement formats + evidenced dialogue depth (documented feedback use, published outputs) + evidenced transparency (public timeline, governance, open updates) + evidenced inclusivity (access adaptations, multi-mode).",
    },
    "resonance": {
        "0": "No resonance dimension (media, reputation, risk, continuation) in the materials.",
        "1": "No media angle, no reputational signalling, risk ignored or naive provocation, strictly one-off.",
        "2": "'We will promote' claims, vague prestige language, risk acknowledged vaguely, vague continuation ideas.",
        "3": "Some media packaging, some institutional or brand signals, risk noted with partial mitigation, some follow-up ideas. Plans weak, proof thin.",
        "4": "Clear media mechanisms + reputational mechanisms (endorsements, positioning) + explicit risk assessment with mitigation + defined continuation mechanisms — each with mechanism-level evidence.",
        "5": "Evidenced media traction or committed partners/assets + evidenced status lift via institutions/prior recognition + evidenced preparedness (protocols, moderation plans, stakeholder mapping) + evidenced continuation commitments (venues, productised outputs).",
    },
}


def parse_block(md: str, header: str, next_headers: list[str]) -> str:
    """Grab text between `header` and the next given header. Returns '' if absent."""
    lookahead = "|".join(re.escape(h) for h in next_headers)
    pattern = rf"^{re.escape(header)}\s*\n(.+?)(?=^(?:{lookahead})\s*$)"
    m = re.search(pattern, md, re.M | re.S)
    return m.group(1).strip() if m else ""


def parse_subindices(sub_block: str, letter: str) -> list[dict]:
    out = []
    for line in sub_block.splitlines():
        line = line.strip()
        if not line:
            continue
        m = re.match(rf"^({letter}\d+)\s+([^(]+?)(?:\s*\(([^)]+)\))?\s*$", line)
        if not m:
            continue
        sid, name, desc = m.group(1), m.group(2).strip(), (m.group(3) or "").strip()
        out.append({"id": sid, "name": name, "description": desc, "rubric": {}})
    return out


def parse_rubrics(rubrics_block: str, subindices: list[dict]) -> None:
    """Mutate subindices, attaching a rubric {0..5} to each based on RUBRICS text."""
    # Split rubrics into per-subindex chunks. Each chunk starts with "X#  Title".
    ids = [s["id"] for s in subindices]
    chunk_pattern = rf"^({'|'.join(re.escape(i) for i in ids)})\b.*?(?=^(?:{'|'.join(re.escape(i) for i in ids)})\b|\Z)"
    for match in re.finditer(chunk_pattern, rubrics_block, re.M | re.S):
        chunk = match.group(0)
        sid = match.group(1)
        rubric: dict[str, str] = {}
        for line in chunk.splitlines():
            m = re.match(r"^([0-5])\s+(.+)$", line.strip())
            if m:
                rubric[m.group(1)] = m.group(2).strip()
        for s in subindices:
            if s["id"] == sid:
                s["rubric"] = rubric
                break


def parse_ceiling_rules(ceiling_block: str) -> list[str]:
    rules = []
    for line in ceiling_block.splitlines():
        line = line.strip()
        if line.startswith("- "):
            rules.append(line[2:].strip())
    return rules


def parse_scoring_discipline(md: str) -> str:
    block = parse_block(
        md,
        "SCORING DISCIPLINE",
        ["SUBINDICES", "EVIDENCE LABELS", "INDEPENDENCE RULE", "CEILING RULES", "RUBRICS", "PROCESS"],
    )
    # Collapse blank-line-separated paragraphs into single paragraphs.
    paragraphs = [re.sub(r"\s+", " ", p.strip()) for p in re.split(r"\n\s*\n", block) if p.strip()]
    return "\n\n".join(paragraphs)


def build_metric(mid: str) -> dict:
    md_path = PROMPTS_DIR / f"{mid}.md"
    md = md_path.read_text(encoding="utf-8")
    letter = LETTER[mid]

    sub_block = parse_block(md, "SUBINDICES", ["EVIDENCE LABELS", "INDEPENDENCE RULE", "CEILING RULES", "RUBRICS", "PROCESS"])
    rub_block = parse_block(md, "RUBRICS", ["PROCESS", "PHASE 1 — EVIDENCE MAP", "OUTPUT JSON SCHEMA", "FINAL CHECKLIST BEFORE OUTPUT"])
    ceil_block = parse_block(md, "CEILING RULES (HARD)", ["RUBRICS", "PROCESS", "PHASE 1 — EVIDENCE MAP"])

    subs = parse_subindices(sub_block, letter)
    parse_rubrics(rub_block, subs)

    return {
        "id":                 mid,
        "letter":             letter,
        "weight":             WEIGHTS[mid],
        "nameEn":             NAME_EN[mid],
        "what":               WHAT[mid],
        "scoringDiscipline":  parse_scoring_discipline(md),
        "ceilingRules":       parse_ceiling_rules(ceil_block),
        "vectorRubric":       VECTOR_RUBRIC[mid],
        "subindices":         subs,
    }


def main() -> int:
    metrics = []
    for mid in METRIC_ORDER:
        m = build_metric(mid)
        subs_missing_rubric = [s["id"] for s in m["subindices"] if not s["rubric"]]
        if subs_missing_rubric:
            print(f"  ! {mid}: missing rubric for {subs_missing_rubric}", file=sys.stderr)
        if not m["scoringDiscipline"]:
            print(f"  ! {mid}: missing scoring discipline", file=sys.stderr)
        if not m["ceilingRules"]:
            print(f"  ! {mid}: missing ceiling rules", file=sys.stderr)
        metrics.append(m)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"metrics": metrics}, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {OUT} ({len(metrics)} metrics)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
