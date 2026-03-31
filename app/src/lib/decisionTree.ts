import type { ImageMetadata, UserLevel } from '../types';
import imageMetadata from '../data/images_metadata.json';

export const imagesMeta: ImageMetadata[] = imageMetadata as ImageMetadata[];

export interface QuestionNode {
  id: string;
  vraag: string;
  toelichting?: string;
  jaResultaat?: string;
  jaVolgende?: string;
  neeResultaat?: string;
  neeVolgende?: string;
  minLevel?: UserLevel;
}

export type DecisionTreeMode =
  | 'beginner'
  | 'phase1-afslag'
  | 'phase1-kling'
  | 'phase1-geretoucheerde-kling'
  | 'phase1-rugmes'
  | 'phase1-klingschrabber'
  | 'phase1-schrabber'
  | 'phase2-schrabber'
  | 'phase2-spits';

interface TreeDefinition {
  label: string;
  startQuestionId: string;
  questions: Record<string, QuestionNode>;
}

// Minimale niveaus voor beginner-eindresultaten.
// Resultaten zonder vermelding zijn beschikbaar op 'beginner'.
export const resultMinLevels: Record<string, UserLevel> = {
  'kern-levallois': 'gevorderd',
  'kern-diskusvormig': 'gevorderd',
  'kern-kling': 'gevorderd',
  'kern-afslag': 'gevorderd',
  'vuistbijl': 'gevorderd',
  'chopper-of-chopping-tool': 'gevorderd',
  'kernwerktuig-grof': 'gevorderd',
  'boor-of-priem': 'gevorderd',
  'kernwerktuig-klein': 'gevorderd',
  'rugmes': 'gevorderd',
  'klingschrabber': 'gevorderd',
  'geretoucheerde-kling': 'gevorderd',
  'schrabber': 'gevorderd',
  'spits': 'gevorderd',
  'geretoucheerde-afslag': 'gevorderd',
};

const beginnerTree: Record<string, QuestionNode> = {
  '1': {
    id: '1',
    vraag: 'Is het object kleiner dan 1 cm en niet bewerkt?',
    toelichting: "Zeer kleine onbewerkte stukjes vuursteen worden 'splinters' genoemd en zijn meestal afvalproducten.",
    jaResultaat: 'splinter',
    neeVolgende: '2',
  },
  '2': {
    id: '2',
    vraag: 'Heeft het object een doorboring (gat) die door mensen is gemaakt?',
    toelichting: 'Kijk of er een gat doorheen gaat dat niet natuurlijk is ontstaan. Doorboorde objecten zijn vaak sieraden of werktuigen.',
    jaVolgende: '200',
    neeVolgende: '3',
  },
  '3': {
    id: '3',
    vraag: 'Is het materiaal vuursteen, kwartsiet of lydiet?',
    toelichting: 'Kies JA als het een van deze drie is: Vuursteen (grijs/bruin, gladde breukvlakken), Kwartsiet (hard, korrelig), of Lydiet (zwarte leisteen). Kies NEE als het een andere steensoort is (bijv. graniet, zandsteen).',
    jaVolgende: '5',
    neeVolgende: '4',
  },
  '4': {
    id: '4',
    vraag: 'Heeft het de vorm van een geslepen bijl?',
    toelichting: 'Geslepen bijlen van andere steensoorten (zoals graniet) hebben gladde, gepolijste vlakken.',
    jaResultaat: 'geslepen-bijl-andere-steensoort',
    neeResultaat: 'geslepen-stenen-artefact',
  },
  '5': {
    id: '5',
    vraag: 'Heeft het object geslepen of gepolijste vlakken?',
    toelichting: 'Geslepen vlakken zijn glad en glanzend, anders dan de ruwe breukvlakken van vuursteen.',
    jaVolgende: '100',
    neeVolgende: '6',
  },
  '6': {
    id: '6',
    vraag: 'Heeft het object een ventrale (buik)zijde?',
    toelichting: 'De ventrale zijde is de onderkant van een afslag: glad met een slagbult bij het slagpunt. Als dit aanwezig is, is het een afslag of kling.',
    jaVolgende: '40',
    neeVolgende: '7',
  },
  '7': {
    id: '7',
    vraag: 'Heeft het object afslagnegatieven (littekens van verwijderde afslagen)?',
    toelichting: 'Afslagnegatieven zijn de holle vlakken die ontstaan waar eerder stukken zijn afgeslagen.',
    jaVolgende: '8',
    neeResultaat: 'natuursteen-of-knol',
  },
  '8': {
    id: '8',
    vraag: 'Heeft het meer dan 2 afslagnegatieven?',
    toelichting: 'Objecten met slechts 1-2 afslagnegatieven kunnen natuurlijk gebroken zijn. Meer dan 2 duidt op menselijke bewerking.',
    jaVolgende: '9',
    neeResultaat: 'brok-of-vorstsplijting',
  },
  '9': {
    id: '9',
    vraag: 'Heeft het een duidelijke werkkant of punt?',
    toelichting: 'Een werkkant is een rand die bewerkt is voor gebruik (snijden, schrapen). Een punt is een scherpe uitstekende punt.',
    jaVolgende: '20',
    neeVolgende: '10',
  },
  '10': {
    id: '10',
    vraag: 'Is het een kern (reststuk na het maken van afslagen)?',
    toelichting: 'Een kern is het blok waarvan afslagen zijn geslagen. Het heeft meerdere afslagnegatieven en vaak een herkenbaar slagvlak.',
    jaVolgende: '11',
    neeResultaat: 'onbepaald-artefact',
  },
  '11': {
    id: '11',
    vraag: 'Heeft de kern één of meerdere grote, herkenbare slagvlakken?',
    toelichting: 'Het slagvlak is het vlak waarop geslagen werd om afslagen te produceren.',
    jaVolgende: '12',
    neeResultaat: 'kern-gelegenheids',
  },
  '12': {
    id: '12',
    vraag: 'Heeft de kern naar het midden gerichte afslagnegatieven aan beide zijden (schildpadvorm)?',
    toelichting: 'Dit is typisch voor de Levallois-techniek uit het Midden-Paleolithicum.',
    jaResultaat: 'kern-levallois',
    neeVolgende: '13',
  },
  '13': {
    id: '13',
    vraag: 'Heeft de kern een discusvorm (rond, aan beide zijden bewerkt)?',
    toelichting: 'Discuskernen zijn rond en hebben aan beide kanten afslagnegatieven naar het midden gericht.',
    jaResultaat: 'kern-diskusvormig',
    neeVolgende: '14',
  },
  '14': {
    id: '14',
    vraag: 'Zijn de afslagnegatieven vooral langwerpig (voor klingproductie)?',
    toelichting: 'Klingkernen hebben lange, parallelle afslagnegatieven.',
    jaResultaat: 'kern-kling',
    neeResultaat: 'kern-afslag',
  },
  '20': {
    id: '20',
    vraag: 'Is het groter dan 6 cm en aan twee zijden bewerkt (bifaciaal)?',
    toelichting: 'Grote bifaciale werktuigen zijn vaak vuistbijlen of hakwerktuigen.',
    jaVolgende: '21',
    neeVolgende: '25',
  },
  '21': {
    id: '21',
    vraag: 'Heeft het een symmetrische, druppel- of hartvorm?',
    toelichting: 'Vuistbijlen hebben vaak een kenmerkende symmetrische vorm.',
    jaResultaat: 'vuistbijl',
    neeVolgende: '22',
  },
  '22': {
    id: '22',
    vraag: 'Heeft het een snijdende kant aan één zijde?',
    toelichting: 'Choppers en chopping tools hebben een bekapte rand aan één kant.',
    jaResultaat: 'chopper-of-chopping-tool',
    neeResultaat: 'kernwerktuig-grof',
  },
  '25': {
    id: '25',
    vraag: 'Heeft het een scherpe punt?',
    toelichting: 'Kleine kernwerktuigen met een punt kunnen boren of priemen zijn.',
    jaResultaat: 'boor-of-priem',
    neeResultaat: 'kernwerktuig-klein',
  },
  '40': {
    id: '40',
    vraag: 'Is het object minstens 2x zo lang als breed?',
    toelichting: 'Een kling is een langwerpige afslag (lengte ≥ 2x breedte).',
    jaVolgende: '50',
    neeVolgende: '60',
  },
  '50': {
    id: '50',
    vraag: 'Is de kling verder bewerkt (geretoucheerd)?',
    toelichting: 'Retouche zijn kleine afslagjes langs de rand voor het scherpen of vormen van het werktuig.',
    jaVolgende: '51',
    neeResultaat: 'kling-onbewerkt',
  },
  '51': {
    id: '51',
    vraag: 'Heeft de kling een stompe (afgeknotte) rug?',
    toelichting: 'Rugmessen hebben een afgestompte rug om het werktuig vast te kunnen houden.',
    jaResultaat: 'rugmes',
    neeVolgende: '52',
  },
  '52': {
    id: '52',
    vraag: 'Heeft de kling retouche aan het uiteinde (schrabber)?',
    toelichting: 'Klingschrabbers hebben een afgeronde, geretoucheerde kop.',
    jaResultaat: 'klingschrabber',
    neeResultaat: 'geretoucheerde-kling',
  },
  '60': {
    id: '60',
    vraag: 'Is de afslag verder bewerkt (geretoucheerd)?',
    toelichting: 'Bewerkte afslagen zijn vaak werktuigen zoals schrabbers of spitsen.',
    jaVolgende: '61',
    neeResultaat: 'afslag-onbewerkt',
  },
  '61': {
    id: '61',
    vraag: 'Heeft de afslag een ronde, geretoucheerde kop?',
    toelichting: 'Dit is typisch voor schrabbers, gebruikt voor het bewerken van huiden.',
    jaResultaat: 'schrabber',
    neeVolgende: '62',
  },
  '62': {
    id: '62',
    vraag: 'Heeft de afslag een scherpe punt?',
    toelichting: 'Spitsen werden gebruikt als projectielpunt of priem.',
    jaResultaat: 'spits',
    neeResultaat: 'geretoucheerde-afslag',
  },
  '100': {
    id: '100',
    vraag: 'Heeft het de vorm van een bijl (breed snijvlak)?',
    toelichting: 'Geslepen bijlen hebben een breed snijvlak aan één kant.',
    jaResultaat: 'geslepen-vuurstenen-bijl',
    neeResultaat: 'geslepen-vuurstenen-artefact',
  },
  '200': {
    id: '200',
    vraag: 'Is het een stenen bijl met een gat voor de steel?',
    toelichting: 'Hamerbijlen en strijdhamers hebben een doorboring voor bevestiging aan een houten steel.',
    jaResultaat: 'hamerbijl',
    neeResultaat: 'doorboord-artefact',
  },
};

const phase1AfslagTree: Record<string, QuestionNode> = {
  '42': {
    id: '42',
    vraag: 'Heeft de afslag twee ventrale zijdes?',
    toelichting: 'Een Kombewa-afslag heeft twee ventrale vlakken en is een herkenbaar speciaal type afslag.',
    jaResultaat: 'afslag--kombewa',
    neeVolgende: '44',
  },
  '44': {
    id: '44',
    vraag: 'Heeft de afslag (deels) cortex op de dorsale zijde?',
    toelichting: 'Cortex wijst op een vroege fase in het reductieproces.',
    jaResultaat: 'afslag--decorticatie',
    neeVolgende: '46',
  },
  '46': {
    id: '46',
    vraag: 'Heeft de afslag kenmerken van een Levallois-afslag?',
    toelichting: 'Let op een voorbereid dorsaal patroon en een typisch regelmatige vorm.',
    jaResultaat: 'afslag--levallois',
    neeVolgende: '48',
  },
  '48': {
    id: '48',
    vraag: 'Heeft de afslag de vorm van een Levallois-spits?',
    toelichting: 'Driehoekige Levallois-afslagen kunnen als spits worden geclassificeerd.',
    jaResultaat: 'spits--levallois',
    neeVolgende: '52',
  },
  '52': {
    id: '52',
    vraag: 'Lijkt het op een pseudo-Levallois-spits?',
    toelichting: 'Dat type lijkt op een Levallois-spits, maar volgt een andere slagrichting.',
    jaResultaat: 'spits--pseudo--levallois',
    neeVolgende: '54',
  },
  '54': {
    id: '54',
    vraag: 'Is dit een afslag voor kernpreparatie?',
    toelichting: 'Kernpreparatie-afslagen helpen de kern in vorm te brengen voor latere gewenste afslagen.',
    jaResultaat: 'afslag--kernpreparatie',
    neeVolgende: '56',
  },
  '56': {
    id: '56',
    vraag: 'Is dit een kernvernieuwings-afslag?',
    toelichting: 'Bij kernvernieuwing wordt een slagvlak of rand van de kern opnieuw voorbereid.',
    jaResultaat: 'afslag--kernvernieuwing',
    neeVolgende: '58',
  },
  '58': {
    id: '58',
    vraag: 'Komt de afslag van een bifaciaal bewerkt werktuig zoals een vuistbijl?',
    toelichting: 'Bifaciale reductieafslagen kunnen herkenbaar zijn aan hun vorm en dorsale littekens.',
    jaResultaat: 'afslag--vuistbijl',
    neeVolgende: '60',
  },
  '60': {
    id: '60',
    vraag: 'Is de afslag gedeeltelijk geslepen?',
    toelichting: 'Bijlafslagen met slijpsporen duiden op een geslepen bijl als bronartefact.',
    jaResultaat: 'afslag--geslepen--bijl',
    neeResultaat: 'afslag',
  },
};

const phase1KlingTree: Record<string, QuestionNode> = {
  '71': {
    id: '71',
    vraag: 'Heeft de kling (deels) cortex op de dorsale zijde?',
    toelichting: 'Cortex op een kling kan wijzen op een decorticatie-kling of natuurlijke rug.',
    jaVolgende: '71a',
    neeVolgende: '73',
  },
  '71a': {
    id: '71a',
    vraag: 'Ligt de cortex tegenover een scherpe zijde?',
    toelichting: 'Dan is een natuurlijke rug waarschijnlijk en kom je bij een rugmes uit.',
    jaResultaat: 'rugmes',
    neeResultaat: 'kling--decorticatie',
  },
  '73': {
    id: '73',
    vraag: 'Heeft de kling kenmerken van een Levallois-kling?',
    toelichting: 'Kijk naar een voorbereid dorsaal patroon en regelmatige, doelgerichte klingvorm.',
    jaResultaat: 'kling--levallois',
    neeVolgende: '75',
  },
  '75': {
    id: '75',
    vraag: 'Is dit een kling voor kernpreparatie?',
    toelichting: 'Sommige klingen zijn vooral ontstaan tijdens het prepareren van de kern.',
    jaResultaat: 'kling--kernpreparatie',
    neeVolgende: '77',
  },
  '77': {
    id: '77',
    vraag: 'Heeft de kling kenmerken van Montbani-stijl?',
    toelichting: 'Montbani-klingen hebben een herkenbaar langgerekt negatievenpatroon.',
    jaResultaat: 'kling--montbanistijl',
    neeVolgende: '79',
  },
  '79': {
    id: '79',
    vraag: 'Is de kling smal en licht vlak of vierkant in dwarsdoorsnede?',
    toelichting: 'Dan kan het om een stekerafslag gaan.',
    jaResultaat: 'stekerafslag',
    neeVolgende: '81',
  },
  '81': {
    id: '81',
    vraag: 'Is de kling bijzonder smal, met breedte kleiner dan 10 mm?',
    toelichting: 'Dat wijst op een lamelle.',
    jaResultaat: 'lamelle',
    neeVolgende: '83',
  },
  '83': {
    id: '83',
    vraag: 'Heeft de kling kenmerken van Coincy-stijl?',
    toelichting: 'Coincy-klingen vormen een specialistische klinggroep.',
    jaResultaat: 'kling--coincystijl',
    neeResultaat: 'kling',
  },
};

const phase1GeretoucheerdeKlingTree: Record<string, QuestionNode> = {
  '390': {
    id: '390',
    vraag: 'Heeft het artefact gedeeltelijk (half-) steil geretoucheerde zijden?',
    toelichting: 'Dit onderscheidt steile retouche van vlakke rand- of oppervlakteretouche.',
    jaVolgende: '391',
    neeResultaat: 'geretoucheerde-kling',
  },
  '391': {
    id: '391',
    vraag: 'Heeft het artefact een duidelijke punt?',
    toelichting: 'Een duidelijke punt wijst op een spitsachtig subtype en vraagt een latere fase.',
    jaResultaat: 'spits',
    neeVolgende: '397',
  },
  '397': {
    id: '397',
    vraag: 'Zijn de zijden steil geretoucheerd zonder duidelijke punt?',
    toelichting: 'Dan zit je in de groep steil geretoucheerde klingen.',
    jaVolgende: '399',
    neeResultaat: 'geretoucheerde-kling',
  },
  '399': {
    id: '399',
    vraag: 'Ligt de geretoucheerde zijde rechthoekig ten opzichte van de vorm?',
    toelichting: 'Hiermee onderscheid je een rechthoekige variant.',
    jaResultaat: 'kling--steil-geretoucheerd--rechthoekig',
    neeVolgende: '400',
  },
  '400': {
    id: '400',
    vraag: 'Loopt een steil geretoucheerde zijde door tot aan een uiteinde?',
    toelichting: 'Dan past het beter bij de driehoekige variant.',
    jaResultaat: 'kling--steil-geretoucheerd--driehoekig',
    neeVolgende: '401',
  },
  '401': {
    id: '401',
    vraag: 'Is het artefact aan vier zijden steil geretoucheerd?',
    toelichting: 'Vierzijdige retouche vormt een apart subtype.',
    jaResultaat: 'kling--steil-geretoucheerd--vierzijdig',
    neeResultaat: 'kling--steil-geretoucheerd',
  },
};

const phase1RugmesTree: Record<string, QuestionNode> = {
  '381': {
    id: '381',
    vraag: 'Heeft het rugmes retouche?',
    toelichting: 'Een natuurlijke rug zonder verdere retouche blijft een apart subtype.',
    jaResultaat: 'rugmes--met-natuurlijke--rug',
    neeVolgende: '382',
  },
  '382': {
    id: '382',
    vraag: 'Heeft het rugmes een relatief dunne en gebogen geretoucheerde rug?',
    toelichting: 'Dat wijst op Aubry-Audi / klingmes-achtige vormen.',
    jaResultaat: 'rugmes-aubri--audi',
    neeVolgende: '383',
  },
  '383': {
    id: '383',
    vraag: 'Heeft het een duidelijke geretoucheerde rug?',
    toelichting: 'Hiermee onderscheid je klingmes/rugmes-varianten.',
    jaResultaat: 'rugmes-klingmes--geretoucheerd',
    neeVolgende: '384',
  },
  '384': {
    id: '384',
    vraag: 'Heeft het rugmes een min of meer steil geretoucheerde rug?',
    toelichting: 'Dan blijft het subtype rugmes-geretoucheerd over.',
    jaResultaat: 'rugmes--geretoucheerd',
    neeResultaat: 'rugmes',
  },
};

const phase1KlingschrabberTree: Record<string, QuestionNode> = {
  '335': {
    id: '335',
    vraag: 'Heeft de klingschrabber een schrabberkap aan één uiteinde?',
    toelichting: 'Daarmee onderscheid je enkelvoudige en dubbele varianten.',
    jaResultaat: 'schrabber--kling--enkelvoudig',
    neeVolgende: '336',
  },
  '336': {
    id: '336',
    vraag: 'Heeft de klingschrabber schrabberkappen aan twee uiteinden?',
    toelichting: 'Twee actieve uiteinden vormen een aparte subtypegroep.',
    jaResultaat: 'schrabber--kling--dubbel',
    neeResultaat: 'klingschrabber',
  },
};

const phase1SchrabberTree: Record<string, QuestionNode> = {
  '337': {
    id: '337',
    vraag: 'Is de schrabber gemaakt van een vorstsplijting?',
    toelichting: 'Schrabbers op vorstsplijting vormen een apart subtype.',
    jaResultaat: 'schrabber--op-vorstsplijting',
    neeResultaat: 'schrabber',
  },
};

const phase2SchrabberTree: Record<string, QuestionNode> = {
  '321': {
    id: '321',
    vraag: "Is dit een 'normale' schrabber en niet vooral een combinatievorm?",
    toelichting: 'De AWN-bron onderscheidt eerst normale schrabbers van meer uitzonderlijke of gecombineerde vormen.',
    jaVolgende: '322',
    neeVolgende: '329',
  },
  '322': {
    id: '322',
    vraag: 'Ligt de schrabberkap tegenover een ventraal geretoucheerde afknotting?',
    toelichting: 'Dan gaat het om een Caminade-schraper.',
    jaResultaat: 'schrabber--caminade',
    neeVolgende: '323',
  },
  '323': {
    id: '323',
    vraag: 'Is het een grote ronde of ovale schrabber?',
    toelichting: 'Grote ronde of ovale schrabbers vormen een aparte subtypegroep.',
    jaResultaat: 'schrabber--groot-rondovaal',
    neeVolgende: '324',
  },
  '324': {
    id: '324',
    vraag: 'Is het artefact een schrabber kleiner dan 18 mm?',
    toelichting: 'Dat past bij een micro- of knoopschrabber.',
    jaResultaat: 'schrabber--micro-of-knoop',
    neeVolgende: '325',
  },
  '325': {
    id: '325',
    vraag: 'Is de schrabber kort en kleiner dan 3 cm breed?',
    toelichting: 'Dat past bij een duimnagelschrapper.',
    jaResultaat: 'schrabber--duimnagel',
    neeVolgende: '326',
  },
  '326': {
    id: '326',
    vraag: 'Heeft de schrabber een smalle, relatief dikke schrabberkap?',
    toelichting: 'Dan gaat het richting een snuitvormige schrabber.',
    jaResultaat: 'schrabber--snuitvormig',
    neeVolgende: '327',
  },
  '327': {
    id: '327',
    vraag: 'Heeft de schrabber een boor- of bec-vormig uiteinde?',
    toelichting: 'Dat is een duidelijke subtypegroep binnen de schrabbers.',
    jaResultaat: 'schrabber--bec-vormig',
    neeVolgende: '328',
  },
  '328': {
    id: '328',
    vraag: 'Is het artefact omgekeerd bootvormig?',
    toelichting: 'Dat past bij een caréné/rabot-achtige bootvormige schrabber.',
    jaResultaat: 'schrabber--bootvormig',
    neeVolgende: '329',
  },
  '329': {
    id: '329',
    vraag: 'Is de schrabber gemaakt van een afslag?',
    toelichting: 'AWN splitst schrabbers daarna naar afslag, kling of vorstsplijting.',
    jaVolgende: '330',
    neeVolgende: '333',
  },
  '330': {
    id: '330',
    vraag: 'Is de schrabber gemaakt aan één uiteinde van een afslag?',
    toelichting: 'Dan is het een enkelvoudige afslag-schrabber.',
    jaResultaat: 'schrabber--afslag--enkelvoudig',
    neeVolgende: '331',
  },
  '331': {
    id: '331',
    vraag: 'Is de schrabber gemaakt aan twee uiteinden van een afslag?',
    toelichting: 'Dan is het een dubbele afslag-schrabber.',
    jaResultaat: 'schrabber--afslag--dubbel',
    neeVolgende: '332',
  },
  '332': {
    id: '332',
    vraag: 'Is de schrabber gemaakt aan een zijkant van een afslag?',
    toelichting: 'Dan gaat het om een zijschrabber.',
    jaResultaat: 'schrabber--zij',
    neeResultaat: 'schrabber--afslag',
  },
  '333': {
    id: '333',
    vraag: 'Is de schrabber gemaakt van een kling?',
    toelichting: 'Kling-schrabbers vormen een aparte subtypegroep.',
    jaVolgende: '334',
    neeVolgende: '337',
  },
  '334': {
    id: '334',
    vraag: 'Heeft de klingschrabber taps toelopende geretoucheerde zijden aan de achterkant?',
    toelichting: 'Dat past bij een Wehlen- of gesteelde schrabber.',
    jaResultaat: 'schrabber--wehlen-of-gesteeld',
    neeVolgende: '335',
  },
  '335': {
    id: '335',
    vraag: 'Heeft de klingschrabber een schrabberkap aan één uiteinde?',
    toelichting: 'Daarmee onderscheid je enkelvoudige en dubbele klingschrabbers.',
    jaResultaat: 'schrabber--kling--enkelvoudig',
    neeVolgende: '336',
  },
  '336': {
    id: '336',
    vraag: 'Heeft de klingschrabber schrabberkappen aan twee uiteinden?',
    toelichting: 'Twee actieve uiteinden vormen een aparte subtypegroep.',
    jaResultaat: 'schrabber--kling--dubbel',
    neeResultaat: 'schrabber--kling',
  },
  '337': {
    id: '337',
    vraag: 'Is de schrabber gemaakt van een vorstsplijting?',
    toelichting: 'Schrabbers op vorstsplijting vormen een apart subtype.',
    jaResultaat: 'schrabber--op-vorstsplijting',
    neeResultaat: 'schrabber',
  },
};

const phase2SpitsTree: Record<string, QuestionNode> = {
  '540': {
    id: '540',
    vraag: 'Heeft het artefact oppervlakteretouche?',
    toelichting: 'Oppervlakteretouche opent in de AWN-boom een aparte spitsengroep.',
    jaVolgende: '543',
    neeVolgende: '410',
  },
  '543': {
    id: '543',
    vraag: 'Heeft het artefact een driehoekige vorm?',
    toelichting: 'Driehoekige vormen worden anders uitgewerkt dan bladvormige spitsen.',
    jaVolgende: '544',
    neeVolgende: '553',
  },
  '544': {
    id: '544',
    vraag: 'Heeft het artefact de vorm van een ongelijkbenige driehoek?',
    toelichting: 'Ongelijkbenige en gelijkbenige vormen lopen in de bron uiteen.',
    jaResultaat: 'spits--ongelijkbenige--driehoek--met-oppervlakteretouche',
    neeVolgende: '546',
  },
  '546': {
    id: '546',
    vraag: 'Heeft het artefact de vorm van een gelijkbenige driehoek?',
    toelichting: 'Bij gelijkbenige driehoeken is vlakke randretouche een belangrijk onderscheid.',
    jaVolgende: '547',
    neeVolgende: '552',
  },
  '547': {
    id: '547',
    vraag: 'Vertoont het vlakke randretouche?',
    toelichting: 'Dat past bij een LBK-spits met oppervlakteretouche.',
    jaResultaat: 'spits--lbk--met-oppervlakteretouche',
    neeVolgende: '548',
  },
  '548': {
    id: '548',
    vraag: 'Heeft het artefact met oppervlakteretouche een driehoekige vorm?',
    toelichting: 'Dan blijft de generieke groep driehoekige spitsen met oppervlakteretouche over.',
    jaVolgende: '549',
    neeResultaat: 'spits--met-oppervlakte--retouche',
  },
  '549': {
    id: '549',
    vraag: 'Heeft het driehoekige artefact een rechte basis?',
    toelichting: 'Rechte en holle basis lopen daarna uiteen.',
    jaResultaat: 'spits--driehoekig--met-oppervlakteretouche--rechte-basis',
    neeVolgende: '551',
  },
  '551': {
    id: '551',
    vraag: 'Is het artefact driehoekig met een holle basis?',
    toelichting: 'Dan is er een aparte subtypegroep met holle basis.',
    jaResultaat: 'spits--driehoekig--met-oppervlakteretouche--holle-basis',
    neeResultaat: 'spits--driehoekig--met-oppervlakteretouche',
  },
  '552': {
    id: '552',
    vraag: 'Is het artefact nagenoeg gelijkzijdig driehoekig?',
    toelichting: 'Gelijkzijdige oppervlakteretouche-spitsen vormen een apart subtype.',
    jaResultaat: 'spits--gelijkzijdige--driehoek',
    neeResultaat: 'spits--met-oppervlakte--retouche',
  },
  '553': {
    id: '553',
    vraag: 'Is het artefact bladvormig?',
    toelichting: 'Bladspitsen vormen binnen de oppervlakteretouche-spitsen een eigen groep.',
    jaVolgende: '554',
    neeResultaat: 'spits--met-oppervlakte--retouche',
  },
  '554': {
    id: '554',
    vraag: 'Zijn alleen top en basis geretoucheerd?',
    toelichting: 'Dat wijst op een Jerzmanowice-bladspits.',
    jaResultaat: 'spits--bladspits--jerzmanowice',
    neeVolgende: '555',
  },
  '555': {
    id: '555',
    vraag: 'Heeft de bladspits een vrij puntige top en vrij afgeronde basis?',
    toelichting: 'Dat past bij de vlakke bladspits.',
    jaResultaat: 'spits--bladspits--vlak',
    neeVolgende: '556',
  },
  '556': {
    id: '556',
    vraag: 'Heeft de bladspits een ronde basis?',
    toelichting: 'Ronde en schuine basis worden apart onderscheiden.',
    jaResultaat: 'spits--bladspits--met-ronde--basis',
    neeVolgende: '557',
  },
  '557': {
    id: '557',
    vraag: 'Heeft de bladspits een schuine basis?',
    toelichting: 'Dan past het bij de bladspits met schuine basis.',
    jaResultaat: 'spits--bladspits--met-schuine--basis',
    neeResultaat: 'spits--bladspits',
  },
  '410': {
    id: '410',
    vraag: 'Is de spits gesteeld of heeft die een gekerfde basis?',
    toelichting: 'Gesteelde of gekerfde spitsen openen een aparte subtypegroep.',
    jaVolgende: '412',
    neeVolgende: '430',
  },
  '412': {
    id: '412',
    vraag: 'Is de spits aan één zijde gekerfd?',
    toelichting: 'Eén- of tweezijdig gekerfde bases worden verschillend behandeld.',
    jaVolgende: '413',
    neeVolgende: '419',
  },
  '413': {
    id: '413',
    vraag: 'Vormen de geretoucheerde kerven een echte steel?',
    toelichting: 'Dan kom je uit bij steelspitsen als Ahrensburg/Hintersee.',
    jaResultaat: 'spits--steel--ahrensburg-og-hintersee--spits',
    neeVolgende: '415',
  },
  '415': {
    id: '415',
    vraag: 'Is de basis door een kerf versmald en kegelvormig geretoucheerd?',
    toelichting: 'Dat is een specifieke kerfspitsvariant.',
    jaResultaat: 'spits--kerf-met-kegelvormig--geretoucheerde--basis',
    neeVolgende: '416',
  },
  '416': {
    id: '416',
    vraag: 'Heeft de spits het ongeretoucheerde feather-uiteinde van een kling?',
    toelichting: 'Dat past bij Bromme/Lyngby-achtige steelspitsen.',
    jaResultaat: 'spits--bromme',
    neeVolgende: '417',
  },
  '417': {
    id: '417',
    vraag: 'Heeft de spits een bifaciaal geretoucheerde basis?',
    toelichting: 'Dan past ze bij Swidry-achtige vormen.',
    jaResultaat: 'spits--swidry',
    neeVolgende: '418',
  },
  '418': {
    id: '418',
    vraag: 'Heeft de spits een vaak ogiefvormige top?',
    toelichting: 'Dan is Font-Robert een logische uitkomst.',
    jaResultaat: 'spits--font-robert',
    neeResultaat: 'spits--steel',
  },
  '419': {
    id: '419',
    vraag: 'Heeft de spits duidelijke steile retouchering?',
    toelichting: 'Daarmee kom je uit bij Teyat of een meer generieke steelspits.',
    jaResultaat: 'spits--teyat',
    neeVolgende: '420',
  },
  '420': {
    id: '420',
    vraag: 'Is de spits gemaakt met oppervlakteretouche?',
    toelichting: 'Dan past Kostienki binnen deze groep.',
    jaResultaat: 'spits--kostienki',
    neeVolgende: '421',
  },
  '421': {
    id: '421',
    vraag: 'Heeft de spits een lange kerf aan één zijde en vaak een ogiefvormige punt?',
    toelichting: 'Dat onderscheidt Magdalenien- van Hamburg-achtige kerfspitsen.',
    jaResultaat: 'spits--kerf-magdalenien',
    neeResultaat: 'spits--kerf-hamburg',
  },
  '430': {
    id: '430',
    vraag: 'Heeft de spits een duidelijke geometrische vorm zoals driehoek, vierhoek of segment?',
    toelichting: 'AWN splitst geometrische spitsen af van andere steil geretoucheerde vormen.',
    jaVolgende: '431',
    neeVolgende: '476',
  },
  '431': {
    id: '431',
    vraag: 'Heeft de spits een driehoekige vorm?',
    toelichting: 'Driehoekige, vierhoekige en segmentvormige spitsen worden apart uitgewerkt.',
    jaVolgende: '432',
    neeVolgende: '450',
  },
  '432': {
    id: '432',
    vraag: 'Is de driehoekige spits kleiner dan 10 mm?',
    toelichting: 'Dan gaat het om een micro-driehoek.',
    jaResultaat: 'spits--driehoek--micro',
    neeVolgende: '433',
  },
  '433': {
    id: '433',
    vraag: 'Heeft de spits iets vlakkere, vaak ventrale randretouche?',
    toelichting: 'Dat wijst op een LBK-spits.',
    jaResultaat: 'spits--lbk',
    neeVolgende: '434',
  },
  '434': {
    id: '434',
    vraag: 'Is het een ongelijkbenige driehoek?',
    toelichting: 'Ongelijkbenige en gelijkbenige driehoeken zijn aparte subtypen.',
    jaResultaat: 'spits--driehoek--ongelijkbenig',
    neeVolgende: '435',
  },
  '435': {
    id: '435',
    vraag: 'Is het een gelijkbenige driehoek met ongeretoucheerde hypotenusa?',
    toelichting: 'Dan past de gelijkbenige driehoek.',
    jaResultaat: 'spits--driehoek--gelijkbenig',
    neeVolgende: '436',
  },
  '436': {
    id: '436',
    vraag: 'Heeft de spits een geretoucheerde basis (retouche inverse plat RIP)?',
    toelichting: 'Dan gaat het richting Frère.',
    jaResultaat: 'spits--frère',
    neeVolgende: '437',
  },
  '437': {
    id: '437',
    vraag: 'Heeft de spits een ventraal geretoucheerde basis (RIP)?',
    toelichting: 'Dan past Dreuil beter.',
    jaResultaat: 'spits--dreuil',
    neeVolgende: '439',
  },
  '439': {
    id: '439',
    vraag: 'Neigt de vorm meer naar een trapezium dan naar een driehoek?',
    toelichting: 'Zo blijft een langwerpig trapezium of generieke driehoek over.',
    jaResultaat: 'spits--trapezium--langwerpig',
    neeResultaat: 'spits--driehoekig',
  },
  '450': {
    id: '450',
    vraag: 'Heeft de spits een vierhoekige vorm?',
    toelichting: 'Vierhoeken en segmenten lopen daarna uiteen.',
    jaVolgende: '451',
    neeVolgende: '470',
  },
  '451': {
    id: '451',
    vraag: 'Heeft de vierhoekige spits één haakse zijde?',
    toelichting: 'Dan past een rechthoekig trapezium.',
    jaResultaat: 'spits--trapezium--rechthoekig',
    neeVolgende: '452',
  },
  '452': {
    id: '452',
    vraag: 'Heeft de spits een rombische vierhoekige vorm?',
    toelichting: 'Dan kom je uit bij de rombische vierhoek / Zonhovenspits.',
    jaResultaat: 'spits--vierhoek--rombisch-og-zonhovenspits',
    neeVolgende: '453',
  },
  '453': {
    id: '453',
    vraag: 'Heeft de spits een onregelmatig vierhoekige vorm?',
    toelichting: 'Daarmee onderscheid je de onregelmatige transversaalspits.',
    jaResultaat: 'spits--transversaal--onregelmatig--gevormd',
    neeVolgende: '454',
  },
  '454': {
    id: '454',
    vraag: 'Is de lengte-breedteverhouding kleiner dan 1?',
    toelichting: 'Dan past een transversale spits.',
    jaResultaat: 'spits--transversaal',
    neeVolgende: '455',
  },
  '455': {
    id: '455',
    vraag: 'Ligt de lengte-breedteverhouding tussen 1 en 2?',
    toelichting: 'Dan gaat het om een breed trapezium.',
    jaResultaat: 'spits--trapezium--breed',
    neeVolgende: '456',
  },
  '456': {
    id: '456',
    vraag: 'Is de lengte-breedteverhouding groter dan 2?',
    toelichting: 'Dan blijft een smal trapezium over.',
    jaResultaat: 'spits--trapezium--smal',
    neeResultaat: 'spits--vierhoekig',
  },
  '470': {
    id: '470',
    vraag: 'Heeft de spits twee punten en de vorm van een cirkelsegment?',
    toelichting: 'Segmentvormige spitsen vragen nog een paar subtypevragen.',
    jaVolgende: '471',
    neeVolgende: '476',
  },
  '471': {
    id: '471',
    vraag: 'Is één zijde enigszins afgeknot?',
    toelichting: 'Dan past Azilien.',
    jaResultaat: 'spits--azilien',
    neeVolgende: '472',
  },
  '472': {
    id: '472',
    vraag: 'Is de bolle zijde van de relatief smalle spits geretoucheerd?',
    toelichting: 'Dat wijst op een cirkelsegment-spits.',
    jaResultaat: 'spits--cirkelsegment',
    neeVolgende: '473',
  },
  '473': {
    id: '473',
    vraag: 'Is juist de rechte zijde geretoucheerd en de bolle zijde niet?',
    toelichting: 'Dan gaat het om een dubbelspits.',
    jaResultaat: 'spits--dubbel',
    neeVolgende: '474',
  },
  '474': {
    id: '474',
    vraag: 'Heeft de spits marginale, vaak ventrale retouche?',
    toelichting: 'Dat past bij Fléchette.',
    jaResultaat: 'spits--fléchette',
    neeResultaat: 'spits--segmentvormig',
  },
  '476': {
    id: '476',
    vraag: 'Heeft de spits mogelijk een geretoucheerde basis?',
    toelichting: 'Dat splitst de eenzijdig en tweezijdig geretoucheerde groepen verder op.',
    jaVolgende: '477',
    neeVolgende: '496',
  },
  '477': {
    id: '477',
    vraag: 'Heeft de spits één geheel geretoucheerde zijde en een geretoucheerde basis?',
    toelichting: 'Dat leidt naar types als C-spits of Svaerdborg.',
    jaVolgende: '485',
    neeVolgende: '478',
  },
  '478': {
    id: '478',
    vraag: 'Heeft de spits één geheel geretoucheerde zijde en is de basis niet geretoucheerd?',
    toelichting: 'Dan zit je in de A/B/lancet/Tjonger-groep.',
    jaVolgende: '479',
    neeVolgende: '493',
  },
  '479': {
    id: '479',
    vraag: 'Is één zijde slechts gedeeltelijk geretoucheerd en schuin afgeknot?',
    toelichting: 'Dat past bij de B-spits.',
    jaResultaat: 'spits--b-spits',
    neeVolgende: '482',
  },
  '482': {
    id: '482',
    vraag: 'Heeft de spits een schuin afgeknotte basis?',
    toelichting: 'Dan past Pennemes/Federmesser.',
    jaResultaat: 'spits--pennemes-og-penknife-point-federmesser',
    neeVolgende: '487',
  },
  '487': {
    id: '487',
    vraag: 'Heeft de spits één volledig geretoucheerde zijde, geen geretoucheerde basis en L:B < 5?',
    toelichting: 'Dan kom je uit bij A-spits.',
    jaResultaat: 'spits--a-spits',
    neeVolgende: '488',
  },
  '488': {
    id: '488',
    vraag: 'Heeft de spits één volledig geretoucheerde zijde, geen geretoucheerde basis en L:B > 5?',
    toelichting: 'Dan gaat het richting Lancet.',
    jaResultaat: 'spits--lancet',
    neeVolgende: '489',
  },
  '489': {
    id: '489',
    vraag: 'Ligt de punt niet op de lengteas en heeft de spits een gebogen geretoucheerde zijde?',
    toelichting: 'Dan past Tjonger.',
    jaResultaat: 'spits--tjonger',
    neeVolgende: '490',
  },
  '490': {
    id: '490',
    vraag: 'Vertoont de geretoucheerde zijde twee duidelijke knikken?',
    toelichting: 'Dan kom je uit bij Cheddar.',
    jaResultaat: 'spits--cheddar',
    neeVolgende: '491',
  },
  '491': {
    id: '491',
    vraag: 'Vertoont de geretoucheerde zijde één duidelijke knik?',
    toelichting: 'Dan is Creswell waarschijnlijk.',
    jaResultaat: 'spits--creswell',
    neeVolgende: '492',
  },
  '492': {
    id: '492',
    vraag: 'Heeft de spits een bolle, sterk gebogen geretoucheerde zijde?',
    toelichting: 'Dan past Châtelperron.',
    jaResultaat: 'spits--châtelperron',
    neeResultaat: 'spits--eenzijdig-geretoucheerd',
  },
  '485': {
    id: '485',
    vraag: 'Is één zijde én de basis geretoucheerd, met soms de andere zijde gedeeltelijk geretoucheerd?',
    toelichting: 'Dan past de C-spits / Tardenoisien-spits.',
    jaResultaat: 'spits--c-spits-og-tardenoisien--spits',
    neeVolgende: '483',
  },
  '483': {
    id: '483',
    vraag: 'Heeft de spits een afgeknotte basis?',
    toelichting: 'Dan past Svaerdborg.',
    jaResultaat: 'spits--svaerdborg',
    neeVolgende: '484',
  },
  '484': {
    id: '484',
    vraag: 'Heeft de spits een schuin afgeknotte basis en een gebogen geretoucheerde zijde?',
    toelichting: 'Dan past Malaurie.',
    jaResultaat: 'spits--malaurie',
    neeResultaat: 'spits--eenzijdig-en-basis-geretoucheerd',
  },
  '493': {
    id: '493',
    vraag: 'Is retouche op dorsale én ventrale zijde aangebracht (gekruist steil geretoucheerd)?',
    toelichting: 'Dan kom je bij Gravette / Blanchère.',
    jaResultaat: 'spits--gravette-og-spits--blanchere',
    neeVolgende: '496',
  },
  '496': {
    id: '496',
    vraag: 'Is aan twee zijden geretoucheerd en ligt L:B onder 5?',
    toelichting: 'Dan past D-spits beter.',
    jaResultaat: 'spits--d-spits',
    neeVolgende: '497',
  },
  '497': {
    id: '497',
    vraag: 'Heeft de spits één scherp uiteinde en L:B boven 5?',
    toelichting: 'Dan kom je uit bij een naaldvormige spits.',
    jaResultaat: 'spits--naaldvormig',
    neeVolgende: '495',
  },
  '495': {
    id: '495',
    vraag: 'Heeft de spits twee scherpe uiteinden en L:B boven 4?',
    toelichting: 'Dan past Sauveterre beter.',
    jaResultaat: 'spits--sauveterre',
    neeVolgende: '499',
  },
  '499': {
    id: '499',
    vraag: 'Is de spits aan beide zijden steil geretoucheerd?',
    toelichting: 'Dan blijft een tweezijdig steil geretoucheerde spits of spitskling over.',
    jaResultaat: 'spits--tweezijdig-steil-geretoucheerd',
    neeResultaat: 'spits',
  },
};

const TREE_DEFINITIONS: Record<DecisionTreeMode, TreeDefinition> = {
  beginner: {
    label: 'Beginner',
    startQuestionId: '1',
    questions: beginnerTree,
  },
  'phase1-afslag': {
    label: 'Fase 1: Afslagverdieping',
    startQuestionId: '42',
    questions: phase1AfslagTree,
  },
  'phase1-kling': {
    label: 'Fase 1: Klingverdieping',
    startQuestionId: '71',
    questions: phase1KlingTree,
  },
  'phase1-geretoucheerde-kling': {
    label: 'Fase 1: Geretoucheerde kling',
    startQuestionId: '390',
    questions: phase1GeretoucheerdeKlingTree,
  },
  'phase1-rugmes': {
    label: 'Fase 1: Rugmes',
    startQuestionId: '381',
    questions: phase1RugmesTree,
  },
  'phase1-klingschrabber': {
    label: 'Fase 1: Klingschrabber',
    startQuestionId: '335',
    questions: phase1KlingschrabberTree,
  },
  'phase1-schrabber': {
    label: 'Fase 1: Schrabber',
    startQuestionId: '337',
    questions: phase1SchrabberTree,
  },
  'phase2-schrabber': {
    label: 'Fase 2: Schrabberverdieping',
    startQuestionId: '321',
    questions: phase2SchrabberTree,
  },
  'phase2-spits': {
    label: 'Fase 2: Spitsverdieping',
    startQuestionId: '540',
    questions: phase2SpitsTree,
  },
};

const DISPLAY_NAMES: Record<string, string> = {
  splinter: 'Splinter (afval)',
  'natuursteen-of-knol': 'Natuursteen of knol (geen artefact)',
  'brok-of-vorstsplijting': 'Brok of vorstsplijting',
  'onbepaald-artefact': 'Onbepaald artefact',
  'kern-gelegenheids': 'Gelegenheids-kern',
  'kern-levallois': 'Levallois-kern',
  'kern-diskusvormig': 'Diskusvormige kern',
  'kern-kling': 'Klingkern',
  'kern-afslag': 'Afslagkern',
  vuistbijl: 'Vuistbijl',
  'chopper-of-chopping-tool': 'Chopper of chopping tool',
  'kernwerktuig-grof': 'Grof kernwerktuig',
  'boor-of-priem': 'Boor of priem',
  'kernwerktuig-klein': 'Klein kernwerktuig',
  'kling-onbewerkt': 'Onbewerkte kling',
  rugmes: 'Rugmes',
  klingschrabber: 'Klingschrabber',
  'geretoucheerde-kling': 'Geretoucheerde kling',
  'afslag-onbewerkt': 'Onbewerkte afslag',
  schrabber: 'Schrabber',
  spits: 'Spits',
  'geretoucheerde-afslag': 'Geretoucheerde afslag',
  'geslepen-vuurstenen-bijl': 'Geslepen vuurstenen bijl',
  'geslepen-vuurstenen-artefact': 'Geslepen vuurstenen artefact',
  'geslepen-bijl-andere-steensoort': 'Geslepen bijl (andere steensoort)',
  'geslepen-stenen-artefact': 'Geslepen stenen artefact',
  hamerbijl: 'Hamerbijl of strijdhamer',
  'doorboord-artefact': 'Doorboord artefact',
  'onbepaald-beginnersniveau': 'Onbepaald (beginnersniveau bereikt)',
  afslag: 'Afslag',
  kling: 'Kling',
  'afslag--kombewa': 'Kombewa-afslag',
  'afslag--decorticatie': 'Decorticatie-afslag',
  'afslag--levallois': 'Levallois-afslag',
  'spits--levallois': 'Levallois-spits',
  'spits--pseudo--levallois': 'Pseudo-Levallois-spits',
  'afslag--kernpreparatie': 'Kernpreparatie-afslag',
  'afslag--kernvernieuwing': 'Kernvernieuwings-afslag',
  'afslag--vuistbijl': 'Vuistbijlafslag',
  'afslag--geslepen--bijl': 'Bijlafslag met slijpsporen',
  'kling--decorticatie': 'Decorticatie-kling',
  'kling--levallois': 'Levallois-kling',
  'kling--kernpreparatie': 'Kernpreparatie-kling',
  'kling--montbanistijl': 'Kling in Montbani-stijl',
  stekerafslag: 'Stekerafslag',
  lamelle: 'Lamelle',
  'kling--coincystijl': 'Kling in Coincy-stijl',
  'rugmes--met-natuurlijke--rug': 'Rugmes met natuurlijke rug',
  'rugmes-aubri--audi': 'Rugmes type Aubry-Audi',
  'rugmes-klingmes--geretoucheerd': 'Geretoucheerd rugmes/klingmes',
  'rugmes--geretoucheerd': 'Geretoucheerd rugmes',
  'schrabber--kling--enkelvoudig': 'Enkelvoudige klingschrabber',
  'schrabber--kling--dubbel': 'Dubbele klingschrabber',
  'schrabber--op-vorstsplijting': 'Schrabber op vorstsplijting',
  'schrabber--caminade': 'Caminade-schrabber',
  'schrabber--groot-rondovaal': 'Grote ronde/ovale schrabber',
  'schrabber--micro-of-knoop': 'Micro- of knoopschrabber',
  'schrabber--duimnagel': 'Duimnagelschrapper',
  'schrabber--snuitvormig': 'Snuitvormige schrabber',
  'schrabber--bec-vormig': 'Bec-vormige schrabber',
  'schrabber--bootvormig': 'Bootvormige schrabber',
  'schrabber--afslag': 'Afslag-schrabber',
  'schrabber--afslag--enkelvoudig': 'Enkelvoudige afslag-schrabber',
  'schrabber--afslag--dubbel': 'Dubbele afslag-schrabber',
  'schrabber--zij': 'Zijschrabber',
  'schrabber--kling': 'Kling-schrabber',
  'schrabber--wehlen-of-gesteeld': 'Wehlen- of gesteelde schrabber',
  'kling--steil-geretoucheerd': 'Steil geretoucheerde kling',
  'kling--steil-geretoucheerd--rechthoekig': 'Steil geretoucheerde rechthoekige kling',
  'kling--steil-geretoucheerd--driehoekig': 'Steil geretoucheerde driehoekige kling',
  'kling--steil-geretoucheerd--vierzijdig': 'Steil geretoucheerde vierzijdige kling',
  'spits--ongelijkbenige--driehoek--met-oppervlakteretouche': 'Ongelijkbenige driehoekige spits met oppervlakteretouche',
  'spits--lbk--met-oppervlakteretouche': 'LBK-spits met oppervlakteretouche',
  'spits--driehoekig--met-oppervlakteretouche--rechte-basis': 'Driehoekige spits met oppervlakteretouche en rechte basis',
  'spits--driehoekig--met-oppervlakteretouche--holle-basis': 'Driehoekige spits met oppervlakteretouche en holle basis',
  'spits--driehoekig--met-oppervlakteretouche': 'Driehoekige spits met oppervlakteretouche',
  'spits--met-oppervlakte--retouche': 'Spits met oppervlakteretouche',
  'spits--gelijkzijdige--driehoek': 'Gelijkzijdige driehoekige spits',
  'spits--bladspits': 'Bladspits',
  'spits--bladspits--jerzmanowice': 'Jerzmanowice-bladspits',
  'spits--bladspits--vlak': 'Vlakke bladspits',
  'spits--bladspits--met-ronde--basis': 'Bladspits met ronde basis',
  'spits--bladspits--met-schuine--basis': 'Bladspits met schuine basis',
  'spits--steel--ahrensburg-og-hintersee--spits': 'Ahrensburg/Hintersee-steelspits',
  'spits--steel': 'Steelspits',
  'spits--kerf-met-kegelvormig--geretoucheerde--basis': 'Kerfspits met kegelvormig geretoucheerde basis',
  'spits--bromme': 'Bromme-spits',
  'spits--swidry': 'Swidry-spits',
  'spits--font-robert': 'Font-Robert-spits',
  'spits--teyat': 'Teyat-spits',
  'spits--kostienki': 'Kostienki-spits',
  'spits--kerf-magdalenien': 'Magdalenien-kerfspits',
  'spits--kerf-hamburg': 'Hamburg-kerfspits',
  'spits--driehoek--micro': 'Micro-driehoek',
  'spits--lbk': 'LBK-spits',
  'spits--driehoek--ongelijkbenig': 'Ongelijkbenige driehoek',
  'spits--driehoek--gelijkbenig': 'Gelijkbenige driehoek',
  'spits--frère': 'Frère-spits',
  'spits--dreuil': 'Dreuil-spits',
  'spits--trapezium--langwerpig': 'Langwerpig trapezium',
  'spits--driehoekig': 'Driehoekige spits',
  'spits--trapezium--rechthoekig': 'Rechthoekig trapezium',
  'spits--vierhoek--rombisch-og-zonhovenspits': 'Rombische vierhoek / Zonhovenspits',
  'spits--transversaal--onregelmatig--gevormd': 'Onregelmatig gevormde transversaalspits',
  'spits--transversaal': 'Transversaalspits',
  'spits--trapezium--breed': 'Breed trapezium',
  'spits--trapezium--smal': 'Smal trapezium',
  'spits--vierhoekig': 'Vierhoekige spits',
  'spits--azilien': 'Azilien-spits',
  'spits--cirkelsegment': 'Cirkelsegment-spits',
  'spits--dubbel': 'Dubbelspits',
  'spits--fléchette': 'Flechette-spits',
  'spits--segmentvormig': 'Segmentvormige spits',
  'spits--b-spits': 'B-spits',
  'spits--pennemes-og-penknife-point-federmesser': 'Pennemes / Penknife point / Federmesser',
  'spits--a-spits': 'A-spits',
  'spits--lancet': 'Lancetspits',
  'spits--tjonger': 'Tjongerspits',
  'spits--cheddar': 'Cheddar-spits',
  'spits--creswell': 'Creswell-spits',
  'spits--châtelperron': 'Châtelperron-spits',
  'spits--eenzijdig-geretoucheerd': 'Eenzijdig geretoucheerde spits',
  'spits--c-spits-og-tardenoisien--spits': 'C-spits / Tardenoisien-spits',
  'spits--svaerdborg': 'Svaerdborg-spits',
  'spits--malaurie': 'Malaurie-spits',
  'spits--eenzijdig-en-basis-geretoucheerd': 'Spits met geretoucheerde zijde en basis',
  'spits--gravette-og-spits--blanchere': 'Gravette-spits / Blanchère-spits',
  'spits--d-spits': 'D-spits',
  'spits--naaldvormig': 'Naaldvormige spits',
  'spits--sauveterre': 'Sauveterre-spits',
  'spits--tweezijdig-steil-geretoucheerd': 'Tweezijdig steil geretoucheerde spits',
};

export function getTreeDefinition(mode: DecisionTreeMode = 'beginner'): TreeDefinition {
  return TREE_DEFINITIONS[mode];
}

export function getTreeStartQuestionId(mode: DecisionTreeMode = 'beginner'): string {
  return getTreeDefinition(mode).startQuestionId;
}

export function getTreeLabel(mode: DecisionTreeMode = 'beginner'): string {
  return getTreeDefinition(mode).label;
}

export function getImagesForQuestion(questionId: string): ImageMetadata[] {
  return imagesMeta.filter((img) => img.question === questionId);
}

export function getQuestion(id: string, mode: DecisionTreeMode = 'beginner'): QuestionNode | undefined {
  return getTreeDefinition(mode).questions[id];
}

export function processAnswer(
  questionId: string,
  answer: 'ja' | 'nee',
  mode: DecisionTreeMode = 'beginner'
): {
  isEnd: boolean;
  nextQuestion?: string;
  result?: string;
} {
  const question = getQuestion(questionId, mode);
  if (!question) {
    return { isEnd: true, result: 'onbekend' };
  }

  if (answer === 'ja') {
    if (question.jaResultaat) {
      return { isEnd: true, result: question.jaResultaat };
    }
    if (question.jaVolgende) {
      return { isEnd: false, nextQuestion: question.jaVolgende };
    }
  } else {
    if (question.neeResultaat) {
      return { isEnd: true, result: question.neeResultaat };
    }
    if (question.neeVolgende) {
      return { isEnd: false, nextQuestion: question.neeVolgende };
    }
  }

  return { isEnd: true, result: 'onbepaald' };
}

export function formatTypeName(typeName: string): string {
  const known = DISPLAY_NAMES[typeName];
  if (known) return known;

  return typeName
    .replace(/--/g, ' / ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
