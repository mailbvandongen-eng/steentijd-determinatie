# Algoritme ↔ Beslisboom Audit

Let op: dit is een brede heuristische eerste audit. Niet elk gemarkeerd label is een fout; een deel zijn routekoppen of geldige typen die later nog geclassificeerd moeten worden.

Samenvatting:
- Vragen uit `algoritme.txt`: 512
- Vragen uit `beslisboom.json`: 512
- Totaal gevonden heuristische issues: 450
- Lege vragen in JSON: 0
- Vraagtekst-mismatches: 261
- Verdachte antwoordlabels: 189
- Ontbrekend in JSON: 0
- Ontbrekend in txt-parse: 0

Eerste 30 issues:
- `..4` `suspicious_nee_label` -> `het-is-een-geslepen--stenen--artefact`
- `..6` `suspicious_ja_label` -> `het-artefact-heeft-resten-van-een-ventrale-zijde`
- `..6` `suspicious_nee_label` -> `het-is-bifaciaal-bewerkt-of-deels-niet-bewerkt`
- `..7` `suspicious_nee_label` -> `het-artefact-is-een-knol--brok-of-vorstsplijting`
- `..12` `suspicious_ja_label` -> `nee`
- `..12a` `suspicious_ja_label` -> `nee`
- `..18` `suspicious_ja_label` -> `nee`
- `..101` `suspicious_ja_label` -> `nee`
- `..102` `suspicious_ja_label` -> `nee`
- `..110` `suspicious_ja_label` -> `nee-het-bifaciale-artefact-heeft-een-andere-vorm`
- `..110` `suspicious_nee_label` -> `het-bifaciale-artefact-heeft-een-andere-vorm`
- `..111` `suspicious_ja_label` -> `nee`
- `..125` `suspicious_ja_label` -> `het-heeft-de-vorm-van-een-vuistbijl-of-bladvorm`
- `..125` `suspicious_nee_label` -> `de-vorm-van-een-bijl--beitel-of-ander-kernwerktuig`
- `..126` `suspicious_nee_label` -> `het-artefact-heeft-de-vorm-van-een-vuistbijl-of-bladvorm`
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

Volledige machine-readable audit: `audit/algoritme_beslisboom_audit.json`