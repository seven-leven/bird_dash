import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { eachDrawnItem, markDrawn, readDrawnIds, readList } from './lists.ts';
import { fakeIo } from './fakeIo.ts';
import type { Collection } from './collections.ts';
import type { RawCollectionData } from '../../src/types/data.ts';

const list: RawCollectionData = {
  Ducks: [
    { id: '001', name: 'Mallard', drawn: '2025-01-01' },
    { id: '002', name: 'Garganey' }, // undrawn
  ],
  Geese: [
    { id: '003', name: 'Greylag', drawn: '2025-02-01' },
  ],
};

const birds = { id: 'birds', paths: { json: './public/lists/birds.json' } } as Collection;
const withList = () => fakeIo({ files: { [birds.paths.json]: JSON.stringify(list) } });
const saved = (io: ReturnType<typeof fakeIo>): RawCollectionData =>
  JSON.parse(io.files.get(birds.paths.json)!);

test('the drawn items are every dated item, across all groups, in list order', () => {
  assertEquals(eachDrawnItem(list).map((item) => item.name), ['Mallard', 'Greylag']);
});

test('a list is read from the collection file, and its drawn ids with it', async () => {
  const io = withList();
  assertEquals(await readList(birds, io), list);
  assertEquals([...await readDrawnIds(birds, io)], ['001', '003']);
});

test('marking an undrawn item dates it, saves the file and gives its name', async () => {
  const io = withList();
  assertEquals(await markDrawn(birds, '002', '2025-06-01', io), 'Garganey');
  assertEquals(saved(io).Ducks[1].drawn, '2025-06-01');
  assertEquals(saved(io).Ducks[0].drawn, '2025-01-01', 'other items are untouched');
  assertEquals(
    io.files.get(birds.paths.json)!.endsWith('}\n'),
    true,
    'kept as the repo keeps JSON',
  );
});

test('an item already drawn keeps its date, and nothing is written', async () => {
  const io = withList();
  const before = io.files.get(birds.paths.json);
  assertEquals(await markDrawn(birds, '001', '2030-01-01', io), 'Mallard');
  assertEquals(io.files.get(birds.paths.json), before);
});

test('an id not in the list gives null and writes nothing', async () => {
  const io = withList();
  const before = io.files.get(birds.paths.json);
  assertEquals(await markDrawn(birds, '999', '2025-06-01', io), null);
  assertEquals(io.files.get(birds.paths.json), before);
});
