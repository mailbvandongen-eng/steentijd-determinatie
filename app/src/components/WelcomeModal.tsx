import { useState, useEffect } from 'react';

const STORAGE_KEY = 'steentijd-hide-welcome';

// Changelog - nieuwste bovenaan
const CHANGELOG = [
  { version: '2.2.79', date: '3 apr 2026', changes: ['Als de AI een snelle instap onwaarschijnlijk vindt, zet de reviewkaart nu de volledige route duidelijk als aanbevolen keuze bovenaan', 'De verkorte route blijft nog wel mogelijk, maar voelt niet meer alsof de app een zwakke instap actief aanmoedigt', 'Daardoor is de snelle instap terughoudender en eerlijker bij twijfelachtige familiekeuzes'] },
  { version: '2.2.78', date: '3 apr 2026', changes: ['Alle beginvragen van de snelle-instapfamilies hebben nu een bronhint, ook in de geslepen en doorboorde fasebomen', 'Daardoor starten snelle instaproutes niet alleen op een geldige vraag, maar ook meteen met inhoudelijke AWN-ondersteuning', 'De quick-start dekking staat nu op 21 families, 33 geldige instapchecks en 0 resterende hintgaten op startvragen'] },
  { version: '2.2.77', date: '3 apr 2026', changes: ['Elke snelle-instapfamilie heeft nu expliciete herkenningskenmerken en veelvoorkomende verwarringen, zodat de AI-instap strenger en bronvaster kan beoordelen', 'De snelle-instapreview laat nu ook zien waar de AI op let en met welke verwante families verwarring kan ontstaan', 'Een nieuwe audit bewaakt dat elke snelle-instapfamilie naar een bestaand boominstappunt, boommodus en bronresultaat verwijst'] },
  { version: '2.2.76', date: '3 apr 2026', changes: ['De snelle instap dekt nu alle artefactfamilies af waarvoor in de app al een stabiel instappunt bestaat, van kernen en kernwerktuigen tot geslepen en doorboorde typen', 'Expertgebruikers kunnen nu ook direct starten in families zoals Levallois-kern, diskusvormige kern, geretoucheerde afslag, boor of priem en hamerbijl', 'De keuzelijst is nu gegroepeerd per categorie zodat de grotere familieset nog bruikbaar en scanbaar blijft'] },
  { version: '2.2.75', date: '3 apr 2026', changes: ['Gevorderde en expertgebruikers kunnen nu direct een artefactfamilie kiezen, zoals spits, schrabber, kern of geslepen vuurstenen bijl', 'Na het maken van een foto doet de AI eerst alleen een plausibiliteitscheck voor die gekozen instap, zonder meteen het type te bepalen', 'Daarna kun je ofwel dieper in de boom starten of alsnog de volledige route vanaf het begin lopen'] },
  { version: '2.2.74', date: '3 apr 2026', changes: ['De expert-spitsroute rond oppervlakteretouche valt nu niet meer te vroeg terug op de brede categorie bekapt', 'Vraag 540 loopt nu altijd door naar de eigen spits- en oppervlakteretoucheroute in plaats van bij nee abrupt te eindigen', 'Daardoor blijven routes naar typen met schachtdoorn en weerhaken, zoals dennenboompje en klokbekerspitsen, beter bereikbaar'] },
  { version: '2.2.73', date: '2 apr 2026', changes: ['De zichtbare testinstructie is weer verwijderd van het startscherm', 'Ook de aparte testbriefing in de infomodal is weggehaald', 'De app start daardoor weer rustiger en directer op'] },
  { version: '2.2.72', date: '2 apr 2026', changes: ['Bij het openen van de app staat nu meteen een korte testbriefing voor AWN-testers en andere proefgebruikers', 'De briefing legt uit wat je het best kunt testen en hoe je bruikbare feedback terugkoppelt', 'Daardoor hoeven testers niet eerst de infomodal te openen om goed te kunnen starten'] },
  { version: '2.2.71', date: '2 apr 2026', changes: ['Het resultaatscherm onderscheidt nu expliciet tussen specifieke type-uitkomsten, brede restcategorieën en echte twijfelgevallen', 'Generieke uitkomsten zoals doorboord artefact, geslepen stenen artefact, combinatiewerktuig en onbepaalde artefacten krijgen nu een duidelijke waarschuwingstekst', 'Daardoor wordt de uitkomst inhoudelijk eerlijker gepresenteerd en minder snel gelezen als een te hard subtype'] },
  { version: '2.2.70', date: '2 apr 2026', changes: ['De expert-engine kan nu ook de extra subtypevragen uit de geslepen en doorboorde detailbomen echt doorlopen in plaats van ze als onbekend te behandelen', 'De geslepen vuurstenen bijlroute rond brede snede, dunne top en dik- of dunbladige subtypen is nu inhoudelijk opengetrokken', 'De uitgebreide expert-regressieset stijgt daarmee naar 122 van 122 scenario’s zonder ontbrekende routes'] },
  { version: '2.2.69', date: '2 apr 2026', changes: ['De expert-regressieset controleert nu ook subtypeverwarring tussen naburige spits- en vuistbijlvarianten', 'Onder meer Tjonger, Bromme, Swidry, Font-Robert, Havelter en Zonhoven worden nu expliciet tegen elkaar afgezet, net als amandel-, hart-, driehoek- en Micoque-vuistbijlen', 'De regressieset blijft daarbij schoon op 102 van 102 scenario’s zonder verboden overgangen staan'] },
  { version: '2.2.68', date: '2 apr 2026', changes: ['De expert-regressieset bewaakt nu ook combinatiewerktuigen en gemengde subtypepaden zoals schaaf-steker, schrabber-boor en steker-boor', 'Nieuwe scenario’s voor gekerfd-en-getand, gekerfd-en-afgeknot en getand-en-afgeknot artefacten zijn toegevoegd aan de matrix', 'De aangescherpte regressieset blijft daarbij schoon op 102 van 102 scenario’s zonder verboden overgangen staan'] },
  { version: '2.2.67', date: '2 apr 2026', changes: ['De expert-regressieset controleert nu ook subfamilieverwarring binnen werktuig-, geslepen- en doorboordroutes', 'Nieuwe scenario’s voor afgeknotte, gekerfde, getande en schaafroutes zijn toegevoegd aan de matrix', 'De aangescherpte regressieset blijft daarbij schoon op 94 van 94 scenario’s zonder verboden overgangen staan'] },
  { version: '2.2.66', date: '2 apr 2026', changes: ['De expert-regressieset bewaakt nu ook verboden familie-overgangen voor werktuigen, spitsen, geslepen en doorboorde routes', 'Daarmee controleert de matrix niet alleen of een pad bestaat, maar ook of een route niet onterecht in een andere artefactfamilie belandt', 'De aangescherpte matrix blijft daarbij op 89 van 89 scenario’s zonder verboden overgangen staan'] },
  { version: '2.2.65', date: '2 apr 2026', changes: ['De expert-kernroute rond vraag 30 en 31 loopt nu niet meer door naar gemodificeerde brok- of klingvragen', 'Een nee op vraag 30 eindigt nu correct op orthogonale kern en vraag 31 eindigt nu correct op bidirectionele afslag- of klingkern', 'Daardoor springt de expertdeterminatie vanuit kernen niet meer onterecht naar afslag- en klingwerktuigen'] },
  { version: '2.2.64', date: '2 apr 2026', changes: ['De AI-beeldtoets krijgt nu een bronpakket mee uit het gekozen type en het doorlopen vraagpad in plaats van alleen een vrije resultaatbeschrijving', 'Per validatie worden nu bronomschrijving van het type, verwachte kenmerken uit de beslisstappen en expliciete validatie-instructies meegestuurd', 'Daardoor wordt de AI-beeldtoets strakker gestuurd op compatibiliteit met de AWN-bronlogica en minder op vrije interpretatie'] },
  { version: '2.2.63', date: '2 apr 2026', changes: ['Bronomschrijvingen worden nu ook getoond in geschiedenis en kaart-popups voor opgeslagen vondsten', 'Daardoor blijft de broncontext zichtbaar buiten het directe resultaatscherm', 'De lijst- en kaartweergave sluiten nu beter aan op de bronvaste uitleg van de determinatie'] },
  { version: '2.2.62', date: '2 apr 2026', changes: ['De bronomschrijvingen zijn uitgebreid naar veel concrete expert-subtypen, waaronder kernvarianten, vuistbijlen, spitsen, schrabbers, stekers, doorboorde typen en geslepen bijlen en beitels', 'Die broninformatie gaat nu ook mee in de deeltekst en PDF-export', 'Daardoor blijft de bronverankering niet beperkt tot het scherm zelf maar reist die ook mee in gedeelde en geëxporteerde resultaten'] },
  { version: '2.2.61', date: '2 apr 2026', changes: ['Het resultaatscherm toont nu ook een bronomschrijving voor veel hoofdgroepen en veelgebruikte expertsubtypen, gebaseerd op algoritme en handleiding', 'Die toelichting gebruikt het bronresultaat of een passende familieherkenning in plaats van alleen de vrije AI-beschrijving', 'Daardoor zijn eindresultaten nu niet alleen naam- maar ook inhoudelijk beter verankerd in de AWN-bronlogica'] },
  { version: '2.2.60', date: '2 apr 2026', changes: ['De laatste resterende bronhints uit de expert-regressiematrix zijn toegevoegd, inclusief zeldzame kern-, boor-, schrabber-, spits- en geslepen subtypevragen', 'De bronhintdekking voor alle vragen die in de huidige expert-testmatrix voorkomen staat daarmee nu op 100 procent', 'Hints in de expertflow zijn nu volledig afgedekt door bronhints of bestaande bronverwijzingen, zonder resterende gaten in de regressieset'] },
  { version: '2.2.59', date: '2 apr 2026', changes: ['De bronhintlaag is verder uitgebreid op resterende expert-subtypen uit de regressiematrix, waaronder vroege kernspecialisaties, kleine schrabbertypen, gesteelde spitsen en rechthoekige vuursteenbijlen en beitels', 'Daardoor zijn nu ook veel lagere frequentievragen in expert voorzien van een bronhint uit algoritme en handleiding', 'De resterende ongedekte expertvragen in de matrix zijn daarmee verder teruggebracht tot een kleine restgroep van zeldzamere subtypeknooppunten'] },
  { version: '2.2.58', date: '2 apr 2026', changes: ['De bronhintlaag is fors uitgebreid op basis van de expert-testmatrix, met dekking voor vroege instapvragen, kernsubtypen, vuistbijlen, schrabbers, stekers, geometrische spitsen en geslepen bijlen', 'Veelgebruikte expertknooppunten in de regressieset hebben nu een bronhint uit algoritme en handleiding in plaats van alleen AI-fallback', 'De hintdekking is daarmee verbreed van losse sleutelvragen naar de hoofdknopen die testers het vaakst raken'] },
  { version: '2.2.57', date: '2 apr 2026', changes: ['Een eerste bronhintlaag is toegevoegd voor sleutelvragen in beginner en expert, gebaseerd op algoritme en handleiding in plaats van vrije AI-uitleg', 'De vraagkaart in expert en het stappenoverzicht op het resultaatscherm tonen nu expliciet de bronvraag uit het algoritme', 'Hints gebruiken nu eerst een bronhint en alleen waar nog niets is vastgelegd eventueel een AI-hint als fallback'] },
  { version: '2.2.56', date: '2 apr 2026', changes: ['De expertboom heeft nu een inhoudelijke regressieset met 89 scenario’s verspreid over kernen, werktuigen, spitsen, bifacialen, geslepen artefacten en doorboorde typen', 'De expert-runtime-audit staat nu op 0 onbereikbare vragen en 0 runtimeproblemen, terwijl de uitgebreide testmatrix 89 van 89 scenario’s automatisch vindt', 'Een echte bronlacune is hersteld met vraag 137 voor driehoekige vuistbijlen, en de geslepen, doorboorde en kernroutes zijn verder inhoudelijk opengetrokken'] },
  { version: '2.2.55', date: '2 apr 2026', changes: ['Een grote volgende batch dolk- en stekervraagteksten gebruikt nu weer de letterlijke algoritmeformulering in plaats van afgebroken parserrestjes', 'De bronaudit daalt daardoor verder naar 406 issues en 229 vraagtekst-mismatches', 'Ook de parserfoutcategorie daalt mee naar 335, terwijl de routekoppen stabiel blijven op 66'] },
  { version: '2.2.54', date: '2 apr 2026', changes: ['Een eerste batch vroege vraagteksten in de dolkroute gebruikt nu weer de letterlijke formulering uit het algoritmedocument', 'De bronaudit daalt daardoor verder naar 428 issues en 251 vraagtekst-mismatches', 'Ook de parserfoutcategorie daalt mee naar 357, terwijl de routekoppen gelijk blijven op 66'] },
  { version: '2.2.53', date: '2 apr 2026', changes: ['De vroege bifaciale route rond vraag 110, 125, 126 en 154 gebruikt nu explicietere labels in plaats van parserkoppen met het- en nee-vormen', 'De ruwe bronaudit daalt daardoor verder naar 438 issues en 177 verdachte antwoordlabels', 'De classificatie zakt mee naar 66 routekoppen, waardoor de resterende bronrommel steeds meer verschuift naar latere subtypevragen'] },
  { version: '2.2.52', date: '2 apr 2026', changes: ['Zes vroege kale nee-labels in kern-, artefact- en bifaciale routes zijn vervangen door expliciete doorgangslabels met dezelfde vervolgvraag', 'De ruwe bronaudit daalt daardoor verder naar 444 issues en 183 verdachte antwoordlabels', 'De classificatie zakt mee naar 72 routekoppen, zodat de bronlaag minder vaak op een kaal nee-label leunt'] },
  { version: '2.2.51', date: '2 apr 2026', changes: ['Een nieuwe batch vroege bifaciale en dolkroutes gebruikt nu minder parserachtige nee-labels en meer expliciete tussenstappen, zonder de bestaande spronglogica te veranderen', 'De ruwe bronaudit daalt daardoor verder naar 450 issues en 189 verdachte antwoordlabels', 'De classificatie zakt mee naar 78 routekoppen, waardoor vooral de kale nee-labels in de bronlaag steeds verder worden teruggedrongen'] },
  { version: '2.2.50', date: '2 apr 2026', changes: ['Een volgende batch vroege kern-, afslag- en vuistbijllabels in de AWN-bronboom is ontdaan van parservormen als een-rugmes, een-kern en een-vuistbijl-kernvormig', 'De ruwe bronaudit daalt daardoor verder naar 456 issues en 195 verdachte antwoordlabels', 'Ook de classificatie zakt mee naar 367 parserfouten en 84 routekoppen, waardoor de resterende rommel nu steeds meer in echte routevragen zit'] },
  { version: '2.2.49', date: '2 apr 2026', changes: ['Een grote batch vroege kern-, afslag-, kling- en bifaciale vragen in de AWN-bronboom gebruikt nu weer de letterlijke formulering uit het algoritmedocument', 'Daardoor daalt de bronaudit van 303 naar 261 vraagtekst-mismatches en van 511 naar 469 totale issues', 'De grootste resterende bronafwijkingen zitten nu minder in de vroege hoofdroutes en meer in latere subtypevragen en parserlabels'] },
  { version: '2.2.48', date: '2 apr 2026', changes: ['Een eerste batch vroege kern- en afslaglabels in de AWN-bronboom is nu minder parserachtig en sluit beter aan op de termen die de app zelf toont', 'Daaronder vallen onder meer kernwerktuig, geteste brok of vorstsplijting, kern met meer dan een slagvlak, onbewerkte afslag of kling en kern of brok met werkkant of punt', 'De baseline-bronaudit daalt daardoor verder naar 511 issues en 208 verdachte antwoordlabels, met een bijgewerkte classificatie van 414 parserfouten en 90 routekoppen'] },
  { version: '2.2.47', date: '2 apr 2026', changes: ['De laatste zichtbare restlabels in Expert hebben nu leesbare namen, ook voor generieke categorieën, vroege kernlabels en opmerkingstypen', 'Daaronder vallen onder meer bijl, beitel, kern, artefact met één of twee afslagnegatieven, segmentvormige restgroepen en diverse vermeld- of twijfeluitkomsten', 'Deze ronde is bedoeld als afrondende opschoning van zichtbare expert-uitkomsten in plaats van nieuwe route- of boomlogica'] },
  { version: '2.2.46', date: '2 apr 2026', changes: ['Een nieuwe batch schaaftypen en stekervarianten toont nu nette namen in Expert, waaronder Quina, demi-Quina, beksteker en Noailles-steker', 'Ook vroege categorie-uitkomsten zoals artefact met afslagnegatieven hebben nu een leesbare schermnaam', 'Daardoor neemt het aantal ruwe eindlabels in de expertboom opnieuw verder af'] },
  { version: '2.2.45', date: '2 apr 2026', changes: ['Nog een batch echte experttypen toont nu nette namen, waaronder gemodificeerde Levallois-spitsen, pseudo-Levallois-spitsen, Dufour-lamellen en kernschrabbers', 'Ook transversaal- en trapeziumvarianten, feuille-de-gui, vuistwig op afslag en enkele afgeknotte resttypen zijn nu leesbaar', 'Daardoor wordt de expertboom opnieuw minder afhankelijk van ruwe AWN-slugs als einduitkomst'] },
  { version: '2.2.44', date: '2 apr 2026', changes: ['Vroege en tussengelegen expertcategorieën zoals bekapt, afgeknot artefact, afslag- of klingwerktuig en geslepen artefact tonen nu nette namen', 'Ook meerdere bifaciale en kernwerktuig-koppen hebben nu een leesbare schermnaam in plaats van een technische route- of parserlabel', 'Daardoor blijven in Expert minder kale categoriecodes over als einduitkomst zichtbaar'] },
  { version: '2.2.43', date: '2 apr 2026', changes: ['Meerdere half-afgebroken expertlabels voor geslepen bijlen tonen nu nette namen, vooral bij breedtoppige, smaltoppige en rechthoekige doorsneden', 'Ook varianten van dissels en hamerbijlen met verdikkingen of ronde doorsneden zijn nu benoemd', 'Daardoor eindigen opnieuw minder geslepen en doorboorde expertpaden op een technische slug'] },
  { version: '2.2.42', date: '1 apr 2026', changes: ['Nog een batch vroege kern-, dolk- en doorboord-uitkomsten toont nu nette namen in plaats van ruwe labels', 'Daaronder vallen onder meer splinter, geteste brok of vorstsplijting, bijlafslag, bladschaaf, Scandinavische dolk en doorboord werktuig', 'Ook schoenleestbijl/dissel, disselkling en afslagbijl zijn nu als leesbare expertuitkomst benoemd'] },
  { version: '2.2.41', date: '1 apr 2026', changes: ['Een volgende batch gemodificeerde afslagen, klingen en schaaftypen toont nu leesbare namen in Expert', 'Ook resttypen zoals boor op kern, klingbeitel, onvolledig doorboorde dellensteen en polsbeschermer zijn nu benoemd', 'Daardoor eindigt de expertboom opnieuw minder vaak op een ruwe slug of half parserlabel'] },
  { version: '2.2.40', date: '1 apr 2026', changes: ['Een extra batch geldige expertuitkomsten toont nu nette namen in plaats van ruwe AWN- of parserlabels', 'Daaronder vallen onder meer Tayac-, Quinson-, Soyons-, Emireh- en Mousterien-spitsen, Havelter-steelspits, Zonhoven-spits en Pseudo-Grand-Pressigny-dolk', 'Ook verschillende schrabbervarianten en restlabels zoals plaatselijk geretoucheerde artefacten zijn nu leesbaarder in de UI'] },
  { version: '2.2.39', date: '1 apr 2026', changes: ['De latere expert-subboom voor oppervlakteretouche loopt nu vraag voor vraag volgens het algoritme door, onder meer rond driehoekige, bladvormige en schachtdoorn-spitsen', 'Meerdere nee-antwoorden die eerder te vroeg eindigden of op een verkeerde subtak belandden springen nu naar de juiste vervolgvraag', 'Ontbrekende schermnamen voor Sögel-, Post-Swidry- en klokbekerspitsen en verwante uitkomsten zijn toegevoegd'] },
  { version: '2.2.38', date: '1 apr 2026', changes: ['De expertroute voor dolken splitst nu weer zoals in het algoritme tussen symmetrische en asymmetrische fijn bewerkte kernwerktuigen', 'Vraag 155 stuurt nu niet meer beide antwoorden naar dezelfde vervolgroute, maar onderscheidt eenzijdig en tweezijdig bewerkte dolken', 'Asymmetrische dolkvormen tonen nu bovendien een leesbare uitkomst in plaats van een technische bronlabel'] },
  { version: '2.2.37', date: '1 apr 2026', changes: ['De expertroute voor gekerfde spitsen loopt nu vanaf vraag 412 expliciet door naar de eenzijdige subtypeboom of eindigt leesbaar op een tweezijdig gekerfde spits', 'De segmentvormige spitsroute vanaf vraag 470 springt nu expliciet door naar de subtypevragen in plaats van op impliciete vraagvolgorde te leunen', 'Daardoor zijn nog minder spitsroutes afhankelijk van parserlabels of toevallige volgorde in de bronexport'] },
  { version: '2.2.36', date: '1 apr 2026', changes: ['De hoofdvertakkingen voor spitsen springen nu door naar de juiste deelboom in plaats van op parserlabels als "geen punt" of "segmentvorm" te stranden', 'Ook de eenzijdig en tweezijdig geretoucheerde spitsroutes lopen nu consistenter door vanaf vraag 476 tot en met de subtypevragen', 'Ruwe eindlabels zoals "spits zonder steel of kerf" en eenzijdig of tweezijdig steil geretoucheerde spitsen tonen nu leesbare uitkomsten'] },
  { version: '2.2.35', date: '1 apr 2026', changes: ['Algemene combinatiewerktuig-uitkomsten springen niet meer onterecht terug een subtypeboom in als ze al als eindresultaat bedoeld zijn', 'Een extra parservariant van combinatiewerktuig wordt nu ook als vervolgroute herkend', 'Schaaf en combinatiewerktuig tonen nu bovendien expliciete schermnamen in Expert'] },
  { version: '2.2.34', date: '1 apr 2026', changes: ['Boor- en combinatiewerktuigroutes in Expert reageren nu verschillend op ja en nee waar de parser eerder beide antwoorden op dezelfde vervolgstap liet landen', 'Ontbrekende schermnamen voor gekerfde, getande en afgeknotte afslag- en klingtypen zijn toegevoegd', 'Daardoor lopen deze werktuigroutes minder springerig en eindigen ze vaker op een herkenbaar subtype'] },
  { version: '2.2.33', date: '1 apr 2026', changes: ['Ontbrekende schermnamen voor onder meer Montbani-klingkern, gekerfd werktuig en getand werktuig zijn toegevoegd', 'Daardoor blijven deze uitkomsten stabieler als echt eindtype staan in plaats van sneller als tussenlabel te worden behandeld', 'Dit sluit vooral de kern-, kling- en werktuigroutes beter aan op de verwachte expertuitkomst'] },
  { version: '2.2.32', date: '1 apr 2026', changes: ['Nee-antwoorden op subtypevragen in de expertboom slaan nu de ja-specifieke vervolgvraag beter over als die alleen bij de ja-tak hoort', 'Daardoor springen kling-, kern- en afslagroutes minder onlogisch door naar een subtype dat alleen bij het andere antwoord past', 'Met name de expert-klingroute loopt nu consistenter door bij nee-antwoorden op Levallois- en vergelijkbare subtypevragen'] },
  { version: '2.2.31', date: '1 apr 2026', changes: ['Geldige expertuitkomsten zoals Levallois-kling vallen niet meer automatisch door naar de volgende klingvraag alleen omdat er nog een vervolgvraag bestaat', 'Daardoor wisselt de expertboom minder onlogisch tussen verschillende klingtypen binnen een pad', 'Gemodificeerde Levallois-kling toont nu ook een leesbare naam als uitkomst'] },
  { version: '2.2.30', date: '1 apr 2026', changes: ['Vervolg naar Expert start nu op een logisch instappunt in de AWN-boom in plaats van opnieuw bij het allereerste begin', 'Een gevorderde vervolgroute kan nu ook nog doorlopen naar Expert als de expertverdieping daarna nog relevant is', 'De antwoord-popup in gevorderd is verwijderd zodat antwoorden direct doorlopen zonder tussenscherm'] },
  { version: '2.2.29', date: '1 apr 2026', changes: ['Een volgende batch bifaciale en dolkroutes gebruikt nu weer volledige bronvragen uit het algoritmedocument', 'Meerdere parserachtige expertuitkomsten tonen nu leesbare schermnamen, onder meer bij combinatiewerktuigen, spitsen en bijlsubtypen', 'De bronaudit daalt daardoor verder naar 303 vraagtekst-mismatches en 420 parserfouten'] },
  { version: '2.2.28', date: '1 apr 2026', changes: ['De expertboom loopt in de bifaciale route niet meer vast op vraag 126 over snede of werkkant', 'De antwoorden op vraag 125 en 126 springen nu door naar de juiste vervolgvraag in plaats van terug naar dezelfde vraag', 'Klingkern naar Expert kan daardoor weer verder in de vuistbijl- of kernwerktuigroutes'] },
  { version: '2.2.27', date: '1 apr 2026', changes: ['De vroege klingroutes, controlevragen en eerste grof-bewerkte of bifaciale routes gebruiken nu weer volledige bronvragen', 'De bronaudit daalt daardoor verder naar 306 vraagtekst-mismatches en 423 parserfouten', 'De resterende bronopschoning verschuift nu steeds meer van hoofdroutes naar latere subroutes en technische labels'] },
  { version: '2.2.26', date: '1 apr 2026', changes: ['Een tweede batch vroege kern-, afslag- en klingvragen gebruikt nu weer volledige bronformuleringen uit het algoritmedocument', 'De bronaudit daalt daardoor verder naar 312 vraagtekst-mismatches en 429 parserfouten', 'De belangrijkste resterende bronafwijkingen zitten nu nog in latere routevragen en technische antwoordlabels'] },
  { version: '2.2.25', date: '1 apr 2026', changes: ['De eerste hoofdvragen in de AWN-bronboom zijn nu uitgebreid van verkorte prompts naar volledige bronformuleringen', 'De bronaudit meet nu scherper dat veel JSON-vragen nog verkort zijn ten opzichte van het algoritmedocument', 'Deze release markeert de eerste echte opschoningsronde van vraagteksten, niet alleen van route- en spronglogica'] },
  { version: '2.2.24', date: '1 apr 2026', changes: ['Lege vraagteksten in de AWN-bronboom zijn nu aangevuld vanuit het algoritmedocument', 'Het ontbrekende bronknooppunt 801 is toegevoegd als expliciete placeholder', 'De geautomatiseerde audit laat nu geen lege vragen of ontbrekende knooppunten meer zien'] },
  { version: '2.2.23', date: '1 apr 2026', changes: ['De baseline-audit wordt nu automatisch gesplitst in parserfouten, routekoppen en vermoedelijk geldige typen', 'De repo bevat nu een tweede auditlaag voor prioritering van bronopschoning', 'De volgende inhoudelijke opschoningsronde kan daardoor gericht op echte parserproblemen starten'] },
  { version: '2.2.22', date: '1 apr 2026', changes: ['Een eerste geautomatiseerde audit vergelijkt nu algoritme.txt met beslisboom.json', 'De repo bevat nu een auditrapport met lege vragen, ontbrekende knooppunten en verdachte labels', 'Dit vormt de basis voor de volgende bronvaste opschoningsronde van de expertboom'] },
  { version: '2.2.21', date: '1 apr 2026', changes: ['Bronbeleid voor algoritme, handleiding, hints, AI-toets en beeldmateriaal is vastgelegd', 'Resultaatscherm toont nu het doorlopen beslispad met vragen en antwoorden', 'Hints zijn niet langer beperkt tot drie en AI-validatie heet nu AI-beeldtoets'] },
  { version: '2.2.20', date: '1 apr 2026', changes: ['Laatste routelekken in vuistbijl-, boor- en oppervlakteretoucheroutes springen nu door naar de juiste expertvragen', 'Kernlabels en dolksubtypen tonen nu vaker leesbare AWN-namen', 'De expertboom eindigt daardoor minder vaak op technische tussencategorieen'] },
  { version: '2.2.19', date: '1 apr 2026', changes: ['Bifaciale routekoppen springen nu door naar hun echte expertvragen', 'Geslepen bijlen, beitels en hamerbijlen lopen minder vaak vast op technische tussencategorieen', 'Meer expertuitkomsten in deze secties tonen nu leesbare AWN-namen'] },
  { version: '2.2.18', date: '1 apr 2026', changes: ['Resterende boor- en combinatiesprongen in de afslag/kling-sectie lopen nu door', 'Technische expertlabels voor stekers en boren tonen nu leesbare namen'] },
  { version: '2.2.17', date: '1 apr 2026', changes: ['Bekapt, combinatie en afgeknot springen nu door naar hun echte expert-subboom', 'Restgroepen binnen de afslag/kling-sectie lopen contextafhankelijk door'] },
  { version: '2.2.16', date: '1 apr 2026', changes: ['Kapotte expert-sprongen voor gat, cortex en geslepen artefacten zijn gerepareerd', 'Losse parserlabels zoals \"nee\" lopen nu door naar de volgende AWN-vraag'] },
  { version: '2.2.15', date: '1 apr 2026', changes: ['Resultaatscherm legt nu uit waarom er geen vervolgkaart is', 'Bewuste eindpunten en nog niet uitgewerkte verdiepingen worden uit elkaar gehouden'] },
  { version: '2.2.14', date: '1 apr 2026', changes: ['Geretoucheerde afslagen en meerdere kernwerktuigen geven nu ook een vervolgkaart', 'Uitkomsten zonder eigen gevorderd-subboom lopen voorlopig door naar Expert'] },
  { version: '2.2.13', date: '1 apr 2026', changes: ['Kernuitkomsten zoals klingkern en afslagkern geven nu een vervolgkaart', 'Voor kerntypen gaat vervolg nu direct naar Expert', 'Vervolgknoppen tonen nu het juiste doelniveau'] },
  { version: '2.2.12', date: '1 apr 2026', changes: ['Expert unlock telt nu alleen correcte determinaties op gevorderd niveau mee', 'Docentpromotie naar expert blijft mogelijk', 'Voortgangsweergave en unlocklogica zijn gelijkgetrokken'] },
  { version: '2.2.11', date: '1 apr 2026', changes: ['Verborgen niveau- en vervolglogica opgeschoond', 'Expertfase staat nu overal als actief', 'Unlock-uitleg verduidelijkt: reguliere doorgroei vereist correcte determinaties én docentvalidaties'] },
  { version: '2.2.10', date: '1 apr 2026', changes: ['Wijzigingenbeheer aangevuld met recente AWN-versies', 'Wat is nieuw sluit nu beter aan op de live V2-uitrol'] },
  { version: '2.2.9', date: '1 apr 2026', changes: ['Beginner toont nu het echte resultaat in plaats van "Onbepaald (beginnersniveau bereikt)"', 'Kern- en andere beginneruitkomsten zijn daardoor logischer leesbaar'] },
  { version: '2.2.8', date: '1 apr 2026', changes: ['Vervolgknoppen werken nu ook na een beginner-cutoff doordat het echte onderliggende resultaat bewaard blijft'] },
  { version: '2.2.7', date: '1 apr 2026', changes: ['Uitleg & testinformatie toegevoegd voor AWN-testers, trainers en geinteresseerden'] },
  { version: '2.2.6', date: '1 apr 2026', changes: ['Expertmodus toegevoegd op basis van de volledige AWN-bronboom', 'Grotere AWN-secties zijn runtime testbaar geworden'] },
  { version: '2.2.5', date: '1 apr 2026', changes: ['Geslepen en doorboorde werktuigen kregen verdieping op gevorderd niveau'] },
  { version: '2.2.4', date: '1 apr 2026', changes: ['Vuistbijlen kregen een eerste subtypeboom op gevorderd niveau'] },
  { version: '2.2.3', date: '1 apr 2026', changes: ['Spitsen en schrabbers kregen een eerste AWN-verdieping op gevorderd niveau'] },
  { version: '2.2.2', date: '1 apr 2026', changes: ['Eerste vervolgknoppen op beginner-resultaten voor klingen en afslagen'] },
  { version: '2.2.0', date: '17 mrt 2026', changes: ['Progressiesysteem: Beginner → Gevorderd → Expert', 'Niveau selector op startscherm', 'Voortgangsbalk naar gevorderd niveau', 'Vrij spelen modus', 'Uitleg progressie in welkomstscherm'] },
  { version: '1.4.20', date: '22 feb 2026', changes: ['Verbeterde AI tekeningen (inkt stijl)', 'Zoeklocaties op kaart markeren', 'Kaart zoekfunctie', 'Kaartlagen panel (satelliet, filters)', 'Light mode standaard', 'Nieuwe professionele header'] },
  { version: '1.3.0', date: '21 feb 2026', changes: ['Vindplaats kaart toegevoegd', 'Vondsten zichtbaar op kaart', 'Verbeterd light mode contrast'] },
  { version: '1.2.1', date: '21 feb 2026', changes: ['Dark mode (standaard aan)', 'Sidebar navigatie op desktop', 'Statistieken in geschiedenis', 'Hover animaties op cards'] },
  { version: '1.1.27', date: '20 feb 2026', changes: ['Firebase login (werkt in Chrome)', 'Popup login i.p.v. redirect'] },
  { version: '1.1.26', date: '20 feb 2026', changes: ['Google login voor synchronisatie', 'Vondsten synchroniseren naar cloud', 'Vondsten ophalen op ander apparaat'] },
  { version: '1.1.25', date: '20 feb 2026', changes: ['Zoom in op foto\'s en tekeningen (dubbeltik, pinch of scroll)'] },
  { version: '1.1.24', date: '20 feb 2026', changes: ['Cropper opent direct na foto maken met camera'] },
  { version: '1.1.23', date: '18 feb 2026', changes: ['Verduidelijking: Claude voor analyse, OpenAI voor tekeningen (betaalde diensten)'] },
  { version: '1.1.20', date: '18 feb 2026', changes: ['Vierkant bijsnijden (1:1 ratio, past bij AI tekeningen)', 'Duidelijkere UI voor vierkante foto\'s'] },
  { version: '1.1.19', date: '18 feb 2026', changes: ['Meer ruimte rond foto\'s in fullscreen viewer', 'Betere weergave tekeningen'] },
  { version: '1.1.18', date: '18 feb 2026', changes: ['Agressievere foto compressie (max 1.5MB, 1500px)', 'Alle foto\'s worden nu automatisch verkleind'] },
  { version: '1.1.17', date: '17 feb 2026', changes: ['Verbeterde foto/tekening layout in resultaten', 'Lightbox foto\'s met betere afstand tot randen'] },
  { version: '1.1.16', date: '17 feb 2026', changes: ['Onnodige teksten verwijderd'] },
  { version: '1.1.15', date: '17 feb 2026', changes: ['Onzinnige foto-labels verwijderd', 'Fix: foto/tekening layout in resultaat'] },
  { version: '1.1.14', date: '17 feb 2026', changes: ['PDF export van determinatie', 'Drag & drop foto upload', 'Zoeken in geschiedenis'] },
  { version: '1.1.13', date: '17 feb 2026', changes: ['Lucide iconen voor consistente UI', 'Dynamisch bijsnijden (sleep hoeken om formaat aan te passen)', 'Multi-foto upload fix'] },
  { version: '1.1.12', date: '17 feb 2026', changes: ['Vindplaats/context invoer voor betere determinatie', 'Compactere resultaat weergave met uitklapbare details', 'Icoon-knoppen voor delen en opnieuw determineren'] },
  { version: '1.1.11', date: '16 feb 2026', changes: ['AI analyse details tonen (periode, zekerheid, kenmerken)', 'Volledige AI-analyse uitklapbaar'] },
  { version: '1.1.10', date: '16 feb 2026', changes: ['Verbeterde foutafhandeling bij tekening generatie'] },
  { version: '1.1.9', date: '16 feb 2026', changes: ['Fullscreen foto viewer met bladeren', 'Verbeterde feedback bij tekening generatie'] },
  { version: '1.1.8', date: '16 feb 2026', changes: ['AI-gegenereerde archeologische tekeningen (via OpenAI)', 'Deel determinatie via WhatsApp of e-mail'] },
  { version: '1.1.6', date: '14 feb 2026', changes: ['Links naar AWN Werkgroep Steentijd toegevoegd', 'Informatie over determinatie-algoritme en vondstkaart'] },
  { version: '1.1.5', date: '14 feb 2026', changes: ['Vereenvoudigde interface: alleen foto\'s', 'Video-analyse komt later met zelflerende AI'] },
  { version: '1.1.4', date: '13 feb 2026', changes: ['Altijd native telefoon camera (met zoom en scherpstelling)', 'Stabielere video opname'] },
  { version: '1.1.3', date: '13 feb 2026', changes: ['Uitleg over werking en toekomst toegevoegd', 'Subtielere UI voor voltooide determinaties', 'Beeldmateriaal viewer bij resultaten', 'Opnieuw determineren met bestaande foto\'s', '8 video frames (selecteer er 5 voor analyse)'] },
  { version: '1.1.2', date: '13 feb 2026', changes: ['Fix: video analyse werkt nu correct', 'Automatische frame extractie uit video voor AI'] },
  { version: '1.0.13', date: '12 feb 2026', changes: ['Direct naar determinatie scherm', 'Verbeterde video opname', 'Consistente amber kleurenschema'] },
  { version: '1.0.11', date: '12 feb 2026', changes: ['Verbeterde video opname compatibiliteit (iOS/Android)', 'Aparte upload knoppen voor foto en video', 'Professionelere camera interface'] },
  { version: '1.0.10', date: '12 feb 2026', changes: ['Fix: meerdere foto\'s workflow', 'Fix: video opname preview', 'Volledige AI analyse wordt opgeslagen bij vondst', 'AI Query viewer in menu'] },
  { version: '1.0.9', date: '12 feb 2026', changes: ['Instellingenmenu rechtsboven toegevoegd', 'Optie om welkomstscherm opnieuw te tonen'] },
  { version: '1.0.8', date: '12 feb 2026', changes: ['Wijzigingsbeheer toegevoegd aan welkomstscherm'] },
  { version: '1.0.7', date: '12 feb 2026', changes: ['Welkomstscherm met uitleg toegevoegd'] },
  { version: '1.0.6', date: '12 feb 2026', changes: ['Auto-compressie van grote foto\'s en video\'s (max 5MB)', 'Camera knoppen blijven nu zichtbaar op mobiel'] },
  { version: '1.0.5', date: '11 feb 2026', changes: ['Foto bijsnijden functie', 'Formaat invoer voor artefact'] },
  { version: '1.0.4', date: '10 feb 2026', changes: ['Verbeterde layout op mobiel'] },
  { version: '1.0.3', date: '9 feb 2026', changes: ['Fix voor foto preview knoppen'] },
  { version: '1.0.2', date: '8 feb 2026', changes: ['Vereenvoudigde interface', 'Meerdere foto\'s workflow'] },
  { version: '1.0.1', date: '7 feb 2026', changes: ['Eerste publieke versie'] },
];

interface WelcomeModalProps {
  onClose: () => void;
}

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[2000]"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 z-[2000] flex items-center justify-center pointer-events-none">
        <div
          className="rounded-2xl shadow-2xl overflow-hidden flex flex-col w-full max-w-md max-h-full pointer-events-auto"
          style={{ backgroundColor: 'var(--bg-card)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-amber-600 to-amber-800 text-white p-4 text-center">
            <h2 className="text-xl font-bold">Welkom bij Steentijd</h2>
            <p className="text-amber-200 text-sm">AI Determinatie van stenen artefacten</p>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <section>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Hoe werkt het?</h3>
              <div className="space-y-3">
                <StepItem number={1} title="Foto's maken" description="Maak meerdere foto's van je artefact (bovenkant, onderkant, zijkanten)" />
                <StepItem number={2} title="AI Analyse" description="De AI analyseert je foto's met kennis van het AWN determinatie-algoritme" />
                <StepItem number={3} title="Resultaat" description="Ontvang een determinatie met type, periode en beschrijving" />
                <StepItem number={4} title="Tekening maken" description="Genereer een wetenschappelijke archeologische tekening van je artefact" />
                <StepItem number={5} title="Delen" description="Deel je determinatie inclusief foto's via WhatsApp of e-mail" />
              </div>
            </section>

            <section className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-1">Tips voor goede foto's</h3>
              <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                <li>• <strong>Maak vierkante foto's</strong> (gebruik de "Vierkant" knop om bij te snijden)</li>
                <li>• Gebruik goed licht (daglicht werkt het beste)</li>
                <li>• Maak scherpe foto's van dichtbij</li>
                <li>• Fotografeer meerdere kanten van het artefact</li>
                <li>• Gebruik een neutrale achtergrond</li>
              </ul>
            </section>

            {/* AWN Werkgroep Steentijd */}
            <section className="rounded-xl p-3 border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>AWN Werkgroep Steentijd</h3>
              <div className="text-xs space-y-2" style={{ color: 'var(--text-secondary)' }}>
                <p>
                  Deze app is gebaseerd op het <strong>determinatie-algoritme</strong> van de
                  AWN Landelijke Werkgroep Steentijd. De werkgroep staat open voor iedereen
                  met interesse in prehistorische stenen artefacten — van beginner tot expert.
                </p>
                <div className="space-y-1.5 mt-3">
                  <a
                    href="https://awn-archeologie.nl/werkgroep/steentijd/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-amber-500 transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                    <span>Over de werkgroep</span>
                  </a>
                  <a
                    href="https://awn-archeologie.nl/werkgroep/steentijd/determinatie/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-amber-500 transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                    <span>Determinatie-algoritme</span>
                  </a>
                  <a
                    href="https://awn-archeologie.nl/werkgroep/steentijd/vondstkaart/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-amber-500 transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                    <span>Vondstkaart Nederland</span>
                  </a>
                </div>
              </div>
            </section>

            {/* Over dit project */}
            <section className="rounded-xl p-3 border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Over deze app</h3>
              <div className="text-xs space-y-2" style={{ color: 'var(--text-secondary)' }}>
                <p>
                  <strong>Proof of Concept</strong> — Experimentele app om te onderzoeken
                  of AI-gestuurde determinatie van stenen artefacten haalbaar en nuttig is.
                </p>
                <p>
                  <strong>Hoe werkt de AI?</strong> — De app gebruikt twee betaalde AI-diensten:
                  <strong> Claude</strong> (Anthropic) voor de determinatie-analyse, en
                  <strong> OpenAI</strong> voor het genereren van archeologische tekeningen.
                  Bij elke analyse wordt het AWN determinatie-algoritme als context meegestuurd.
                  De modellen zijn <em>stateless</em>: ze onthouden niets van eerdere sessies en worden
                  niet getraind door gebruik van deze app.
                </p>
                <p>
                  <strong>Transparantie</strong> — Via het menu (☰) kun je de volledige AI-query
                  bekijken die naar het model wordt gestuurd.
                </p>
                <p className="pt-1" style={{ color: 'var(--text-muted)' }}>
                  <strong>Toekomst:</strong> trainbaar model, referentiedatabase, video-analyse met zelflerende AI.
                </p>
              </div>
            </section>

            {/* Progressiesysteem */}
            <section className="rounded-xl p-3 border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Doorgroeien van Beginner naar Gevorderd</h3>
              <div className="text-xs space-y-2" style={{ color: 'var(--text-secondary)' }}>
                <p>
                  De app heeft drie niveaus: <strong>Beginner</strong>, <strong>Gevorderd</strong> en <strong>Expert</strong>.
                </p>
                <p>
                  <strong>Als Beginner</strong> krijg je volledige hulp: bronhints bij belangrijke vragen, referentiefoto&apos;s bij elke vraag, en uitleg bij de beslisboom. Alleen waar nog geen bronhint is vastgelegd kan een AI-hint als fallback worden gebruikt.
                </p>
                <p>
                  <strong>Hoe ontgrendel je Gevorderd?</strong>
                </p>
                <ul className="pl-3 space-y-1" style={{ color: 'var(--text-secondary)' }}>
                  <li>• <strong>Reguliere doorgroei vereist beide:</strong> 20 correcte determinaties en 5 docent-validaties.</li>
                  <li>• Na elke determinatie geeft de AI een beoordeling (correct/twijfelachtig/onjuist). Alleen "correct" telt mee.</li>
                  <li>• Een docent kan je ook direct naar Gevorderd of Expert promoveren.</li>
                </ul>
                <p>
                  <strong>Expert</strong> ontgrendel je normaal via 30 correcte determinaties op <strong>gevorderd niveau</strong> en 10 docent-validaties, of via directe promotie door een docent.
                </p>
                <p>
                  <strong>Op Gevorderd niveau</strong> werk je zelfstandiger: geen hints meer, minder directe uitleg en waar relevant een diepere AWN-vervolglaag.
                </p>
                <p style={{ color: 'var(--text-muted)' }}>
                  Je kunt ook "vrij spelen" om beginner, gevorderd en expert te proberen zonder dat het meetelt voor je voortgang.
                </p>
              </div>
            </section>

            <section className="rounded-xl p-3 border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20">
              <p className="text-xs text-amber-800 dark:text-amber-400">
                <strong>Let op:</strong> Dit is een hulpmiddel. Raadpleeg bij twijfel
                altijd een expert van de AWN Werkgroep Steentijd.
              </p>
            </section>

            {/* Changelog */}
            <section>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Wat is nieuw?</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {CHANGELOG.map((release) => (
                  <div key={release.version} className="text-xs border-l-2 border-amber-400 dark:border-amber-600 pl-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>v{release.version}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{release.date}</span>
                    </div>
                    <ul className="mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {release.changes.map((change, i) => (
                        <li key={i}>• {change}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Niet meer tonen</span>
            </label>
            <button
              onClick={handleClose}
              className="px-6 py-2 text-sm font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function StepItem({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 flex items-center justify-center bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 rounded-full text-sm font-bold flex-shrink-0">
        {number}
      </div>
      <div>
        <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{title}</h4>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      </div>
    </div>
  );
}

export function resetWelcomeModal() {
  localStorage.removeItem(STORAGE_KEY);
}

export function useWelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hidden = localStorage.getItem(STORAGE_KEY);
    if (!hidden) {
      setIsOpen(true);
    }
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}
