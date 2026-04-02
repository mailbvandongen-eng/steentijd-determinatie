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
