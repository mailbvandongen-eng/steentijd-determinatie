import type { UserLevel } from '../types';
import type { DecisionTreeMode } from './decisionTree';

export type QuickStartFamily =
  | 'kern-levallois'
  | 'kern-diskusvormig'
  | 'kern-kling'
  | 'kern-afslag'
  | 'afslag-onbewerkt'
  | 'kling-onbewerkt'
  | 'geretoucheerde-kling'
  | 'geretoucheerde-afslag'
  | 'rugmes'
  | 'klingschrabber'
  | 'schrabber'
  | 'spits'
  | 'chopper-of-chopping-tool'
  | 'kernwerktuig-grof'
  | 'boor-of-priem'
  | 'kernwerktuig-klein'
  | 'vuistbijl'
  | 'geslepen-vuurstenen-bijl'
  | 'geslepen-vuurstenen-artefact'
  | 'doorboord-artefact'
  | 'hamerbijl';

export type QuickStartCategory =
  | 'Kernen'
  | 'Afslag en kling'
  | 'Kernwerktuigen'
  | 'Bifaciaal'
  | 'Geslepen'
  | 'Doorboord';

interface QuickStartTarget {
  targetLevel: UserLevel;
  treeMode: DecisionTreeMode;
  startQuestionId: string;
}

export interface QuickStartDefinition {
  id: QuickStartFamily;
  category: QuickStartCategory;
  label: string;
  description: string;
  sourceResultType: string;
  expectedTraits: string[];
  commonConfusions?: string[];
  exampleOutcomes?: string[];
  start: {
    gevorderd?: QuickStartTarget;
    expert: QuickStartTarget;
  };
}

export const QUICK_START_DEFINITIONS: QuickStartDefinition[] = [
  {
    id: 'kern-levallois',
    category: 'Kernen',
    label: 'Levallois-kern',
    description: 'Gebruik dit als je al vrij zeker weet dat het om een Levallois-kern gaat of duidelijk in die familie zit.',
    sourceResultType: 'kern-levallois',
    expectedTraits: [
      'voorbereide kern met naar het midden gerichte negatieven',
      'schildpadachtige of doelgericht voorbereide opbouw',
      'duidelijk kernstuk, geen afslag of klingwerktuig',
    ],
    commonConfusions: ['diskusvormige kern', 'gewone afslagkern', 'groot afgebroken brokstuk'],
    exampleOutcomes: ['Ongebruikte Levallois-kern', 'Levallois-afslagkern', 'Levallois-klingkern'],
    start: {
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '21' },
    },
  },
  {
    id: 'kern-diskusvormig',
    category: 'Kernen',
    label: 'Diskusvormige kern',
    description: 'Gebruik dit als het stuk duidelijk een tweezijdig, schijfachtig kernpatroon heeft.',
    sourceResultType: 'kern-diskusvormig',
    expectedTraits: [
      'schijfachtige of ronde kernvorm',
      'negatieven aan beide zijden naar het midden gericht',
      'duidelijk kernstuk zonder uitgewerkte werktuigkap',
    ],
    commonConfusions: ['Levallois-kern', 'veelvlakkern', 'platte brok of schijfsteen'],
    exampleOutcomes: ['Diskusvormige kern', 'Afslagkern', 'Bidirectionele kern'],
    start: {
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '18' },
    },
  },
  {
    id: 'kern-kling',
    category: 'Kernen',
    label: 'Klingkern',
    description: 'Gebruik dit als je al weet dat het om een kern voor klingproductie gaat.',
    sourceResultType: 'kern-kling',
    expectedTraits: [
      'langwerpige parallelle of subparallelle kernnegatieven',
      'kern bedoeld voor productie van klingen',
      'geen los klingwerktuig met retouche',
    ],
    commonConfusions: ['lange afslagkern', 'geretoucheerde kling', 'rugmes'],
    exampleOutcomes: ['Klingkern', 'Montbani-klingkern', 'Coincy-klingkern', 'Kielvormige kern'],
    start: {
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '27' },
    },
  },
  {
    id: 'kern-afslag',
    category: 'Kernen',
    label: 'Afslagkern',
    description: 'Gebruik dit als het om een kern voor afslagen gaat en niet om een werktuig op afslag of kling.',
    sourceResultType: 'kern-afslag',
    expectedTraits: [
      'duidelijk kernstuk met meerdere afslagnegatieven',
      'negatieven minder uitgesproken klingvormig',
      'geen doelgerichte retouche langs een werktuigrand',
    ],
    commonConfusions: ['klingkern', 'grof kernwerktuig', 'natuurlijk gebroken brok'],
    exampleOutcomes: ['Afslagkern', 'Piramidale afslagkern', 'Orthogonale kern', 'Bidirectionele afslagkern'],
    start: {
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '23' },
    },
  },
  {
    id: 'afslag-onbewerkt',
    category: 'Afslag en kling',
    label: 'Onbewerkte afslag',
    description: 'Gebruik dit als het stuk duidelijk een afslag is zonder verdere retouche of uitwerking.',
    sourceResultType: 'afslag-onbewerkt',
    expectedTraits: [
      'ventrale zijde met slagbult of buikzijde',
      'korter of breder dan een kling',
      'geen duidelijke retouche of werktuigkap',
    ],
    commonConfusions: ['geretoucheerde afslag', 'kling', 'bijlafslag'],
    exampleOutcomes: ['Kombewa-afslag', 'Primaire afslag', 'Secundaire afslag'],
    start: {
      gevorderd: { targetLevel: 'gevorderd', treeMode: 'phase1-afslag', startQuestionId: '42' },
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '42' },
    },
  },
  {
    id: 'kling-onbewerkt',
    category: 'Afslag en kling',
    label: 'Onbewerkte kling',
    description: 'Gebruik dit als het stuk duidelijk een kling is zonder retouche of werktuigbewerking.',
    sourceResultType: 'kling-onbewerkt',
    expectedTraits: [
      'duidelijk langer dan breed',
      'parallelle of bijna parallelle randen',
      'geen duidelijke retouche of werktuigkap',
    ],
    commonConfusions: ['geretoucheerde kling', 'rugmes', 'kernpreparatiekling'],
    exampleOutcomes: ['Levallois-kling', 'Kernpreparatiekling', 'Montbani-kling'],
    start: {
      gevorderd: { targetLevel: 'gevorderd', treeMode: 'phase1-kling', startQuestionId: '71' },
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '71' },
    },
  },
  {
    id: 'geretoucheerde-kling',
    category: 'Afslag en kling',
    label: 'Geretoucheerde kling',
    description: 'Gebruik dit als het stuk duidelijk een kling is met doelgerichte randbewerking.',
    sourceResultType: 'geretoucheerde-kling',
    expectedTraits: [
      'klingvorm met doelgerichte retouche langs rand of uiteinde',
      'langwerpig basisstuk',
      'geen kern maar een los product',
    ],
    commonConfusions: ['rugmes', 'klingschrabber', 'spits'],
    exampleOutcomes: ['Geretoucheerde kling', 'Klingschrabber', 'Rugmes', 'Spits'],
    start: {
      gevorderd: { targetLevel: 'gevorderd', treeMode: 'phase1-geretoucheerde-kling', startQuestionId: '390' },
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '390' },
    },
  },
  {
    id: 'geretoucheerde-afslag',
    category: 'Afslag en kling',
    label: 'Geretoucheerde afslag',
    description: 'Gebruik dit als het om een afslag met duidelijke retouche of werktuigbewerking gaat.',
    sourceResultType: 'geretoucheerde-afslag',
    expectedTraits: [
      'afslagvorm met doelgerichte retouche of bewerkte rand',
      'geen langwerpige kling als basisvorm',
      'werktuigfunctie overheerst boven ruwe afslagvorm',
    ],
    commonConfusions: ['schrabber', 'spits', 'onbewerkte afslag'],
    exampleOutcomes: ['Schrabber', 'Steker', 'Boor', 'Afgeknot artefact'],
    start: {
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '202' },
    },
  },
  {
    id: 'rugmes',
    category: 'Afslag en kling',
    label: 'Rugmes',
    description: 'Gebruik dit als de kling of afslag een duidelijke rug tegenover de scherpe rand heeft.',
    sourceResultType: 'rugmes',
    expectedTraits: [
      'scherpe rand tegenover dikke of stompe rug',
      'driehoekige dwarsdoorsnede of rugzijde',
      'langwerpig stuk zonder uitgesproken spitsfunctie',
    ],
    commonConfusions: ['geretoucheerde kling', 'spits', 'klingschrabber'],
    exampleOutcomes: ['Rugmes met natuurlijke rug', 'Rugmes met retouche', 'Micro-rugmes'],
    start: {
      gevorderd: { targetLevel: 'gevorderd', treeMode: 'phase1-rugmes', startQuestionId: '381' },
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '381' },
    },
  },
  {
    id: 'klingschrabber',
    category: 'Afslag en kling',
    label: 'Klingschrabber',
    description: 'Gebruik dit als een kling duidelijk een schrabberkap of schrabberfunctie heeft.',
    sourceResultType: 'klingschrabber',
    expectedTraits: [
      'klingbasis met schrabberkap of geronde werkkant',
      'steile kapretouche aan een uiteinde of duidelijke werkkant',
      'geen zuivere spitsvorm als hoofdfunctie',
    ],
    commonConfusions: ['geretoucheerde kling', 'schrabber', 'rugmes'],
    exampleOutcomes: ['Enkelvoudige klingschrabber', 'Dubbele klingschrabber'],
    start: {
      gevorderd: { targetLevel: 'gevorderd', treeMode: 'phase1-klingschrabber', startQuestionId: '335' },
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '335' },
    },
  },
  {
    id: 'schrabber',
    category: 'Afslag en kling',
    label: 'Schrabber',
    description: 'Gebruik dit bij een duidelijke schrabbervorm met een steile of gebogen werkkant.',
    sourceResultType: 'schrabber',
    expectedTraits: [
      'relatief steile geretoucheerde werkkant',
      'schrapende kap of zijrand als hoofdfunctie',
      'geen uitgesproken doorborende punt',
    ],
    commonConfusions: ['klingschrabber', 'afgeknot werktuig', 'spits'],
    exampleOutcomes: ['Zijschrabber', 'Duimnagelschraper', 'Snuitschrabber', 'Limace'],
    start: {
      gevorderd: { targetLevel: 'gevorderd', treeMode: 'phase2-schrabber', startQuestionId: '321' },
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '321' },
    },
  },
  {
    id: 'spits',
    category: 'Afslag en kling',
    label: 'Pijlpunt / spits',
    description: 'Gebruik dit als het artefact duidelijk als spits of pijlpunt oogt, maar het subtype nog onduidelijk is.',
    sourceResultType: 'spits',
    expectedTraits: [
      'duidelijke doelgerichte puntvorm',
      'retouche naar een punt toe of schachtdoorn/weerhaak',
      'puntfunctie overheerst boven schrapende of rugmesfunctie',
    ],
    commonConfusions: ['rugmes', 'boor of priem', 'geretoucheerde kling'],
    exampleOutcomes: ['Dennenboompje', 'Brede klokbekerspits', 'Smalle klokbekerspits', 'Tjonger-spits'],
    start: {
      gevorderd: { targetLevel: 'gevorderd', treeMode: 'phase2-spits', startQuestionId: '540' },
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '540' },
    },
  },
  {
    id: 'chopper-of-chopping-tool',
    category: 'Kernwerktuigen',
    label: 'Chopper / chopping tool',
    description: 'Gebruik dit als het om een grof kernwerktuig met duidelijke snijkant of werkkant gaat.',
    sourceResultType: 'chopper-of-chopping-tool',
    expectedTraits: [
      'grof bekapte snijkant of werkkant op massief stuk',
      'kernachtig of blokvormig basisstuk',
      'geen fijne bifaciale afwerking',
    ],
    commonConfusions: ['grof kernwerktuig', 'vuistbijl', 'natuurlijk beschadigde steen'],
    exampleOutcomes: ['Chopper', 'Chopping tool', 'Unifaciaal chopping tool'],
    start: {
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '103' },
    },
  },
  {
    id: 'kernwerktuig-grof',
    category: 'Kernwerktuigen',
    label: 'Grof kernwerktuig',
    description: 'Gebruik dit voor grof bewerkte kernwerktuigen die nog niet duidelijk in een scherper subtype vallen.',
    sourceResultType: 'kernwerktuig-grof',
    expectedTraits: [
      'massief stuk met duidelijke menselijke bekapping',
      'werktuigfunctie zichtbaar maar nog grof van contour',
      'geen nette vuistbijl- of schrabbervorm',
    ],
    commonConfusions: ['chopper of chopping tool', 'klein kernwerktuig', 'vuistbijl'],
    exampleOutcomes: ['Pic of hak', 'Vuistwig', 'Grof kernwerktuig'],
    start: {
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '104' },
    },
  },
  {
    id: 'boor-of-priem',
    category: 'Kernwerktuigen',
    label: 'Boor / priem / bec',
    description: 'Gebruik dit als een duidelijke punt of boorvorm de hoofdfunctie lijkt te zijn.',
    sourceResultType: 'boor-of-priem',
    expectedTraits: [
      'smalle functionele punt of bec',
      'borende of priemende functie lijkt centraal',
      'geen brede pijlpunt of schrabberkap',
    ],
    commonConfusions: ['spits', 'klein kernwerktuig', 'steker'],
    exampleOutcomes: ['Boor', 'Dubbele boor', 'Bec', 'Priem'],
    start: {
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '230' },
    },
  },
  {
    id: 'kernwerktuig-klein',
    category: 'Kernwerktuigen',
    label: 'Klein kernwerktuig',
    description: 'Gebruik dit voor kleine kernwerktuigen die niet beter als vuistbijl of grove chopper passen.',
    sourceResultType: 'kernwerktuig-klein',
    expectedTraits: [
      'klein maar duidelijk kernachtig bewerkt stuk',
      'meer vormgegeven dan een grof kernwerktuig',
      'geen duidelijke geslepen, doorboorde of afslag/klingbasis',
    ],
    commonConfusions: ['boor of priem', 'kleine vuistbijl', 'grof kernwerktuig'],
    exampleOutcomes: ['Faustkeilblatt', 'Uniface', 'Klein kernwerktuig'],
    start: {
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '125' },
    },
  },
  {
    id: 'vuistbijl',
    category: 'Bifaciaal',
    label: 'Vuistbijl / bifaciaal',
    description: 'Gebruik dit als het stuk duidelijk bifaciaal bewerkt is en eerder op een vuistbijl of bladvorm lijkt.',
    sourceResultType: 'vuistbijl',
    expectedTraits: [
      'duidelijke bifaciale bewerking aan twee zijden',
      'globale punt-, blad- of bijlvorm',
      'niet slechts één geretoucheerde rand op een afslag of kling',
    ],
    commonConfusions: ['klein kernwerktuig', 'chopper', 'geslepen bijl'],
    exampleOutcomes: ['Amandelvormige vuistbijl', 'Hartvormige vuistbijl', 'Micoque-vuistbijl', 'Bout-coupé'],
    start: {
      gevorderd: { targetLevel: 'gevorderd', treeMode: 'phase3-vuistbijl', startQuestionId: '610' },
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '610' },
    },
  },
  {
    id: 'geslepen-vuurstenen-bijl',
    category: 'Geslepen',
    label: 'Geslepen vuurstenen bijl',
    description: 'Gebruik dit als het artefact duidelijk geslepen is en al als bijlachtig stuk herkenbaar is.',
    sourceResultType: 'geslepen-vuurstenen-bijl',
    expectedTraits: [
      'duidelijk geslepen oppervlak',
      'bijlvormig lichaam met snede',
      'geen boring of gat als hoofdkenmerk',
    ],
    commonConfusions: ['geslepen vuurstenen artefact', 'geslepen stenen artefact', 'doorboorde bijl'],
    exampleOutcomes: ['Vlakbijl', 'Buren-bijl', 'Dissel', 'Dunbladige vuurstenen bijl'],
    start: {
      gevorderd: { targetLevel: 'gevorderd', treeMode: 'phase4-geslepen-bijl', startQuestionId: '801' },
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '801' },
    },
  },
  {
    id: 'geslepen-vuurstenen-artefact',
    category: 'Geslepen',
    label: 'Geslepen vuurstenen artefact',
    description: 'Gebruik dit als het stuk geslepen is, maar eerder op een beitel, dolk of ander geslepen vuurstenen werktuig lijkt.',
    sourceResultType: 'geslepen-vuurstenen-artefact',
    expectedTraits: [
      'duidelijk geslepen vuursteen',
      'geen gewone bijlvorm als hoofdvorm',
      'kan eerder beitel-, dolk- of ander gespecialiseerd werktuig zijn',
    ],
    commonConfusions: ['geslepen vuurstenen bijl', 'geslepen stenen artefact', 'geretoucheerde kling'],
    exampleOutcomes: ['Gutsbeitel', 'Disselbeitel', 'Puntbeitel', 'Dolk'],
    start: {
      gevorderd: { targetLevel: 'gevorderd', treeMode: 'phase4-geslepen-artefact', startQuestionId: '840' },
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '840' },
    },
  },
  {
    id: 'doorboord-artefact',
    category: 'Doorboord',
    label: 'Doorboord artefact',
    description: 'Gebruik dit als je zeker weet dat het artefact een kunstmatig gat of boring heeft.',
    sourceResultType: 'doorboord-artefact',
    expectedTraits: [
      'duidelijk kunstmatig gat of boring',
      'doorboring is een hoofdkenmerk van de vorm',
      'geen natuurlijke holte of recente beschadiging',
    ],
    commonConfusions: ['hamerbijl', 'natuurlijke steen met gat', 'geslepen bijlfragment'],
    exampleOutcomes: ['Dellensteen', 'Doorboorde rolsteen', 'Doorboorde breedwig', 'Dubbelbijl'],
    start: {
      gevorderd: { targetLevel: 'gevorderd', treeMode: 'phase5-doorboord-artefact', startQuestionId: '900' },
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '900' },
    },
  },
  {
    id: 'hamerbijl',
    category: 'Doorboord',
    label: 'Hamerbijl',
    description: 'Gebruik dit als het stuk al duidelijk in de hamerbijlfamilie valt en je vooral het subtype zoekt.',
    sourceResultType: 'hamerbijl',
    expectedTraits: [
      'kunstmatig gat of boring',
      'hamer- of bijlvormig lichaam',
      'duidelijk zwaarder werktuig dan kleine doorboorde objecten of sieraden',
    ],
    commonConfusions: ['doorboord artefact', 'dubbelbijl', 'geslepen bijl met beschadiging'],
    exampleOutcomes: ['Gefacetteerde hamerbijl', 'Knop-hamerbijl', 'Type Muntendam', 'Type Zuidvelde'],
    start: {
      gevorderd: { targetLevel: 'gevorderd', treeMode: 'phase5-hamerbijl', startQuestionId: '930' },
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '930' },
    },
  },
];

export function getQuickStartDefinition(id: QuickStartFamily): QuickStartDefinition | undefined {
  return QUICK_START_DEFINITIONS.find((definition) => definition.id === id);
}

export function getQuickStartDefinitionsForLevel(level: UserLevel): QuickStartDefinition[] {
  return QUICK_START_DEFINITIONS.filter((definition) => {
    if (level === 'expert') return true;
    return Boolean(definition.start.gevorderd);
  });
}

export function getQuickStartContinuation(id: QuickStartFamily, level: UserLevel) {
  const definition = getQuickStartDefinition(id);
  if (!definition) return null;

  if (level === 'expert') {
    return {
      ...definition.start.expert,
      sourceResultType: definition.sourceResultType,
      familyLabel: definition.label,
    };
  }

  const advancedStart = definition.start.gevorderd;
  if (!advancedStart) return null;

  return {
    ...advancedStart,
    sourceResultType: definition.sourceResultType,
    familyLabel: definition.label,
  };
}

export function getQuickStartPromptContext(definition: QuickStartDefinition): string {
  const lines = [
    `Verwachte kenmerken: ${definition.expectedTraits.join('; ')}`,
    definition.commonConfusions && definition.commonConfusions.length > 0
      ? `Veelvoorkomende verwarring: ${definition.commonConfusions.join('; ')}`
      : null,
    definition.exampleOutcomes && definition.exampleOutcomes.length > 0
      ? `Voorbeelden van subtype-uitkomsten in deze familie: ${definition.exampleOutcomes.join('; ')}`
      : null,
  ].filter(Boolean);

  return lines.join('\n');
}
