/// <reference lib="deno.ns" />
import { assert, assertEquals, assertMatch, assertRejects } from '@std/assert';
import { computeVersion, getCommitCount, getDrawnIds } from './compute.ts';
import { git } from '../lib/git.ts';
import { readJson } from '../lib/fs.ts';
import { COLLECTIONS, VERSION_FILE } from '../collection/registry.ts';

// These run against the real repository: git history and the files in public/.

Deno.test('git: returns trimmed output for a command that succeeds', async () => {
  assertEquals(await git('rev-parse', '--is-inside-work-tree'), 'true');
});

Deno.test('git: a failing command rejects and names the command', async () => {
  await assertRejects(
    () => git('rev-parse', '--verify', 'refs/heads/no-such-branch-here'),
    Error,
    'git rev-parse --verify refs/heads/no-such-branch-here failed',
  );
});

Deno.test('computeVersion: major.minor from version.json, patch and commit from git', async () => {
  const stored = await readJson<{ major: number; minor: number }>(VERSION_FILE);
  const v = await computeVersion();
  assertEquals([v.major, v.minor], [stored.major, stored.minor]);
  assertEquals(v.patch, await getCommitCount());
  assert(v.patch > 0, 'the repository has commits');
  assertMatch(v.commit, /^[0-9a-f]{7}$/);
});

Deno.test('computeVersion: the drawn count is the drawn items across every collection', async () => {
  const all = await getDrawnIds();
  assertEquals((await computeVersion()).drawn, all.size);

  let sum = 0;
  for (const col of COLLECTIONS) {
    const ids = await getDrawnIds(col.id);
    for (const id of ids) assert(id.startsWith(`${col.id}/`), `${id} is not namespaced`);
    sum += ids.size;
  }
  assertEquals(sum, all.size, 'per-collection counts add up to the total');
});

Deno.test('getDrawnIds: an unknown collection has no drawn items', async () => {
  assertEquals((await getDrawnIds('no-such-collection')).size, 0);
});
