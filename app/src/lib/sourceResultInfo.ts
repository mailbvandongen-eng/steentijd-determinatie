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
