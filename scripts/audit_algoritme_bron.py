#!/usr/bin/env python3
"""
Bronaudit voor het AWN-algoritme.

Vergelijkt de geëxtraheerde `algoritme.txt` met de huidige `beslisboom.json`
en rapporteert structurele afwijkingen:
- ontbrekende vraagteksten
- mismatch in vraagteksten
- verdachte antwoordlabels
- ontbrekende vraagnummers
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parents[1]
ALGORITME_TXT = ROOT / "algoritme.txt"
DECISION_TREE_JSON = ROOT / "app" / "src" / "data" / "beslisboom.json"
REPORT_DIR = ROOT / "audit"
REPORT_JSON = REPORT_DIR / "algoritme_beslisboom_audit.json"
REPORT_MD = REPORT_DIR / "algoritme_beslisboom_audit.md"


PAGE_SPLIT_RE = re.compile(r"={60}\nPAGINA \d+ van \d+\n={60}")
QUESTION_ID_RE = re.compile(r"\.\.(\d+[a-z]?)")


@dataclass
class TextQuestion:
    question_id: str
    question_text: str
    ja_raw: str | None
    nee_raw: str | None


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def normalize_question(value: str) -> str:
    value = normalize_whitespace(value)
    value = value.replace(" ?", "?")
    return value


def normalize_label(value: str | None) -> str | None:
    if not value:
        return None
    value = normalize_whitespace(value).lower()
    value = re.sub(r"[–—-]+", "-", value)
    value = re.sub(r"\s+", "-", value)
    value = re.sub(r"[^a-z0-9à-ÿ_-]+", "", value)
    return value or None


def extract_first_question_line(page: str) -> str:
    candidates = []
    for line in page.splitlines():
      stripped = normalize_whitespace(line)
      if "?" in stripped:
          candidates.append(stripped)

    # Kies de eerste echte vraagregel; korte labels als "Natuurlijk ..2" vallen af.
    for candidate in candidates:
        if len(candidate) > 12 and not candidate.startswith(".."):
            return normalize_question(candidate)
    return ""


def extract_answer_line(page: str, prefix: str) -> str | None:
    pattern = re.compile(rf"\b{prefix}\s+([^\n]+)")
    match = pattern.search(page)
    if not match:
        return None
    return normalize_whitespace(match.group(1))


def parse_algoritme_questions(content: str) -> dict[str, TextQuestion]:
    pages = PAGE_SPLIT_RE.split(content)
    parsed: dict[str, TextQuestion] = {}

    for page in pages:
        qid_match = QUESTION_ID_RE.search(page)
        if not qid_match:
            continue

        question_id = qid_match.group(1)
        parsed[question_id] = TextQuestion(
            question_id=question_id,
            question_text=extract_first_question_line(page),
            ja_raw=extract_answer_line(page, "Ja"),
            nee_raw=extract_answer_line(page, "Nee"),
        )

    return parsed


def is_suspicious_label(label: str | None) -> bool:
    if not label:
        return False
    return (
        label == "nee"
        or label.startswith("nee-")
        or label.startswith("het-")
        or label.startswith("de-")
        or label.startswith("een-")
        or label.startswith("gemaakt-van")
        or label.endswith("--")
        or "type-" in label
        or "breedte" in label
        or "zie-ook" in label
    )


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def iter_question_mismatches(
    text_questions: dict[str, TextQuestion],
    json_questions: dict[str, dict[str, str | None]],
) -> Iterable[dict]:
    all_ids = sorted(set(text_questions) | set(json_questions), key=question_sort_key)
    for question_id in all_ids:
        text_q = text_questions.get(question_id)
        json_q = json_questions.get(question_id)

        if text_q is None:
            yield {
                "question_id": question_id,
                "issue": "missing_in_algoritme_txt_parse",
                "json_question": json_q.get("vraag", "") if json_q else "",
            }
            continue

        if json_q is None:
            yield {
                "question_id": question_id,
                "issue": "missing_in_beslisboom_json",
                "text_question": text_q.question_text,
            }
            continue

        json_question = normalize_question(json_q.get("vraag") or "")
        if not json_question:
            yield {
                "question_id": question_id,
                "issue": "empty_question_in_json",
                "text_question": text_q.question_text,
            }
        elif text_q.question_text and text_q.question_text != json_question:
            yield {
                "question_id": question_id,
                "issue": "question_text_mismatch",
                "text_question": text_q.question_text,
                "json_question": json_question,
            }

        for branch in ("ja", "nee"):
            label = json_q.get(branch)
            if is_suspicious_label(label):
                yield {
                    "question_id": question_id,
                    "issue": f"suspicious_{branch}_label",
                    "label": label,
                    "text_answer": getattr(text_q, f"{branch}_raw"),
                }


def question_sort_key(value: str) -> tuple[int, str]:
    match = re.match(r"(\d+)([a-z]?)", value)
    if not match:
        return (10**9, value)
    return (int(match.group(1)), match.group(2))


def main() -> None:
    REPORT_DIR.mkdir(exist_ok=True)

    text_questions = parse_algoritme_questions(ALGORITME_TXT.read_text(encoding="utf-8"))
    json_questions = load_json(DECISION_TREE_JSON)

    issues = list(iter_question_mismatches(text_questions, json_questions))

    summary = {
        "algoritme_questions": len(text_questions),
        "json_questions": len(json_questions),
        "issue_count": len(issues),
        "empty_question_in_json": sum(1 for issue in issues if issue["issue"] == "empty_question_in_json"),
        "question_text_mismatch": sum(1 for issue in issues if issue["issue"] == "question_text_mismatch"),
        "suspicious_label_count": sum(1 for issue in issues if issue["issue"].startswith("suspicious_")),
        "missing_in_json": sum(1 for issue in issues if issue["issue"] == "missing_in_beslisboom_json"),
        "missing_in_txt_parse": sum(1 for issue in issues if issue["issue"] == "missing_in_algoritme_txt_parse"),
    }

    REPORT_JSON.write_text(
        json.dumps(
            {
                "summary": summary,
                "issues": issues,
                "sample_questions": {
                    key: asdict(text_questions[key])
                    for key in list(sorted(text_questions, key=question_sort_key))[:10]
                },
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    top_issues = "\n".join(
        f"- `..{issue['question_id']}` `{issue['issue']}`"
        + (f" -> `{issue.get('label')}`" if issue.get("label") else "")
        for issue in issues[:30]
    )

    REPORT_MD.write_text(
        "\n".join(
            [
                "# Algoritme ↔ Beslisboom Audit",
                "",
                "Let op: dit is een brede heuristische eerste audit. Niet elk gemarkeerd label is een fout; een deel zijn routekoppen of geldige typen die later nog geclassificeerd moeten worden.",
                "",
                "Samenvatting:",
                f"- Vragen uit `algoritme.txt`: {summary['algoritme_questions']}",
                f"- Vragen uit `beslisboom.json`: {summary['json_questions']}",
                f"- Totaal gevonden heuristische issues: {summary['issue_count']}",
                f"- Lege vragen in JSON: {summary['empty_question_in_json']}",
                f"- Vraagtekst-mismatches: {summary['question_text_mismatch']}",
                f"- Verdachte antwoordlabels: {summary['suspicious_label_count']}",
                f"- Ontbrekend in JSON: {summary['missing_in_json']}",
                f"- Ontbrekend in txt-parse: {summary['missing_in_txt_parse']}",
                "",
                "Eerste 30 issues:",
                top_issues or "- geen issues gevonden",
                "",
                f"Volledige machine-readable audit: `{REPORT_JSON.relative_to(ROOT)}`",
            ]
        ),
        encoding="utf-8",
    )

    print(f"Audit geschreven naar: {REPORT_JSON.relative_to(ROOT)}")
    print(f"Samenvatting geschreven naar: {REPORT_MD.relative_to(ROOT)}")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
