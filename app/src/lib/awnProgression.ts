import type { UserLevel } from '../types';
import type { DecisionTreeMode } from './decisionTree';

export type AwnTestPhaseId =
  | 'phase-1-klingen-en-afslagen'
  | 'phase-2-spitsen-en-schrapers'
  | 'phase-3-bifaciale-werktuigen'
  | 'phase-4-geslepen-werktuigen'
  | 'phase-5-doorboorde-werktuigen'
  | 'phase-6-expert-volledige-boom';

export interface AwnTestPhase {
  id: AwnTestPhaseId;
  title: string;
  status: 'active' | 'planned';
  summary: string;
}

export interface ContinuationOption {
  sourceResultType: string;
  targetLevel: UserLevel;
  treeMode: DecisionTreeMode;
  phaseId: AwnTestPhaseId;
  title: string;
  summary: string;
  testLabel: string;
}

export const AWN_TEST_PHASES: AwnTestPhase[] = [
  {
    id: 'phase-1-klingen-en-afslagen',
    title: 'Fase 1: Klingen en Afslagen',
    status: 'active',
    summary: 'Verdieping van onbewerkte en eenvoudig geretoucheerde klingen en afslagen.',
  },
  {
    id: 'phase-2-spitsen-en-schrapers',
    title: 'Fase 2: Spitsen en Schrabbers',
    status: 'active',
    summary: 'Verdieping van spitsen, schrabbers en bredere afslag/kling-werktuiggroepen.',
  },
  {
    id: 'phase-3-bifaciale-werktuigen',
    title: 'Fase 3: Bifaciale Werktuigen',
    status: 'active',
    summary: 'Vuistbijlen en eerste bifaciale subtypeverdieping volgens AWN 5.5.2.',
  },
  {
    id: 'phase-4-geslepen-werktuigen',
    title: 'Fase 4: Geslepen Werktuigen',
    status: 'active',
    summary: 'Vuurstenen bijlen, beitels en eerste geslepen artefactverdieping volgens AWN niveau 2C/3C.',
  },
  {
    id: 'phase-5-doorboorde-werktuigen',
    title: 'Fase 5: Doorboorde Werktuigen',
    status: 'active',
    summary: 'Doorboorde werktuigen, dubbelbijlen en hamerbijlen volgens AWN niveau 2D/3D.',
  },
  {
    id: 'phase-6-expert-volledige-boom',
    title: 'Fase 6: Expert Volledige Boom',
    status: 'planned',
    summary: 'Integratie van de volledige AWN-beslisboom met alle 511 vraagknooppunten.',
  },
];

const CONTINUATION_MAP: Partial<Record<string, ContinuationOption>> = {
  'afslag-onbewerkt': {
    sourceResultType: 'afslag-onbewerkt',
    targetLevel: 'gevorderd',
    treeMode: 'phase1-afslag',
    phaseId: 'phase-1-klingen-en-afslagen',
    title: 'Verdiep afslagtype',
    summary: 'Test de AWN-verdieping voor onbewerkte afslagen.',
    testLabel: 'Afslagverdieping actief',
  },
  'kling-onbewerkt': {
    sourceResultType: 'kling-onbewerkt',
    targetLevel: 'gevorderd',
    treeMode: 'phase1-kling',
    phaseId: 'phase-1-klingen-en-afslagen',
    title: 'Verdiep klingtype',
    summary: 'Test de AWN-verdieping voor onbewerkte klingen.',
    testLabel: 'Klingverdieping actief',
  },
  'geretoucheerde-kling': {
    sourceResultType: 'geretoucheerde-kling',
    targetLevel: 'gevorderd',
    treeMode: 'phase1-geretoucheerde-kling',
    phaseId: 'phase-1-klingen-en-afslagen',
    title: 'Verdiep geretoucheerde kling',
    summary: 'Test de eerste AWN-verdieping voor steil geretoucheerde klingen.',
    testLabel: 'Geretoucheerde kling actief',
  },
  rugmes: {
    sourceResultType: 'rugmes',
    targetLevel: 'gevorderd',
    treeMode: 'phase1-rugmes',
    phaseId: 'phase-1-klingen-en-afslagen',
    title: 'Verdiep rugmes',
    summary: 'Test de eerste AWN-verdieping voor rugmes-varianten.',
    testLabel: 'Rugmesverdieping actief',
  },
  klingschrabber: {
    sourceResultType: 'klingschrabber',
    targetLevel: 'gevorderd',
    treeMode: 'phase1-klingschrabber',
    phaseId: 'phase-1-klingen-en-afslagen',
    title: 'Verdiep klingschrabber',
    summary: 'Test de eerste AWN-verdieping voor klingschrabbers.',
    testLabel: 'Klingschrabberverdieping actief',
  },
  schrabber: {
    sourceResultType: 'schrabber',
    targetLevel: 'gevorderd',
    treeMode: 'phase2-schrabber',
    phaseId: 'phase-2-spitsen-en-schrapers',
    title: 'Verdiep schrabber',
    summary: 'Test de uitgebreidere AWN-verdieping voor schrabber-subtypen.',
    testLabel: 'Schrabberfase 2 actief',
  },
  spits: {
    sourceResultType: 'spits',
    targetLevel: 'gevorderd',
    treeMode: 'phase2-spits',
    phaseId: 'phase-2-spitsen-en-schrapers',
    title: 'Verdiep spits',
    summary: 'Test de eerste uitgebreide AWN-verdieping voor spits-subtypen.',
    testLabel: 'Spitsfase 2 actief',
  },
  vuistbijl: {
    sourceResultType: 'vuistbijl',
    targetLevel: 'gevorderd',
    treeMode: 'phase3-vuistbijl',
    phaseId: 'phase-3-bifaciale-werktuigen',
    title: 'Verdiep vuistbijl',
    summary: 'Test de eerste AWN-verdieping voor vuistbijl-subtypen.',
    testLabel: 'Vuistbijlfase 3 actief',
  },
  'geslepen-vuurstenen-bijl': {
    sourceResultType: 'geslepen-vuurstenen-bijl',
    targetLevel: 'gevorderd',
    treeMode: 'phase4-geslepen-bijl',
    phaseId: 'phase-4-geslepen-werktuigen',
    title: 'Verdiep geslepen vuurstenen bijl',
    summary: 'Test de AWN-verdieping voor vuurstenen bijl-subtypen.',
    testLabel: 'Geslepen bijlfase 4 actief',
  },
  'geslepen-vuurstenen-artefact': {
    sourceResultType: 'geslepen-vuurstenen-artefact',
    targetLevel: 'gevorderd',
    treeMode: 'phase4-geslepen-artefact',
    phaseId: 'phase-4-geslepen-werktuigen',
    title: 'Verdiep geslepen vuurstenen artefact',
    summary: 'Test de eerste AWN-verdieping voor beitels, dolken en andere geslepen vuurstenen artefacten.',
    testLabel: 'Geslepen artefactfase 4 actief',
  },
  'doorboord-artefact': {
    sourceResultType: 'doorboord-artefact',
    targetLevel: 'gevorderd',
    treeMode: 'phase5-doorboord-artefact',
    phaseId: 'phase-5-doorboorde-werktuigen',
    title: 'Verdiep doorboord artefact',
    summary: 'Test de AWN-verdieping voor doorboorde werktuigen zonder directe beginner-specificatie.',
    testLabel: 'Doorboordfase 5 actief',
  },
  hamerbijl: {
    sourceResultType: 'hamerbijl',
    targetLevel: 'gevorderd',
    treeMode: 'phase5-hamerbijl',
    phaseId: 'phase-5-doorboorde-werktuigen',
    title: 'Verdiep hamerbijl',
    summary: 'Test de AWN-verdieping voor hamerbijlen en verwante dubbelbijlen.',
    testLabel: 'Hamerbijlfase 5 actief',
  },
};

export function getContinuationOption(resultType: string, currentLevel: UserLevel): ContinuationOption | null {
  if (currentLevel !== 'beginner') return null;
  return CONTINUATION_MAP[resultType] ?? null;
}

export function getPhaseById(phaseId: AwnTestPhaseId): AwnTestPhase | undefined {
  return AWN_TEST_PHASES.find((phase) => phase.id === phaseId);
}

export function isContinuationActive(option: ContinuationOption | null): boolean {
  if (!option) return false;
  return getPhaseById(option.phaseId)?.status === 'active';
}
