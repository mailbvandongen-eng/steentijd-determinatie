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
- 512 vragen uit `beslisboom.json`
- 406 heuristisch gemarkeerde issues
- 0 lege vragen in JSON
- 229 vraagtekst-mismatches
- 177 verdachte antwoordlabels
- 0 ontbrekende vragen in `beslisboom.json`

Belangrijke nuance:
de eerste audit is expres breed. Niet elk gemarkeerd label is een fout; een deel zijn routekoppen, parserlabels of geldige typen die later nog geclassificeerd moeten worden.

Wat in de eerste bronopschoningen concreet is verbeterd:
- de 9 lege vraagteksten zijn bronvast aangevuld uit `algoritme.txt`
- vraag `801` is toegevoegd als expliciet bronplaceholder
- de eerste verkorte hoofdvragen in de JSON-boom zijn weer uitgebreid naar bronformuleringen
- een tweede batch vroege kern-, afslag- en klingvragen is ook teruggebracht naar bronformuleringen
- de vroege kling-, controle- en bifaciale routes zijn verder opgeschoond naar volledige bronvragen
- ook de volgende bifaciale en dolkroutes zijn verder teruggebracht naar bronvragen
- een eerste batch vroege kern- en afslaglabels is genormaliseerd van parserachtige routevormen naar stabielere apptermen
- een volgende batch vroege antwoordlabels is verder genormaliseerd van `een-*`-vormen naar stabielere type- en categorielabels
- een nieuwe batch vroege bifaciale en dolkroutes gebruikt nu explicietere tussenstappen in plaats van parserachtige `nee-*`-koppen
- zes vroege kale `nee`-labels zijn vervangen door expliciete doorgangslabels met dezelfde vervolgvraag
- de vroege bifaciale route gebruikt nu explicietere labels rond vraag 110, 125, 126 en 154 in plaats van parserachtige `het-*`- en `nee-*`-koppen
- een eerste batch vroege dolkvraagteksten is teruggebracht naar de letterlijke formulering uit het algoritmedocument
- een volgende grotere batch dolk- en stekervraagteksten is teruggebracht naar de letterlijke formulering uit het algoritmedocument
- meerdere technische expertlabels hebben nu expliciete leesbare schermnamen

Tweede auditlaag:
- `parser_error`: 335
- `route_label`: 66
- `likely_valid_type`: 5

Belangrijke nuance bij de tweede auditlaag:
- de classificatie is bewust conservatief
- twijfelgevallen vallen voorlopig eerder in `parser_error` dan in `likely_valid_type`
- een groot deel van `parser_error` blijkt nu niet leegte maar verkorte of beschadigde vraagtekst in `beslisboom.json`
- de eerstvolgende opschoningsrondes moeten dus starten bij:
  - verkorte hoofdvragen en vroege routevragen
  - routekoppen met `nee-`, `het-`, `de-`
  - beschadigde labels met afbrekingen zoals `ste-il`, `z-ijde`, `doorsned-e`

Belangrijkste oorzaken:
1. `beslisboom.json` is afgeleid uit een ruwe parser op `algoritme.txt`.
2. De app heeft daarom een herstel- en spronglaag nodig in `decisionTree.ts`.
3. De `handleiding` wordt nog niet systematisch als bronlaag gebruikt voor hints, definities en beeldcontrole.

Vastgestelde structurele afwijkingen:
- Veel vragen zijn verkort of beschadigd uit de parser gekomen.
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
- De volgende kwaliteitsstap moet dus vooral in de bronlaag gebeuren, niet alleen in de UI.

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

Huidige prioriteit:
1. vroege hoofdvragen en routevragen in `beslisboom.json` terugbrengen naar de volledige bronformulering
2. daarna routekoppen en technische antwoordlabels verder opschonen
3. pas daarna hints, definities en beeldmateriaal systematisch aan `handleiding.txt` koppelen
