import { test } from 'vitest';
import { assert, assertEquals, assertRejects } from '@std/assert';
import { buildVite, checkIntegrity, cli, type Steps } from './build.ts';
import { fakeIo } from '../lib/fakeIo.ts';
import { PATHS } from '../lib/paths.ts';
import { writeStats } from './collection_stats.ts';
import type { Collection } from '../lib/collections.ts';

/** Run `fn` and return everything it printed, without printing it. */
async function captured(fn: () => unknown): Promise<string> {
  const lines: string[] = [];
  const { log, error } = console;
  console.log = (...a: unknown[]) => lines.push(a.join(' '));
  console.error = (...a: unknown[]) => lines.push(a.join(' '));
  try {
    await fn();
  } finally {
    console.log = log;
    console.error = error;
  }
  return lines.join('\n');
}

// ── which step runs for which arguments ──

/** Stand-in steps that record the order they ran in. */
function fakeSteps(over: Partial<Steps> = {}) {
  const ran: string[] = [];
  const steps: Steps = {
    vite: () => (ran.push('vite'), Promise.resolve()),
    check: () => (ran.push('check'), Promise.resolve(0)),
    ...over,
  };
  return { steps, ran };
}

test('with no arguments the build makes the site, and only the site', async () => {
  const { steps, ran } = fakeSteps();
  assertEquals(await cli([], steps), 0);
  assertEquals(ran, ['vite']);
});

test('--check only checks, and exits 0 when nothing is wrong', async () => {
  const { steps, ran } = fakeSteps();
  assertEquals(await cli(['--check'], steps), 0);
  assertEquals(ran, ['check']);
});

test('--check exits 1 and says how many issues it found', async () => {
  const { steps } = fakeSteps({ check: () => Promise.resolve(3) });
  let code = -1;
  const output = await captured(async () => {
    code = await cli(['--check'], steps);
  });
  assertEquals(code, 1);
  assert(output.includes('integrity check failed: 3 issue(s)'));
});

test('a step that fails stops the build: exit 1, and the reason printed', async () => {
  const { steps } = fakeSteps({ vite: () => Promise.reject(new Error('disk full')) });
  let code = -1;
  const output = await captured(async () => {
    code = await cli([], steps);
  });
  assertEquals(code, 1);
  assert(output.includes('build failed: disk full'));
});

// ── the site build ──

test('buildVite succeeds when vite exits 0 and fails with its exit code otherwise', async () => {
  await captured(() => buildVite(() => Promise.resolve(0)));
  await captured(() =>
    assertRejects(() => buildVite(() => Promise.resolve(2)), Error, 'vite exited with code 2')
  );
});

// ── the check, on a fake repository ──

const birds = {
  id: 'x',
  label: 'Test',
  emoji: '',
  paths: { json: './x.json', sourceArt: './raw/', full: './full/', thumb: './thumb/' },
} as Collection;

test('a clean collection with current stats passes the check', async () => {
  const io = fakeIo({
    files: {
      [PATHS.baseVersion]: '{ "major": 0, "minor": 9 }',
      './x.json': JSON.stringify({ Group: [{ id: '001', name: 'A', drawn: '2025-01-01' }] }),
      './raw/001.png': '',
      './full/001.webp': '',
      './thumb/001.webp': '',
    },
    git: { 'rev-list --count HEAD': '1', 'rev-parse --short=7 HEAD': 'abc1234' },
  });
  await writeStats([birds], io, './stats.json');
  let issues = -1;
  const report = await captured(async () => {
    issues = await checkIntegrity([birds], io, './stats.json');
  });
  assertEquals(issues, 0);
  assert(report.includes('./stats.json matches the lists'), report);
});

test('the check counts the blocking issues across collections, and a stale stats file', async () => {
  const io = fakeIo({
    files: {
      [PATHS.baseVersion]: '{ "major": 0, "minor": 9 }',
      './x.json': JSON.stringify({ Group: [{ id: '001', name: 'A', drawn: '2025-01-01' }] }),
    },
    git: { 'rev-list --count HEAD': '1', 'rev-parse --short=7 HEAD': 'abc1234' },
  });
  let issues = -1;
  const report = await captured(async () => {
    issues = await checkIntegrity([birds, birds], io, './stats.json');
  });
  // One missing full image, seen in each of the two entries, and stats never written.
  assertEquals(issues, 3);
  assert(report.includes('is stale: run `npm run ingest`'), report);
  assert(report.includes('missing full WebP     001'));
});

test('cli reports a thrown non-Error value without a stack trace', async () => {
  const { steps } = fakeSteps({ vite: () => Promise.reject('disk full') });
  let code = 0;
  const output = await captured(async () => (code = await cli([], steps)));
  assertEquals(code, 1);
  assert(output.includes('build failed: disk full'));
});
