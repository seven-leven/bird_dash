import { test } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertEquals, assertRejects } from '@std/assert';
import type { ResolvedConfig } from 'vite';
import {
  type Budget,
  type BuiltFile,
  judgeBudgets,
  measureFiles,
  sizeBudget,
} from './sizeBudget.ts';

const BUDGETS: Budget[] = [
  { label: 'JavaScript, gzipped', match: /\.js$/, gzip: true, limit: 100, per: 'total' },
  { label: 'a thumbnail', match: /^thumb\//, gzip: false, limit: 50, per: 'file' },
];
const file = (path: string, size: number, gzipped = size): BuiltFile => ({ path, size, gzipped });

test('within the budget, every line is a tick and nothing is over', () => {
  const { lines, over } = judgeBudgets(
    [file('assets/a.js', 500, 60), file('assets/b.js', 300, 40), file('thumb/1.webp', 50)],
    BUDGETS,
  );
  assertEquals(lines, [
    '  ✓ JavaScript, gzipped: 0.1 kB of 0.1 kB',
    '  ✓ largest a thumbnail: 0.1 kB of 0.1 kB',
  ]);
  assertEquals(over, []);
});

test('a total over its limit is named by what it measures; a file by its path', () => {
  const { lines, over } = judgeBudgets(
    [file('assets/a.js', 900, 101), file('thumb/1.webp', 20), file('thumb/2.webp', 51)],
    BUDGETS,
  );
  assertEquals(lines.map((line) => line.slice(0, 3)), ['  ✗', '  ✗']);
  assertEquals(over, ['JavaScript, gzipped is 0.1 kB', 'thumb/2.webp is 0.1 kB']);
});

test('a budget with no files to measure is within it', () => {
  assertEquals(judgeBudgets([], BUDGETS).over, []);
});

async function withBuild(fn: (dir: string) => Promise<void>) {
  const dir = await mkdtemp(join(tmpdir(), 'budget-'));
  try {
    await mkdir(join(dir, 'thumb'), { recursive: true });
    await writeFile(join(dir, 'app.js'), 'x'.repeat(1000)); // compresses to a few bytes
    await writeFile(join(dir, 'thumb', '1.webp'), 'y'.repeat(60));
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('the built files are measured by their path in dist/, as stored and gzipped', () =>
  withBuild(async (dir) => {
    const files = await measureFiles(dir);
    assertEquals(files.map((f) => [f.path, f.size]), [['app.js', 1000], ['thumb/1.webp', 60]]);
    assertEquals(files[0].gzipped < 100, true);
  }));

test('the plugin fails the build when dist/ is over the budget', () =>
  withBuild(async (dir) => {
    const afterBuild = (budgets: Budget[]) => {
      const plugin = sizeBudget(budgets);
      const config = { root: dir, build: { outDir: '.' } } as ResolvedConfig;
      (plugin.configResolved as (config: ResolvedConfig) => void)(config);
      return plugin.closeBundle as () => Promise<void>;
    };
    const log = console.log;
    console.log = () => {};
    try {
      await assertRejects(
        afterBuild(BUDGETS),
        Error,
        'over the size budget: thumb/1.webp is 0.1 kB',
      );
      await afterBuild([BUDGETS[0]])(); // the JavaScript alone is within its limit
    } finally {
      console.log = log;
    }
  }));
