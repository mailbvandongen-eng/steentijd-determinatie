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
