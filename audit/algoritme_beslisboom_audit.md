# Algoritme ↔ Beslisboom Audit

Let op: dit is een brede heuristische eerste audit. Niet elk gemarkeerd label is een fout; een deel zijn routekoppen of geldige typen die later nog geclassificeerd moeten worden.

Samenvatting:
- Vragen uit `algoritme.txt`: 512
- Vragen uit `beslisboom.json`: 511
- Totaal gevonden heuristische issues: 229
- Lege vragen in JSON: 9
- Vraagtekst-mismatches: 0
- Verdachte antwoordlabels: 219
- Ontbrekend in JSON: 1
- Ontbrekend in txt-parse: 0

Eerste 30 issues:
- `..1` `suspicious_ja_label` -> `een-splinter`
- `..4` `suspicious_nee_label` -> `het-is-een-geslepen--stenen--artefact`
- `..6` `suspicious_ja_label` -> `het-artefact-heeft-resten-van-een-ventrale-zijde`
- `..6` `suspicious_nee_label` -> `het-is-bifaciaal-bewerkt-of-deels-niet-bewerkt`
- `..7` `suspicious_nee_label` -> `het-artefact-is-een-knol--brok-of-vorstsplijting`
- `..8` `empty_question_in_json`
- `..8` `suspicious_ja_label` -> `het-is-een-artefact`
- `..9` `suspicious_ja_label` -> `een-kern--werktuig`
- `..9` `suspicious_nee_label` -> `een-kern`
- `..9a` `suspicious_ja_label` -> `een-brokvorstsplijting--getest`
- `..10` `empty_question_in_json`
- `..11` `suspicious_ja_label` -> `nee-een-klein-of-onherkenbaar-slagvlak`
- `..11` `suspicious_nee_label` -> `een-klein-of-onherkenbaar-slagvlak`
- `..12` `empty_question_in_json`
- `..12` `suspicious_ja_label` -> `nee`
- `..12a` `suspicious_ja_label` -> `nee`
- `..13` `suspicious_ja_label` -> `een-kern--gelegenhei-ds`
- `..18` `suspicious_ja_label` -> `nee`
- `..24` `suspicious_ja_label` -> `nee-één-slagvlak`
- `..27` `suspicious_ja_label` -> `een-kern--kielvormig`
- `..27` `suspicious_nee_label` -> `een-kern--kling`
- `..28a` `suspicious_nee_label` -> `een-kern--lamelle`
- `..32` `suspicious_ja_label` -> `nee-zie-vorige-determinatie-`
- `..35` `empty_question_in_json`
- `..40` `suspicious_nee_label` -> `de-afslag-of-kling-is-niet-bewerkt`
- `..45a` `suspicious_ja_label` -> `een-rugmes`
- `..45a` `suspicious_nee_label` -> `een-afslag--decorticatie`
- `..86` `suspicious_ja_label` -> `het-is-een-artefact`
- `..101` `suspicious_ja_label` -> `nee`
- `..102` `suspicious_ja_label` -> `nee`

Volledige machine-readable audit: `audit/algoritme_beslisboom_audit.json`