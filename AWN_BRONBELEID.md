# AWN Bronbeleid en Implementatieplan

Doel:
de app moet zich inhoudelijk gedragen volgens de AWN-bronnen, niet volgens vrije AI-interpretatie.

Bronhiërarchie:
1. `7-Algoritme-versie-1.0-GSMversie.pdf`
   Bepaalt de vraagstructuur, antwoordlabels, sprongen en eindpunten.
2. `5-Handleiding-versie-1.0-digitale-versie.pdf`
   Bepaalt definities, toelichtingen, terminologie, subtype-uitleg en beeldcontrole.
3. App-logica
   Mag alleen afwijken als bronextractie aantoonbaar kapot is. Elke afwijking moet traceerbaar en herstelbaar zijn.

Werkregels:
- Geen eigen interpretatie van steentijdjargon in hints zonder bronverankering.
- Geen AI-hint of AI-beeldtoets zonder expliciete koppeling aan vraag, vraagpad en bronterminologie.
- Geen referentiebeeld tonen zonder handmatige inhoudelijke controle op type, vorm en onderscheidend kenmerk.
- Het doorlopen vraagpad moet altijd zichtbaar en controleerbaar zijn.

Productbeslissingen:
- `algoritme` is leidend voor de beslisboom.
- `handleiding` is leidend voor uitleg, terminologie en beeldmateriaal.
- Hints moeten uiteindelijk onbeperkt en gelaagd zijn.
- AI-validatie wordt productmatig behandeld als `AI-beeldtoets`, niet als absolute validatie.
- Resultaten moeten altijd het volledige doorlopen pad tonen.

Fasering:
1. Bronvalidatie `algoritme -> beslisboom.json`
   Controleer vraagtekst, ja/nee-labels, sprongen en eindresultaten.
2. Bronvalidatie `handleiding -> terminologie`
   Koppel definities en toelichtingen aan vragen en types.
3. Zichtbaar vraagpad
   Toon op het resultaatscherm alle doorlopen vragen, antwoorden en vraagnummers.
4. Hints bronvast maken
   Vervang vrije AI-hints door bronhints per vraag, met meerdere detaillagen.
5. AI-beeldtoets bronvast maken
   Geef de AI het gekozen type, het vraagpad en de relevante bronkenmerken mee.
6. Beeldmateriaal herbeoordelen
   Alleen gevalideerde referentiebeelden tonen.

Eerste uitvoer:
- `ResultView` toont het doorlopen vraagpad.
- Hints zijn niet langer beperkt tot drie.
- AI-validatie wordt in de UI gepositioneerd als ondersteunende beeldtoets.

Testmomenten:
- Na fase 1: controle van bronboom tegen PDF
- Na fase 3: testers kunnen exact aanwijzen waar gebruiker of app faalt
- Na fase 5: AI-beeldtoets vergelijken met AWN-oordeel
- Na fase 6: herbeoordeling voorbeeldbeelden
