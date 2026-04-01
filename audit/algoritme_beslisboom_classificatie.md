# Algoritme ↔ Beslisboom Classificatie

Deze tweede auditlaag deelt de baseline-issues op in werkcategorieën.

Samenvatting:
- parser_error: 122
- route_label: 95
- likely_valid_type: 7

Voorbeelden parser_error:
- `..9` `suspicious_ja_label` -> `een-kern--werktuig`
- `..9a` `suspicious_ja_label` -> `een-brokvorstsplijting--getest`
- `..10` `question_text_mismatch`
- `..12` `question_text_mismatch`
- `..13` `suspicious_ja_label` -> `een-kern--gelegenhei-ds`
- `..27` `suspicious_ja_label` -> `een-kern--kielvormig`
- `..27` `suspicious_nee_label` -> `een-kern--kling`
- `..28a` `suspicious_nee_label` -> `een-kern--lamelle`
- `..35` `question_text_mismatch`
- `..45a` `suspicious_nee_label` -> `een-afslag--decorticatie`
- `..107` `suspicious_ja_label` -> `een-chopper--rondom--bekapt`
- `..128` `suspicious_nee_label` -> `meer-een-beitel-vorm--breedte29-cm`
- `..132` `suspicious_ja_label` -> `een-proto--vuistbijl`
- `..132b` `suspicious_ja_label` -> `een-vuistbijl--kernvormig`
- `..135a` `suspicious_nee_label` -> `een-flesvorm-vuistbijl--flesvormig`
- `..157` `suspicious_nee_label` -> `onregelmatig-dolk--kling--met-volledige--`
- `..160` `suspicious_ja_label` -> `dolk--scandinavisch--type-i`
- `..161` `suspicious_ja_label` -> `dolk--scandinavisch--type-ia`
- `..162` `suspicious_ja_label` -> `dolk--scandinavisch--type-ib`
- `..163` `suspicious_ja_label` -> `dolk--scandinavisch--type-ic`

Voorbeelden route_label:
- `..1` `suspicious_ja_label` -> `een-splinter`
- `..4` `suspicious_nee_label` -> `het-is-een-geslepen--stenen--artefact`
- `..6` `suspicious_ja_label` -> `het-artefact-heeft-resten-van-een-ventrale-zijde`
- `..6` `suspicious_nee_label` -> `het-is-bifaciaal-bewerkt-of-deels-niet-bewerkt`
- `..7` `suspicious_nee_label` -> `het-artefact-is-een-knol--brok-of-vorstsplijting`
- `..8` `suspicious_ja_label` -> `het-is-een-artefact`
- `..11` `suspicious_ja_label` -> `nee-een-klein-of-onherkenbaar-slagvlak`
- `..11` `suspicious_nee_label` -> `een-klein-of-onherkenbaar-slagvlak`
- `..12` `suspicious_ja_label` -> `nee`
- `..12a` `suspicious_ja_label` -> `nee`
- `..18` `suspicious_ja_label` -> `nee`
- `..24` `suspicious_ja_label` -> `nee-één-slagvlak`
- `..32` `suspicious_ja_label` -> `nee-zie-vorige-determinatie-`
- `..40` `suspicious_nee_label` -> `de-afslag-of-kling-is-niet-bewerkt`
- `..86` `suspicious_ja_label` -> `het-is-een-artefact`
- `..101` `suspicious_ja_label` -> `nee`
- `..102` `suspicious_ja_label` -> `nee`
- `..103` `suspicious_ja_label` -> `nee-grof-bewerkt`
- `..104` `suspicious_ja_label` -> `nee-voor-een-groot-deel-bekapt`
- `..105` `suspicious_nee_label` -> `de-kern-of-brok-is-voorzien-van-een-werkkant-punt`

Voorbeelden likely_valid_type:
- `..9` `suspicious_nee_label` -> `een-kern`
- `..45a` `suspicious_ja_label` -> `een-rugmes`
- `..197` `suspicious_ja_label` -> `een-sikkel`
- `..236` `suspicious_ja_label` -> `een-boor`
- `..320` `suspicious_ja_label` -> `een-schrabber`
- `..602` `suspicious_ja_label` -> `een-bijl`
- `..603` `suspicious_ja_label` -> `een-bijl-dissel`