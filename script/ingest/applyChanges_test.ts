import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { applyChanges } from './applyChanges.ts';
import { planChanges } from './planChanges.ts';
import { fakeIo } from '../lib/fakeIo.ts';
import {
  fakeTranscoder,
  makeScriptCollection,
  twoDucks,
} from '../../src/testing/scriptFixtures.ts';

const birds = makeScriptCollection('birds');
const set = (...ids: string[]) => new Set(ids);

/** The two ducks' list, and a transcoder that fails for the ids it is told to. */
function makeRepository(failing: string[] = []) {
  const io = fakeIo({ files: { [birds.paths.json]: JSON.stringify(twoDucks()) } });
  return { io, ...fakeTranscoder(failing) };
}

test('new source art is dated, its images made, and a missing thumbnail repaired', async () => {
  const { io, made, transcoder } = makeRepository();
  const plan = planChanges({
    drawnIds: set('001'),
    extraIds: new Set<string>(),
    sourceIds: set('001', '002'),
    fullIds: set('001'),
    thumbIds: set(),
    smallIds: set(),
  });
  const applied = await applyChanges(birds, plan, { date: '2025-06-01', io, transcoder });

  assertEquals(applied, { registered: ['002'], failures: [] });
  assertEquals(made, ['full 002', 'thumb 001']);
  assertEquals(JSON.parse(io.files.get(birds.paths.json)!).Ducks[1].drawn, '2025-06-01');
  assert(
    io.outLines.some((line) => /registered\s+Garganey \(002\)/.test(line)),
    io.outLines.join('\n'),
  );
});

test('source art with no item in the list is skipped with a warning, and nothing is written', async () => {
  const { io, transcoder } = makeRepository();
  const before = io.files.get(birds.paths.json);
  const plan = planChanges({
    drawnIds: set(),
    extraIds: new Set<string>(),
    sourceIds: set('999'),
    fullIds: set('999'),
    thumbIds: set('999'),
    smallIds: set('999'),
  });
  const applied = await applyChanges(birds, plan, { date: '2025-06-01', io, transcoder });

  assertEquals(applied.registered, []);
  assertEquals(io.files.get(birds.paths.json), before);
  assert(io.outLines.some((line) => line.includes('no item 999 in the list')));
});

test('an image that cannot be made is a failure for that item, reported, and the rest go on', async () => {
  const { io, made, transcoder } = makeRepository(['002', '001']);
  const plan = planChanges({
    drawnIds: set('001', '002'),
    extraIds: new Set<string>(),
    sourceIds: set('001', '002'),
    fullIds: set('001'),
    thumbIds: set(),
    smallIds: set(),
  });
  const applied = await applyChanges(birds, plan, { date: '2025-06-01', io, transcoder });

  assertEquals(applied.failures, [{ id: '002', reason: 'boom' }, { id: '001', reason: 'boom' }]);
  assertEquals(made, ['full 002', 'thumb 001']);
  assertEquals(io.errLines.length, 2);
  assert(io.errLines[0].includes('could not make  002  boom'));
  assert(io.errLines[1].includes('could not repair the thumbnail  001  boom'));
});

test("an item's other images are made, full size alone, and a failure says which", async () => {
  const { io, made, transcoder } = makeRepository(['001-3']);
  const plan = planChanges({
    drawnIds: set('001'),
    extraIds: set('001-2', '001-3'),
    sourceIds: set('001', '001-2', '001-3'),
    fullIds: set('001'),
    thumbIds: set('001'),
    smallIds: set('001'),
  });
  const applied = await applyChanges(birds, plan, { date: '2025-06-01', io, transcoder });
  assertEquals(made, ['extra 001-2', 'extra 001-3']);
  assertEquals(applied.failures, [{ id: '001-3', reason: 'boom' }]);
  assert(io.errLines.some((line) => line.includes('could not make  001-3  boom')));
});
