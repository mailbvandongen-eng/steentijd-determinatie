# Algoritme ↔ Beslisboom Audit

Let op: dit is een brede heuristische eerste audit. Niet elk gemarkeerd label is een fout; een deel zijn routekoppen of geldige typen die later nog geclassificeerd moeten worden.

Samenvatting:
- Vragen uit `algoritme.txt`: 512
- Vragen uit `beslisboom.json`: 512
- Totaal gevonden heuristische issues: 428
- Lege vragen in JSON: 0
- Vraagtekst-mismatches: 251
- Verdachte antwoordlabels: 177
- Ontbrekend in JSON: 0
- Ontbrekend in txt-parse: 0

Eerste 30 issues:
- `..4` `suspicious_nee_label` -> `het-is-een-geslepen--stenen--artefact`
- `..6` `suspicious_ja_label` -> `het-artefact-heeft-resten-van-een-ventrale-zijde`
- `..6` `suspicious_nee_label` -> `het-is-bifaciaal-bewerkt-of-deels-niet-bewerkt`
- `..7` `suspicious_nee_label` -> `het-artefact-is-een-knol--brok-of-vorstsplijting`
- `..128` `question_text_mismatch`
- `..128` `suspicious_nee_label` -> `meer-een-beitel-vorm--breedte29-cm`
- `..129` `question_text_mismatch`
- `..129a` `question_text_mismatch`
- `..130` `question_text_mismatch`
- `..130` `suspicious_nee_label` -> `het-is-een-vuistbijl-of-bladvorm`
- `..131` `suspicious_ja_label` -> `het-artefact-heeft-een-blad-vorm`
- `..131` `suspicious_nee_label` -> `het-artefact-heeft-de-vorm-van-een-vuistbijl`
- `..132b` `question_text_mismatch`
- `..134` `question_text_mismatch`
- `..135` `question_text_mismatch`
- `..136` `question_text_mismatch`
- `..138` `question_text_mismatch`
- `..139` `question_text_mismatch`
- `..140` `question_text_mismatch`
- `..142` `question_text_mismatch`
- `..143` `question_text_mismatch`
- `..144` `question_text_mismatch`
- `..147` `question_text_mismatch`
- `..148` `question_text_mismatch`
- `..149` `question_text_mismatch`
- `..155` `suspicious_ja_label` -> `een-oppervlak-bewerkt`
- `..157` `suspicious_nee_label` -> `onregelmatig-dolk--kling--met-volledige--`
- `..160` `suspicious_ja_label` -> `dolk--scandinavisch--type-i`
- `..161` `suspicious_ja_label` -> `dolk--scandinavisch--type-ia`
- `..162` `suspicious_ja_label` -> `dolk--scandinavisch--type-ib`

Volledige machine-readable audit: `audit/algoritme_beslisboom_audit.json`