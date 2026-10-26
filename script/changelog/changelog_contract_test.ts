import { test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { assert, assertEquals, assertMatch } from '@std/assert';
import { main, readUnloggedCommits } from './changelog.ts';
import { realIo } from '../lib/io.ts';
import { fakeIo } from '../lib/fakeIo.ts';
import { PATHS } from '../lib/paths.ts';
import { lineName, readLineNames } from '../version/lineNames.ts';

// Runs against the real repository's history.
test('the unlogged commits are dated, non-merge commits (possibly none)', async () => {
  const commits = await readUnloggedCommits(realIo);
  assert(Array.isArray(commits));
  for (const commit of commits) {
    assertMatch(commit.date, /^\d{4}-\d{2}-\d{2}$/);
    assert(commit.subject.trim().length > 0);
    assert(!commit.subject.startsWith('Merge pull request'), 'merge commits must be skipped');
  }
});

test('a dry run against the real repository never touches CHANGELOG.md', async () => {
  const before = await readFile(PATHS.changelog, 'utf8');
  const output = fakeIo();
  assertEquals(await main(['--dry-run'], { ...realIo, out: output.out, err: output.err }), 0);
  assertEquals(await readFile(PATHS.changelog, 'utf8'), before);
});

test("every line's heading carries its name, the Dhivehi name the drawings give it", async () => {
  const changelog = await readFile('./CHANGELOG.md', 'utf8');
  const names = await readLineNames();
  const headings = [...changelog.matchAll(/^## v(\d+)\.(\d+)\.0 (.+?) \(/gm)];
  assert(headings.length > 0, 'CHANGELOG.md has line headings');
  assertEquals(
    headings.length,
    [...changelog.matchAll(/^## v/gm)].length,
    'every heading is named',
  );
  for (const [heading, major, minor, name] of headings) {
    assertEquals(
      name,
      lineName(names, Number(major), Number(minor))?.roman,
      `${heading.trim()}: the lists name this line differently (script/version/line_names.ts)`,
    );
  }
});
