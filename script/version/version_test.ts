import { test } from 'vitest';
import { assert, assertEquals, assertRejects } from '@std/assert';
import { computeVersion, countDrawn, formatVersion, formatVersionLine, main } from './version.ts';
import type { Version } from './version.ts';
import { fakeIo, type FakeIoOptions } from '../lib/fakeIo.ts';
import { PATHS } from '../lib/paths.ts';
import { makeScriptCollection } from '../../src/testing/scriptFixtures.ts';

const version = (over: Partial<Version> = {}): Version => ({
  major: 0,
  minor: 8,
  patch: 154,
  name: null,
  drawn: 18,
  commit: 'a1b2c3d',
  ...over,
});

test('the version is plain major.minor.patch, with no padding', () => {
  assertEquals(formatVersion(version()), '0.8.154');
  assertEquals(formatVersion(version({ patch: 5 })), '0.8.5'); // was 0.8.005, not valid semver
  assertEquals(formatVersion(version({ major: 1, minor: 2, patch: 1234 })), '1.2.1234');
});

test('the version line adds the drawing count and the commit', () => {
  assertEquals(formatVersionLine(version()), '0.8.154 · 18 drawings · a1b2c3d');
});

test('the version line names the line after the version, when the lists give it a name', () => {
  const name = { roman: 'Alhi Maakanaa', script: 'އަޅި މާކަނާ', species: 'Gray Heron' };
  assertEquals(
    formatVersionLine(version({ name })),
    '0.8.154 Alhi Maakanaa · 18 drawings · a1b2c3d',
  );
});

test('the version line counts one drawing, or none, in words that agree', () => {
  assertEquals(formatVersionLine(version({ drawn: 1 })), '0.8.154 · 1 drawing · a1b2c3d');
  assertEquals(formatVersionLine(version({ drawn: 0 })), '0.8.154 · 0 drawings · a1b2c3d');
});

test('an unknown commit is shown as such rather than left blank', () => {
  assertEquals(
    formatVersionLine(version({ commit: 'unknown' })),
    '0.8.154 · 18 drawings · unknown',
  );
});

// ── Worked out from a repository: a fake one, with two collections ──

const birds = makeScriptCollection('birds');
const ghosts = makeScriptCollection('ghosts'); // no list yet
const collections = [birds, ghosts];
/** A repository git knows nothing about: no commits to count, no commit id. */
const withoutGit = { commits: undefined, commit: undefined };

const repository = (over: FakeIoOptions = {}) =>
  fakeIo({
    files: {
      [PATHS.baseVersion]: '{ "major": 0, "minor": 1 }',
      [PATHS.list('birds')]: JSON.stringify({
        Ducks: [
          {
            id: '001',
            name: 'Lesser Whistling-Duck',
            drawn: '2024-10-10',
            dhiv: 'Reyru',
            dhiv_script: 'ރޭރު',
          },
          { id: '002', name: 'Cotton Pygmy-Goose', drawn: '2024-10-15' },
          { id: '005', name: 'Garganey' },
        ],
      }),
    },
    commits: 310,
    commit: 'd3c113e',
    ...over,
  });

test('major.minor come from base_version.json, the patch and commit from git', async () => {
  const worked = await computeVersion(repository(), { collections });
  assertEquals(worked, {
    major: 0,
    minor: 1,
    patch: 310,
    name: { roman: 'Reyru', script: 'ރޭރު', species: 'Lesser Whistling-Duck' },
    drawn: 2,
    commit: 'd3c113e',
  });
});

test('a collection whose list is not written yet has no drawings', async () => {
  assertEquals(await countDrawn(repository(), collections), 2);
  assertEquals(await countDrawn(repository(), [ghosts]), 0);
});

test('without git, a strict version fails instead of inventing one', async () => {
  await assertRejects(
    () => computeVersion(repository(withoutGit), { collections }),
    Error,
    'not a git repository',
  );
});

test('without git, a lenient version is patch 0 and commit unknown, with one warning', async () => {
  const io = repository(withoutGit);
  const worked = await computeVersion(io, { lenient: true, collections });
  assertEquals([worked.patch, worked.commit, worked.drawn], [0, 'unknown', 2]);
  assertEquals(io.errLines.length, 1);
  assert(io.errLines[0]!.startsWith('[version] git is unavailable (git '));
  assert(io.errLines[0]!.includes('not a git repository'));
});

test('in CI even a lenient version fails without git, so a deploy never ships a made-up one', async () => {
  const io = repository({ ...withoutGit, env: { CI: 'true' } });
  await assertRejects(() => computeVersion(io, { lenient: true, collections }), Error);
});

// ── The command ──

test('the command prints the version, and with --long the whole line', async () => {
  // The command reads the real collections; of their lists, the fake repository has the birds'.
  const io = repository();
  assertEquals(await main([], io), 0);
  assertEquals(await main(['--', '--long'], io), 0);
  assertEquals(io.outLines, ['0.1.310', '0.1.310 Reyru · 2 drawings · d3c113e']);
});

test('the command reports a problem and exits 1 when git is unavailable', async () => {
  const io = repository(withoutGit);
  assertEquals(await main([], io), 1);
  assertEquals(io.outLines, []);
  assertEquals(io.errLines.length, 1);
  assert(/^✗ git .* failed: not a git repository$/.test(io.errLines[0]!), io.errLines[0]);
});

test('the command exits 2 on an option it does not take, and explains itself with --help', async () => {
  const io = repository();
  assertEquals(await main(['--short'], io), 2);
  assert(io.errLines[0]!.startsWith('✗ unknown option --short'));
  assertEquals(await main(['--help'], io), 0);
  assert(io.outLines[0]!.startsWith('npm run version'));
});
