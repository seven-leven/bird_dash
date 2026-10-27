import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { ref } from 'vue';
import { createCollectionsStore } from './collections.ts';
import type { ViewMode } from '../types/index.ts';
import { fakeFetch, json } from '../testing/fakes/fakeFetch.ts';
import { captureConsole } from '../testing/fakes/captureConsole.ts';
import { settle } from '../testing/settle.ts';

// The store end to end: real loading, caching, filtering and grouping, with only
// the network replaced.

const BIRDS = {
  Ducks: [
    { id: '001', name: 'Mallard', sci: 'Anas platyrhynchos', drawn: '2025-01-10' },
    { id: '002', name: 'Garganey', sci: 'Spatula querquedula' },
  ],
  Herons: [{ id: '003', name: 'Grey Heron', sci: 'Ardea cinerea', drawn: '2025-03-05' }],
};
const SHARKS = {
  Requiem: [{ id: '001', name: 'Grey Reef Shark', sci: 'Carcharhinus amblyrhynchos' }],
};

const entry = (id: string, label: string) => ({
  id,
  label,
  emoji: '',
  groupLabel: 'Family',
  itemLabel: 'item',
  links: [],
});

/** A store over two small collections, loaded; the fake `fetch` goes when it is disposed. */
async function storeOverTwoCollections() {
  const fetch = fakeFetch({
    '/collections.json': json([entry('birds', 'Birds'), entry('sharks', 'Sharks')]),
    '/lists/birds.json': json(BIRDS),
    '/lists/sharks.json': json(SHARKS),
  });
  const query = ref('');
  const viewMode = ref<ViewMode>('group');
  const store = createCollectionsStore({ query, viewMode });
  await store.init();
  await settle(); // let the background prefetch land
  return { store, query, viewMode, [Symbol.dispose]: () => fetch[Symbol.dispose]() };
}

const names = (items: readonly { commonName: string }[]) => items.map((i) => i.commonName);

test('after init the first collection is active, grouped, and counted', async () => {
  using loaded = await storeOverTwoCollections();
  const { store } = loaded;
  assertEquals(store.isInitialized.value, true);
  assertEquals(store.list.value.map((c) => c.id), ['birds', 'sharks']);
  assertEquals(store.activeCollection.value?.id, 'birds');

  assertEquals(Object.keys(store.activeData.value.grouped), ['Ducks', 'Herons']);
  assertEquals(store.stats.value, { total: 3, filtered: 3, filteredDrawn: 2, drawn: 2 });
  assertEquals(store.globalStats.value, { drawn: 2, total: 4 }); // sharks counted too
});

test('the query filters the grid and the counts, across name, group and id', async () => {
  using loaded = await storeOverTwoCollections();
  const { store, query } = loaded;
  query.value = 'heron';
  assertEquals(Object.keys(store.activeData.value.grouped), ['Herons']);
  assertEquals(store.stats.value.filtered, 1);

  query.value = 'ducks'; // a group name matches every item in the group
  assertEquals(names(store.activeData.value.grouped.Ducks), ['Mallard', 'Garganey']);

  query.value = 'nothing-matches';
  assertEquals(store.activeData.value.grouped, {});
  assertEquals(store.stats.value.filtered, 0);
});

test('the same query searches every loaded collection for the dropdown', async () => {
  using loaded = await storeOverTwoCollections();
  const { store, query } = loaded;
  query.value = 'grey';
  assertEquals(
    store.globalResults.value.map((g) => [g.collection.id, names(g.results.map((r) => r.item))]),
    [['birds', ['Grey Heron']], ['sharks', ['Grey Reef Shark']]],
  );
  assertEquals(store.globalResultCount.value, 2);

  query.value = '';
  assertEquals(store.globalResults.value, []);
});

test('date view shows only drawn items, newest first; the viewer still pages oldest to newest', async () => {
  using loaded = await storeOverTwoCollections();
  const { store, viewMode } = loaded;
  viewMode.value = 'date';
  const months = Object.keys(store.activeData.value.grouped);
  assertEquals(months, ['March 2025', 'January 2025']);
  assertEquals(store.stats.value.total, 2); // undrawn items are not part of this view
  assertEquals(names(store.drawnItems.value), ['Mallard', 'Grey Heron']);
});

test('switching collection swaps the grid; the cache keeps both', async () => {
  using loaded = await storeOverTwoCollections();
  const { store } = loaded;
  await store.switch('sharks');
  assertEquals(store.activeCollection.value?.id, 'sharks');
  assertEquals(Object.keys(store.activeData.value.grouped), ['Requiem']);
  assertEquals(store.drawnItems.value, []); // no shark is drawn yet
  assertEquals(Object.keys(store.cache).sort(), ['birds', 'sharks']);
});

test('components cannot change the loaded data: it is read-only outside the store', async () => {
  using loaded = await storeOverTwoCollections();
  const { store } = loaded;
  // Vue warns on each attempt; that is the behaviour under test.
  using warnings = captureConsole((line) => line.includes('target is readonly'));
  const before = store.data.items.length;
  const writable = store.data as unknown as { items: unknown[]; loading: boolean };
  writable.items = [];
  writable.loading = true;
  assertEquals(store.data.items.length, before);
  assertEquals(store.data.loading, false);
  assertEquals(warnings.lines.length, 2);
});
