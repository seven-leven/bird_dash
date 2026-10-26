import { test } from 'vitest';
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { insertEntries, main, parseLog, toLines, writeChangelog } from './changelog.ts';
import { fakeIo } from '../lib/fakeIo.ts';
import { PATHS } from '../lib/paths.ts';

const LINES = ['- 2025-01-02 | feat: b', '- 2025-01-01 | feat: a'];

test('insertEntries puts new lines at the top of the newest section', () => {
  const changelog =
    '# Changelog\n\n---\n\n## v0.9.0\n\n- 2024-12-31 | old\n\n## v0.8.0\n\n- older\n';
  const out = insertEntries(changelog, LINES);
  assertEquals(
    out,
    '# Changelog\n\n---\n\n## v0.9.0\n\n- 2025-01-02 | feat: b\n- 2025-01-01 | feat: a\n' +
      '- 2024-12-31 | old\n\n## v0.8.0\n\n- older\n',
  );
});

test('insertEntries never creates an "Unreleased" section: every merge is live', () => {
  const out = insertEntries('# Changelog\n\n---\n\n## v0.9.0\n\n- shipped\n', LINES);
  assert(!out.includes('Unreleased'));
});

test('insertEntries with no section yet adds the lines after the divider', () => {
  const out = insertEntries('# Changelog\n\n---\n', LINES);
  assert(out.indexOf(LINES[0]) > out.indexOf('---'));
  for (const line of LINES) assertStringIncludes(out, line);
});

test('parseLog reads one commit per line and keeps "|" inside a subject', () => {
  assertEquals(parseLog('2025-01-01|feat: a\n2025-01-02|fix: b | c'), [
    { date: '2025-01-01', subject: 'feat: a' },
    { date: '2025-01-02', subject: 'fix: b | c' },
  ]);
});

test('parseLog of empty output is no commits', () => {
  assertEquals(parseLog(''), []);
  assertEquals(parseLog('\n'), []);
});

test('toLines writes the "- date | subject" form the changelog uses', () => {
  assertEquals(toLines([{ date: '2025-01-01', subject: 'feat: a' }]), ['- 2025-01-01 | feat: a']);
});

// ── the command itself, on a fake repository ──

const FILE = '# Changelog\n\n---\n\n## v0.9.0\n\n- 2024-12-31 | old\n';
const LOG_ARGS = 'log --no-merges --reverse --format=%ad|%s --date=short';

/** A repository whose changelog was last touched at `abc`, with `log` the commits since. */
const makeRepository = (log = '2025-01-01|feat: a\n2025-01-02|fix: b') =>
  fakeIo({
    files: { [PATHS.changelog]: FILE },
    git: {
      [`log -1 --format=%H -- ${PATHS.changelog}`]: 'abc',
      [`${LOG_ARGS} abc..HEAD`]: log,
    },
  });

test('with nothing new the command says so and leaves the file alone', async () => {
  const io = makeRepository('');
  assertEquals(await writeChangelog(io), 'up-to-date');
  assertEquals(io.files.get(PATHS.changelog), FILE);
  assertStringIncludes(io.outLines.join('\n'), 'up to date');
});

test('a dry run lists the commits and writes nothing', async () => {
  const io = makeRepository();
  assertEquals(await main(['--dry-run'], io), 0);
  assertEquals(io.files.get(PATHS.changelog), FILE);
  const out = io.outLines.join('\n');
  assertStringIncludes(out, '2 unlogged commit(s)');
  assertStringIncludes(out, '- 2025-01-01 | feat: a');
  assertStringIncludes(out, 'nothing written');
});

test('the new entries go above the old ones, once', async () => {
  const io = makeRepository();
  assertEquals(await writeChangelog(io), 'written');
  assertEquals(
    io.files.get(PATHS.changelog),
    '# Changelog\n\n---\n\n## v0.9.0\n\n- 2025-01-01 | feat: a\n- 2025-01-02 | fix: b\n' +
      '- 2024-12-31 | old\n',
  );
  assertStringIncludes(io.outLines.join('\n'), 'review, edit, and commit');
});

test('without git the command fails with exit 1 and says why', async () => {
  const io = fakeIo({ files: { [PATHS.changelog]: FILE } });
  assertEquals(await main([], io), 1);
  assert(io.errLines[0].startsWith('✗ git log -1'), io.errLines[0]);
});

test('insertEntries with no heading and no divider puts the entries at the very top', () => {
  assertEquals(insertEntries('Some notes.\n', ['- a']), '\n- a\nSome notes.\n');
});
