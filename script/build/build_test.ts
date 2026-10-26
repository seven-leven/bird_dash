import { test } from 'vitest';
import { assert, assertEquals, assertThrows } from '@std/assert';
import { checkIntegrity, main, pickStages, STAGES } from './build.ts';
import { writeStats } from './collection_stats.ts';
import { UsageError } from '../lib/cli.ts';
import { fakeIo } from '../lib/fakeIo.ts';
import { PATHS } from '../lib/paths.ts';
import type { Collection } from '../lib/collections.ts';

/** Run `fn` and return everything it printed to the console, without printing it. */
async function captured(fn: () => unknown): Promise<string> {
  const lines: string[] = [];
  const { log, error } = console;
  console.log = (...parts: unknown[]) => lines.push(parts.join(' '));
  console.error = (...parts: unknown[]) => lines.push(parts.join(' '));
  try {
    await fn();
  } finally {
    console.log = log;
    console.error = error;
  }
  return lines.join('\n');
}

// ── the stages ──

test('a full build runs the site, then the docs, each with this Node', async () => {
  const io = fakeIo();
  assertEquals(await main([], io), 0);
  assertEquals(io.ran, [
    `${PATHS.viteBin} build --config ${PATHS.viteConfig}`,
    `${PATHS.vitepressBin} build docs`,
  ]);
  assert(io.outLines.some((line) => /✓ site\s+\d+\.\d\ds/.test(line)), io.outLines.join('\n'));
  assert(io.outLines.some((line) => /✓ docs\s+\d+\.\d\ds/.test(line)));
});

test('naming stages builds only those, always in build order', async () => {
  const io = fakeIo();
  assertEquals(await main(['docs'], io), 0);
  assertEquals(io.ran, [`${PATHS.vitepressBin} build docs`]);
  assertEquals(pickStages(['docs', 'site']).map((stage) => stage.id), ['site', 'docs']);
  assertEquals(pickStages([]), STAGES);
});

test('an unknown stage is a usage error that lists the stages', async () => {
  assertThrows(
    () => pickStages(['assets']),
    UsageError,
    'no stage assets (the stages: site, docs)',
  );
  const io = fakeIo();
  assertEquals(await main(['assets'], io), 2);
  assertEquals(io.ran, []);
});

test('a stage that fails stops the build with exit 1, and the later stages do not run', async () => {
  const io = fakeIo({ exitCodes: { [PATHS.viteBin]: 3 } });
  assertEquals(await main([], io), 1);
  assertEquals(io.ran.length, 1);
  assertEquals(io.errLines, ['✗ build: site failed (exit code 3)']);
});

// ── the check (here until it has its own command) ──

test('--check passes with no issues, and fails saying how many', async () => {
  assertEquals(await main(['--check'], fakeIo(), () => Promise.resolve(0)), 0);
  const io = fakeIo();
  assertEquals(await main(['--check'], io, () => Promise.resolve(3)), 1);
  assertEquals(io.errLines, ['✗ integrity check failed: 3 issue(s)']);
});

test('--check runs on the repository it is given, not this one', async () => {
  // The fake repository has no git, which the real one does: the failure shows which ran.
  const io = fakeIo({ files: { [PATHS.baseVersion]: '{ "major": 0, "minor": 9 }' } });
  assertEquals(await main(['--check'], io), 1);
  assert(io.errLines[0].endsWith('failed: not a git repository'), io.errLines[0]);
});

const birds = {
  id: 'x',
  label: 'Test',
  emoji: '',
  paths: { json: './x.json', sourceArt: './raw/', full: './full/', thumb: './thumb/' },
} as Collection;

const repository = (files: Record<string, string>) =>
  fakeIo({
    files: {
      [PATHS.baseVersion]: '{ "major": 0, "minor": 9 }',
      './x.json': JSON.stringify({ Group: [{ id: '001', name: 'A', drawn: '2025-01-01' }] }),
      ...files,
    },
    git: { 'rev-list --count HEAD': '1', 'rev-parse --short=7 HEAD': 'abc1234' },
  });

test('a clean collection with current stats passes the check', async () => {
  const io = repository({ './raw/001.png': '', './full/001.webp': '', './thumb/001.webp': '' });
  await writeStats([birds], io, './stats.json');
  let issues = -1;
  const report = await captured(async () => {
    issues = await checkIntegrity([birds], io, './stats.json');
  });
  assertEquals(issues, 0);
  assert(report.includes('./stats.json matches the lists'), report);
});

test('the check counts the blocking issues across collections, and a stale stats file', async () => {
  const io = repository({});
  let issues = -1;
  const report = await captured(async () => {
    issues = await checkIntegrity([birds, birds], io, './stats.json');
  });
  // One missing full image, seen in each of the two entries, and stats never written.
  assertEquals(issues, 3);
  assert(report.includes('is stale: run `npm run ingest`'), report);
  assert(report.includes('missing full WebP     001'));
});
