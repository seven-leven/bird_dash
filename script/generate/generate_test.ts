import { test } from 'vitest';
import { assert, assertEquals, assertThrows } from '@std/assert';
import { GENERATORS, main, pickGenerators } from './generate.ts';
import { UsageError } from '../lib/cli.ts';
import { fakeIo } from '../lib/fakeIo.ts';
import { PATHS } from '../lib/paths.ts';
import { COLLECTIONS } from '../lib/collections.ts';

// The command itself, on a fake repository. Every generator, run for real, is in
// generatedFiles_contract_test.ts.

/** A repository whose lists are empty and whose stats list no drawings. */
const emptyRepository = () =>
  fakeIo({
    files: {
      ...Object.fromEntries(COLLECTIONS.map((collection) => [PATHS.list(collection.id), '{}'])),
      [PATHS.stats]: JSON.stringify({ newest: [] }),
      [PATHS.collections]: JSON.stringify([{ id: 'ghosts', label: 'Ghosts' }]), // no icon
    },
  });

test('the stats are written where they belong, and the first line says the repo changes', async () => {
  const io = emptyRepository();
  assertEquals(await main(['stats'], io), 0);
  assertEquals(JSON.parse(io.files.get(PATHS.stats)!).total, 0);
  assert(io.outLines[0]!.includes('this changes files git tracks'));
  assertEquals(io.outLines.at(-1), `  ✓ stats  ${PATHS.stats}`);
});

test('--into writes into the folder given instead, and changes nothing else', async () => {
  const io = emptyRepository();
  const stats = io.files.get(PATHS.stats);
  assertEquals(await main(['--into', './out', 'stats'], io), 0);
  assert(io.files.has('./out/stats.json'));
  assertEquals(io.files.get(PATHS.stats), stats);
  assert(io.outLines[0]!.includes('into ./out, so nothing git tracks is changed'));
});

test('with nothing drawn the README’s strip has nothing to draw', async () => {
  const io = emptyRepository();
  assertEquals(await main(['drawingsStrip', '--into', './out'], io), 0);
  assertEquals(io.outLines.at(-1), '  ✓ drawingsStrip  nothing to draw yet');
});

test('without --into, a generator with nothing to draw writes nothing in its own place', async () => {
  const io = emptyRepository();
  const before = new Map(io.files);
  assertEquals(await main(['drawingsStrip'], io), 0);
  assertEquals(io.files, before);
});

test('generators are picked by name, in their own order, or all of them', () => {
  assertEquals(pickGenerators(['logo', 'stats']).map((g) => g.id), ['stats', 'logo']);
  assertEquals(pickGenerators([]), GENERATORS);
  assertThrows(() => pickGenerators(['design']), UsageError, 'no generator design');
});

test('an unknown generator, or --into with no folder, exits 2 and writes nothing', async () => {
  for (const args of [['design'], ['stats', '--into']]) {
    const io = emptyRepository();
    const before = new Map(io.files);
    assertEquals(await main(args, io), 2);
    assertEquals(io.files, before);
  }
});
