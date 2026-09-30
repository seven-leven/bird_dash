/// <reference lib="deno.ns" />
import { assert, assertEquals } from '@std/assert';
import { discoverTests, groupByTier, TIER_ORDER, tierOf } from './tiers.ts';

// The runner only looks in src/ and script/. A test file anywhere else would pass
// `deno test` on its own but silently never run in `deno task test` or CI — so
// fail loudly instead.

async function allTestFilesInRepo(dir = '.'): Promise<string[]> {
  const skip = new Set(['node_modules', '.git', 'dist', '.claude', 'test-results']);
  const found: string[] = [];
  for await (const entry of Deno.readDir(dir)) {
    const path = dir === '.' ? entry.name : `${dir}/${entry.name}`;
    if (entry.isDirectory && !skip.has(entry.name)) found.push(...await allTestFilesInRepo(path));
    else if (entry.isFile && entry.name.endsWith('_test.ts')) found.push(path);
  }
  return found.sort();
}

Deno.test('every *_test.ts in the repo is one the runner will pick up', async () => {
  const everywhere = await allTestFilesInRepo();
  const discovered = await discoverTests();
  assertEquals(
    everywhere.filter((f) => !discovered.includes(f)),
    [],
    'these test files live outside src/ and script/, so the runner would skip them',
  );
});

Deno.test('every discovered test file has a tier, and each tier has at least one file', async () => {
  const files = await discoverTests();
  assert(files.length > 0);
  for (const f of files) tierOf(f); // throws if a name can't be classified

  const groups = groupByTier(files);
  for (const tier of TIER_ORDER) assert(groups[tier].length > 0, `no tests in tier "${tier}"`);
});
