# Algoritme ↔ Beslisboom Audit

Let op: dit is een brede heuristische eerste audit. Niet elk gemarkeerd label is een fout; een deel zijn routekoppen of geldige typen die later nog geclassificeerd moeten worden.

Samenvatting:
- Vragen uit `algoritme.txt`: 512
- Vragen uit `beslisboom.json`: 512
- Totaal gevonden heuristische issues: 511
- Lege vragen in JSON: 0
- Vraagtekst-mismatches: 303
- Verdachte antwoordlabels: 208
- Ontbrekend in JSON: 0
- Ontbrekend in txt-parse: 0

Eerste 30 issues:
- `..1` `suspicious_ja_label` -> `een-splinter`
- `..4` `suspicious_nee_label` -> `het-is-een-geslepen--stenen--artefact`
- `..5` `question_text_mismatch`
- `..6` `suspicious_ja_label` -> `het-artefact-heeft-resten-van-een-ventrale-zijde`
- `..6` `suspicious_nee_label` -> `het-is-bifaciaal-bewerkt-of-deels-niet-bewerkt`
- `..7` `suspicious_nee_label` -> `het-artefact-is-een-knol--brok-of-vorstsplijting`
- `..8` `suspicious_ja_label` -> `het-is-een-artefact`
- `..9` `suspicious_nee_label` -> `een-kern`
- `..10` `question_text_mismatch`
- `..11` `suspicious_nee_label` -> `een-klein-of-onherkenbaar-slagvlak`
- `..12` `question_text_mismatch`
- `..12` `suspicious_ja_label` -> `nee`
- `..12a` `question_text_mismatch`
- `..12a` `suspicious_ja_label` -> `nee`
- `..14` `question_text_mismatch`
- `..15` `question_text_mismatch`
- `..18` `question_text_mismatch`
- `..18` `suspicious_ja_label` -> `nee`
- `..19` `question_text_mismatch`
- `..21` `question_text_mismatch`
- `..25` `question_text_mismatch`
- `..26` `question_text_mismatch`
- `..28` `question_text_mismatch`
- `..31` `question_text_mismatch`
- `..32` `suspicious_ja_label` -> `nee-zie-vorige-determinatie-`
- `..33` `question_text_mismatch`
- `..37` `question_text_mismatch`
- `..45a` `question_text_mismatch`
- `..45a` `suspicious_ja_label` -> `een-rugmes`
- `..45a` `suspicious_nee_label` -> `een-afslag--decorticatie`

Volledige machine-readable audit: `audit/algoritme_beslisboom_audit.json`