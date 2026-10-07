/// <reference lib="deno.ns" />
import { assert, assertEquals, assertMatch } from '@std/assert';
import { fileIo, run, unloggedCommits } from './changelog.ts';

// Runs against the real repository's history.
Deno.test('unloggedCommits returns dated, non-merge commits (possibly none)', async () => {
  const commits = await unloggedCommits();
  assert(Array.isArray(commits));
  for (const c of commits) {
    assertMatch(c.date, /^\d{4}-\d{2}-\d{2}$/);
    assert(c.subject.trim().length > 0);
    assert(!c.subject.startsWith('Merge pull request'), 'merge commits must be skipped');
  }
});

Deno.test('fileIo reads and writes the file it is pointed at, and logs to the console', async () => {
  const dir = await Deno.makeTempDir({ prefix: 'bird_dash_changelog_' });
  const path = `${dir}/CHANGELOG.md`;
  const printed: string[] = [];
  const log = console.log;
  console.log = (line: string) => printed.push(line);
  try {
    await Deno.writeTextFile(path, '# Changelog\n');
    const io = fileIo(path);
    assertEquals(await io.read(), '# Changelog\n');
    await io.write('# Changelog\n\n- new\n');
    assertEquals(await Deno.readTextFile(path), '# Changelog\n\n- new\n');
    io.log('hello');
    assertEquals(printed, ['hello']);
  } finally {
    console.log = log;
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test('a dry run against the real repository never touches CHANGELOG.md', async () => {
  const before = await Deno.readTextFile('./CHANGELOG.md');
  const outcome = await run(['--dry-run'], { ...fileIo(), log: () => {} });
  assert(outcome === 'dry-run' || outcome === 'up-to-date');
  assertEquals(await Deno.readTextFile('./CHANGELOG.md'), before);
});
