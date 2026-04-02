import type { UserLevel } from '../types';
import type { DecisionTreeMode } from './decisionTree';

export type QuickStartFamily =
  | 'spits'
  | 'schrabber'
  | 'vuistbijl'
  | 'geslepen-vuurstenen-bijl'
  | 'doorboord-artefact'
  | 'kern';

export interface QuickStartDefinition {
  id: QuickStartFamily;
  label: string;
  description: string;
  sourceResultType: string;
  beginnerAvailable: boolean;
  start: {
    gevorderd?: {
      targetLevel: UserLevel;
      treeMode: DecisionTreeMode;
      startQuestionId: string;
    };
    expert: {
      targetLevel: UserLevel;
      treeMode: DecisionTreeMode;
      startQuestionId: string;
    };
  };
}

export const QUICK_START_DEFINITIONS: QuickStartDefinition[] = [
  {
    id: 'spits',
    label: 'Pijlpunt / spits',
    description: 'Gebruik dit als het artefact duidelijk als spits of pijlpunt oogt, maar het subtype nog onduidelijk is.',
    sourceResultType: 'spits',
    beginnerAvailable: false,
    start: {
      gevorderd: { targetLevel: 'gevorderd', treeMode: 'phase2-spits', startQuestionId: '540' },
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '540' },
    },
  },
  {
    id: 'schrabber',
    label: 'Schrabber',
    description: 'Gebruik dit bij een duidelijke schrabbervorm met een steile of gebogen werkkant.',
    sourceResultType: 'schrabber',
    beginnerAvailable: false,
    start: {
      gevorderd: { targetLevel: 'gevorderd', treeMode: 'phase2-schrabber', startQuestionId: '321' },
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '320' },
    },
  },
  {
    id: 'vuistbijl',
    label: 'Vuistbijl / bifaciaal',
    description: 'Gebruik dit als het stuk duidelijk bifaciaal bewerkt is en eerder op een vuistbijl of bladvorm lijkt.',
    sourceResultType: 'vuistbijl',
    beginnerAvailable: false,
    start: {
      gevorderd: { targetLevel: 'gevorderd', treeMode: 'phase3-vuistbijl', startQuestionId: '610' },
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '125' },
    },
  },
  {
    id: 'geslepen-vuurstenen-bijl',
    label: 'Geslepen vuurstenen bijl',
    description: 'Gebruik dit als het artefact duidelijk geslepen is en al als bijlachtig stuk herkenbaar is.',
    sourceResultType: 'geslepen-vuurstenen-bijl',
    beginnerAvailable: false,
    start: {
      gevorderd: { targetLevel: 'gevorderd', treeMode: 'phase4-geslepen-bijl', startQuestionId: '801' },
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '603' },
    },
  },
  {
    id: 'doorboord-artefact',
    label: 'Doorboord werktuig',
    description: 'Gebruik dit als je zeker weet dat het artefact een kunstmatig gat of boring heeft.',
    sourceResultType: 'doorboord-artefact',
    beginnerAvailable: false,
    start: {
      gevorderd: { targetLevel: 'gevorderd', treeMode: 'phase5-doorboord-artefact', startQuestionId: '900' },
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '700' },
    },
  },
  {
    id: 'kern',
    label: 'Kern',
    description: 'Gebruik dit als je al weet dat het om een kern gaat en niet om een werktuig op afslag of kling.',
    sourceResultType: 'kern',
    beginnerAvailable: false,
    start: {
      expert: { targetLevel: 'expert', treeMode: 'expert', startQuestionId: '11' },
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
