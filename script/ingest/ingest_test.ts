import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { main } from './ingest.ts';
import { fakeIo } from '../lib/fakeIo.ts';
import { PATHS } from '../lib/paths.ts';
import {
  fakeTranscoder,
  makeScriptCollection,
  twoDucks,
} from '../../src/testing/scriptFixtures.ts';

const birds = makeScriptCollection('birds');

/** A repository where 002 has new source art; `failing` ids cannot be made. */
function makeRepository(failing: string[] = []) {
  const io = fakeIo({
    files: {
      [PATHS.baseVersion]: '{ "major": 0, "minor": 9 }',
      [PATHS.list('birds')]: JSON.stringify(twoDucks()),
      [`${PATHS.sourceArt('birds')}001.png`]: '',
      [`${PATHS.sourceArt('birds')}002.png`]: '',
      [`${PATHS.full('birds')}001.webp`]: '',
      [`${PATHS.thumb('birds')}001.webp`]: '',
    },
    commits: 400,
    commit: 'abc1234',
    now: new Date(Date.UTC(2026, 9, 26)),
  });
  const { transcoder } = fakeTranscoder(failing);
  return { io, options: { collections: [birds], transcoder } };
}
const listOf = (io: ReturnType<typeof fakeIo>) => JSON.parse(io.files.get(PATHS.list('birds'))!);

test('ingesting dates the new drawing today, makes its images, writes the stats and says so', async () => {
  const { io, options } = makeRepository();
  assertEquals(await main([], io, options), 0);

  assertEquals(listOf(io).Ducks[1].drawn, '2026-10-26');
  assert(
    io.outLines[0].includes('this changes files git tracks'),
    'the first line says it changes the repo',
  );
  const out = io.outLines.join('\n');
  assert(out.includes('2 drawn') && out.includes('+1 new'), out);
  assert(out.includes('0.9.400 · 2 drawings · abc1234'), out);
  assert(out.includes(`✓ stats: 2 of 2 drawn → ${PATHS.stats}`), out);
  assertEquals(JSON.parse(io.files.get(PATHS.stats)!).drawn, 2);
});

test('a dry run says what it would do and changes nothing', async () => {
  const { io, options } = makeRepository();
  const before = new Map(io.files);
  assertEquals(await main(['--dry-run'], io, options), 0);

  assertEquals(io.files, before);
  assert(io.outLines[0].includes('dry run'));
  assert(io.outLines.some((line) => /would register\s+002/.test(line)), io.outLines.join('\n'));
});

test('a drawing whose images cannot be made fails the run, and the stats are left alone', async () => {
  const { io, options } = makeRepository(['002']);
  assertEquals(await main([], io, options), 1);

  assertEquals(io.files.has(PATHS.stats), false);
  assertEquals(
    io.errLines.at(-1),
    '✗ ingest failed: 1 drawing(s) could not be made; stats not written',
  );
});

test('an option ingest does not take exits 2 and changes nothing', async () => {
  const { io, options } = makeRepository();
  const before = new Map(io.files);
  assertEquals(await main(['--all'], io, options), 2);
  assertEquals(io.files, before);
});
