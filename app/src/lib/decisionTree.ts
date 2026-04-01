import type { ImageMetadata, UserLevel } from '../types';
import imageMetadata from '../data/images_metadata.json';
import fullDecisionTreeData from '../data/beslisboom.json';

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
  | 'expert'
  | 'phase1-afslag'
  | 'phase1-kling'
  | 'phase1-geretoucheerde-kling'
  | 'phase1-rugmes'
  | 'phase1-klingschrabber'
  | 'phase1-schrabber'
  | 'phase2-schrabber'
  | 'phase2-spits'
  | 'phase3-vuistbijl'
  | 'phase4-geslepen-bijl'
  | 'phase4-geslepen-artefact'
  | 'phase5-doorboord-artefact'
  | 'phase5-hamerbijl';

interface TreeDefinition {
  label: string;
  startQuestionId: string;
  questions: Record<string, QuestionNode>;
}

interface RawDecisionNode {
  vraag: string;
  ja: string | null;
  nee: string | null;
}

const fullDecisionTree = fullDecisionTreeData as Record<string, RawDecisionNode>;
const expertQuestionOrder = Object.keys(fullDecisionTree);

const EXPERT_QUESTION_OVERRIDES: Partial<Record<string, string>> = {
  '8': 'Heeft het meer dan 2 afslagnegatieven?',
  '10': 'Is de brok of vorstsplijting mogelijk gemodificeerd?',
  '12': 'Heeft de kern naar het midden gerichte afslagnegatieven aan één sterk bolle zijde?',
  '35': 'Heeft het kernwerktuig een duidelijke boorpunt?',
  '132': 'Houdt het werktuig het midden tussen een chopping tool en een vuistbijl met beperkte bifaciale bewerking?',
  '141': 'Is de vuistbijl gedeeltelijk bewerkt, aan één zijde bewerkt of gemaakt van een dikke afslag?',
  '230': 'Heeft het artefact een smalle, puntige werkkant zoals een boor, bec of ruimer?',
  '560': 'Heeft het artefact een schachtdoorn zonder duidelijke weerhaken?',
  '622': 'Heeft de rechthoekige vuurstenen bijl een extra brede snede?',
};

const EXPERT_LABEL_JUMPS: Record<string, string> = {
  'doorboord--artefact': '700',
  'géén-gat-of-een-natuurlijk-gat': '3',
  'artefact-van-vuursteen--kwartsiet-of-lydiet': '5',
  'van-een-andere-steensoort': '4',
  'het-is-een-geslepen--stenen--artefact': '5',
  'geslepen--bijl': '660',
  'geslepen--vuurstenen--artefact': '601',
  'nee-het-artefact-is-een-artefact--geslepen': '602',
  'het-artefact-is-een-artefact--geslepen': '602',
  'het-artefact-heeft-resten-van-een-ventrale-zijde': '40',
  'het-is-bifaciaal-bewerkt-of-deels-niet-bewerkt': '125',
  'één-of-meer-afslagnegatieven': '8',
  'het-artefact-is-een-knol--brok-of-vorstsplijting': '9a',
  'het-is-een-artefact': '9',
  '1-of-2-het-is-een-brok-of-vorstsplijting': '10',
  'mogelijk-gemodificeerd': '32',
  'een-kern--werktuig': '33',
  'een-kern': '11',
  'nee-een-klein-of-onherkenbaar-slagvlak': '18',
  'een-klein-of-onherkenbaar-slagvlak': '13',
  'nee-één-slagvlak': '29',
  'één-slagvlak': '25',
  'lange-afslagnegatieven': '26',
  'relatief-klein': '28',
  twee: '30',
  'afslagkling--werktuig': '201',
  bekapt: '300',
  'geretoucheerd-of-bijzondere-bewerking': '202',
  'een-combinatiewerktuig': '270',
  'combinatie--werktuig': '270',
  'afgeknot-artefact': '301',
  'de-afslag-of-kling-is-niet-bewerkt': '41',
  afslag: '42',
  'geen-cortex': '73',
  kling: '71',
  'zie-ook': '265',
  'boor-bec-of-ruimer': '231',
  'steile-retouche': '391',
  'vlakke-rand---of-oppervlakte-retouche': '540',
  'nee-het-is-bekapt': '541',
  'het-is-bekapt': '541',
  'nee-nee-de-vorm-van-een-spits': '542',
  'nee-de-vorm-van-een-spits': '542',
  'nee-bladvormig': '544',
  bladvormig: '544',
  'nee-gelijkbenig-of-gelijkzijdig': '545',
  'gelijkbenig-of-gelijkzijdig': '545',
};

function getExpertQuestionIndex(questionId: string): number {
  return expertQuestionOrder.indexOf(questionId);
}

function getExpertQuestionIdAt(questionId: string, offset: number): string | undefined {
  const index = getExpertQuestionIndex(questionId);
  if (index < 0) return undefined;
  return expertQuestionOrder[index + offset];
}

function normalizeExpertText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slugTokens(value: string): string[] {
  return normalizeExpertText(value)
    .split(' ')
    .filter((token) => token.length > 2)
    .slice(0, 6);
}

function isExpertQuestionRelatedToLabel(questionId: string | undefined, label: string | null): boolean {
  if (!questionId || !label) return false;
  const question = fullDecisionTree[questionId];
  if (!question) return false;

  const normalizedQuestion = normalizeExpertText(EXPERT_QUESTION_OVERRIDES[questionId] ?? question.vraag);
  if (!normalizedQuestion) return false;

  return slugTokens(label).some((token) => normalizedQuestion.includes(token));
}

function buildExpertQuestionNode(id: string): QuestionNode {
  const raw = fullDecisionTree[id];
  return {
    id,
    vraag: (EXPERT_QUESTION_OVERRIDES[id] ?? raw.vraag).trim(),
    toelichting: `AWN bronvraag ..${id}`,
  };
}

function getExpertContextualJump(
  questionId: string,
  target: string
): string | undefined {
  if (target === 'breedte--29-cm-een-beitel' && questionId === '602') {
    return '640';
  }

  if (target === 'een-bijl-dissel' && questionId === '603') {
    return '623';
  }

  if (target === 'gemaakt-van-een-andere-steensoort-dan-vuursteen' && questionId === '604') {
    return '660';
  }

  if (target === 'de-bijl-is-relatief-dik' && questionId === '618') {
    return '620';
  }

  if (target === 'breedte--29-cm' && questionId === '620') {
    return '640';
  }

  if (target === 'vuursteenbijl-met-rechthoekige-dwarsdoorsnede' && questionId === '621') {
    return '622';
  }

  if (target === 'normale-sned-e' && questionId === '621') {
    return '623';
  }

  if (target === 'dunbladig' && questionId === '633') {
    return '637';
  }

  if (target === 'bijl-dissel' && questionId === '661') {
    return '683';
  }

  if (target === 'nee-overige-groepen-afslagklingwerktuigen') {
    if (questionId === '202') return '230';
    if (questionId === '230') return '240';
    if (questionId === '240') return '247';
    if (questionId === '247') return '260';
    if (questionId === '260') return '270';
    if (questionId === '270') return '300';
    if (questionId === '300') return '320';
  }

  if (target === 'nee-nee-overige-groepen-afslagklingwerktuigen') {
    if (questionId === '260') return '270';
    if (questionId === '270') return '300';
  }

  if (target === 'nee-meerdere--boor--dubbel-of-boor--meervoudig' || target === 'meerdere--boor--dubbel-of-boor--meervoudig') {
    if (questionId === '232') return '233';
  }

  if (target === 'kern-gemodificeerd-of-brok-gemodificeerd' && questionId === '105') {
    return '106';
  }

  if (target === 'de-kern-of-brok-is-voorzien-van-een-werkkant-punt' && questionId === '105') {
    return '113';
  }

  if (questionId === '125') {
    if (target === 'het-heeft-de-vorm-van-een-vuistbijl-of-bladvorm') return '126';
    if (target === 'de-vorm-van-een-bijl--beitel-of-ander-kernwerktuig') return '127';
  }

  if (questionId === '126') {
    if (target === 'nee-het-artefact-heeft-de-vorm-van-een-vuistbijl-of-bladvorm') return '127';
    if (target === 'het-artefact-heeft-de-vorm-van-een-vuistbijl-of-bladvorm') return '130';
  }

  if (target === 'het-is-een-vuistbijl-of-bladvorm' && questionId === '130') {
    return '131';
  }

  if (target === 'zorgvuldiger-bewerkt' && questionId === '132b') {
    return '132a';
  }

  if (target === 'dikke-vuistbijlen' && questionId === '132a') {
    return '133';
  }

  if (target === 'dun' && questionId === '132a') {
    return '136';
  }

  if (target === 'fijner-bewerkt' && questionId === '134') {
    return '135';
  }

  if (target === 'het-artefact-heeft-een-blad-vorm' && questionId === '131') {
    return '149';
  }

  if (target === 'het-artefact-heeft-de-vorm-van-een-vuistbijl' && questionId === '131') {
    return '132';
  }

  if ((target === 'nee-heel-klein--6-cm-of-heel-dun' || target === 'heel-klein--6-cm-of-heel-dun') && questionId === '136') {
    return '146';
  }

  if ((target === 'nee-het-artefact-is-asymmetrisch' || target === 'het-artefact-is-asymmetrisch') && questionId === '154') {
    return '155';
  }

  if ((target === 'nee-aan-beide-oppervlakken' || target === 'aan-beide-oppervlakken') && questionId === '155') {
    return '156';
  }

  if (target === 'relatief-grof-aan-beide-zijden' && questionId === '158') {
    return '159';
  }

  if (target === 'dolk-engels' && questionId === '159') {
    return '189';
  }

  if (target === 'dichter-bij-de-basis-dolk--oost-europ-ees' && questionId === '159') {
    return '193';
  }

  if (target === 'dolk--scandinavisch' && questionId === '158') {
    return '160';
  }

  if (target === 'niet-gefacetteerd' && questionId === '712') {
    return '716';
  }

  if (target === 'type-h-en-g' && questionId === '718') {
    return '719';
  }

  if (target === 'weinig-verdikking-bij-het-verdiept-liggende-gat' && questionId === '719') {
    return '720';
  }

  if (target === 'type-k-en-l' && questionId === '720') {
    return '721';
  }

  if (target === 'type-a--ba' && questionId === '722') {
    return '723';
  }

  if (target === 'een-vierzijdige-dwarsdoorsnede' && questionId === '722') {
    return '726';
  }

  if (
    (target === 'nee-een-licht-convexe-tot-vlakke-bovenzijde-vlakke' ||
      target === 'een-licht-convexe-tot-vlakke-bovenzijde-vlakke') &&
    questionId === '727'
  ) {
    return '728';
  }

  if (target === 'type-c-en-ca' && questionId === '729') {
    return '730';
  }

  if (target === 'een-ronde-dwarsdoorsnede-van-de-nek' && questionId === '730') {
    return '731';
  }

  if (target === 'type-zuidvelde-en-emmen' && questionId === '731') {
    return '732';
  }

  if (target === 'vlakke-bovenzijde-en-sterk-concave-onderzijde' && questionId === '731') {
    return '733';
  }

  if (target === 'met-scherpe-verdikking' && questionId === '733') {
    return '734';
  }

  if (target === 'symmetrisch--geen-uitgewaaierde-snede' && questionId === '734') {
    return '735';
  }

  return undefined;
}

const expertTree: Record<string, QuestionNode> = Object.fromEntries(
  expertQuestionOrder.map((id) => [id, buildExpertQuestionNode(id)])
);

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

const phase3VuistbijlTree: Record<string, QuestionNode> = {
  '610': {
    id: '610',
    vraag: 'Is de vuistbijl kleiner dan 6 cm?',
    toelichting: 'Kleine vuistbijlen vallen in de AWN-bron onder de groep fäustel.',
    jaResultaat: 'vuistbijl--fäustel',
    neeVolgende: '611',
  },
  '611': {
    id: '611',
    vraag: 'Is het werktuig opvallend dun en zonder duidelijke dikke rug?',
    toelichting: 'Dat past beter bij een faustkeilblatt dan bij een klassieke vuistbijl.',
    jaResultaat: 'vuistbijl--faustkeilblatt',
    neeVolgende: '612',
  },
  '612': {
    id: '612',
    vraag: 'Is het artefact maar gedeeltelijk bifaciaal bewerkt of vooral aan één zijde uitgewerkt?',
    toelichting: 'Eenvoudige of op afslag gemaakte vuistbijlen worden in de AWN-bron als uniface onderscheiden.',
    jaResultaat: 'uniface',
    neeVolgende: '613',
  },
  '613': {
    id: '613',
    vraag: 'Heeft de vuistbijl een korte snede, soms als tranchet-snede?',
    toelichting: 'Asymmetrische vuistbijlen met korte snede vormen een aparte subtypegroep.',
    jaResultaat: 'vuistbijl--met-korte--snede',
    neeVolgende: '614',
  },
  '614': {
    id: '614',
    vraag: 'Is de vuistbijl relatief dik: breedte kleiner dan 2,35 x dikte?',
    toelichting: 'De AWN-bron splitst eerst dikke en dunnere vuistbijlen.',
    jaVolgende: '620',
    neeVolgende: '640',
  },
  '620': {
    id: '620',
    vraag: 'Heeft de vuistbijl een asymmetrische, dikke bolle basis met slanke punt en vaak licht concave zijden?',
    toelichting: 'Dat zijn kenmerkende eigenschappen van een Micoque-vuistbijl.',
    jaResultaat: 'vuistbijl--micoque',
    neeVolgende: '621',
  },
  '621': {
    id: '621',
    vraag: 'Is de vuistbijl langwerpig met rechte zijden en een dikke bolle basis?',
    toelichting: 'Dan past de lancetvormige vuistbijl.',
    jaResultaat: 'vuistbijl--lancetvormig',
    neeVolgende: '622',
  },
  '622': {
    id: '622',
    vraag: 'Is de vuistbijl relatief groot en langwerpig met dikke bolle basis, concave zijden en een goed ontwikkelde punt?',
    toelichting: 'Dat past bij een ficron, een grover bewerkte langwerpige vuistbijl.',
    jaResultaat: 'vuistbijl--ficron',
    neeVolgende: '623',
  },
  '623': {
    id: '623',
    vraag: 'Is de vorm amandelvormig en fijner bewerkt dan de ficron?',
    toelichting: 'Dikkere maar regelmatige amandelvormige stukken horen in deze subtypegroep.',
    jaResultaat: 'vuistbijl--amandelvormig',
    neeResultaat: 'vuistbijl--flesvormig',
  },
  '640': {
    id: '640',
    vraag: 'Heeft de vuistbijl een duidelijk hartvormig silhouet?',
    toelichting: 'Dunne vuistbijlen met spitse punt worden in de bron eerst naar hart- en driehoeksvormen gesplitst.',
    jaVolgende: '641',
    neeVolgende: '645',
  },
  '641': {
    id: '641',
    vraag: 'Is de vuistbijl langwerpig, dus duidelijk langer dan 1,5 x de breedte?',
    toelichting: 'Dan past de langwerpig hartvormige subtypegroep beter dan de compacte hartvorm.',
    jaResultaat: 'vuistbijl--langwerpig--hartvormig',
    neeVolgende: '642',
  },
  '642': {
    id: '642',
    vraag: 'Is de vorm hartvormig maar asymmetrisch of onregelmatig?',
    toelichting: 'Dan gaat het om een sub-hartvormige vuistbijl.',
    jaResultaat: 'vuistbijl--sub-hartvormig',
    neeResultaat: 'vuistbijl--hartvormig',
  },
  '645': {
    id: '645',
    vraag: 'Heeft de vuistbijl een duidelijke driehoekige vorm met rechte tot licht convexe of concave zijden?',
    toelichting: 'Driehoekige varianten worden in de AWN-bron apart uitgewerkt.',
    jaVolgende: '646',
    neeVolgende: '650',
  },
  '646': {
    id: '646',
    vraag: 'Is de vuistbijl langwerpig, dus duidelijk langer dan 1,5 x de breedte?',
    toelichting: 'Dan past de langwerpig driehoekige subtypegroep.',
    jaResultaat: 'vuistbijl--langwerpig--driehoekig',
    neeVolgende: '647',
  },
  '647': {
    id: '647',
    vraag: 'Is de vorm driehoekig maar asymmetrisch of onregelmatig?',
    toelichting: 'Dan gaat het om een sub-driehoekige vuistbijl.',
    jaResultaat: 'vuistbijl--sub-driehoekig',
    neeResultaat: 'vuistbijl--driehoekig',
  },
  '650': {
    id: '650',
    vraag: 'Heeft de vuistbijl een afgeronde driehoekige top boven een min of meer rechthoekige basis?',
    toelichting: 'Dat zijn de klassieke kenmerken van een bout-coupe.',
    jaResultaat: 'vuistbijl--bout--coupé',
    neeVolgende: '651',
  },
  '651': {
    id: '651',
    vraag: 'Is de vorm langgerekt ovaal en langer dan 1,5 x de breedte?',
    toelichting: 'Dan past limande beter dan een gewone ovale vuistbijl.',
    jaResultaat: 'vuistbijl--limande',
    neeVolgende: '652',
  },
  '652': {
    id: '652',
    vraag: 'Is de vorm overwegend ovaal en korter dan 1,5 x de breedte?',
    toelichting: 'Dat hoort bij de ovale vuistbijlen.',
    jaResultaat: 'vuistbijl--ovaal',
    neeVolgende: '653',
  },
  '653': {
    id: '653',
    vraag: 'Is de vuistbijl rond met een fijner bewerkte werkkant?',
    toelichting: 'Ronde/disque-vormen zijn een eigen subtype.',
    jaResultaat: 'vuistbijl--rond-og-vuistbijl--disque',
    neeVolgende: '654',
  },
  '654': {
    id: '654',
    vraag: 'Is de vuistbijl ovaal tot vierhoekig en bootvormig?',
    toelichting: 'Dat past bij de bootvormige vuistbijl.',
    jaResultaat: 'vuistbijl--bootvormig',
    neeResultaat: 'vuistbijl',
  },
};

const phase4GeslepenBijlTree: Record<string, QuestionNode> = {
  '801': {
    id: '801',
    vraag: 'Is de vuurstenen bijl relatief breed en dun, ongeveer breder dan de helft van de lengte?',
    toelichting: 'Dat is de vlakbijl-groep binnen AWN 7.1.1.',
    jaVolgende: '802',
    neeVolgende: '805',
  },
  '802': {
    id: '802',
    vraag: 'Heeft de vlakbijl een klokvormige omtrek met gebogen zijden en grootste breedte op circa een derde van de snede?',
    toelichting: 'Dat past bij de klokvormige vuurstenen vlakbijl.',
    jaResultaat: 'bijl-vlakbijl--klokvormig',
    neeVolgende: '803',
  },
  '803': {
    id: '803',
    vraag: 'Heeft de vlakbijl een trapeziumvormige omtrek met rechte zijden?',
    toelichting: 'Dan past de trapeziumvormige vuurstenen vlakbijl.',
    jaResultaat: 'bijl-vlakbijl--trapeziumvormig',
    neeVolgende: '804',
  },
  '804': {
    id: '804',
    vraag: 'Is de omtrek rechthoekig tot zwak trapeziumvormig?',
    toelichting: 'Dan blijft de rechthoekige vuurstenen vlakbijl over.',
    jaResultaat: 'bijl-vlakbijl--rechthoekig',
    neeResultaat: 'bijl-vlakbijl',
  },
  '805': {
    id: '805',
    vraag: 'Heeft de vuurstenen bijl een ovale dwarsdoorsnede?',
    toelichting: 'AWN splitst daarna naar ovale of rechthoekige dwarsdoorsnede.',
    jaVolgende: '806',
    neeVolgende: '814',
  },
  '806': {
    id: '806',
    vraag: 'Heeft de bijl een smalle top in bovenaanzicht?',
    toelichting: 'Smaltoppige en breedtoppige bijlen vormen aparte subtypegroepen.',
    jaVolgende: '807',
    neeVolgende: '810',
  },
  '807': {
    id: '807',
    vraag: 'Heeft de smaltoppige bijl geslepen zijden?',
    toelichting: 'Dan gaat het om de smaltoppige variant met ovale dwarsdoorsnede en geslepen zijden.',
    jaResultaat: 'bijl-smaltoppig--met-ovale--dwarsdoorsnede--en-geslepen--zijden',
    neeVolgende: '808',
  },
  '808': {
    id: '808',
    vraag: 'Heeft de smaltoppige bijl een afgerond rombische dwarsdoorsnede?',
    toelichting: 'Dit is een aparte subtypegroep binnen de smaltoppige bijlen.',
    jaResultaat: 'bijl-smaltoppig--met-afgerond--rombische--dwarsdoorsnede',
    neeVolgende: '809',
  },
  '809': {
    id: '809',
    vraag: 'Heeft de smaltoppige bijl een ovale tot vlakovale dwarsdoorsnede?',
    toelichting: 'Dan past de smaltoppige vuurstenen bijl met ovale tot vlakovale dwarsdoorsnede.',
    jaResultaat: 'bijl-smaltoppig--met-ovale--tot-vlakovale--dwarsdoorsnede',
    neeResultaat: 'bijl-smaltoppig--met-ovale--dwarsdoorsnede',
  },
  '810': {
    id: '810',
    vraag: 'Heeft de bijl een brede, dunne top in zijaanzicht?',
    toelichting: 'Dan kom je in de breedtoppige subtypegroep.',
    jaVolgende: '811',
    neeVolgende: '813',
  },
  '811': {
    id: '811',
    vraag: 'Is de bijl langer dan 15 cm?',
    toelichting: 'Lange breedtoppige vuurstenen bijlen vallen in de Buren-groep.',
    jaResultaat: 'bijl-buren',
    neeVolgende: '812',
  },
  '812': {
    id: '812',
    vraag: 'Heeft de breedtoppige bijl duidelijk geslepen zijden?',
    toelichting: 'Daarmee onderscheid je de variant met geslepen zijden van de rondovale doorsnede.',
    jaResultaat: 'bijl-breedtoppig--met-ovale--dwarsdoorsnede--en-geslepen--zijden',
    neeResultaat: 'bijl-breedtoppig--met-rondovale--dwarsdoorsnede',
  },
  '813': {
    id: '813',
    vraag: 'Is de bijl dun in lengtedoorsnede en ovaal in dwarsdoorsnede?',
    toelichting: 'Dan gaat het om de dunbladige vuurstenen bijl met ovale dwarsdoorsnede.',
    jaResultaat: 'bijl-dunbladig--met-ovale--dwarsdoorsnede',
    neeResultaat: 'bijl-met-ovale--dwarsdoorsnede',
  },
  '814': {
    id: '814',
    vraag: 'Heeft de vuurstenen bijl een rechthoekige dwarsdoorsnede?',
    toelichting: 'Binnen deze groep worden afwijkende snede, top en bladdikte verder uitgesplitst.',
    jaVolgende: '815',
    neeResultaat: 'geslepen-vuurstenen-bijl',
  },
  '815': {
    id: '815',
    vraag: 'Heeft de bijl een afwijkende snede, zoals een brede snede, disselsnede of holle snede?',
    toelichting: 'AWN behandelt afwijkende sneden eerst, voor de top- en bladtypen.',
    jaVolgende: '816',
    neeVolgende: '820',
  },
  '816': {
    id: '816',
    vraag: 'Heeft de bijl een duidelijke disselsnede en is die niet symmetrisch in lengtedoorsnede?',
    toelichting: 'Dan gaat het om een vuurstenen dissel.',
    jaVolgende: '817',
    neeVolgende: '818',
  },
  '817': {
    id: '817',
    vraag: 'Heeft de dissel gebogen onder- en bovenzijde?',
    toelichting: 'Dit onderscheidt de twee AWN-subtypen binnen de vuurstenen dissels.',
    jaResultaat: 'bijl-dissel--met-gebogen--onder--en-bovenzijde',
    neeResultaat: 'bijl-dissel--met-parallelle--onder--en-bovenzijde',
  },
  '818': {
    id: '818',
    vraag: 'Heeft de bijl een holle snede?',
    toelichting: 'Vuurstenen bijlen met holle snede worden verder naar profiel gesplitst.',
    jaVolgende: '819',
    neeResultaat: 'bijl-met-rechthoekige--dwarsdoorsnede--en-brede--snede',
  },
  '819': {
    id: '819',
    vraag: 'Zijn onder- en bovenzijde gebogen?',
    toelichting: 'Dit onderscheidt de twee typen met holle snede.',
    jaResultaat: 'bijl-met-holle--snede--en-gebogen--onder--en-bovenzijde',
    neeResultaat: 'bijl-met-holle--snede--en-parallelle--onder--en-bovenzijde',
  },
  '820': {
    id: '820',
    vraag: 'Heeft de bijl een dunne top in dwarsdoorsnede?',
    toelichting: 'Duntoppige, dikbladige en dunbladige rechthoekige bijlen vormen de hoofdgroepen.',
    jaVolgende: '821',
    neeVolgende: '824',
  },
  '821': {
    id: '821',
    vraag: 'Is de dunne top scherp?',
    toelichting: 'Dat is de eerste subtypegroep binnen de duntoppige bijlen.',
    jaResultaat: 'bijl-met-rechthoekige--dwarsdoorsnede--en-dunne--scherpe--top',
    neeVolgende: '822',
  },
  '822': {
    id: '822',
    vraag: 'Is de dunne top vlak?',
    toelichting: 'Dan gaat het om de variant met dunne vlakke top.',
    jaResultaat: 'bijl-met-rechthoekige--dwarsdoorsnede--en-dunne--vlakke--top',
    neeVolgende: '823',
  },
  '823': {
    id: '823',
    vraag: 'Is de top dun maar onregelmatig?',
    toelichting: 'Dan blijft de variant met dunne onregelmatige top over.',
    jaResultaat: 'bijl-met-rechthoekige--dwarsdoorsnede--en-dunne--onregelmatige--top',
    neeResultaat: 'bijl-met-rechthoekige--dwarsdoorsnede--duntoppig',
  },
  '824': {
    id: '824',
    vraag: 'Is de grootste dikte meer dan de helft van de grootste breedte?',
    toelichting: 'Dan hoort de bijl in de dikbladige groep, anders in de dunbladige.',
    jaVolgende: '825',
    neeVolgende: '828',
  },
  '825': {
    id: '825',
    vraag: 'Ligt de grootste dikte in het midden met sterk gebogen boven- en onderzijde?',
    toelichting: 'Dat is de sterk gebogen dikbladige variant.',
    jaResultaat: 'bijl-met-rechthoekige--dwarsdoorsnede--dikbladig--sterk-gebogen',
    neeVolgende: '826',
  },
  '826': {
    id: '826',
    vraag: 'Zijn boven- en onderzijde weinig gekromd?',
    toelichting: 'Dan gaat het om de weinig gekromde dikbladige variant.',
    jaResultaat: 'bijl-met-rechthoekige--dwarsdoorsnede--dikbladig--weinig-gekromd',
    neeVolgende: '827',
  },
  '827': {
    id: '827',
    vraag: 'Zijn boven- en onderzijde nagenoeg parallel?',
    toelichting: 'Dan past de parallelle dikbladige variant, anders blijft het generieke type over.',
    jaResultaat: 'bijl-met-rechthoekige--dwarsdoorsnede--dikbladig--parallel',
    neeResultaat: 'bijl-met-rechthoekige--dwarsdoorsnede--dikbladig',
  },
  '828': {
    id: '828',
    vraag: 'Zijn boven- en onderzijde sterk gekromd?',
    toelichting: 'Dit onderscheidt de twee dunbladige subtypen.',
    jaResultaat: 'bijl-met-rechthoekige--dwarsdoorsnede--dunbladig--sterk-gekromd',
    neeVolgende: '829',
  },
  '829': {
    id: '829',
    vraag: 'Zijn boven- en onderzijde nagenoeg parallel?',
    toelichting: 'Dan gaat het om de parallelle dunbladige variant.',
    jaResultaat: 'bijl-met-rechthoekige--dwarsdoorsnede--dunbladig--parallel',
    neeResultaat: 'bijl-met-rechthoekige--dwarsdoorsnede--dunbladig',
  },
};

const phase4GeslepenArtefactTree: Record<string, QuestionNode> = {
  '840': {
    id: '840',
    vraag: 'Is het geslepen vuurstenen artefact smal, ongeveer smaller dan 2,9 cm en ongeveer even dik als breed?',
    toelichting: 'Dan zit je in de beitelgroep van AWN 7.2.',
    jaVolgende: '841',
    neeVolgende: '845',
  },
  '841': {
    id: '841',
    vraag: 'Heeft het artefact een holle snede?',
    toelichting: 'Dat past bij een gutsbeitel.',
    jaResultaat: 'beitel--guts',
    neeVolgende: '842',
  },
  '842': {
    id: '842',
    vraag: 'Ligt de snede niet in het midden?',
    toelichting: 'Dan past de disselbeitel beter dan de standaardbeitel.',
    jaResultaat: 'beitel--dissel',
    neeVolgende: '843',
  },
  '843': {
    id: '843',
    vraag: 'Heeft het artefact een rechte snede in het midden?',
    toelichting: 'Dat is de standaardbeitel.',
    jaResultaat: 'beitel--standaard',
    neeVolgende: '844',
  },
  '844': {
    id: '844',
    vraag: 'Heeft het artefact geen snede maar een puntig uiteinde?',
    toelichting: 'Dan gaat het om een puntbeitel.',
    jaResultaat: 'beitel--punt',
    neeResultaat: 'beitel',
  },
  '845': {
    id: '845',
    vraag: 'Heeft het artefact een smal lang lemmet met bewuste top of handgreepvorm, dus min of meer dolkvormig?',
    toelichting: 'Binnen de geslepen vuurstenen artefacten vormen dolken een eigen hoofdgroep.',
    jaResultaat: 'dolk',
    neeVolgende: '846',
  },
  '846': {
    id: '846',
    vraag: 'Is het artefact gemaakt van een geslepen bijlfragment of toont het duidelijk hergebruik van een bijlafslag?',
    toelichting: 'AWN noemt bijlfragmenten expliciet als aparte categorie geslepen werktuigen.',
    jaResultaat: 'artefact--gemaakt-van-bijlafslag',
    neeResultaat: 'geslepen-vuurstenen-artefact',
  },
};

const phase5DoorboordArtefactTree: Record<string, QuestionNode> = {
  '900': {
    id: '900',
    vraag: 'Is het artefact onvolledig doorboord?',
    toelichting: 'Een onvolledig doorboord artefact valt in de AWN-bron onder dellensteen.',
    jaResultaat: 'dellensteen',
    neeVolgende: '901',
  },
  '901': {
    id: '901',
    vraag: 'Is het volledig doorboorde artefact zonder snede en duidelijk dik of rolsteenachtig?',
    toelichting: 'Dan gaat het om een doorboorde rolsteen.',
    jaResultaat: 'doorboorde--rolsteen',
    neeVolgende: '902',
  },
  '902': {
    id: '902',
    vraag: 'Is het volledig doorboorde artefact zonder snede schijfvormig of plat?',
    toelichting: 'Dan past de schijfvormige doorboorde steen.',
    jaResultaat: 'doorboorde--schijfvormige--steen',
    neeVolgende: '903',
  },
  '903': {
    id: '903',
    vraag: 'Heeft het artefact een snede haaks op het gat?',
    toelichting: 'Dat is de schoenleest-bijl met gat haaks op de snede.',
    jaResultaat: 'bijl-dissel--met-gat-haaks--op-de-snede',
    neeVolgende: '904',
  },
  '904': {
    id: '904',
    vraag: 'Heeft het artefact een snede evenwijdig aan het gat, maar niet in het midden?',
    toelichting: 'Dan gaat het om een doorboorde schoenleestwig.',
    jaResultaat: 'bijl-dissel--doorboord',
    neeVolgende: '905',
  },
  '905': {
    id: '905',
    vraag: 'Heeft het artefact een centrale snede en een wigvorm?',
    toelichting: 'Dan past de doorboorde breedwig.',
    jaResultaat: 'doorboorde--breedwig',
    neeVolgende: '906',
  },
  '906': {
    id: '906',
    vraag: 'Heeft het doorboorde artefact een stompe punt in plaats van een brede snede?',
    toelichting: 'Dat past bij de puntige hak.',
    jaResultaat: 'hak-puntig',
    neeVolgende: '907',
  },
  '907': {
    id: '907',
    vraag: 'Heeft het artefact twee echte snedes of een dubbelbijl-vorm?',
    toelichting: 'Dubbelbijlen worden in de AWN-bron in type A, B en C onderverdeeld.',
    jaVolgende: '908',
    neeVolgende: '911',
  },
  '908': {
    id: '908',
    vraag: 'Is de vorm symmetrisch, maar heeft het artefact feitelijk maar één echte snede en ligt het gat iets meer naar de stompe kant?',
    toelichting: 'Dan past dubbelbijl type A.',
    jaResultaat: 'bijl-dubbel--type-a',
    neeVolgende: '909',
  },
  '909': {
    id: '909',
    vraag: 'Heeft het artefact twee echte snedes en ligt het gat iets excentrisch?',
    toelichting: 'Dan past dubbelbijl type B.',
    jaResultaat: 'bijl-dubbel--type-b',
    neeVolgende: '910',
  },
  '910': {
    id: '910',
    vraag: 'Heeft de dubbelbijl een beitelvorm en een ovaal gat?',
    toelichting: 'Dan gaat het om dubbelbijl type C.',
    jaResultaat: 'bijl-dubbel--type-c',
    neeResultaat: 'bijl-dubbel',
  },
  '911': {
    id: '911',
    vraag: 'Heeft het doorboorde artefact een duidelijke hamervorm?',
    toelichting: 'Dan kom je uit bij de hamerbijlgroep.',
    jaResultaat: 'hamerbijl',
    neeResultaat: 'doorboord-artefact',
  },
};

const phase5HamerbijlTree: Record<string, QuestionNode> = {
  '930': {
    id: '930',
    vraag: 'Heeft de hamerbijl een gefacetteerd oppervlak?',
    toelichting: 'Gefacetteerde hamerbijlen worden in de AWN-bron in type 1, 2a en 2b verdeeld.',
    jaVolgende: '931',
    neeVolgende: '934',
  },
  '931': {
    id: '931',
    vraag: 'Heeft de hamerbijl een convexe bovenzijde, concave onderzijde, ronde dwarsdoorsnede en een duidelijke rand op de versterking bij het gat?',
    toelichting: 'Dat past bij gefacetteerde hamerbijl type 1.',
    jaResultaat: 'bijl-hamer--gefacetteerd--type-1',
    neeVolgende: '932',
  },
  '932': {
    id: '932',
    vraag: 'Heeft de hamerbijl vrijwel vlakke boven- en onderzijde, ronde dwarsdoorsnede en een versmalling van gat naar snede?',
    toelichting: 'Dat past bij gefacetteerde hamerbijl type 2a.',
    jaResultaat: 'bijl-hamer--gefacetteerd--type-2a',
    neeVolgende: '933',
  },
  '933': {
    id: '933',
    vraag: 'Heeft de hamerbijl convexe boven- en onderzijde, een afgerond vierzijdige dwarsdoorsnede en een taps toelopend deel vanaf het gat naar een smalle snede?',
    toelichting: 'Dat past bij gefacetteerde hamerbijl type 2b.',
    jaResultaat: 'bijl-hamer--gefacetteerd--type-2b',
    neeResultaat: 'bijl-hamer--gefacetteerd',
  },
  '934': {
    id: '934',
    vraag: 'Heeft de hamerbijl een knopvormig uiteinde aan de nek?',
    toelichting: 'Dan gaat het om de knop-hamerbijl.',
    jaResultaat: 'bijl-hamer--knop',
    neeVolgende: '935',
  },
  '935': {
    id: '935',
    vraag: 'Heeft het artefact feitelijk twee echte snedes?',
    toelichting: 'Sommige beginner-uitkomsten als hamerbijl blijken bij verdieping een dubbelbijl te zijn.',
    jaResultaat: 'bijl-dubbel--type-b',
    neeVolgende: '936',
  },
  '936': {
    id: '936',
    vraag: 'Lijkt het symmetrisch, maar heeft het eigenlijk één echte snede en ligt het gat iets naar de stompe kant?',
    toelichting: 'Dan past dubbelbijl type A beter.',
    jaResultaat: 'bijl-dubbel--type-a',
    neeVolgende: '937',
  },
  '937': {
    id: '937',
    vraag: 'Heeft het artefact een beitelvorm en een ovaal gat?',
    toelichting: 'Dan gaat het om dubbelbijl type C.',
    jaResultaat: 'bijl-dubbel--type-c',
    neeResultaat: 'hamerbijl',
  },
};

const TREE_DEFINITIONS: Record<DecisionTreeMode, TreeDefinition> = {
  beginner: {
    label: 'Beginner',
    startQuestionId: '1',
    questions: beginnerTree,
  },
  expert: {
    label: 'Expert: volledige AWN-boom',
    startQuestionId: '1',
    questions: expertTree,
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
  'phase3-vuistbijl': {
    label: 'Fase 3: Vuistbijlverdieping',
    startQuestionId: '610',
    questions: phase3VuistbijlTree,
  },
  'phase4-geslepen-bijl': {
    label: 'Fase 4: Geslepen vuurstenen bijl',
    startQuestionId: '801',
    questions: phase4GeslepenBijlTree,
  },
  'phase4-geslepen-artefact': {
    label: 'Fase 4: Geslepen vuurstenen artefact',
    startQuestionId: '840',
    questions: phase4GeslepenArtefactTree,
  },
  'phase5-doorboord-artefact': {
    label: 'Fase 5: Doorboord artefact',
    startQuestionId: '900',
    questions: phase5DoorboordArtefactTree,
  },
  'phase5-hamerbijl': {
    label: 'Fase 5: Hamerbijl',
    startQuestionId: '930',
    questions: phase5HamerbijlTree,
  },
};

const DISPLAY_NAMES: Record<string, string> = {
  'een-splinter': 'Splinter',
  'een-brokvorstsplijting--getest': 'Geteste brok of vorstsplijting',
  'niet-gemodificeerd-brok-of-vorstsplijting': 'Niet-gemodificeerde brok of vorstsplijting',
  'kern--kombewa': 'Kombewa-kern',
  'kern--quina': 'Quina-kern',
  'kern--veelvlaks': 'Veelvlakkige kern',
  'kern--bipolair': 'Bipolaire kern',
  'onbepaalde-kern': 'Onbepaalde kern',
  'kern--levallois--ongebruikt': 'Ongebruikte Levallois-kern',
  'beide-zijden-licht-bol-een-kern--diskusvormig': 'Diskusvormige kern',
  'kern--levallois--afslag': 'Levallois-afslagkern',
  'kern--levallois--kling': 'Levallois-klingkern',
  'kern--levallois--spits': 'Levallois-spitskern',
  'aan-beide-zijden-kern--diskusvormig': 'Diskusvormige kern',
  'kern--afslag--piramida-al': 'Piramidale afslagkern',
  'kern--lamelle': 'Lamellenkern',
  'een-kern--kielvormig': 'Kielvormige kern',
  'een-kern--kling': 'Klingkern',
  'kern--kielvormig-ook-wel-aangeduid-als-kielvormige': 'Kielvormige kern',
  'kern--kling--coincy': 'Coincy-klingkern',
  'kern--met-meer--dan-2-slagvlakken': 'Kern met meer dan twee slagvlakken',
  'kern--bidirectioneel': 'Bidirectionele kern',
  'kern--orthogon-aal': 'Orthogonale kern',
  'kern--bidirectioneel--kling': 'Bidirectionele klingkern',
  'kern--bidirectioneel--afslag': 'Bidirectionele afslagkern',
  'een-rugmes': 'Rugmes',
  'een-afslag--decorticatie': 'Decorticatie-afslag',
  'een-vuistwig': 'Vuistwig',
  'met-een-evt-afgeronde-punt': 'Vuistwig met afgeronde punt',
  'een-vuistbijl--kernvormig': 'Kernvormige vuistbijl',
  'een-flesvorm-vuistbijl--flesvormig': 'Flesvormige vuistbijl',
  'langwerpig-driehoekig-vuistbijl--langwerpig--driehoekig': 'Langwerpig driehoekige vuistbijl',
  'onregelmatig-driehoekig-vuistbijl--sub-driehoekig': 'Sub-driehoekige vuistbijl',
  'langwerpig-driehoekig-vuistbijl--langwerpig--hartvormig': 'Langwerpig hartvormige vuistbijl',
  'onregelmatig-driehoekig-vuistbijl--sub-hartvorm-ig': 'Sub-hartvormige vuistbijl',
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
  'steker--meervoudig': 'Meervoudige steker',
  'met-gebogen-punt-met-mini-stekerafslag-en-van-ventrale': 'Gebogen beksteker met mini-stekerafslag vanaf ventrale zijde',
  'alternerende-bek--steker-o-g-steker--rr': 'Alternerende beksteker / steker RR',
  'een-krukowski--kerfrest': 'Krukowski-kerfrest',
  'de-krukowski--kerfrest-is-aan-één-zijde-steil-geretoucheerd-': 'Steil geretoucheerde Krukowski-kerfrest',
  'kerfrest-of-microsteker': 'Kerfrest of microsteker',
  'steker--a': 'A-steker',
  'op-andere-manier-gemaakt': 'Op andere manier gemaakte steker',
  'steker--corbiac': 'Corbiac-steker',
  'steke-r-ra-versmald': 'Versmalde RA-steker',
  'steker--bassaler': 'Bassaler-steker',
  'steker--lacan': 'Lacan-steker',
  'steker--ra': 'RA-steker',
  'steker--aa': 'AA-steker',
  steker: 'Steker',
  'niet-naast-elkaar-steker--aa': 'AA-steker zonder naast elkaar liggende afslagen',
  'steker--kielvormig': 'Kielvormige steker',
  'steker--snuitvormig': 'Snuitvormige steker',
  'steker--vachons': 'Vachons-steker',
  'nee-meerdere--boor--dubbel-of-boor--meervoudig': 'Enkelvoudige boor',
  'meerdere--boor--dubbel-of-boor--meervoudig': 'Dubbele of meervoudige boor',
  'boor-dickenbännli': 'Dickenbaennli-boor',
  'een-bec': 'Bec',
  'een-boor': 'Boor',
  ruimer: 'Ruimer',
  'billhook--a': 'Billhook type A',
  'billhook--b': 'Billhook type B',
  vuurslag: 'Vuurslag',
  klopsteen: 'Klopsteen',
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
  'nee-grof-bewerkt': 'Fijn oppervlaktegeretoucheerd bifaciaal werktuig',
  'grof-bewerkt': 'Grof oppervlaktegeretoucheerd bifaciaal werktuig',
  chopper: 'Chopper',
  'een-chopper--rondom--bekapt': 'Rondom bekapte chopper',
  'naar-twee-zijden-een-choppingtool': 'Chopping tool',
  'choppingtool--met-geïsoleerde--bekapte--punt': 'Chopping tool met geisoleerde bekapte punt',
  'geen-punt-choppingtool': 'Chopping tool zonder punt',
  'choppingtool--épanellé': 'Epanelle chopping tool',
  choppingtool: 'Chopping tool',
  'met-één-of-twee-dmv-steile-retouche': 'Bifaciaal werktuig met een of twee steil geretoucheerde zijden',
  'pic-of-hak': 'Pic of hak',
  'bijl-kern': 'Kernbijl',
  'bijl-kern--puntig': 'Puntige kernbijl',
  'beitel--kern': 'Kernbeitel',
  vuistwig: 'Vuistwig',
  'een-asymmetrische-driehoekige-dwarsdoorsnede': 'Asymmetrische driehoekige dwarsdoorsnede',
  'met-vlakke-retouche-bekapping-keilmesser': 'Keilmesser met vlakke retouche of bekapping',
  'met-getrapte-schubvormige-retouche': 'Keilmesser met getrapte schubvormige retouche',
  'keilmesser--köningsaue': 'Koeningsaue-keilmesser',
  'keilmesser--lichtenberger': 'Lichtenberg-keilmesser',
  'keilmesser--balver': 'Balver-keilmesser',
  'met-een-dikke-rug': 'Keilmesser met dikke rug',
  'keilmesser--buhlener': 'Buhlen-keilmesser',
  'keilmesser--bockstein': 'Bockstein-keilmesser',
  'de-snede-en-rug-lopen-zijn-nagenoeg-recht-keilmesser--': 'Rechtlijnige keilmesser',
  'meer-afgeronde-rug-messer--pradnik': 'Pradnik-messer',
  'bijl-tranchet': 'Bijl met tranchet-snede',
  'breed-te29-cm--halffabricaat--bijl': 'Halffabricaat van een bijl breder dan 2,9 cm',
  'meer-een-beitel-vorm--breedte29-cm': 'Beitelvormig artefact smaller dan 2,9 cm',
  'halffabricaat--beitel': 'Halffabricaat van een beitel',
  'een-proto--vuistbijl': 'Proto-vuistbijl',
  'spits--blad': 'Bladspits',
  'spits--blad--mauern': 'Mauern-bladspits',
  'spits--blad--szeletienne': 'Szeletien-bladspits',
  'half-steile-randretouche-aan-beide-zijden': 'Dolk met half-steile randretouche aan beide zijden',
  'franse-dolk': 'Franse dolk',
  'onregelmatig-dolk--kling--met-volledige--': 'Onregelmatige klingdolk met volledige retouche',
  'relatief-grof-aan-beide-zijden': 'Relatief grof aan beide zijden bewerkte dolk',
  'dolk-engels': 'Engelse dolk',
  'dichter-bij-de-basis-dolk--oost-europ-ees': 'Oost-Europese dolk',
  'dolk--grand--pressigny': 'Grand-Pressigny-dolk',
  'dolk--scandinavisch--type-i': 'Scandinavische dolk type I',
  'dolk--scandinavisch--type-ia': 'Scandinavische dolk type Ia',
  'dolk--scandinavisch--type-ib': 'Scandinavische dolk type Ib',
  'dolk--scandinavisch--type-ic': 'Scandinavische dolk type Ic',
  'dolk--scandinavisch--type-id': 'Scandinavische dolk type Id',
  'dolk--scandinavisch--type-ii': 'Scandinavische dolk type II',
  'dolk--scandinavisch--type-iib': 'Scandinavische dolk type IIb',
  'dolk--scandinavisch--type-iii': 'Scandinavische dolk type III',
  'dolk--scandinavisch--type-iiia': 'Scandinavische dolk type IIIa',
  'dolk--scandinavisch--type-iiib': 'Scandinavische dolk type IIIb',
  'dolk--scandinavisch--type-iiic': 'Scandinavische dolk type IIIc',
  'dolk--scandinavisch--type-iiid': 'Scandinavische dolk type IIId',
  'dolk--scandinavisch--type-iiie': 'Scandinavische dolk type IIIe',
  'dolk--scandinavisch--type-iiif': 'Scandinavische dolk type IIIf',
  'dolk--scandinavisch--type-iv': 'Scandinavische dolk type IV',
  'dolk--scandinavisch--type-iva': 'Scandinavische dolk type IVa',
  'dolk--scandinavisch--type-ivb': 'Scandinavische dolk type IVb',
  'dolk--scandinavisch--type-ivc': 'Scandinavische dolk type IVc',
  'dolk--scandinavisch--type-ivd': 'Scandinavische dolk type IVd',
  'dolk--scandinavisch--type-ive': 'Scandinavische dolk type IVe',
  'dolk--scandinavisch--type-ivf': 'Scandinavische dolk type IVf',
  'dolk-scandinavisch--type-v': 'Scandinavische dolk type V',
  'dolk--scandinavisch--type-va': 'Scandinavische dolk type Va',
  'dolk-scandinavisch--type-vb': 'Scandinavische dolk type Vb',
  'dolk--scandinavisch--type-vi': 'Scandinavische dolk type VI',
  'dolk--scandinavisch---type-via': 'Scandinavische dolk type VIa',
  'dolk--scandinavisch--type-vib': 'Scandinavische dolk type VIb',
  'dolk--scandinavisch--type-vic': 'Scandinavische dolk type VIc',
  'dolk--engels--met-kort--handvat': 'Engelse dolk met kort handvat',
  'dolk--engels--met-lang-handvat--class--1': 'Engelse dolk met lang handvat class 1',
  'dolk--engels--met-lang-handvat--class--2': 'Engelse dolk met lang handvat class 2',
  'met-een-knik-dolk--engels--met-lang-handvat--class--3': 'Engelse dolk met knik en lang handvat class 3',
  'zonder-knik-dolk--engels--met-lang-handvat--class--4': 'Engelse dolk zonder knik en lang handvat class 4',
  'dolk--oost-europees--type-1': 'Oost-Europese dolk type 1',
  'dolk--oost-europees--type-2': 'Oost-Europese dolk type 2',
  'dolk--oost-europees--type-5': 'Oost-Europese dolk type 5',
  'een-breed-lemmet-dolk--oost-europees--type-3': 'Oost-Europese dolk type 3 met breed lemmet',
  'een-smal-lemmet-dolk--oost-europees--type-4': 'Oost-Europese dolk type 4 met smal lemmet',
  'een-sikkel': 'Sikkel',
  'sikkel--type-a': 'Sikkel type A',
  'sikkel--type-b': 'Sikkel type B',
  'kernwerktuig--fijn-bewerkt': 'Fijn bewerkt kernwerktuig',
  uniface: 'Uniface',
  'vuistbijl--lancetvormig': 'Lancetvormige vuistbijl',
  'vuistbijl--ficron': 'Ficron',
  'vuistbijl--micoque': 'Micoque-vuistbijl',
  'vuistbijl--amandelvormig': 'Amandelvormige vuistbijl',
  'vuistbijl--flesvormig': 'Flesvormige vuistbijl',
  'vuistbijl--hartvormig': 'Hartvormige vuistbijl',
  'vuistbijl--langwerpig--hartvormig': 'Langwerpig hartvormige vuistbijl',
  'vuistbijl--sub-hartvormig': 'Sub-hartvormige vuistbijl',
  'vuistbijl--driehoekig': 'Driehoekige vuistbijl',
  'vuistbijl--langwerpig--driehoekig': 'Langwerpig driehoekige vuistbijl',
  'vuistbijl--sub-driehoekig': 'Sub-driehoekige vuistbijl',
  'vuistbijl--bout--coupé': 'Bout-coupe',
  'vuistbijl--met-korte--snede': 'Vuistbijl met korte snede',
  'vuistbijl--limande': 'Limande',
  'vuistbijl--ovaal': 'Ovale vuistbijl',
  'vuistbijl--rond-og-vuistbijl--disque': 'Ronde vuistbijl / disque',
  'vuistbijl--bootvormig': 'Bootvormige vuistbijl',
  'vuistbijl--fäustel': 'Fäustel',
  'vuistbijl--faustkeilblatt': 'Faustkeilblatt',
  'bijl-vlakbijl': 'Vlakbijl',
  'bijl-vlakbijl--klokvormig': 'Klokvormige vuurstenen vlakbijl',
  'bijl-vlakbijl--trapeziumvormig': 'Trapeziumvormige vuurstenen vlakbijl',
  'bijl-vlakbijl--rechthoekig': 'Rechthoekige vuurstenen vlakbijl',
  'bijl-smaltoppig--met-ovale--dwarsdoorsnede': 'Smaltoppige vuurstenen bijl met ovale dwarsdoorsnede',
  'bijl-smaltoppig--met-ovale--dwarsdoorsnede--en-geslepen--zijden': 'Smaltoppige vuurstenen bijl met geslepen zijden',
  'bijl-smaltoppig--met-afgerond--rombische--dwarsdoorsnede': 'Smaltoppige vuurstenen bijl met afgerond rombische dwarsdoorsnede',
  'bijl-smaltoppig--met-ovale--tot-vlakovale--dwarsdoorsnede': 'Smaltoppige vuurstenen bijl met ovale tot vlakovale dwarsdoorsnede',
  'bijl-breedtoppig--met-rondovale--dwarsdoorsnede': 'Breedtoppige vuurstenen bijl met rondovale dwarsdoorsnede',
  'bijl-breedtoppig--met-ovale--dwarsdoorsnede--en-geslepen--zijden': 'Breedtoppige vuurstenen bijl met geslepen zijden',
  'bijl-buren': 'Buren-bijl',
  'bijl-dunbladig--met-ovale--dwarsdoorsnede': 'Dunbladige vuurstenen bijl met ovale dwarsdoorsnede',
  'bijl-met-ovale--dwarsdoorsnede': 'Vuurstenen bijl met ovale dwarsdoorsnede',
  'bijl-met-rechthoekige--dwarsdoorsnede': 'Vuurstenen bijl met rechthoekige dwarsdoorsnede',
  'bijl-met-rechthoekige--dwarsdoorsnede--en-brede--snede': 'Vuurstenen bijl met rechthoekige dwarsdoorsnede en brede snede',
  'bijl-dissel': 'Vuurstenen dissel',
  'bijl-dissel--met-gebogen--onder--en-bovenzijde': 'Vuurstenen dissel met gebogen onder- en bovenzijde',
  'bijl-dissel--met-parallelle--onder--en-bovenzijde': 'Vuurstenen dissel met parallelle onder- en bovenzijde',
  'bijl-met-holle--snede': 'Vuurstenen bijl met holle snede',
  'bijl-met-holle--snede--en-gebogen--onder--en-bovenzijde': 'Vuurstenen bijl met holle snede en gebogen onder- en bovenzijde',
  'bijl-met-holle--snede--en-parallelle--onder--en-bovenzijde': 'Vuurstenen bijl met holle snede en parallelle onder- en bovenzijde',
  'bijl-vuursteen': 'Vuurstenen bijl',
  'bijl-met-ovale--dwarsdoorsnede--en-smalle--top': 'Stenen bijl met ovale dwarsdoorsnede en smalle top',
  'bijl-met-ronde--dwarsdoorsnede': 'Stenen bijl met ronde dwarsdoorsnede',
  'bijl-met-ronde--dwarsdoorsnede--en-dunne--smalle--top': 'Stenen bijl met ronde dwarsdoorsnede en dunne smalle top',
  'bijl-met-ronde--dwarsdoorsnede--en-stompe--top': 'Stenen bijl met ronde dwarsdoorsnede en stompe top',
  'bijl-kleischalie': 'Geslepen bijl van kleischalie',
  'bijl-met-rechthoekige--dwarsdoorsnede--duntoppig': 'Duntoppige vuurstenen bijl met rechthoekige dwarsdoorsnede',
  'bijl-met-rechthoekige--dwarsdoorsnede--en-dunne--scherpe--top': 'Vuurstenen bijl met rechthoekige dwarsdoorsnede en dunne scherpe top',
  'bijl-met-rechthoekige--dwarsdoorsnede--en-dunne--vlakke--top': 'Vuurstenen bijl met rechthoekige dwarsdoorsnede en dunne vlakke top',
  'bijl-met-rechthoekige--dwarsdoorsnede--en-dunne--onregelmatige--top': 'Vuurstenen bijl met rechthoekige dwarsdoorsnede en dunne onregelmatige top',
  'bijl-met-rechthoekige--dwarsdoorsnede--dikbladig': 'Dikbladige vuurstenen bijl met rechthoekige dwarsdoorsnede',
  'bijl-met-rechthoekige--dwarsdoorsnede--dikbladig--sterk-gebogen': 'Dikbladige vuurstenen bijl met sterk gebogen boven- en onderzijde',
  'bijl-met-rechthoekige--dwarsdoorsnede--dikbladig--weinig-gekromd': 'Dikbladige vuurstenen bijl met weinig gekromde boven- en onderzijde',
  'bijl-met-rechthoekige--dwarsdoorsnede--dikbladig--parallel': 'Dikbladige vuurstenen bijl met nagenoeg parallelle boven- en onderzijde',
  'bijl-met-rechthoekige--dwarsdoorsnede--dunbladig': 'Dunbladige vuurstenen bijl met rechthoekige dwarsdoorsnede',
  'bijl-met-rechthoekige--dwarsdoorsnede--dunbladig--sterk-gekromd': 'Dunbladige vuurstenen bijl met sterk gekromde boven- en onderzijde',
  'bijl-met-rechthoekige--dwarsdoorsnede--dunbladig--parallel': 'Dunbladige vuurstenen bijl met nagenoeg parallelle boven- en onderzijde',
  beitel: 'Beitel',
  'beitel--guts': 'Gutsbeitel',
  'beitel--dissel': 'Disselbeitel',
  'beitel--standaard': 'Standaardbeitel',
  'beitel--punt': 'Puntbeitel',
  dolk: 'Dolk',
  'artefact--gemaakt-van-bijlafslag': 'Artefact gemaakt van bijlafslag',
  dellensteen: 'Dellensteen',
  'doorboorde--rolsteen': 'Doorboorde rolsteen',
  'doorboorde--schijfvormige--steen': 'Doorboorde schijfvormige steen',
  'bijl-dissel--met-gat-haaks--op-de-snede': 'Schoenleest-bijl met gat haaks op de snede',
  'bijl-dissel--doorboord': 'Doorboorde schoenleestwig',
  'doorboorde--breedwig': 'Doorboorde breedwig',
  'hak-puntig': 'Puntige hak',
  'bijl-dubbel': 'Dubbelbijl',
  'bijl-dubbel--type-a': 'Dubbelbijl type A',
  'bijl-dubbel--type-b': 'Dubbelbijl type B',
  'bijl-dubbel--type-c': 'Dubbelbijl type C',
  'bijl-hamer--gefacetteerd': 'Gefacetteerde hamerbijl',
  'bijl-hamer--gefacetteerd--type-1': 'Gefacetteerde hamerbijl type 1',
  'bijl-hamer--gefacetteerd--type-2a': 'Gefacetteerde hamerbijl type 2a',
  'bijl-hamer--gefacetteerd--type-2b': 'Gefacetteerde hamerbijl type 2b',
  'bijl-hamer--knop': 'Knop-hamerbijl',
  'een-afgeronde-verdikking-bijl-hamer--type-p1': 'Hamerbijl type P1',
  'type-h-en-g': 'Hamerbijl type H of G',
  'type-k-en-l': 'Hamerbijl type K of L',
  'type-a--ba': 'Hamerbijl type A of Ba',
  'type-c-en-ca': 'Hamerbijl type C of Ca',
  'bijl-hamer--type-g': 'Hamerbijl type G',
  'bijl-hamer--type-k': 'Hamerbijl type K',
  'bijl-hamer--type-l': 'Hamerbijl type L',
  'bijl-hamer--type-ba': 'Hamerbijl type Ba',
  'bijl-hamer--type-b': 'Hamerbijl type B',
  'bijl-hamer--type-i': 'Hamerbijl type I',
  'bijl-hamer--type-r': 'Hamerbijl type R',
  'bijl-hamer--type-c': 'Hamerbijl type C',
  'bijl-hamer--type-d': 'Hamerbijl type D',
  'bijl-hamer--type-f': 'Hamerbijl type F',
  'bijl-hamer--type-muntendam': 'Hamerbijl type Muntendam',
  'met-rand-bijl-hamer--type-zuidvelde': 'Hamerbijl type Zuidvelde',
  'zonder-rand-bijl-hamer--type-emmen': 'Hamerbijl type Emmen',
  'geen-versmalde-nek-wel-verdikking-rond-het-gat': 'Hamerbijl met verdikking rond het gat en zonder versmalde nek',
  'wigvormig-zonder-verdikking': 'Wigvormige hamerbijl zonder verdikking',
};

function processExpertAnswer(
  questionId: string,
  answer: 'ja' | 'nee'
): {
  isEnd: boolean;
  nextQuestion?: string;
  result?: string;
} {
  const question = fullDecisionTree[questionId];
  if (!question) {
    return { isEnd: true, result: 'onbekend' };
  }

  const target = answer === 'ja' ? question.ja : question.nee;
  const nextQuestionId = getExpertQuestionIdAt(questionId, 1);
  const nextNextQuestionId = getExpertQuestionIdAt(questionId, 2);

  if (!target) {
    return nextQuestionId
      ? { isEnd: false, nextQuestion: nextQuestionId }
      : { isEnd: true, result: 'onbepaald' };
  }

  const explicitJump = EXPERT_LABEL_JUMPS[target];
  if (explicitJump) {
    return { isEnd: false, nextQuestion: explicitJump };
  }

  const contextualJump = getExpertContextualJump(questionId, target);
  if (contextualJump) {
    return { isEnd: false, nextQuestion: contextualJump };
  }

  if (target === 'terug-artefactgroepen-start') {
    return nextQuestionId
      ? { isEnd: false, nextQuestion: nextQuestionId }
      : { isEnd: true, result: formatTypeName(target) };
  }

  if (target === 'nee' && nextQuestionId) {
    return { isEnd: false, nextQuestion: nextQuestionId };
  }

  if (answer === 'ja' && isExpertQuestionRelatedToLabel(nextQuestionId, target)) {
    return { isEnd: false, nextQuestion: nextQuestionId! };
  }

  const yesTarget = question.ja;
  if (
    answer === 'nee' &&
    yesTarget &&
    isExpertQuestionRelatedToLabel(nextQuestionId, yesTarget) &&
    nextNextQuestionId
  ) {
    return { isEnd: false, nextQuestion: nextNextQuestionId };
  }

  const genericLabel = slugTokens(target).some((token) =>
    ['artefact', 'kern', 'werktuig', 'afslag', 'kling', 'bijl', 'beitel', 'spits', 'schrabber', 'dolk'].includes(token)
  );
  if (genericLabel && nextQuestionId) {
    return { isEnd: false, nextQuestion: nextQuestionId };
  }

  return { isEnd: true, result: target };
}

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
  if (mode === 'expert') {
    return processExpertAnswer(questionId, answer);
  }

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
