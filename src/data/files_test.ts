import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { checkCollections, checkList, checkStats } from './files.ts';
import { archiveCollections, archiveLists, archiveStats } from '../testing/scenarios/archive.ts';

test('the fixture archive has the shape of every file', () => {
  assertEquals(checkCollections(archiveCollections()), []);
  for (const list of Object.values(archiveLists())) assertEquals(checkList(list), []);
  assertEquals(checkStats(archiveStats()), []);
  assertEquals(checkStats({ ...archiveStats(), first: null }), []); // nothing drawn yet
});

test('collections.json: each field missing, of the wrong kind, or not one of its words', () => {
  assertEquals(checkCollections({}), ['the file is not a list']);
  assertEquals(checkCollections(['birds']), ['[0] is not an object']);
  const [birds] = archiveCollections();
  assertEquals(
    checkCollections([{ ...birds, label: undefined, emoji: 3, kind: 'bird', links: 'none' }]),
    [
      '[0].label is missing',
      '[0].kind is not one of species, series',
      '[0].emoji is not a string',
      '[0].links is not a list',
    ],
  );
  assertEquals(checkCollections([{ ...birds, links: [{ label: 'Wiki' }] }]), [
    '[0].links[0].url is missing',
  ]);
});

test('a list: each group a list, each item with its id and name, a count of images', () => {
  assertEquals(checkList([]), ['the file is not an object']);
  assertEquals(checkList({ Ducks: 'Mallard' }), ['Ducks is not a list']);
  assertEquals(
    checkList({ Ducks: [{ id: '001', name: 'A' }, { id: 2, images: 0 }] }),
    [
      'Ducks[1].id is not a string',
      'Ducks[1].name is missing',
      'Ducks[1].images is not a whole number of 1 or more',
    ],
  );
  // A field the shape does not name is the list's own business (it shows in the viewer).
  assertEquals(checkList({ Ducks: [{ id: '001', name: 'A', habitat: 'Wetlands', size: 3 }] }), []);
});

test('stats.json: the numbers, each collection, and the drawings named in it', () => {
  const stats = archiveStats();
  assertEquals(checkStats([]), ['stats is not an object']);
  assertEquals(
    checkStats({ ...stats, drawn: '3', newest: [{ ...stats.newest[0], drawn: undefined }] }),
    ['stats.drawn is not a number', 'stats.newest[0].drawn is missing'],
  );
  assertEquals(
    checkStats({ ...stats, collections: [{ ...stats.collections[0], firstDrawn: 0 }] }),
    [
      'stats.collections[0].firstDrawn is not a string or null',
    ],
  );
  assertEquals(checkStats({ ...stats, first: { id: '001' } }), [
    'stats.first.collection is missing',
    'stats.first.name is missing',
    'stats.first.drawn is missing',
  ]);
  assertEquals(checkStats({ ...stats, first: 'duck' }), ['stats.first is not an object']);
});
