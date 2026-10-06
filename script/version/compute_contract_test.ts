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

// ── Without git (a zip download, a broken checkout) ──

const noGit = () => Promise.reject(new Error('git: command not found\nmore detail'));

/** Run `fn` with the CI variable set or unset, restoring it afterwards. */
async function withCi(value: string | undefined, fn: () => Promise<void>): Promise<void> {
  const before = Deno.env.get('CI');
  if (value === undefined) Deno.env.delete('CI');
  else Deno.env.set('CI', value);
  try {
    await fn();
  } finally {
    if (before === undefined) Deno.env.delete('CI');
    else Deno.env.set('CI', before);
  }
}

Deno.test('computeVersion: strict mode fails without git instead of inventing a version', () =>
  withCi(undefined, async () => {
    await assertRejects(() => computeVersion({ git: noGit }), Error, 'git: command not found');
  }));

Deno.test('computeVersion: lenient mode falls back to patch 0 / "unknown", with a warning', () =>
  withCi(undefined, async () => {
    const warnings: string[] = [];
    const warn = console.warn;
    console.warn = (msg: string) => warnings.push(msg);
    try {
      const v = await computeVersion({ lenient: true, git: noGit });
      assertEquals([v.patch, v.commit], [0, 'unknown']);
      assertEquals(v.drawn, (await getDrawnIds()).size, 'the drawing count does not need git');
    } finally {
      console.warn = warn;
    }
    assertEquals(warnings.length, 1);
    assert(warnings[0].includes('git: command not found'));
    assert(!warnings[0].includes('more detail'), 'only the first line of the error is shown');
  }));

Deno.test('computeVersion: in CI even lenient mode fails, so a deploy never ships a made-up version', () =>
  withCi('true', async () => {
    await assertRejects(() => computeVersion({ lenient: true, git: noGit }), Error);
  }));
