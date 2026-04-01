#!/usr/bin/env python3
"""
Tweede auditlaag voor de AWN-bronboom.

Leest `audit/algoritme_beslisboom_audit.json` en deelt issues in in:
- parser_error
- route_label
- likely_valid_type

Doel:
de brede baseline-audit omzetten naar een bruikbare werkvoorraad.
"""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INPUT_JSON = ROOT / "audit" / "algoritme_beslisboom_audit.json"
OUTPUT_JSON = ROOT / "audit" / "algoritme_beslisboom_classificatie.json"
OUTPUT_MD = ROOT / "audit" / "algoritme_beslisboom_classificatie.md"


ROUTE_PREFIXES = (
    "nee-",
    "het-",
    "de-",
    "zie-ook",
)

ROUTE_EXACT = {
    "nee",
    "het-is-een-artefact",
    "een-combinatiewerktuig",
    "een-combinatie--werktuig",
    "boor-bec-of-ruimer",
    "steile-retouche",
    "vlakke-rand---of-oppervlakte-retouche",
    "het-is-een-geslepen--stenen--artefact",
}

PARSER_PATTERNS = (
    "--",
    "breedte--29-cm",
    "gelegenhei-ds",
    "ste-il",
    "z-ijde",
    "k-ling",
    "doorsned-e",
    "een--",
)

VALID_TYPE_HINTS = (
    "kern",
    "schrabber",
    "spits",
    "vuistbijl",
    "dolk",
    "bijl",
    "hamer",
    "beitel",
    "rugmes",
    "steker",
    "boor",
    "ruimer",
    "sikkel",
    "chopper",
    "keilmesser",
    "limace",
    "vuurkets",
    "billhook",
    "lamelle",
)


def classify_issue(issue: dict) -> str:
    if issue["issue"] in {"empty_question_in_json", "missing_in_beslisboom_json", "missing_in_algoritme_txt_parse"}:
        return "parser_error"

    label = issue.get("label", "")
    if not label:
        return "parser_error"

    if label in ROUTE_EXACT or label.startswith(ROUTE_PREFIXES):
        return "route_label"

    if any(pattern in label for pattern in PARSER_PATTERNS):
        return "parser_error"

    if any(hint in label for hint in VALID_TYPE_HINTS):
        return "likely_valid_type"

    if label.startswith("een-") or label.startswith("gemaakt-van"):
        return "route_label"

    return "parser_error"


def main() -> None:
    source = json.loads(INPUT_JSON.read_text(encoding="utf-8"))
    classified_issues = []
    counts = {
        "parser_error": 0,
        "route_label": 0,
        "likely_valid_type": 0,
    }

    for issue in source["issues"]:
        category = classify_issue(issue)
        counts[category] += 1
        classified_issues.append({**issue, "category": category})

    output = {
        "summary": {
            **source["summary"],
            **counts,
        },
        "issues": classified_issues,
    }

    OUTPUT_JSON.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")

    def first_n(cat: str, n: int = 20) -> list[dict]:
        return [issue for issue in classified_issues if issue["category"] == cat][:n]

    lines = [
        "# Algoritme ↔ Beslisboom Classificatie",
        "",
        "Deze tweede auditlaag deelt de baseline-issues op in werkcategorieën.",
        "",
        "Samenvatting:",
        f"- parser_error: {counts['parser_error']}",
        f"- route_label: {counts['route_label']}",
        f"- likely_valid_type: {counts['likely_valid_type']}",
        "",
        "Voorbeelden parser_error:",
    ]
    for issue in first_n("parser_error"):
        lines.append(f"- `..{issue['question_id']}` `{issue['issue']}`" + (f" -> `{issue.get('label')}`" if issue.get("label") else ""))

    lines += ["", "Voorbeelden route_label:"]
    for issue in first_n("route_label"):
        lines.append(f"- `..{issue['question_id']}` `{issue['issue']}` -> `{issue.get('label')}`")

    lines += ["", "Voorbeelden likely_valid_type:"]
    for issue in first_n("likely_valid_type"):
        lines.append(f"- `..{issue['question_id']}` `{issue['issue']}` -> `{issue.get('label')}`")

    OUTPUT_MD.write_text("\n".join(lines), encoding="utf-8")

    print(json.dumps(output["summary"], ensure_ascii=False, indent=2))
    print(f"Classificatie geschreven naar: {OUTPUT_JSON.relative_to(ROOT)}")
    print(f"Samenvatting geschreven naar: {OUTPUT_MD.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
