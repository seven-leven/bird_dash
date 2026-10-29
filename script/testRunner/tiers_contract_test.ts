import { readdir, readFile } from 'node:fs/promises';
import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { discoverTests, groupByTier, TIER_ORDER, tierOf, tiersMarkdown } from './tiers.ts';
import { areaOf, AREAS, discoverSources } from './areas.ts';

// The runner only looks in src/ and script/. A test file anywhere else would pass
// `vitest` on its own but silently never run in `npm test` or CI — so
// fail loudly instead.

async function allTestFilesInRepo(dir = '.'): Promise<string[]> {
  const skip = new Set(['node_modules', '.git', 'dist', '.claude', 'test-results']);
  const found: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = dir === '.' ? entry.name : `${dir}/${entry.name}`;
    if (entry.isDirectory() && !skip.has(entry.name)) found.push(...await allTestFilesInRepo(path));
    else if (entry.isFile() && entry.name.endsWith('_test.ts')) found.push(path);
  }
  return found.sort();
}

test('every *_test.ts in the repo is one the runner will pick up', async () => {
  const everywhere = await allTestFilesInRepo();
  const discovered = await discoverTests();
  assertEquals(
    everywhere.filter((f) => !discovered.includes(f)),
    [],
    'these test files live outside src/ and script/, so the runner would skip them',
  );
});

test('every discovered test file has a tier, and each tier has at least one file', async () => {
  const files = await discoverTests();
  assert(files.length > 0);
  for (const f of files) tierOf(f); // throws if a name can't be classified

  const groups = groupByTier(files);
  for (const tier of TIER_ORDER) assert(groups[tier].length > 0, `no tests in tier "${tier}"`);
});

test('every source file and every test file belongs to an area', async () => {
  const files = [...await discoverSources(), ...await discoverTests()];
  assert(files.length > 0);
  assertEquals(
    files.filter((f) => areaOf(f) === undefined),
    [],
    'add these to an area in script/testRunner/areas.ts so they show up in the report',
  );
});

test('every area has at least one source file, so none is a stale entry', async () => {
  const sources = await discoverSources();
  assert(sources.includes('src/app/App.vue'), 'components are source files too');
  for (const area of AREAS) {
    assert(sources.some((s) => areaOf(s)?.id === area.id), `area "${area.id}" matches no file`);
  }
});

test('every component has a test of its own beside it (Foo.vue, Foo_dom_test.ts)', async () => {
  const tests = new Set(await discoverTests());
  const components = (await discoverSources()).filter((f) => f.endsWith('.vue'));
  assert(components.length > 20, `found only ${components.length} components`);
  assertEquals(
    components.filter((f) => !tests.has(f.replace(/\.vue$/, '_dom_test.ts'))),
    [],
    'a journey is not enough: give each a _dom_test.ts for its own states (docs/TESTING.md)',
  );
});

test("docs/TESTING.md's table of tiers says what the table in tiers.ts says", async () => {
  const doc = await readFile('docs/TESTING.md', 'utf8');
  // The rows as written, with dprint's column padding taken out.
  const rows = doc.split('\n')
    .filter((line) => /^\| `\w+` +\| `x\w*_test\.ts`/.test(line))
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()).join(' | '))
    .map((line) => `| ${line} |`);
  assertEquals(
    rows,
    tiersMarkdown(),
    'update the table in docs/TESTING.md ("Tiers") from tiers.ts',
  );
});

test('every tier has its own npm script, test:<tier>', async () => {
  const { scripts } = JSON.parse(await readFile('package.json', 'utf8')) as {
    scripts: Record<string, string>;
  };
  for (const tier of TIER_ORDER) {
    assertEquals(scripts[`test:${tier}`], `node script/testRunner/testRunner.ts ${tier}`);
  }
});
