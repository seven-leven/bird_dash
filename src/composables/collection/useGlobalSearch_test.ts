/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import { ref } from 'vue';
import { useGlobalSearch } from './useGlobalSearch.ts';
import { makeCollection, makeItem } from '../../../test/fixtures.ts';
import type { CollectionCache } from '../../types/index.ts';

const birds = makeCollection('birds');
const shells = makeCollection('shells');
const cache: CollectionCache = {
  birds: [
    makeItem({ itemId: '001', commonName: 'Mallard', scientificName: 'Anas', group: 'Ducks' }),
    makeItem({ itemId: '002', commonName: 'Garganey', scientificName: 'Spatula', group: 'Ducks' }),
  ],
  shells: [
    makeItem({ itemId: '019', commonName: 'Cowrie', scientificName: 'Cypraea', group: 'Sea' }),
  ],
};

Deno.test('empty query yields no groups and zero count', () => {
  const { globalResults, globalResultCount } = useGlobalSearch(
    ref([birds, shells]),
    cache,
    ref('  '),
  );
  assertEquals(globalResults.value, []);
  assertEquals(globalResultCount.value, 0);
});

Deno.test('matches group by collection with counts', () => {
  const { globalResults, globalResultCount } = useGlobalSearch(
    ref([birds, shells]),
    cache,
    ref('a'), // Mallard, Anas, Garganey, Spatula, Ducks, Cypraea…
  );
  assertEquals(globalResultCount.value, globalResults.value.reduce((n, g) => n + g.count, 0));
  const byId = Object.fromEntries(globalResults.value.map((g) => [g.collection.id, g.count]));
  assertEquals(byId.birds, 2);
});

Deno.test('matchedFields flags which display fields matched', () => {
  const { globalResults } = useGlobalSearch(ref([birds]), cache, ref('mallard'));
  const result = globalResults.value[0].results[0];
  assertEquals(result.matchedFields, ['commonName']);
});

Deno.test('id match is reported in matchedFields', () => {
  const { globalResults } = useGlobalSearch(ref([birds]), cache, ref('001'));
  assertEquals(globalResults.value[0].results[0].matchedFields, ['id']);
});
