# AWN Progressieplan

Doel:
de app moet inhoudelijk de AWN-logica volgen en tegelijk werkbaar blijven voor trainingen, liefhebbers en geinteresseerden.

Uitgangspunten:
- `Beginner` blijft een verkorte, begrijpelijke instapboom.
- `Gevorderd` verdiept alleen artefactgroepen waar de AWN-bron aantoonbaar een volgende laag heeft.
- `Expert` moet uiteindelijk de volledige boom met 511 vraagknooppunten gebruiken.
- `Validator` is geen leerniveau maar een aparte beoordelaarsrol.

Gekozen fasering:
1. Klingen en afslagen
2. Spitsen en schrabbers
3. Bifaciale werktuigen
4. Geslepen werktuigen
5. Doorboorde werktuigen
6. Expert volledige boom

Huidige testfase:
- Fase 1 is actief.
- Fase 2 is actief.
- Fase 3 is actief.
- Fase 4 is actief.
- Fase 5 is actief.
- Fase 6 is actief.
- Testbare beginner-uitkomsten met vervolgknop:
  - `afslag-onbewerkt`
  - `kling-onbewerkt`
  - `geretoucheerde-kling`
  - `rugmes`
  - `klingschrabber`
  - `schrabber`
  - `spits`
  - `vuistbijl`
  - `geslepen-vuurstenen-bijl`
  - `geslepen-vuurstenen-artefact`
  - `doorboord-artefact`
  - `hamerbijl`

Fase 2 focus:
- `spits` krijgt een eerste grote subtypeboom
- `schrabber` krijgt een bredere subtypeboom dan alleen vorstsplijting

Fase 3 focus:
- `vuistbijl` krijgt een eerste subtypeboom op basis van AWN 5.5.2
- de eerste tranche splitst naar:
  - kleine of zeer dunne vormen (`fäustel`, `faustkeilblatt`)
  - gedeeltelijk bifaciale vormen (`uniface`)
  - dikke vuistbijlen (`micoque`, `lancetvormig`, `ficron`, `amandelvormig`, `flesvormig`)
  - dunnere vuistbijlen (`hartvormig`, `langwerpig hartvormig`, `sub-hartvormig`, `driehoekig`, `langwerpig driehoekig`, `sub-driehoekig`, `bout-coupé`, `limande`, `ovaal`, `rond/disque`, `bootvormig`)

Handmatige test voor fase 3:
- doorloop een beginner-determinatie naar `vuistbijl`
- controleer of op het resultaatscherm `Verder op Gevorderd` verschijnt
- controleer daarna minimaal deze paden:
  - `kleiner dan 6 cm` -> `fäustel`
  - `opvallend dun` -> `faustkeilblatt`
  - `relatief dik` + `asymmetrische dikke basis` -> `micoque`
  - `relatief dun` + `hartvormig` -> `hartvormige vuistbijl`
  - `relatief dun` + `driehoekig` -> `driehoekige vuistbijl`

Fase 4 focus:
- `geslepen-vuurstenen-bijl` splitst nu naar:
  - vlakbijlen
  - ovale dwarsdoorsnede
  - rechthoekige dwarsdoorsnede
  - dissel- en holle snede-varianten
- `geslepen-vuurstenen-artefact` splitst nu naar:
  - `beitel`
  - `gutsbeitel`
  - `disselbeitel`
  - `standaardbeitel`
  - `puntbeitel`
  - `dolk`
  - `artefact gemaakt van bijlafslag`

Handmatige test voor fase 4:
- doorloop een beginner-determinatie naar `geslepen-vuurstenen-bijl`
- controleer op het resultaatscherm de vervolgknop
- test minimaal:
  - `relatief breed en dun` + `klokvormige omtrek` -> `klokvormige vuurstenen vlakbijl`
  - `ovale dwarsdoorsnede` + `smalle top` + `geslepen zijden` -> `smaltoppige vuurstenen bijl met geslepen zijden`
  - `rechthoekige dwarsdoorsnede` + `dunne top` + `scherp` -> `dunne scherpe top`
- doorloop ook een beginner-determinatie naar `geslepen-vuurstenen-artefact`
- test minimaal:
  - `smal` + `holle snede` -> `gutsbeitel`
  - `smal` + `rechte snede in midden` -> `standaardbeitel`
  - `dolkvormig` -> `dolk`

Fase 5 focus:
- `doorboord-artefact` splitst nu naar:
  - `dellensteen`
  - `doorboorde rolsteen`
  - `doorboorde schijfvormige steen`
  - doorboorde schoenleest- en breedwigvarianten
  - dubbelbijlen
- `hamerbijl` splitst nu naar:
  - gefacetteerde hamerbijl `type 1`
  - gefacetteerde hamerbijl `type 2a`
  - gefacetteerde hamerbijl `type 2b`
  - `knop-hamerbijl`
  - doorverwijzing naar dubbelbijlen waar passend

Handmatige test voor fase 5:
- doorloop een beginner-determinatie naar `doorboord-artefact`
- test minimaal:
  - `onvolledig doorboord` -> `dellensteen`
  - `zonder snede en dik` -> `doorboorde rolsteen`
  - `centrale snede en wigvorm` -> `doorboorde breedwig`
- doorloop een beginner-determinatie naar `hamerbijl`
- test minimaal:
  - `gefacetteerd` + `convexe bovenzijde / concave onderzijde` -> `gefacetteerde hamerbijl type 1`
  - `niet gefacetteerd` + `knopvormig uiteinde` -> `knop-hamerbijl`

Fase 6 focus:
- `expert` gebruikt nu een runtimeversie van de volledige AWN-bronboom uit `beslisboom.json`
- de expert-engine springt vanuit grote bronlabels door naar de juiste AWN-secties
- bronvragen met lege parsertekst zijn handmatig aangevuld waar nodig

Handmatige test voor fase 6:
- start een nieuwe determinatie op niveau `expert`
- controleer dat je niet in de verkorte beginnerboom terechtkomt maar in `Expert: volledige AWN-boom`
- test minimaal deze routes:
  - `niet natuurlijk gat` -> door naar de doorboorde sectie
  - `vuursteen` + `geslepen vlakken` -> door naar de geslepen sectie
  - `ventrale zijde` -> door naar afslag/kling-secties
  - `geen ventrale zijde` -> door naar kern/bifaciaal-secties
- controleer dat het doorlopen pad in de sessie expert-vragen met bronnummer bevat

Testafspraak:
- Elke fase wordt pas verbreed nadat de vorige fase handmatig is getest in de app.
- Nieuwe vervolgknoppen moeten alleen verschijnen voor artefactgroepen waarvan de fase actief is.
