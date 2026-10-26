import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { applyChanges } from './applyChanges.ts';
import { planChanges } from './planChanges.ts';
import type { Transcoder } from './transcodeImages.ts';
import { fakeIo } from '../lib/fakeIo.ts';
import type { Collection } from '../lib/collections.ts';

const birds = { id: 'birds', paths: { json: './lists/birds.json' } } as Collection;
const set = (...ids: string[]) => new Set(ids);

/** A repository with one list, and a transcoder that fails for the ids it is told to. */
function makeRepository(failing: string[] = []) {
  const io = fakeIo({
    files: {
      './lists/birds.json': JSON.stringify({
        Ducks: [{ id: '001', name: 'Mallard', drawn: '2025-01-01' }, {
          id: '002',
          name: 'Garganey',
        }],
      }),
    },
  });
  const made: string[] = [];
  const answer = (kind: string, id: string) => {
    made.push(`${kind} ${id}`);
    return Promise.resolve(
      failing.includes(id) ? { ok: false as const, error: 'boom' } : { ok: true as const },
    );
  };
  const transcoder: Transcoder = {
    full: (_, id) => answer('full', id),
    thumb: (_, id) => answer('thumb', id),
  };
  return { io, made, transcoder };
}

test('new source art is dated, its images made, and a missing thumbnail repaired', async () => {
  const { io, made, transcoder } = makeRepository();
  const plan = planChanges({
    drawnIds: set('001'),
    sourceIds: set('001', '002'),
    fullIds: set('001'),
    thumbIds: set(),
  });
  const applied = await applyChanges(birds, plan, { date: '2025-06-01', io, transcoder });

  assertEquals(applied, { registered: ['002'], failures: [] });
  assertEquals(made, ['full 002', 'thumb 001']);
  assertEquals(JSON.parse(io.files.get('./lists/birds.json')!).Ducks[1].drawn, '2025-06-01');
  assert(
    io.outLines.some((line) => /registered\s+Garganey \(002\)/.test(line)),
    io.outLines.join('\n'),
  );
});

test('source art with no item in the list is skipped with a warning, and nothing is written', async () => {
  const { io, transcoder } = makeRepository();
  const before = io.files.get('./lists/birds.json');
  const plan = planChanges({
    drawnIds: set(),
    sourceIds: set('999'),
    fullIds: set('999'),
    thumbIds: set('999'),
  });
  const applied = await applyChanges(birds, plan, { date: '2025-06-01', io, transcoder });

  assertEquals(applied.registered, []);
  assertEquals(io.files.get('./lists/birds.json'), before);
  assert(io.outLines.some((line) => line.includes('no item 999 in the list')));
});

test('an image that cannot be made is a failure for that item, reported, and the rest go on', async () => {
  const { io, made, transcoder } = makeRepository(['002', '001']);
  const plan = planChanges({
    drawnIds: set('001', '002'),
    sourceIds: set('001', '002'),
    fullIds: set('001'),
    thumbIds: set(),
  });
  const applied = await applyChanges(birds, plan, { date: '2025-06-01', io, transcoder });

  assertEquals(applied.failures, [{ id: '002', reason: 'boom' }, { id: '001', reason: 'boom' }]);
  assertEquals(made, ['full 002', 'thumb 001']);
  assertEquals(io.errLines.length, 2);
  assert(io.errLines[0].includes('could not make  002  boom'));
  assert(io.errLines[1].includes('could not repair the thumbnail  001  boom'));
});
