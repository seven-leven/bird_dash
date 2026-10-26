import { test } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assert, assertEquals, assertMatch } from '@std/assert';
import { fileIo, run, unloggedCommits } from './changelog.ts';
import { lineName, loadLineNames } from '../version/line_names.ts';

// Runs against the real repository's history.
test('unloggedCommits returns dated, non-merge commits (possibly none)', async () => {
  const commits = await unloggedCommits();
  assert(Array.isArray(commits));
  for (const c of commits) {
    assertMatch(c.date, /^\d{4}-\d{2}-\d{2}$/);
    assert(c.subject.trim().length > 0);
    assert(!c.subject.startsWith('Merge pull request'), 'merge commits must be skipped');
  }
});

test('fileIo reads and writes the file it is pointed at, and logs to the console', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bird_dash_changelog_'));
  const path = `${dir}/CHANGELOG.md`;
  const printed: string[] = [];
  const log = console.log;
  console.log = (line: string) => printed.push(line);
  try {
    await writeFile(path, '# Changelog\n');
    const io = fileIo(path);
    assertEquals(await io.read(), '# Changelog\n');
    await io.write('# Changelog\n\n- new\n');
    assertEquals(await readFile(path, 'utf8'), '# Changelog\n\n- new\n');
    io.log('hello');
    assertEquals(printed, ['hello']);
  } finally {
    console.log = log;
    await rm(dir, { recursive: true, force: true });
  }
});

test('a dry run against the real repository never touches CHANGELOG.md', async () => {
  const before = await readFile('./CHANGELOG.md', 'utf8');
  const outcome = await run(['--dry-run'], { ...fileIo(), log: () => {} });
  assert(outcome === 'dry-run' || outcome === 'up-to-date');
  assertEquals(await readFile('./CHANGELOG.md', 'utf8'), before);
});

test("every line's heading carries its name, the Dhivehi name the drawings give it", async () => {
  const changelog = await readFile('./CHANGELOG.md', 'utf8');
  const names = await loadLineNames();
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
