import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  QUICK_START_DEFINITIONS,
  getQuickStartContinuation,
} from '../app/src/lib/quickStart.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const decisionTreeSource = fs.readFileSync(
  path.join(repoRoot, 'app/src/lib/decisionTree.ts'),
  'utf8'
);
const fullDecisionTree = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'app/src/data/beslisboom.json'), 'utf8')
);
const sourceResultInfoSource = fs.readFileSync(
  path.join(repoRoot, 'app/src/lib/sourceResultInfo.ts'),
  'utf8'
);

function hasTreeMode(treeMode) {
  return (
    decisionTreeSource.includes(`'${treeMode}': {`) ||
    decisionTreeSource.includes(`${treeMode}: {`)
  );
}

function hasQuestion(questionId) {
  return (
    decisionTreeSource.includes(`'${questionId}': {`) ||
    Boolean(fullDecisionTree[questionId])
  );
}

function hasSourceResultInfo(resultType) {
  return sourceResultInfoSource.includes(`'${resultType}': {`) || sourceResultInfoSource.includes(`${resultType}: {`);
}

const levels = ['gevorderd', 'expert'];
const issues = [];
const checks = [];

for (const definition of QUICK_START_DEFINITIONS) {
  if (!hasSourceResultInfo(definition.sourceResultType)) {
    issues.push({
      family: definition.id,
      kind: 'missing_source_result_info',
      detail: `Geen broninformatie gevonden voor ${definition.sourceResultType}`,
    });
  }

  if (!definition.expectedTraits?.length) {
    issues.push({
      family: definition.id,
      kind: 'missing_expected_traits',
      detail: 'Geen verwachte herkenningskenmerken ingevuld',
    });
  }

  for (const level of levels) {
    const continuation = getQuickStartContinuation(definition.id, level);
    if (!continuation) {
      if (level === 'expert') {
        issues.push({
          family: definition.id,
          kind: 'missing_expert_continuation',
          detail: 'Expert snelle instap ontbreekt',
        });
      }
      continue;
    }

    if (!hasTreeMode(continuation.treeMode)) {
      issues.push({
        family: definition.id,
        kind: 'missing_tree_mode',
        detail: `Boommodus ${continuation.treeMode} ontbreekt`,
      });
      continue;
    }

    if (!hasQuestion(continuation.startQuestionId)) {
      issues.push({
        family: definition.id,
        kind: 'missing_start_question',
        detail: `Startvraag ${continuation.startQuestionId} ontbreekt`,
      });
      continue;
    }

    checks.push({
      family: definition.id,
      level,
      treeMode: continuation.treeMode,
      startQuestionId: continuation.startQuestionId,
      sourceResultType: continuation.sourceResultType,
    });
  }
}

const report = {
  families: QUICK_START_DEFINITIONS.length,
  checks: checks.length,
  issueCount: issues.length,
  issues,
  checksByFamily: checks,
};

console.log(JSON.stringify(report, null, 2));
