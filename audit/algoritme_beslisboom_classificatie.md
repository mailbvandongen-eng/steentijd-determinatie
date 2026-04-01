# Algoritme ↔ Beslisboom Classificatie

Deze tweede auditlaag deelt de baseline-issues op in werkcategorieën.

Samenvatting:
- parser_error: 414
- route_label: 90
- likely_valid_type: 7

Voorbeelden parser_error:
- `..5` `question_text_mismatch`
- `..10` `question_text_mismatch`
- `..12` `question_text_mismatch`
- `..12a` `question_text_mismatch`
- `..14` `question_text_mismatch`
- `..15` `question_text_mismatch`
- `..18` `question_text_mismatch`
- `..19` `question_text_mismatch`
- `..21` `question_text_mismatch`
- `..25` `question_text_mismatch`
- `..26` `question_text_mismatch`
- `..28` `question_text_mismatch`
- `..31` `question_text_mismatch`
- `..33` `question_text_mismatch`
- `..37` `question_text_mismatch`
- `..45a` `question_text_mismatch`
- `..45a` `suspicious_nee_label` -> `een-afslag--decorticatie`
- `..46` `question_text_mismatch`
- `..48` `question_text_mismatch`
- `..50` `question_text_mismatch`

Voorbeelden route_label:
- `..1` `suspicious_ja_label` -> `een-splinter`
- `..4` `suspicious_nee_label` -> `het-is-een-geslepen--stenen--artefact`
- `..6` `suspicious_ja_label` -> `het-artefact-heeft-resten-van-een-ventrale-zijde`
- `..6` `suspicious_nee_label` -> `het-is-bifaciaal-bewerkt-of-deels-niet-bewerkt`
- `..7` `suspicious_nee_label` -> `het-artefact-is-een-knol--brok-of-vorstsplijting`
- `..8` `suspicious_ja_label` -> `het-is-een-artefact`
- `..11` `suspicious_nee_label` -> `een-klein-of-onherkenbaar-slagvlak`
- `..12` `suspicious_ja_label` -> `nee`
- `..12a` `suspicious_ja_label` -> `nee`
- `..18` `suspicious_ja_label` -> `nee`
- `..32` `suspicious_ja_label` -> `nee-zie-vorige-determinatie-`
- `..101` `suspicious_ja_label` -> `nee`
- `..102` `suspicious_ja_label` -> `nee`
- `..103` `suspicious_ja_label` -> `nee-grof-bewerkt`
- `..104` `suspicious_ja_label` -> `nee-voor-een-groot-deel-bekapt`
- `..110` `suspicious_ja_label` -> `nee-het-bifaciale-artefact-heeft-een-andere-vorm`
- `..110` `suspicious_nee_label` -> `het-bifaciale-artefact-heeft-een-andere-vorm`
- `..111` `suspicious_ja_label` -> `nee`
- `..117` `suspicious_nee_label` -> `een-asymmetrische-driehoekige-dwarsdoorsnede`
- `..124` `suspicious_ja_label` -> `de-snede-en-rug-lopen-zijn-nagenoeg-recht-keilmesser--`

Voorbeelden likely_valid_type:
- `..9` `suspicious_nee_label` -> `een-kern`
- `..45a` `suspicious_ja_label` -> `een-rugmes`
- `..197` `suspicious_ja_label` -> `een-sikkel`
- `..236` `suspicious_ja_label` -> `een-boor`
- `..320` `suspicious_ja_label` -> `een-schrabber`
- `..602` `suspicious_ja_label` -> `een-bijl`
- `..603` `suspicious_ja_label` -> `een-bijl-dissel`