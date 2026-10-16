import { test } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assert, assertEquals, assertRejects } from '@std/assert';
import sharp from 'sharp';
import { buildAssets, buildVite, checkIntegrity, cli, type Steps } from './build.ts';
import type { Collection } from './collection/registry.ts';

// sharp caches open files; on Windows that would keep the temporary folder locked.
sharp.cache(false);

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
    assets: () => (ran.push('assets'), Promise.resolve()),
    vite: () => (ran.push('vite'), Promise.resolve()),
    check: () => (ran.push('check'), Promise.resolve(0)),
    ...over,
  };
  return { steps, ran };
}

test('with no arguments the build makes the assets, then the site', async () => {
  const { steps, ran } = fakeSteps();
  assertEquals(await cli([], steps), 0);
  assertEquals(ran, ['assets', 'vite']);
});

test('--assets-only and --vite-only run just that step', async () => {
  const a = fakeSteps();
  assertEquals(await cli(['--assets-only'], a.steps), 0);
  assertEquals(a.ran, ['assets']);

  const v = fakeSteps();
  assertEquals(await cli(['--vite-only'], v.steps), 0);
  assertEquals(v.ran, ['vite']);
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

test('a step that fails stops the build: exit 1, the reason printed, later steps skipped', async () => {
  const { steps, ran } = fakeSteps({ assets: () => Promise.reject(new Error('disk full')) });
  let code = -1;
  const output = await captured(async () => {
    code = await cli([], steps);
  });
  assertEquals(code, 1);
  assert(output.includes('build failed: disk full'));
  assertEquals(ran, [], 'vite ran after the asset step failed');
});

// ── the site build ──

test('buildVite succeeds when vite exits 0 and fails with its exit code otherwise', async () => {
  await captured(() => buildVite(() => Promise.resolve(0)));
  await captured(() =>
    assertRejects(() => buildVite(() => Promise.resolve(2)), Error, 'vite exited with code 2')
  );
});

// ── the asset build and the check, on a throwaway collection ──

type Item = { id: string; name: string; drawn?: string };

async function withCollection(
  items: Item[],
  raw: string[],
  fn: (col: Collection) => Promise<void>,
): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), 'bird_dash_build_'));
  const col: Collection = {
    id: 'x',
    label: 'Test',
    emoji: '',
    paths: {
      json: `${dir}/list.json`,
      raw: `${dir}/raw/`,
      full: `${dir}/full/`,
      thumb: `${dir}/thumb/`,
      placeholder: '',
      placeholderDark: '',
    },
  };
  try {
    await writeFile(col.paths.json, JSON.stringify({ Group: items }));
    await mkdir(col.paths.raw);
    for (const id of raw) {
      await sharp({ create: { width: 40, height: 40, channels: 3, background: '#3366cc' } })
        .png().toFile(`${col.paths.raw}${id}.png`);
    }
    await fn(col);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('buildAssets builds a collection, prints the summary, and leaves the check clean', () =>
  withCollection([{ id: '001', name: 'New drawing' }], ['001'], async (col) => {
    let issuesBefore = -1;
    await captured(async () => {
      issuesBefore = await checkIntegrity([col]);
    });
    assert(issuesBefore > 0, 'an unregistered PNG should be an issue before the build');

    const output = await captured(() => buildAssets([col]));
    assert(output.includes('registered') && output.includes('New drawing (001)'));
    assert(output.includes('1 drawn') && output.includes('+1 new'), output);
    assert(/\d+\.\d+\.\d+ · \d+ drawings?/.test(output), 'the summary ends with the version');

    let issuesAfter = -1;
    const report = await captured(async () => {
      issuesAfter = await checkIntegrity([col]);
    });
    assertEquals(issuesAfter, 0);
    assert(report.includes('✓'));
  }));

test('buildAssets fails, naming the item, when a drawing cannot be converted', () =>
  withCollection([{ id: '007', name: 'No source', drawn: '2025-01-01' }], [], async (col) => {
    await captured(() =>
      assertRejects(() => buildAssets([col]), Error, 'asset build failed:\n  x/007:')
    );
  }));

test('checkIntegrity counts the blocking issues across collections', () =>
  withCollection([{ id: '001', name: 'A', drawn: '2025-01-01' }], [], async (col) => {
    let issues = -1;
    const report = await captured(async () => {
      issues = await checkIntegrity([col, col]);
    });
    assertEquals(issues, 2); // one missing full image, seen in each of the two entries
    assert(report.includes('missing full WebP     001'));
  }));
