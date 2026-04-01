# AWN Bronaudit

Status:
eerste audit op basis van:
- `7-Algoritme-versie-1.0-GSMversie.pdf`
- `5-Handleiding-versie-1.0-digitale-versie.pdf`
- `algoritme.txt`
- `handleiding.txt`
- `app/src/data/beslisboom.json`
- `app/src/lib/decisionTree.ts`

Hoofdconclusie:
de app volgt de AWN-structuur inmiddels redelijk goed, maar nog niet exact het algoritmedocument.

Eerste geautomatiseerde audit:
- script: [`scripts/audit_algoritme_bron.py`](/mnt/c/projecten/steentijd/scripts/audit_algoritme_bron.py)
- samenvatting: [`audit/algoritme_beslisboom_audit.md`](/mnt/c/projecten/steentijd/audit/algoritme_beslisboom_audit.md)
- machine-readable: [`audit/algoritme_beslisboom_audit.json`](/mnt/c/projecten/steentijd/audit/algoritme_beslisboom_audit.json)
- classificatiescript: [`scripts/classificeer_bronissues.py`](/mnt/c/projecten/steentijd/scripts/classificeer_bronissues.py)
- classificatiesamenvatting: [`audit/algoritme_beslisboom_classificatie.md`](/mnt/c/projecten/steentijd/audit/algoritme_beslisboom_classificatie.md)
- classificatiedata: [`audit/algoritme_beslisboom_classificatie.json`](/mnt/c/projecten/steentijd/audit/algoritme_beslisboom_classificatie.json)

Uitkomst huidige audit:
- 512 vragen uit `algoritme.txt`
- 511 vragen uit `beslisboom.json`
- 229 heuristisch gemarkeerde issues
- 9 lege vragen in JSON
- 219 verdachte antwoordlabels
- 1 vraag ontbreekt in `beslisboom.json`

Belangrijke nuance:
de eerste audit is expres breed. Niet elk gemarkeerd label is een fout; een deel zijn routekoppen, parserlabels of geldige typen die later nog geclassificeerd moeten worden.

Na eerste bronopschoning:
- 512 vragen uit `algoritme.txt`
- 512 vragen uit `beslisboom.json`
- 224 heuristisch gemarkeerde issues
- 0 lege vragen in JSON
- 5 vraagtekst-mismatches
- 0 ontbrekende vragen in `beslisboom.json`

Wat in deze ronde concreet is verbeterd:
- de 9 lege vraagteksten zijn bronvast aangevuld uit `algoritme.txt`
- vraag `801` is toegevoegd als expliciet bronplaceholder

Tweede auditlaag:
- `parser_error`: 127
- `route_label`: 95
- `likely_valid_type`: 7

Belangrijke nuance bij de tweede auditlaag:
- de classificatie is bewust conservatief
- twijfelgevallen vallen voorlopig eerder in `parser_error` dan in `likely_valid_type`
- de eerstvolgende opschoningsronde moet dus starten bij:
  - lege vragen in JSON
  - ontbrekende knooppunten
  - routekoppen met `nee-`, `het-`, `de-`
  - beschadigde labels met afbrekingen zoals `ste-il`, `z-ijde`, `doorsned-e`

Belangrijkste oorzaken:
1. `beslisboom.json` is afgeleid uit een ruwe parser op `algoritme.txt`.
2. De app heeft daarom een herstel- en spronglaag nodig in `decisionTree.ts`.
3. De `handleiding` wordt nog niet systematisch als bronlaag gebruikt voor hints, definities en beeldcontrole.

Vastgestelde structurele afwijkingen:
- Sommige vragen zijn leeg of beschadigd uit de parser gekomen.
- Sommige antwoordlabels zijn eigenlijk sprongen of tussenkoppen, geen eindtypes.
- Sommige labels zijn technisch of parserachtig en moesten in de app handmatig leesbaar worden gemaakt.
- De expertboom gebruikt daarom extra overrides en jumps om zich bruikbaar te gedragen.

Voorbeelden van bekende kwetsbare bronpunten:
- vraag `8`
- vraag `12`
- vraag `132`
- vraag `230`
- vraag `601`
- vraag `622`

Betekenis voor de app:
- `Beginner` en `Gevorderd` zijn productmatig bruikbaar.
- `Expert` is inhoudelijk sterk verbeterd, maar nog deels een gerepareerde interpretatie van een onzuivere bronextractie.
- De volgende kwaliteitsstap moet dus in de bronlaag gebeuren, niet alleen in de UI.

Benodigde vervolgaudit:
1. vraag-voor-vraag vergelijking `algoritme.txt -> beslisboom.json`
2. markering per verschil:
   - parserfout
   - label dat sprong is
   - label dat eindtype is
   - vraagtekst beschadigd
3. koppeling `handleiding -> vraag/toelichting/type`
4. lijst met toegestane referentiebeelden per type

Doel van de volgende auditfase:
een bronvaste datastructuur maken die niet meer primair leunt op herstelwerk in de app.
