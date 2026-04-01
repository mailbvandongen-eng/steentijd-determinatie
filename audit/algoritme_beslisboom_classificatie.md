# Algoritme ↔ Beslisboom Classificatie

Deze tweede auditlaag deelt de baseline-issues op in werkcategorieën.

Samenvatting:
- parser_error: 367
- route_label: 66
- likely_valid_type: 5

Voorbeelden parser_error:
- `..128` `question_text_mismatch`
- `..128` `suspicious_nee_label` -> `meer-een-beitel-vorm--breedte29-cm`
- `..129` `question_text_mismatch`
- `..129a` `question_text_mismatch`
- `..130` `question_text_mismatch`
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
- `..150` `question_text_mismatch`
- `..151` `question_text_mismatch`

Voorbeelden route_label:
- `..4` `suspicious_nee_label` -> `het-is-een-geslepen--stenen--artefact`
- `..6` `suspicious_ja_label` -> `het-artefact-heeft-resten-van-een-ventrale-zijde`
- `..6` `suspicious_nee_label` -> `het-is-bifaciaal-bewerkt-of-deels-niet-bewerkt`
- `..7` `suspicious_nee_label` -> `het-artefact-is-een-knol--brok-of-vorstsplijting`
- `..130` `suspicious_nee_label` -> `het-is-een-vuistbijl-of-bladvorm`
- `..131` `suspicious_ja_label` -> `het-artefact-heeft-een-blad-vorm`
- `..131` `suspicious_nee_label` -> `het-artefact-heeft-de-vorm-van-een-vuistbijl`
- `..155` `suspicious_ja_label` -> `een-oppervlak-bewerkt`
- `..202` `suspicious_nee_label` -> `nee-overige-groepen-afslagklingwerktuigen`
- `..203` `suspicious_ja_label` -> `een-combinatiewerktuig`
- `..208` `suspicious_nee_label` -> `de-krukowski--kerfrest-is-aan-één-zijde-steil-geretoucheerd-`
- `..230` `suspicious_nee_label` -> `nee-overige-groepen-afslagklingwerktuigen`
- `..231` `suspicious_ja_label` -> `een-combinatiewerktuig`
- `..232` `suspicious_ja_label` -> `nee-meerdere--boor--dubbel-of-boor--meervoudig`
- `..235` `suspicious_ja_label` -> `een-bec`
- `..240` `suspicious_nee_label` -> `nee-overige-groepen-afslagklingwerktuigen`
- `..241a` `suspicious_ja_label` -> `een-combinatie--werktuig`
- `..247` `suspicious_nee_label` -> `nee-overige-groepen-afslagklingwerktuigen`
- `..260` `suspicious_ja_label` -> `nee-nee-overige-groepen-afslagklingwerktuigen`
- `..260` `suspicious_nee_label` -> `nee-overige-groepen-afslagklingwerktuigen`

Voorbeelden likely_valid_type:
- `..197` `suspicious_ja_label` -> `een-sikkel`
- `..236` `suspicious_ja_label` -> `een-boor`
- `..320` `suspicious_ja_label` -> `een-schrabber`
- `..602` `suspicious_ja_label` -> `een-bijl`
- `..603` `suspicious_ja_label` -> `een-bijl-dissel`