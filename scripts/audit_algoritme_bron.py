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
VALID_TYPE_PREFIXES = (
    "type-",
    "dolk--scandinavisch--type-",
    "dolk-scandinavisch--type-",
    "dolk--oost-europees--type-",
    "breed-lemmet-dolk--oost-europees--type-",
    "smal-lemmet-dolk--oost-europees--type-",
    "sikkel--type-",
    "bijl-smaltoppig--",
    "bijl-met-rechthoekige--",
    "bijl-met-ronde--",
    "bijl-met-ovale--",
    "bijl-dubbel--type-",
    "bijl-hamer--type-",
    "bijl-hamer--gefacetteerd--type-",
    "met-lichte-verdikking-bijl-hamer--type-",
    "met-rand-bijl-hamer--type-",
    "zonder-rand-bijl-hamer--type-",
    "een-afgeronde-verdikking-bijl-hamer--type-",
)
ACCEPTABLE_INTERNAL_LABELS = {
    "het-is-een-geslepen--stenen--artefact",
    "het-artefact-heeft-resten-van-een-ventrale-zijde",
    "het-is-bifaciaal-bewerkt-of-deels-niet-bewerkt",
    "het-artefact-is-een-knol--brok-of-vorstsplijting",
    "meer-een-beitel-vorm--breedte29-cm",
    "het-is-een-vuistbijl-of-bladvorm",
    "het-artefact-heeft-een-blad-vorm",
    "het-artefact-heeft-de-vorm-van-een-vuistbijl",
    "nee-meerdere--boor--dubbel-of-boor--meervoudig",
    "zie-ook",
    "de-spits-heeft-ste-il-geretoucheerde-zijden-en-evt-basis",
    "nee-de-spits-heeft-ste-il-geretoucheerde-zijden-en-evt-basis",
    "de-vorm-van-een-spits",
    "het-artefact-is-een-artefact--geslepen",
    "nee-het-artefact-is-een-artefact--geslepen",
    "de-bijl-is-relatief-dik",
    "breedte--29-cm",
    "de-krukowski--kerfrest-is-aan-één-zijde-steil-geretoucheerd-",
    "de-vuurkets-is-aan-één-zijde-is-afgerond-of-de-vuurkets",
    "een-zijde-deels-en-basis",
    "een-vierzijdige-dwarsdoorsnede",
    "een-licht-convexe-tot-vlakke-bovenzijde-vlakke",
    "nee-een-licht-convexe-tot-vlakke-bovenzijde-vlakke",
    "een-ronde-dwarsdoorsnede-van-de-nek",
}


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
    replacements = {
        " i.p.v. ": " in plaats van ",
        "retouche/bekapping": "retouche of bekapping",
        "retouche of bekapping": "retouche/bekapping",
        " /": "/",
        "/ ": "/",
        " X ": " x ",
        " de de ": " de ",
        " is is ": " is ",
        " heeft heeft ": " heeft ",
        "Is de vuistbijl is ": "Is de vuistbijl ",
        "Heeft de vuistbijl heeft ": "Heeft de vuistbijl ",
        "Heeft h et ": "Heeft het ",
        "Heeft de n ": "Heeft de ",
        "ovaa l": "ovaal",
        "zijde n": "zijden",
        "afknot ting": "afknotting",
        "dikke re": "dikkere",
        "decorticatie afslag": "decorticatieafslag",
        "(half -)": "(half-)",
        "schrabber -achtige": "schrabber-achtige",
        "kling/lamelle": "kling of lamelle",
        "la melle": "lamelle",
        "m in ": "min ",
        "s teelspits": "steelspits",
        "l angwerpige": "langwerpige",
        "d.m.v.": "door middel van",
        "kerf/steel": "kerf of steel",
        "oppervlakte retouche": "oppervlakteretouche",
        "afslag/kling": "afslag of kling",
        "g eometrische": "geometrische",
        "driehoe k": "driehoek",
        "tranchet -snede": "tranchet-snede",
        "vuistbijlen": "vuistbijl",
        "ogiefvormig vorm": "ogiefvormige vorm",
        "vorm ,": "vorm,",
        "bladvormig ,": "bladvormig,",
        "punt?": "punt?",
        "punt?": "punt?",
        "dunner ,": "dunner,",
        "rug?": "rug?",
        "(half-) steil": "(half-)steil",
        "(half-)steile": "(half-)steil",
        "zijden ,": "zijden,",
        "vuursteenelement ,": "vuursteenelement,",
        " (deels) geretoucheerde": " deels geretoucheerde",
        " d.m.v. ": " door middel van ",
        "segment )": "segment)",
        "het artefact is bladvormig": "het artefact bladvormig",
        "is vaak dunner": "is het vaak dunner",
        "maar is niet geslepen": "maar is het niet geslepen",
        "dwarsdoorsnede maar is niet geslepen": "dwarsdoorsnede maar is het niet geslepen",
        "Heeft de vuistbijl een afgeronde punt": "Heeft de vuistbijl een (afgeronde) punt",
        "Heeft de vuistbijl een korte snede": "Heeft de vuistbijl met een (korte) snede",
        "relatief dun, breedte > 2,35 x dikte": "relatief dun breedte > 2,35 x dikte",
        "vorm ovaal, lengte < 1,5 x breedte": "vorm ovaal lengte < 1,5 x breedte",
        "fijnere bewerking aan één lange zijde": "fijnere bewerking aan ‘één lange zijde",
        "deels geretoucheerde en door middel van een kerf": "deels geretoucheerde en d.m.v. een kerf",
        "het spitse deel": "het spits deel",
        "polymorfe kerf of steel": "polymorfe kerf/steel",
        "gemaakt van een kling een relatief": "gemaakt van een kling, een relatief",
    }
    for source, target in replacements.items():
        value = value.replace(source, target)
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


def extract_question_text(page: str) -> str:
    lines = [normalize_whitespace(line) for line in page.splitlines()]

    qid_index = next((i for i, line in enumerate(lines) if QUESTION_ID_RE.search(line)), None)
    if qid_index is None:
        return ""

    collected: list[str] = []
    for line in lines[qid_index + 1 :]:
        if not line:
            if collected:
                continue
            continue

        if line.startswith(("Ja", "Nee", "Terug")):
            break

        if QUESTION_ID_RE.search(line):
            break

        if line in {"Natuurlijk", "Niet-natuurlijk", "Vuursteen kwartsiet lydiet"}:
            continue

        collected.append(line)

    question = normalize_question(" ".join(collected))
    if "?" in question and len(question) > 12:
        return question
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
            question_text=extract_question_text(page),
            ja_raw=extract_answer_line(page, "Ja"),
            nee_raw=extract_answer_line(page, "Nee"),
        )

    return parsed


def is_suspicious_label(label: str | None) -> bool:
    if not label:
        return False
    if label in ACCEPTABLE_INTERNAL_LABELS:
        return False
    if label.startswith(VALID_TYPE_PREFIXES):
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
