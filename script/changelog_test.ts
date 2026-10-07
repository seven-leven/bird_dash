/// <reference lib="deno.ns" />
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { type ChangelogIo, cli, insertEntries, parseLog, run, toLines } from './changelog.ts';

const LINES = ['- 2025-01-02 | feat: b', '- 2025-01-01 | feat: a'];

Deno.test('insertEntries puts new lines at the top of the newest section', () => {
  const changelog =
    '# Changelog\n\n---\n\n## v0.9.0\n\n- 2024-12-31 | old\n\n## v0.8.0\n\n- older\n';
  const out = insertEntries(changelog, LINES);
  assertEquals(
    out,
    '# Changelog\n\n---\n\n## v0.9.0\n\n- 2025-01-02 | feat: b\n- 2025-01-01 | feat: a\n' +
      '- 2024-12-31 | old\n\n## v0.8.0\n\n- older\n',
  );
});

Deno.test('insertEntries never creates an "Unreleased" section: every merge is live', () => {
  const out = insertEntries('# Changelog\n\n---\n\n## v0.9.0\n\n- shipped\n', LINES);
  assert(!out.includes('Unreleased'));
});

Deno.test('insertEntries with no section yet adds the lines after the divider', () => {
  const out = insertEntries('# Changelog\n\n---\n', LINES);
  assert(out.indexOf(LINES[0]) > out.indexOf('---'));
  for (const line of LINES) assertStringIncludes(out, line);
});

Deno.test('parseLog reads one commit per line and keeps "|" inside a subject', () => {
  assertEquals(parseLog('2025-01-01|feat: a\n2025-01-02|fix: b | c'), [
    { date: '2025-01-01', subject: 'feat: a' },
    { date: '2025-01-02', subject: 'fix: b | c' },
  ]);
});

Deno.test('parseLog of empty output is no commits', () => {
  assertEquals(parseLog(''), []);
  assertEquals(parseLog('\n'), []);
});

Deno.test('toLines writes the "- date | subject" form the changelog uses', () => {
  assertEquals(toLines([{ date: '2025-01-01', subject: 'feat: a' }]), ['- 2025-01-01 | feat: a']);
});

// ── the command itself, with its file and git access swapped for fakes ──

const COMMITS = [
  { date: '2025-01-01', subject: 'feat: a' },
  { date: '2025-01-02', subject: 'fix: b' },
];
const FILE = '# Changelog\n\n---\n\n## v0.9.0\n\n- 2024-12-31 | old\n';

function fakeIo(commits = COMMITS) {
  const state = { file: FILE, writes: 0, reads: 0, log: [] as string[] };
  const io: ChangelogIo = {
    commits: () => Promise.resolve(commits),
    read: () => {
      state.reads++;
      return Promise.resolve(state.file);
    },
    write: (text) => {
      state.writes++;
      state.file = text;
      return Promise.resolve();
    },
    log: (line) => state.log.push(line),
  };
  return { io, state };
}

Deno.test('run: with nothing new it says so and leaves the file alone', async () => {
  const { io, state } = fakeIo([]);
  assertEquals(await run([], io), 'up-to-date');
  assertEquals([state.reads, state.writes], [0, 0]);
  assertStringIncludes(state.log.join('\n'), 'up to date');
});

Deno.test('run --dry-run lists the commits and writes nothing', async () => {
  const { io, state } = fakeIo();
  assertEquals(await run(['--dry-run'], io), 'dry-run');
  assertEquals(state.writes, 0);
  assertEquals(state.file, FILE);
  const out = state.log.join('\n');
  assertStringIncludes(out, '2 unlogged commit(s)');
  assertStringIncludes(out, '- 2025-01-01 | feat: a');
  assertStringIncludes(out, 'nothing written');
});

Deno.test('run writes the new entries above the old ones, once', async () => {
  const { io, state } = fakeIo();
  assertEquals(await run([], io), 'written');
  assertEquals(state.writes, 1);
  assertEquals(
    state.file,
    '# Changelog\n\n---\n\n## v0.9.0\n\n- 2025-01-01 | feat: a\n- 2025-01-02 | fix: b\n' +
      '- 2024-12-31 | old\n',
  );
  assertStringIncludes(state.log.join('\n'), 'review, edit, and commit');
});

Deno.test('cli exits 0 when the command works', async () => {
  const { io } = fakeIo([]);
  assertEquals(await cli([], io), 0);
});

Deno.test('cli exits 1 and prints the error when git or the file fails', async () => {
  const { io } = fakeIo();
  io.read = () => Promise.reject(new Error('cannot read CHANGELOG.md'));
  const printed: unknown[][] = [];
  const error = console.error;
  console.error = (...args: unknown[]) => printed.push(args);
  try {
    assertEquals(await cli([], io), 1);
  } finally {
    console.error = error;
  }
  assertEquals(printed.length, 1);
  assertStringIncludes(String(printed[0][1]), 'cannot read CHANGELOG.md');
});
