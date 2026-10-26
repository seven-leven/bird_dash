import { test } from 'vitest';
import { assert, assertEquals, assertMatch } from '@std/assert';
import { computeVersion, countCommits, countDrawn, main } from './version.ts';
import { readJson, realIo } from '../lib/io.ts';
import { PATHS } from '../lib/paths.ts';
import { COLLECTIONS } from '../lib/collections.ts';
import { readDrawnIds } from '../lib/lists.ts';
import { fakeIo } from '../lib/fakeIo.ts';

// These run against the real repository: git history and the files in public/.

test('git answers with its trimmed output, and a failing command names itself', async () => {
  assertEquals(await realIo.git('rev-parse', '--is-inside-work-tree'), 'true');
  const failed = await realIo.git('rev-parse', '--verify', 'refs/heads/no-such-branch-here')
    .catch((err: Error) => err.message);
  assert(String(failed).startsWith('git rev-parse --verify refs/heads/no-such-branch-here failed'));
});

test("this repository's version: base_version.json, then git's count and commit", async () => {
  const stored = await readJson<{ major: number; minor: number }>(realIo, PATHS.baseVersion);
  const version = await computeVersion();
  assertEquals([version.major, version.minor], [stored.major, stored.minor]);
  assertEquals(version.patch, await countCommits(realIo));
  assert(version.patch > 0, 'the repository has commits');
  assertMatch(version.commit, /^[0-9a-f]{7}$/);
  assert(version.name, 'the lists name the current line');
});

test('the drawn count is every collection’s drawn items added up', async () => {
  let sum = 0;
  for (const collection of COLLECTIONS) sum += (await readDrawnIds(collection)).size;
  assertEquals(await countDrawn(realIo), sum);
  assertEquals((await computeVersion()).drawn, sum);
});

test('the command prints this repository’s version, named, with --long', async () => {
  // The real repository, with the output kept for the test instead of printed.
  const output = fakeIo();
  assertEquals(await main(['--long'], { ...realIo, out: output.out, err: output.err }), 0);
  const { name } = await computeVersion();
  assertMatch(
    output.outLines[0],
    new RegExp(`^\\d+\\.\\d+\\.\\d+ ${name!.roman} · \\d+ drawings? · [0-9a-f]{7}$`),
  );
});
