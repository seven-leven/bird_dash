import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { ref } from 'vue';
import { useSearchResults } from './useSearchResults.ts';
import { makeCollection, makeItem } from '../testing/fixtures.ts';
import type { ItemsByCollection } from '../data/useCollectionLoader.ts';

const birds = makeCollection('birds');
const shells = makeCollection('shells');
const cache: ItemsByCollection = {
  birds: [
    makeItem({ itemId: '001', commonName: 'Mallard', scientificName: 'Anas', group: 'Ducks' }),
    makeItem({ itemId: '002', commonName: 'Garganey', scientificName: 'Spatula', group: 'Ducks' }),
  ],
  shells: [
    makeItem({ itemId: '019', commonName: 'Cowrie', scientificName: 'Cypraea', group: 'Sea' }),
  ],
};

test('empty query yields no groups and zero count', () => {
  const { globalResults, globalResultCount } = useSearchResults(
    ref([birds, shells]),
    cache,
    ref('  '),
  );
  assertEquals(globalResults.value, []);
  assertEquals(globalResultCount.value, 0);
});

test('matches group by collection with counts', () => {
  const { globalResults, globalResultCount } = useSearchResults(
    ref([birds, shells]),
    cache,
    ref('a'), // Mallard, Anas, Garganey, Spatula, Ducks, Cypraea…
  );
  assertEquals(globalResultCount.value, globalResults.value.reduce((n, g) => n + g.count, 0));
  const byId = Object.fromEntries(globalResults.value.map((g) => [g.collection.id, g.count]));
  assertEquals(byId.birds, 2);
});

test('matchedFields flags which display fields matched', () => {
  const { globalResults } = useSearchResults(ref([birds]), cache, ref('mallard'));
  const result = globalResults.value[0]!.results[0];
  assertEquals(result!.matchedFields, ['commonName']);
});

test('id match is reported in matchedFields', () => {
  const { globalResults } = useSearchResults(ref([birds]), cache, ref('001'));
  assertEquals(globalResults.value[0]!.results[0]!.matchedFields, ['id']);
});

test('a collection whose list has not loaded yet is searched as empty', () => {
  const sharks = makeCollection('sharks'); // not in the cache
  const { globalResults } = useSearchResults(ref([birds, sharks]), cache, ref('mallard'));
  assertEquals(globalResults.value.map((g) => g.collection.id), ['birds']);
});

test('the drawn count covers every collection; a match on the group alone is recorded as such', () => {
  const plovers = makeCollection('plovers');
  const lists: ItemsByCollection = {
    plovers: [
      makeItem({
        itemId: '035',
        commonName: 'Black-bellied Plover',
        group: 'Plovers and Lapwings',
        drawnTime: 1,
      }),
      makeItem({
        itemId: '037',
        commonName: 'Sociable Lapwing',
        group: 'Plovers and Lapwings',
        isDrawn: false,
      }),
    ],
  };
  const { globalResultCount, globalDrawnCount, globalResults } = useSearchResults(
    ref([plovers]),
    lists,
    ref('plover'),
  );
  assertEquals([globalResultCount.value, globalDrawnCount.value], [2, 1]);
  const [plover, lapwing] = globalResults.value[0]!.results;
  assertEquals(plover!.matchedFields, ['commonName', 'group']);
  assertEquals(lapwing!.matchedFields, ['group']);
});
