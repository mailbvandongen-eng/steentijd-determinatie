#!/usr/bin/env node

import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const SOURCE = resolve(ROOT, 'app/src/lib/decisionTree.ts');
const IMAGES = pathToFileURL(resolve(ROOT, 'app/src/data/images_metadata.json')).href;
const TREE = pathToFileURL(resolve(ROOT, 'app/src/data/beslisboom.json')).href;
const REPORT_DIR = resolve(ROOT, 'audit');
const REPORT_JSON = resolve(REPORT_DIR, 'expert_route_audit.json');
const REPORT_MD = resolve(REPORT_DIR, 'expert_route_audit.md');
const EXCLUDED_UNREACHABLE = new Set(['87', '88', '89', '90', '91', '92', '800', '801']);

function patchSource(source) {
  return source
    .replace(
      "import imageMetadata from '../data/images_metadata.json';",
      `import imageMetadata from '${IMAGES}' with { type: 'json' };`
    )
    .replace(
      "import fullDecisionTreeData from '../data/beslisboom.json';",
      `import fullDecisionTreeData from '${TREE}' with { type: 'json' };`
    );
}

function isSuspiciousResult(result, formatted) {
  if (!result) return true;
  if (formatted && formatted !== result) return false;
  return (
    result === 'nee' ||
    result.startsWith('nee-') ||
    result.startsWith('het-') ||
    result.startsWith('de-') ||
    result.startsWith('een-') ||
    result.startsWith('gemaakt-van') ||
    result === 'zie-ook' ||
    result.endsWith('--')
  );
}

const tempDir = await mkdtemp(join(tmpdir(), 'steentijd-expert-audit-'));

try {
  const source = await readFile(SOURCE, 'utf8');
  const patched = patchSource(source);
  const tempModule = join(tempDir, 'decisionTree.audit.ts');
  await writeFile(tempModule, patched, 'utf8');

  const mod = await import(pathToFileURL(tempModule).href);
  const start = mod.getTreeStartQuestionId('expert');
  const questions = mod.getTreeDefinition('expert').questions;

  const visitedQuestions = new Set();
  const seenTransitions = new Set();
  const queue = [start];
  const problems = [];
  const edges = [];

  while (queue.length) {
    const questionId = queue.shift();
    if (!questionId || visitedQuestions.has(questionId)) continue;
    visitedQuestions.add(questionId);

    const question = mod.getQuestion(questionId, 'expert');
    if (!question) {
      problems.push({ type: 'missing_question', questionId });
      continue;
    }

    for (const answer of ['ja', 'nee']) {
      const transitionKey = `${questionId}:${answer}`;
      if (seenTransitions.has(transitionKey)) continue;
      seenTransitions.add(transitionKey);

      const result = mod.processAnswer(questionId, answer, 'expert');
      edges.push({ questionId, answer, result });

      if (result.nextQuestion) {
        if (result.nextQuestion === questionId) {
          problems.push({ type: 'self_loop', questionId, answer });
        }
        const nextQuestion = mod.getQuestion(result.nextQuestion, 'expert');
        if (!nextQuestion) {
          problems.push({
            type: 'invalid_next_question',
            questionId,
            answer,
            nextQuestion: result.nextQuestion,
          });
        } else if (!visitedQuestions.has(result.nextQuestion)) {
          queue.push(result.nextQuestion);
        }
      } else if (result.isEnd) {
        const formatted = result.result ? mod.formatTypeName(result.result) : '';
        if (isSuspiciousResult(result.result, formatted)) {
          problems.push({
            type: 'suspicious_end_result',
            questionId,
            answer,
            result: result.result,
            formatted,
          });
        }
      } else {
        problems.push({ type: 'missing_transition', questionId, answer, result });
      }
    }
  }

  const allExpertQuestionIds = Object.keys(questions);
  const unreachable = allExpertQuestionIds.filter(
    (id) => !visitedQuestions.has(id) && !EXCLUDED_UNREACHABLE.has(id)
  );

  const report = {
    startQuestion: start,
    reachableQuestions: visitedQuestions.size,
    totalQuestions: allExpertQuestionIds.length,
    unreachableQuestions: unreachable.length,
    transitionCount: edges.length,
    problemCount: problems.length,
    unreachable,
    problems,
  };

  await mkdir(REPORT_DIR, { recursive: true });
  await writeFile(REPORT_JSON, JSON.stringify(report, null, 2) + '\n', 'utf8');
  const md = [
    '# Expert Route Audit',
    '',
    `- startQuestion: \`${report.startQuestion}\``,
    `- reachableQuestions: \`${report.reachableQuestions}\``,
    `- totalQuestions: \`${report.totalQuestions}\``,
    `- unreachableQuestions: \`${report.unreachableQuestions}\``,
    `- transitionCount: \`${report.transitionCount}\``,
    `- problemCount: \`${report.problemCount}\``,
    '',
    '## Problems',
    ...(report.problems.length
      ? report.problems.map((problem) => `- \`${JSON.stringify(problem)}\``)
      : ['- none']),
    '',
    '## Unreachable Questions',
    ...unreachable.map((id) => {
      const vraag = questions[id]?.vraag ?? '';
      return `- \`${id}\` ${vraag}`;
    }),
    '',
    '## Excluded Questions',
    ...Array.from(EXCLUDED_UNREACHABLE).map((id) => `- \`${id}\` ${questions[id]?.vraag ?? ''}`),
    '',
  ].join('\n');
  await writeFile(REPORT_MD, md, 'utf8');

  console.log(JSON.stringify(report, null, 2));
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
