# Algoritme ↔ Beslisboom Audit

Let op: dit is een brede heuristische eerste audit. Niet elk gemarkeerd label is een fout; een deel zijn routekoppen of geldige typen die later nog geclassificeerd moeten worden.

Samenvatting:
- Vragen uit `algoritme.txt`: 512
- Vragen uit `beslisboom.json`: 512
- Totaal gevonden heuristische issues: 525
- Lege vragen in JSON: 0
- Vraagtekst-mismatches: 306
- Verdachte antwoordlabels: 219
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
- `..9` `suspicious_ja_label` -> `een-kern--werktuig`
- `..9` `suspicious_nee_label` -> `een-kern`
- `..9a` `suspicious_ja_label` -> `een-brokvorstsplijting--getest`
- `..10` `question_text_mismatch`
- `..11` `suspicious_ja_label` -> `nee-een-klein-of-onherkenbaar-slagvlak`
- `..11` `suspicious_nee_label` -> `een-klein-of-onherkenbaar-slagvlak`
- `..12` `question_text_mismatch`
- `..12` `suspicious_ja_label` -> `nee`
- `..12a` `question_text_mismatch`
- `..12a` `suspicious_ja_label` -> `nee`
- `..13` `suspicious_ja_label` -> `een-kern--gelegenhei-ds`
- `..14` `question_text_mismatch`
- `..15` `question_text_mismatch`
- `..18` `question_text_mismatch`
- `..18` `suspicious_ja_label` -> `nee`
- `..19` `question_text_mismatch`
- `..21` `question_text_mismatch`
- `..24` `suspicious_ja_label` -> `nee-één-slagvlak`
- `..25` `question_text_mismatch`
- `..26` `question_text_mismatch`
- `..27` `suspicious_ja_label` -> `een-kern--kielvormig`
- `..27` `suspicious_nee_label` -> `een-kern--kling`
- `..28` `question_text_mismatch`

Volledige machine-readable audit: `audit/algoritme_beslisboom_audit.json`