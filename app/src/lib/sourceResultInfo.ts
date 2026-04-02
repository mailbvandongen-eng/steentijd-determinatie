export interface SourceResultInfo {
  summary: string;
  detail?: string;
  source: string;
}

const SOURCE_RESULT_INFO: Record<string, SourceResultInfo> = {
  'splinter': {
    summary: 'Een splinter is een zeer klein, onbewerkt fragment zonder duidelijke doelgerichte vormgeving.',
    detail: 'Dit is in de bron vooral een uitsluitingscategorie aan het begin van de determinatie.',
    source: 'Algoritme vroege uitsluitingsvragen, handleiding basisdeterminatie',
  },
  'brok-of-vorstsplijting': {
    summary: 'Een brok of vorstsplijting heeft geen overtuigende reductie of werktuigvorm en past beter bij natuurlijke breuk dan bij artefactproductie.',
    detail: 'Eventuele testslagen of minimale bewerking worden in de bron apart afgehandeld.',
    source: 'Algoritme basisvragen, handleiding brok en vorstsplijting',
  },
  'natuursteen-of-knol': {
    summary: 'Dit resultaat wijst op een steen of knol zonder overtuigende aanwijzingen voor menselijk bewerken.',
    detail: 'De bron gebruikt deze uitkomst om natuurlijke stukken buiten de echte artefacttypologie te houden.',
    source: 'Algoritme basisvragen, handleiding natuurlijke stukken',
  },
  'afslag-onbewerkt': {
    summary: 'Een onbewerkte afslag is een losgeslagen stuk zonder duidelijke nabewerking na het losslaan van de kern.',
    detail: 'De vorm en dorsale negatieven blijven wel bruikbaar voor verdere typering binnen de afslaggroep.',
    source: 'Algoritme afslagroute, handleiding afslagen',
  },
  'kling-onbewerkt': {
    summary: 'Een onbewerkte kling is een langwerpig kernproduct zonder duidelijke nabewerking.',
    detail: 'Binnen de bron worden daarna nog Levallois-, preparatie-, Montbani- en andere klingtypen onderscheiden.',
    source: 'Algoritme klingroute, handleiding klingen',
  },
  'geretoucheerde-kling': {
    summary: 'Een geretoucheerde kling is een kling waarop na het losslaan doelgerichte randbewerking is aangebracht.',
    detail: 'De verdere typologie splitst onder meer naar rugmessen, schrabbers, spitsen en andere klingwerktuigen.',
    source: 'Algoritme gemodificeerde klingroute, handleiding klingwerktuigen',
  },
  'geretoucheerde-afslag': {
    summary: 'Een geretoucheerde afslag is een afslag met doelgerichte nabewerking van rand of uiteinde.',
    detail: 'Vanuit deze brede groep splitst de bron verder naar schrabbers, stekers, boren, afgeknotte en andere werktuigtypen.',
    source: 'Algoritme afslagwerktuigen, handleiding afslagwerktuigen',
  },
  'rugmes': {
    summary: 'Een rugmes is een klingachtig werktuig met een scherpe rand tegenover een dikke of geretoucheerde rug.',
    detail: 'De rug kan natuurlijk, corticaal of door steile retouche gevormd zijn.',
    source: 'Algoritme rugmesroute, handleiding rugmessen',
  },
  'klingschrabber': {
    summary: 'Een klingschrabber is een schrabber op klingbasis, meestal met een kap aan één of beide uiteinden.',
    detail: 'De bron splitst vervolgens naar enkelvoudige, dubbele en andere klingschrabbertypen.',
    source: 'Algoritme schrabber op kling, handleiding klingschrabbers',
  },
  'schrabber': {
    summary: 'Een schrabber heeft een relatief steil geretoucheerde, vaak gebogen werkkant.',
    detail: 'De schrabbergroep kent in de bron veel subtypen, zoals zijschrabbers, duimnagelschrabbers, snuitschrabbers en limaces.',
    source: 'Algoritme schrabberroute, handleiding schrabbers',
  },
  'spits': {
    summary: 'Een spits is een werktuig met een duidelijke doelgerichte puntvorm.',
    detail: 'De bron verdeelt spitsen verder in gesteelde, geometrische, steil geretoucheerde, eenzijdig geretoucheerde en bladvormige typen.',
    source: 'Algoritme spitsroute, handleiding spitsen',
  },
  'vuistbijl': {
    summary: 'Een vuistbijl is een bifaciaal bewerkt werktuig met een doelgerichte globale contour en punt- of snedevorm.',
    detail: 'Binnen de bron volgen daarna vele subtypen zoals amandelvormig, lancetvormig, hartvormig, driehoekig en Micoque.',
    source: 'Algoritme bifaciale route, handleiding vuistbijlen',
  },
  'geslepen-vuurstenen-bijl': {
    summary: 'Dit is een geslepen vuurstenen bijl, dus een werktuig met duidelijke bijlvorm en geslepen afwerking.',
    detail: 'De bron werkt deze groep verder uit naar vlakbijlen, ovale en rechthoekige doorsneden, dissels en topvarianten.',
    source: 'Algoritme geslepen vuursteenbijlen, handleiding geslepen bijlen',
  },
  'geslepen-vuurstenen-artefact': {
    summary: 'Dit is een geslepen vuurstenen artefact dat niet direct als standaard bijl uit de eerste hoofdvraag valt.',
    detail: 'Binnen de bron kunnen hier onder meer beitels, gutsen, puntbeitels, dolken en hergebruikte bijlfragmenten onder vallen.',
    source: 'Algoritme geslepen vuurstenen artefacten, handleiding geslepen werktuigen',
  },
  'doorboord-artefact': {
    summary: 'Een doorboord artefact heeft een duidelijk kunstmatig gat of boring door het stuk heen.',
    detail: 'De bron splitst daarna onder meer naar rolstenen, schijfstenen, breedwiggen, dubbelbijlen en hamerbijlen.',
    source: 'Algoritme doorboorde artefacten, handleiding doorboorde werktuigen',
  },
  'hamerbijl': {
    summary: 'Een hamerbijl is een doorboord werktuig met duidelijke hamer- of bijlvorm en een eigen subtypeboom.',
    detail: 'In de bron worden gefacetteerde en niet-gefacetteerde hamerbijlen verder onderverdeeld naar profiel, verdikking en nekvorm.',
    source: 'Algoritme hamerbijlen, handleiding hamerbijlen',
  },
  'kern-levallois': {
    summary: 'Een Levallois-kern is voorbereid om doelgericht één of meer karakteristieke afslagen of klingen te produceren.',
    detail: 'Kenmerkend zijn naar het midden gerichte negatieven en een duidelijk voorbereid volumebeheer.',
    source: 'Algoritme Levallois-kernen, handleiding Levallois-techniek',
  },
  'kern-diskusvormig': {
    summary: 'Een diskusvormige kern heeft rondom naar het midden gerichte negatieven aan beide zijden en een schijfachtige opbouw.',
    detail: 'Het reductiepatroon is tweezijdig en centraal georiënteerd.',
    source: 'Algoritme diskusvormige kernen, handleiding diskusvormige kernen',
  },
  'kern-kling': {
    summary: 'Een klingkern is ingericht op de productie van klingen in plaats van gewone afslagen.',
    detail: 'De bron splitst daarna verder naar grote klingkernen, Coincy-, Montbani- en kielvormige varianten.',
    source: 'Algoritme klingkernen, handleiding klingkernen',
  },
  'kern-afslag': {
    summary: 'Een afslagkern is ingericht op het losmaken van afslagen en niet primair op klingen.',
    detail: 'Binnen de bron volgen daarna verdere kernsubtypen op basis van slagvlakken, vorm en regulariteit van de negatieven.',
    source: 'Algoritme afslagkernen, handleiding afslagkernen',
  },
  'boor-of-priem': {
    summary: 'Deze brede groep omvat werktuigen met een duidelijke punt die als boor, bec of priem is uitgewerkt.',
    detail: 'De bron splitst vervolgens naar enkelvoudige en meervoudige boren, becs en boorvormen op kern of afslag.',
    source: 'Algoritme boor-, bec- en ruimerroute, handleiding boren en becs',
  },
  'kernwerktuig-grof': {
    summary: 'Dit is een grof bewerkt kernwerktuig zonder de fijnere bifaciale afwerking van vuistbijlen en bladvormen.',
    detail: 'Verdere splitsing volgt in de bron naar choppers, chopping tools en andere grof bekapte werktuigen.',
    source: 'Algoritme grof bewerkte kernwerktuigen, handleiding kernwerktuigen',
  },
  'kernwerktuig-klein': {
    summary: 'Dit resultaat valt in de kleine kernwerktuigen, een groep van relatief kleine maar doelgericht gevormde stukken.',
    detail: 'De bron trekt deze los van grotere vuistbijlen en grof bewerkte kernwerktuigen.',
    source: 'Algoritme kleine kernwerktuigen, handleiding kleine kernwerktuigen',
  },
  'chopper-of-chopping-tool': {
    summary: 'Dit is een grof kernwerktuig met een door bekapping gevormde werkkant of slagzijde.',
    detail: 'De bron werkt deze familie verder uit naar een- en tweezijdige vormen en verwante overgangstypen.',
    source: 'Algoritme chopper/chopping tool, handleiding choppers en chopping tools',
  },
  'uniface': {
    summary: 'Een uniface is vooral aan één zijde bewerkt of gevormd, in tegenstelling tot echte bifaciale werktuigen.',
    detail: 'Het stuk kan wel sterk gemodelleerd zijn, maar mist de tweezijdige opbouw van vuistbijlen en bladvormen.',
    source: 'Algoritme unifaces, handleiding unifaces',
  },
  'kern--bipolair': {
    summary: 'Een bipolaire kern toont reductie in twee tegengestelde richtingen en vaak versplinterde uiteinden.',
    detail: 'Dit past bij slaan op aambeeld of tegenoverliggende krachten tijdens het reduceren.',
    source: 'Algoritme bipolaire kernroute, handleiding bipolaire kernen',
  },
  'kern--kombewa': {
    summary: 'Een Kombewa-kern of -afbouw toont een groot dominant afslagnegatief op een relatief massieve kern.',
    detail: 'Het is een duidelijk georganiseerde kernvorm en niet alleen een toevallig afgebroken brok.',
    source: 'Algoritme Kombewa-route, handleiding Kombewa',
  },
  'kern--quina': {
    summary: 'Een Quina-kern heeft twee net niet haaks op elkaar staande slagvlakken die beurtelings worden gebruikt.',
    detail: 'De reductie verloopt wisselend over die twee vlakken.',
    source: 'Algoritme Quina-kernen, handleiding Quina-kernen',
  },
  'kern--veelvlaks': {
    summary: 'Een veelvlakkern heeft afslagnegatieven in meerdere richtingen en geen eenvoudige reductie rond één of twee vlakken.',
    detail: 'De kern oogt daardoor meerfacettig en minder strak georganiseerd.',
    source: 'Algoritme veelvlakkernen, handleiding veelvlakkernen',
  },
  'kern--orthogon-aal': {
    summary: 'Een orthogonale kern gebruikt slagvlakken die niet tegenover elkaar liggen maar in verschillende richtingen staan.',
    detail: 'De reductie wisselt tussen haaks of bijna haaks georiënteerde vlakken.',
    source: 'Algoritme orthogonale kernen, handleiding orthogonale kernen',
  },
  'kern--bidirectioneel': {
    summary: 'Een bidirectionele kern wordt vanuit twee tegenover elkaar liggende slagvlakken geëxploiteerd.',
    detail: 'Binnen die groep kan de productie meer naar afslagen of juist naar klingen neigen.',
    source: 'Algoritme bidirectionele kernen, handleiding bidirectionele kernen',
  },
  'kern--afslag--piramida-al': {
    summary: 'Een piramidale afslagkern heeft rondom korte afslagnegatieven vanaf een centraal slagvlak.',
    detail: 'De vorm is compacter dan bij langwerpige kling- of lamellekernen.',
    source: 'Algoritme piramidale afslagkern, handleiding afslagkernen',
  },
  'kern--kling--coincy': {
    summary: 'Een Coincy-kern is een klingkernvariant zonder de regelmatige Montbani-achtige paralleliteit.',
    detail: 'De kern blijft wel duidelijk op klingproductie gericht.',
    source: 'Algoritme Coincy-route, handleiding klingkernen',
  },
  'met-parallelle-afslagnegatieven-kern--kling--montbani': {
    summary: 'Een Montbani-achtige klingkern heeft regelmatige, parallelle klingnegatieven.',
    detail: 'De reductie oogt gestandaardiseerd en strak georganiseerd.',
    source: 'Algoritme Montbani-klingkern, handleiding Montbani en verwante klingkernen',
  },
  'kern--lamelle': {
    summary: 'Een lamellekern is ingericht op productie van zeer smalle lamellen.',
    detail: 'De negatieven zijn overwegend smaller dan bij gewone klingkernen.',
    source: 'Algoritme lamellekernen, handleiding lamellekernen',
  },
  'stekerafslag': {
    summary: 'Een stekerafslag is het smalle afslagje dat ontstaat bij het maken of opfrissen van een steker.',
    detail: 'Het is dus een product van stekerbewerking, niet het stekerwerktuig zelf.',
    source: 'Algoritme stekerafslagen, handleiding stekers',
  },
  'steker--transversaal': {
    summary: 'Een transversale steker heeft zijn stekerafslag zijwaarts aangebracht ten opzichte van de slagrichting van het basisstuk.',
    detail: 'De werkende beitelkant ligt daardoor anders georiënteerd dan bij gewone eindstekers.',
    source: 'Algoritme transversale stekers, handleiding stekers',
  },
  'steker--noailles': {
    summary: 'Een Noailles-steker is klein, dun en vaak verbonden met microsteker- of kerfresttechniek.',
    detail: 'De beitelkant blijft meestal zeer fijn en klein van formaat.',
    source: 'Algoritme Noailles-stekers, handleiding Noailles-stekers',
  },
  'steker--kern': {
    summary: 'Een steker op kern is op een kernachtig stuk aangebracht in plaats van op een afslag of kling.',
    detail: 'Dat maakt hem morfologisch en technisch anders dan de gebruikelijkere stekers op kling- of afslagbasis.',
    source: 'Algoritme steker op kern, handleiding stekers op kern',
  },
  'grattoir--caréné-rabot-of-schrabber--kern': {
    summary: 'Dit is een caréné-, rabot- of schrabber-kernachtig stuk: dik, steil bewerkt en vaak omgekeerd bootvormig.',
    detail: 'Het zit op de grens van kern en schrabber en vormt in de bron een eigen subtypegroep.',
    source: 'Algoritme caréné/rabot-route, handleiding caréné, rabot en schrabberkernen',
  },
  'schrabber--duimnagel': {
    summary: 'Een duimnagelschraper is klein, kort en breed, met een brede kap tegenover een rechte basis.',
    detail: 'Lengte en breedte zijn ongeveer gelijk en het stuk blijft doorgaans onder circa 3 cm.',
    source: 'Algoritme duimnagelschrapers, handleiding duimnagelschrabbers',
  },
  'schrabber--snuitvormig': {
    summary: 'Een snuitschrabber heeft een smalle, relatief dikke schrabberkap die als snuit uitsteekt.',
    detail: 'De actieve kap is duidelijk smaller dan de rest van het stuk.',
    source: 'Algoritme snuitschrabbers, handleiding snuitschrabbers',
  },
  'schrabber--zij': {
    summary: 'Een zijschrabber heeft zijn werkkant langs een zijkant van het stuk in plaats van aan het uiteinde.',
    detail: 'Het is dus een lateraal georiënteerde schrabbervorm.',
    source: 'Algoritme zijschrabbers, handleiding zijschrabbers',
  },
  'schrabber--kling': {
    summary: 'Een schrabber op klingbasis gebruikt een kling als drager, niet een gewone afslag.',
    detail: 'De langwerpige basis beïnvloedt vorm en subtype-indeling van de schrabber.',
    source: 'Algoritme schrabbers op kling, handleiding klingschrabbers',
  },
  'spits--azilien': {
    summary: 'Een Azilien-spits is relatief breed en toont retouche op de bolle zijde, soms met lichte afknotting.',
    detail: 'Het subtype is minder slank dan veel andere enkelzijdig geretoucheerde spitsen.',
    source: 'Algoritme Azilien-spitsen, handleiding Azilien-spitsen',
  },
  'spits--blad': {
    summary: 'Een bladspits is een dun, bifaciaal bewerkt en bladvormig spitswerktuig.',
    detail: 'Hij staat dichter bij fijn bewerkte bladvormen dan bij grover gevormde vuistbijlen.',
    source: 'Algoritme bladspitsen, handleiding bladspitsen',
  },
  'spits--bromme': {
    summary: 'Een Bromme-spits is een langwerpige steelspits waarbij het ongeretoucheerde feather-einde van de kling de punt vormt.',
    detail: 'De steel is aanwezig, maar de punt zelf blijft opvallend weinig bewerkt.',
    source: 'Algoritme Bromme-spitsen, handleiding Bromme-spitsen',
  },
  'spits--font-robert': {
    summary: 'Een Font-Robert-spits is een steelspits met relatief lange, smalle steel en vaak ogiefvormige top.',
    detail: 'Het subtype is duidelijk langgesteeld binnen de steelspitsen.',
    source: 'Algoritme Font-Robert-spitsen, handleiding Font-Robert-spitsen',
  },
  'spits--havelter-steelspits': {
    summary: 'Een Havelter-steelspits is relatief lang en heeft een korte steel door twee ongelijke kerven.',
    detail: 'De steelretouche kan asymmetrisch over dorsale en ventrale zijde verlopen.',
    source: 'Algoritme Havelter-steelspitsen, handleiding Havelter-steelspitsen',
  },
  'spits--kerf-hamburg': {
    summary: 'Een Hamburg-kerfspits heeft een smallere steel door kerfvorming, maar mist de langere Magdalenien-kerf.',
    detail: 'Hij blijft binnen de kerfspitsen, maar met een ander basisprofiel.',
    source: 'Algoritme Hamburg-spitsen, handleiding Hamburg-spitsen',
  },
  'spits--lbk': {
    summary: 'Een LBK-spits is driehoekig en heeft een holle basis met wat vlakkere randretouche.',
    detail: 'De holle basis is het belangrijkste onderscheidende kenmerk.',
    source: 'Algoritme LBK-spitsen, handleiding LBK-spitsen',
  },
  'spits--naaldvormig': {
    summary: 'Een naaldvormige spits is smal, lang en tweezijdig geretoucheerd met één duidelijke punt.',
    detail: 'De lengte-breedteverhouding ligt hoger dan bij compactere spitsen.',
    source: 'Algoritme naaldvormige spitsen, handleiding naaldvormige spitsen',
  },
  'spits--sauveterre': {
    summary: 'Een Sauveterre-spits is een kleine, tweezijdig geretoucheerde lamelle met twee puntige uiteinden.',
    detail: 'Het subtype blijft duidelijk lamellair en zeer fijn van formaat.',
    source: 'Algoritme Sauveterre-spitsen, handleiding Sauveterre-spitsen',
  },
  'spits--swidry': {
    summary: 'Een Swidry-spits is min of meer ruitvormig en heeft een bifaciaal geretoucheerde basis.',
    detail: 'De basisbewerking is hier bepalend voor het subtype.',
    source: 'Algoritme Swidry-spitsen, handleiding Swidry-spitsen',
  },
  'spits--tjonger': {
    summary: 'Een Tjonger-spits heeft één gebogen volledig geretoucheerde zijde en een punt buiten de lengteas.',
    detail: 'Die asymmetrische ligging van de punt is het kernkenmerk.',
    source: 'Algoritme Tjonger-spitsen, handleiding Tjonger-spitsen',
  },
  'spits--zonhoven': {
    summary: 'Een Zonhoven-spits heeft een gedeeltelijk geretoucheerde zijde en een steil geretoucheerde afgeknotte basis.',
    detail: 'Zowel zijde als basis dragen dus actief bij aan de vorm.',
    source: 'Algoritme Zonhoven-spitsen, handleiding Zonhoven-spitsen',
  },
  'vuistbijl--amandelvormig': {
    summary: 'Een amandelvormige vuistbijl heeft een regelmatige ovale contour en een vrij ronde, onduidelijke punt.',
    detail: 'Het subtype is klassiek symmetrisch en minder hoekig dan driehoekige vormen.',
    source: 'Algoritme amandelvormige vuistbijlen, handleiding amandelvormige vuistbijlen',
  },
  'vuistbijl--bootvormig': {
    summary: 'Een bootvormige vuistbijl heeft een langgerekte vorm met een karakteristieke bootachtige contour.',
    detail: 'Het profiel en de gelijkmatige verlenging bepalen dit subtype.',
    source: 'Algoritme bootvormige vuistbijlen, handleiding bootvormige vuistbijlen',
  },
  'vuistbijl--bout--coupé': {
    summary: 'Een bout-coupé heeft een karakteristiek afgekapt of kort uiteinde binnen de vuistbijlgroep.',
    detail: 'Het subtype is compacter en minder spits toelopend dan veel andere vormen.',
    source: 'Algoritme bout-coupé, handleiding bout-coupé',
  },
  'vuistbijl--driehoekig': {
    summary: 'Een driehoekige vuistbijl heeft relatief rechte zijden en een scherpe, rechte basis.',
    detail: 'De globale driehoeksvorm is hier belangrijker dan kleine asymmetrie.',
    source: 'Algoritme driehoekige vuistbijlen, handleiding driehoekige vuistbijlen',
  },
  'vuistbijl--faustkeilblatt': {
    summary: 'Een Faustkeilblatt is bladvormig, dunner dan een gewone vuistbijl en zonder uitgesproken dikke rug.',
    detail: 'Het subtype staat op de overgang tussen vuistbijl en bladvormig spitswerktuig.',
    source: 'Algoritme Faustkeilblatt, handleiding Faustkeilblatt',
  },
  'vuistbijl--ficron': {
    summary: 'Een ficron is een langwerpige, vrij grof bewerkte vuistbijl met concave zijden.',
    detail: 'Hij is slanker en grover dan een Micoque-vorm.',
    source: 'Algoritme ficron, handleiding ficrons',
  },
  'vuistbijl--flesvormig': {
    summary: 'Een flesvormige vuistbijl heeft een bredere body en een versmalling die aan een flescontour doet denken.',
    detail: 'Hij volgt in de bron op amandelvormige vormen die net niet meer echt ovaal genoeg zijn.',
    source: 'Algoritme flesvormige vuistbijlen, handleiding flesvormige vuistbijlen',
  },
  'vuistbijl--fäustel': {
    summary: 'Een Fäustel is een kleine vuistbijl, doorgaans korter dan ongeveer 6 cm.',
    detail: 'Formaat is hier het kernkenmerk van het subtype.',
    source: 'Algoritme Fäustel, handleiding Fäustel',
  },
  'vuistbijl--hartvormig': {
    summary: 'Een hartvormige vuistbijl heeft sterk convexe zijden, een ronde basis en een enigszins ronde punt.',
    detail: 'De contour is minder strak driehoekig en meer uitgesproken symmetrisch gebogen.',
    source: 'Algoritme hartvormige vuistbijlen, handleiding hartvormige vuistbijlen',
  },
  'vuistbijl--lancetvormig': {
    summary: 'Een lancetvormige vuistbijl is langwerpig en heeft relatief rechte zijden.',
    detail: 'Het subtype is slanker en spitser dan ovale of hartvormige vuistbijlen.',
    source: 'Algoritme lancetvormige vuistbijlen, handleiding lancetvormige vuistbijlen',
  },
  'vuistbijl--limande': {
    summary: 'Een limande is een plattere, visvormig aandoende vuistbijlvariant binnen de dunnere typen.',
    detail: 'Hij is minder hoekig dan driehoekige vormen en niet zo ovaal als de klassieke amandelvorm.',
    source: 'Algoritme limandes, handleiding limandes',
  },
  'vuistbijl--micoque': {
    summary: 'Een Micoque-vuistbijl is langwerpig, heeft concave zijden en is fijner bewerkt dan ficron of lancetvormig.',
    detail: 'De combinatie van slanke vorm en zorgvuldiger afwerking is beslissend.',
    source: 'Algoritme Micoque-vuistbijlen, handleiding Micoque-vuistbijlen',
  },
  'vuistbijl--ovaal': {
    summary: 'Een ovale vuistbijl heeft een gelijkmatig afgeronde, ellipsachtige contour zonder sterke hoekvorming.',
    detail: 'Hij is regelmatiger en breder afgerond dan lancet- of driehoekige vormen.',
    source: 'Algoritme ovale vuistbijlen, handleiding ovale vuistbijlen',
  },
  'vuistbijl--rond-og-vuistbijl--disque': {
    summary: 'Een ronde of disque-vuistbijl is compact en vrijwel cirkel- of schijfvormig van omtrek.',
    detail: 'De vorm is duidelijk minder langgerekt dan de meeste andere vuistbijlen.',
    source: 'Algoritme ronde/disque vuistbijlen, handleiding ronde vuistbijlen',
  },
  'bijl-vlakbijl--klokvormig': {
    summary: 'Een klokvormige vlakbijl heeft gebogen zijden en zijn grootste breedte ongeveer op een derde vanaf de snede.',
    detail: 'Dat geeft de herkenbare klokvormige contour.',
    source: 'Algoritme klokvormige vlakbijlen, handleiding vlakbijlen',
  },
  'bijl-vlakbijl--rechthoekig': {
    summary: 'Een rechthoekige vlakbijl heeft een vrij rechte omtrek en een relatief platte opbouw.',
    detail: 'Hij wijkt daarmee af van klok- en trapeziumvormige vlakbijlen.',
    source: 'Algoritme rechthoekige vlakbijlen, handleiding vlakbijlen',
  },
  'bijl-vlakbijl--trapeziumvormig': {
    summary: 'Een trapeziumvormige vlakbijl heeft rechte convergerende zijden en een duidelijke trapeziumomtrek.',
    detail: 'De globale contour is het onderscheidende kenmerk.',
    source: 'Algoritme trapeziumvormige vlakbijlen, handleiding vlakbijlen',
  },
  'bijl-buren': {
    summary: 'Een Buren-bijl is een langere ovale vuursteenbijl, doorgaans langer dan ongeveer 15 cm.',
    detail: 'De combinatie van ovale doorsnede en lengte is hier bepalend.',
    source: 'Algoritme Buren-bijlen, handleiding Buren-bijlen',
  },
  'bijl-met-rechthoekige--dwarsdoorsnede--dikbladig': {
    summary: 'Dit is een dikbladige vuursteenbijl met min of meer rechthoekige dwarsdoorsnede.',
    detail: 'De maximale dikte is relatief groot ten opzichte van de breedte.',
    source: 'Algoritme dikbladige rechthoekige bijlen, handleiding vuursteenbijlen',
  },
  'bijl-met-rechthoekige--dwarsdoorsnede--dunbladig': {
    summary: 'Dit is een dunbladige vuursteenbijl met min of meer rechthoekige dwarsdoorsnede.',
    detail: 'De bijl is slanker in doorsnede dan de dikbladige varianten.',
    source: 'Algoritme dunbladige rechthoekige bijlen, handleiding vuursteenbijlen',
  },
  'bijl-met-ronde--dwarsdoorsnede': {
    summary: 'Dit subtype heeft een ronde dwarsdoorsnede in plaats van een vlakke, ovale of rechthoekige opbouw.',
    detail: 'De doorsnede is het hoofdkenmerk van deze bijlgroep.',
    source: 'Algoritme ronde dwarsdoorsneden, handleiding stenen bijlen',
  },
  'beitel--dissel': {
    summary: 'Een beiteldissel heeft een uit het midden geplaatste snede in plaats van een centrale beitelrand.',
    detail: 'De asymmetrische snede vormt het onderscheidende kenmerk.',
    source: 'Algoritme beiteldissels, handleiding beitels en dissels',
  },
  'beitel--guts': {
    summary: 'Een guts is een beitel met een holle of concave snede.',
    detail: 'Daardoor wijkt hij functioneel en vormmatig af van een gewone rechte beitel.',
    source: 'Algoritme gutsen, handleiding gutsen',
  },
  'beitel--punt': {
    summary: 'Een puntbeitel heeft geen echte snede maar een doelgericht puntig uiteinde.',
    detail: 'De werkkant eindigt dus in een punt in plaats van een brede beitelrand.',
    source: 'Algoritme puntbeitels, handleiding puntbeitels',
  },
  'doorboorde--rolsteen': {
    summary: 'Een doorboorde rolsteen is een afgerond steenobject met kunstmatige doorboring.',
    detail: 'De afgeronde natuurlijke basisvorm blijft daarbij goed herkenbaar.',
    source: 'Algoritme doorboorde rolstenen, handleiding doorboorde werktuigen',
  },
  'doorboorde--schijfvormige--steen': {
    summary: 'Dit is een schijfvormige steen met kunstmatige doorboring.',
    detail: 'De schijfvorm is het primaire vormkenmerk binnen de doorboorde groep.',
    source: 'Algoritme schijfvormige doorboorde stenen, handleiding doorboorde werktuigen',
  },
  'doorboorde--breedwig': {
    summary: 'Een doorboorde breedwig is een brede, wigvormige doorboorde steenwerktuigvorm.',
    detail: 'Hij staat vormmatig tussen eenvoudig doorboorde stenen en de meer uitgesproken dubbelbijlen.',
    source: 'Algoritme doorboorde breedwiggen, handleiding doorboorde werktuigen',
  },
  'bijl-dubbel': {
    summary: 'Een dubbelbijl is een doorboord werktuig met aan beide zijden een bijlachtig werkend uiteinde.',
    detail: 'De bron splitst daarna verder naar specifieke dubbelbijltypen.',
    source: 'Algoritme dubbelbijlen, handleiding dubbelbijlen',
  },
  'bijl-hamer': {
    summary: 'Een hamerbijl combineert doorboring met een hamer- of bijlvormig profiel.',
    detail: 'Het subtype wordt in de bron verder uitgewerkt op basis van doorsnede, verdikking en nekvorm.',
    source: 'Algoritme hamerbijlen, handleiding hamerbijlen',
  },
};

const PREFIX_RESULT_INFO: Array<[string, SourceResultInfo]> = [
  ['kern--levallois', SOURCE_RESULT_INFO['kern-levallois']],
  ['aan-beide-zijden-kern--diskusvormig', SOURCE_RESULT_INFO['kern-diskusvormig']],
  ['kern--kling', SOURCE_RESULT_INFO['kern-kling']],
  ['kern--afslag', SOURCE_RESULT_INFO['kern-afslag']],
  ['steker', {
    summary: 'Een steker heeft een kleine beitelkant of stekernegatief dat doelgericht als werkpunt is gevormd.',
    detail: 'Binnen de bron bestaan veel stekersubtypen, zoals transversale, Noailles-, bek- en kernstekers.',
    source: 'Algoritme stekers, handleiding stekers',
  }],
  ['schrabber', SOURCE_RESULT_INFO['schrabber']],
  ['spits--', SOURCE_RESULT_INFO['spits']],
  ['vuistbijl--', SOURCE_RESULT_INFO['vuistbijl']],
  ['bijl-vlakbijl', SOURCE_RESULT_INFO['geslepen-vuurstenen-bijl']],
  ['bijl-', SOURCE_RESULT_INFO['geslepen-vuurstenen-bijl']],
  ['beitel', SOURCE_RESULT_INFO['geslepen-vuurstenen-artefact']],
  ['doorboorde--', SOURCE_RESULT_INFO['doorboord-artefact']],
  ['bijl-hamer', SOURCE_RESULT_INFO['hamerbijl']],
  ['bijl-dubbel', SOURCE_RESULT_INFO['doorboord-artefact']],
  ['rugmes', SOURCE_RESULT_INFO['rugmes']],
  ['lamelle', {
    summary: 'Een lamelle is een zeer smal klingachtig product, smaller dan gewone klingen.',
    detail: 'In de bron komen lamellen zowel onbewerkt als verwerkt in spits- en werktuigtypen voor.',
    source: 'Algoritme lamellen, handleiding lamellen',
  }],
];

export function getSourceResultInfo(resultType: string | undefined | null): SourceResultInfo | null {
  if (!resultType) return null;
  if (SOURCE_RESULT_INFO[resultType]) return SOURCE_RESULT_INFO[resultType];

  for (const [prefix, info] of PREFIX_RESULT_INFO) {
    if (resultType.startsWith(prefix)) return info;
  }

  return null;
}
