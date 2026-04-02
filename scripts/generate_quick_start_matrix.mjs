#!/usr/bin/env node

import { mkdir, readFile, rm, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const SOURCE = resolve(ROOT, 'app/src/lib/decisionTree.ts');
const QUICK_START_SOURCE = resolve(ROOT, 'app/src/lib/quickStart.ts');
const TREE = pathToFileURL(resolve(ROOT, 'app/src/data/beslisboom.json')).href;
const IMAGES = pathToFileURL(resolve(ROOT, 'app/src/data/images_metadata.json')).href;
const REPORT_DIR = resolve(ROOT, 'audit');
const REPORT_JSON = resolve(REPORT_DIR, 'quick_start_matrix.json');
const REPORT_MD = resolve(REPORT_DIR, 'quick_start_matrix.md');

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

function isSpecificResult(result) {
  if (!result) return false;
  return ![
    'onbekend',
    'onbepaald',
    'combinatiewerktuig',
    'doorboord-artefact',
    'geslepen-vuurstenen-artefact',
    'geslepen-vuurstenen-bijl',
    'spits',
    'schrabber',
    'rugmes',
    'klingschrabber',
    'geretoucheerde-kling',
    'geretoucheerde-afslag',
    'vuistbijl',
    'hamerbijl',
    'kern--bidirectioneel',
    'kern--kling',
    'kern--orthogon-aal',
  ].includes(result);
}

async function main() {
  const tempDir = await mkdtemp(join(tmpdir(), 'steentijd-quick-start-'));

  try {
    const decisionTreeSource = await readFile(SOURCE, 'utf8');
    const quickStartSource = await readFile(QUICK_START_SOURCE, 'utf8');
    const patchedDecisionTree = patchSource(decisionTreeSource);
    const patchedQuickStart = quickStartSource;

    const tempDecisionTree = join(tempDir, 'decisionTree.matrix.ts');
    const tempQuickStart = join(tempDir, 'quickStart.matrix.ts');
    await writeFile(tempDecisionTree, patchedDecisionTree, 'utf8');
    await writeFile(tempQuickStart, patchedQuickStart, 'utf8');

    const decisionTree = await import(pathToFileURL(tempDecisionTree).href);
    const quickStart = await import(pathToFileURL(tempQuickStart).href);

    const rows = [];

    for (const definition of quickStart.QUICK_START_DEFINITIONS) {
      for (const level of ['gevorderd', 'expert']) {
        const continuation = quickStart.getQuickStartContinuation(definition.id, level);
        if (!continuation) continue;

        const seen = new Set();
        const queue = [{
          questionId: continuation.startQuestionId,
          depth: 0,
        }];
        const reachableResults = new Set();
        const specificResults = new Set();

        while (queue.length > 0) {
          const current = queue.shift();
          if (!current) continue;
          const stateKey = `${current.questionId}:${current.depth}`;
          if (seen.has(stateKey) || current.depth > 14) continue;
          seen.add(stateKey);

          for (const answer of ['ja', 'nee']) {
            const result = decisionTree.processAnswer(current.questionId, answer, continuation.treeMode);
            if (result.isEnd && result.result) {
              reachableResults.add(result.result);
              if (isSpecificResult(result.result)) {
                specificResults.add(result.result);
              }
            } else if (result.nextQuestion) {
              queue.push({ questionId: result.nextQuestion, depth: current.depth + 1 });
            }
          }
        }

        rows.push({
          family: definition.id,
          label: definition.label,
          level,
          treeMode: continuation.treeMode,
          startQuestionId: continuation.startQuestionId,
          reachableResults: Array.from(reachableResults).sort(),
          specificResults: Array.from(specificResults).sort(),
          reachableCount: reachableResults.size,
          specificCount: specificResults.size,
        });
      }
    }

    await mkdir(REPORT_DIR, { recursive: true });
    await writeFile(REPORT_JSON, JSON.stringify({ rows }, null, 2) + '\n', 'utf8');

    const md = [
      '# Quick Start Matrix',
      '',
      `- families: \`${rows.length}\` routes`,
      '',
      '## Overzicht',
      ...rows.map((row) =>
        `- \`${row.family}\` (${row.level}): \`${row.specificCount}\` specifieke resultaten vanaf vraag \`${row.startQuestionId}\``
      ),
      '',
      '## Details',
      ...rows.flatMap((row) => [
        `### ${row.label} (${row.level})`,
        '',
        `- start: \`${row.treeMode}\` vraag \`${row.startQuestionId}\``,
        `- specifieke resultaten: \`${row.specificCount}\``,
        `- voorbeelden: ${row.specificResults.slice(0, 8).map((item) => `\`${decisionTree.formatTypeName(item)}\``).join(', ') || 'geen'}`,
        '',
      ]),
    ].join('\n');

    await writeFile(REPORT_MD, md, 'utf8');

    console.log(
      JSON.stringify(
        {
          routes: rows.length,
          zeroSpecific: rows.filter((row) => row.specificCount === 0).map((row) => `${row.family}:${row.level}`),
        },
        null,
        2
      )
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

await main();
